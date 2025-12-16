import { ref, set, onValue, onDisconnect, serverTimestamp as rtdbServerTimestamp, DatabaseReference, push, get, Database } from 'firebase/database';
import { getClientFirebase } from '@/lib/firebase';
import { logger } from './logger';

// Provide rtdb convenience variable for modules expecting it
const { rtdb } = getClientFirebase();

// Simple debounce implementation
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export interface TypingState {
  [userId: string]: boolean;
}

export interface PresenceState {
  state: 'online' | 'offline';
  lastChanged: Date;
}

/**
 * Typing indicator management using Realtime Database
 */
export class TypingManager {
  private roomId: string;
  private userId: string;
  private typingRef: DatabaseReference;
  private sendTypingDebounced: () => void;
  private unsubscribe: (() => void) | null = null;

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
    const { rtdb } = getClientFirebase();
    if (!rtdb) {
      throw new Error('Realtime Database not initialized. Please configure NEXT_PUBLIC_FIREBASE_DATABASE_URL');
    }

    this.typingRef = ref(rtdb, `typing/${roomId}/${userId}`);

    // Debounced typing indicator (300ms delay)
    this.sendTypingDebounced = debounce(async () => {
      try {
        await set(this.typingRef, true);
        // Auto-clear typing after 1.5 seconds
        setTimeout(() => {
          set(this.typingRef, false).catch(() => { });
        }, 1500);
      } catch (error) {
        logger.error('Failed to update typing status', error as Error, { userId: this.userId });
      }
    }, 300);
  }

  /**
   * Send typing indicator
   */
  sendTyping() {
    this.sendTypingDebounced();
  }

  /**
   * Subscribe to typing changes for the room
   */
  subscribeToTyping(callback: (typingUsers: string[]) => void) {
    if (!rtdb) {
      logger.warn('Realtime Database not available, typing indicators disabled');
      return;
    }

    const roomTypingRef = ref(rtdb, `typing/${this.roomId}`);

    this.unsubscribe = onValue(roomTypingRef, (snapshot) => {
      const data = snapshot.val() || {};
      const typingUsers = Object.entries(data)
        .filter(([userId, isTyping]) => userId !== this.userId && isTyping === true)
        .map(([userId]) => userId);

      callback(typingUsers);
    });
  }

  /**
   * Stop typing (clear indicator)
   */
  stopTyping() {
    set(this.typingRef, false).catch(() => { });
  }

  /**
   * Cleanup
   */
  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.stopTyping();
  }
}

/**
 * Presence management using Realtime Database with onDisconnect
 */
export class PresenceManager {
  private userId: string;
  private rtdb: Database;
  private connId: string | null = null;
  private connRef: DatabaseReference | null = null;
  private statusRef: DatabaseReference;
  private unsubscribe: (() => void) | null = null;
  private connectedRef: DatabaseReference;
  private onValueUnsubscribe: (() => void) | null = null;

  constructor(userId: string) {
    this.userId = userId;
    const { rtdb } = getClientFirebase();
    if (!rtdb) {
      throw new Error('Realtime Database not initialized. Please configure NEXT_PUBLIC_FIREBASE_DATABASE_URL');
    }
    this.rtdb = rtdb;
    this.statusRef = ref(this.rtdb, `status/${userId}`);
    this.connectedRef = ref(this.rtdb, '.info/connected');
  }

  async goOnline(userId: string): Promise<void> {
    // Генеруємо унікальний ID для цього з'єднання
    const connectionsRef = ref(this.rtdb, `connections/${userId}`);
    const newConnRef = push(connectionsRef);
    this.connId = newConnRef.key!;
    this.connRef = newConnRef;

    // Встановлюємо connection як активне
    await set(this.connRef, {
      online: true,
      connectedAt: rtdbServerTimestamp()
    });

    // При disconnect видаляємо тільки це з'єднання
    onDisconnect(this.connRef).remove();

    // Оновлюємо агрегований статус
    await this.updateAggregatedStatus(userId);

    // Підписуємось на .info/connected для моніторингу
    this.onValueUnsubscribe = onValue(this.connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        // З'єднання втрачено - RTDB автоматично виконає onDisconnect
        return;
      }
      // Відновлюємо onDisconnect після reconnect
      if (this.connRef) {
        onDisconnect(this.connRef).remove();
      }
    });
    // Log current connection id for telemetry/debugging
    try {
      logger.info('PresenceManager.goOnline: connection started', { userId, connId: this.connId });
    } catch (err) {
      logger.debug('PresenceManager.goOnline: failed to log connection start', { error: String(err) });
    }
  }

  private async updateAggregatedStatus(userId: string): Promise<void> {
    const connectionsRef = ref(this.rtdb, `connections/${userId}`);
    const snapshot = await get(connectionsRef);
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;

    await set(this.statusRef, {
      state: count > 0 ? 'online' : 'offline',
      lastChanged: rtdbServerTimestamp(),
      activeConnections: count
    });
    try {
      logger.debug('PresenceManager.updateAggregatedStatus', { userId, activeConnections: count });
    } catch (err) {
      // Non-critical logging error
    }
  }

  async goOffline(): Promise<void> {
    if (this.connRef) {
      await set(this.connRef, null); // Set to null to trigger onDisconnect if not already disconnected
      this.connRef = null;
      this.connId = null;
    }
    if (this.onValueUnsubscribe) {
      this.onValueUnsubscribe();
      this.onValueUnsubscribe = null;
    }
    await this.updateAggregatedStatus(this.userId); // Update aggregated status after going offline
  }

  subscribeToPresence(callback: (presence: { [userId: string]: PresenceState }) => void) {
    const allStatusRef = ref(this.rtdb, 'status');

    this.unsubscribe = onValue(allStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      callback(data);
    });
  }

  /**
   * Unsubscribe presence listener without going offline.
   * Useful to stop receiving aggregated presence updates while keeping the connection alive.
   */
  public unsubscribePresence() {
    if (this.unsubscribe) {
      try {
        this.unsubscribe();
      } catch (err) {
        // swallow errors
      } finally {
        this.unsubscribe = null;
      }
    }
  }

  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.goOffline(); // Ensure to set offline and cleanup connection
  }
}
