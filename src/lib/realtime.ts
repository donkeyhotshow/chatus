import { ref, set, onValue, onDisconnect, serverTimestamp as rtdbServerTimestamp, DatabaseReference } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { logger } from './logger';

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
          set(this.typingRef, false).catch(() => {});
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
    set(this.typingRef, false).catch(() => {});
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
  private statusRef: DatabaseReference;
  private unsubscribe: (() => void) | null = null;

  constructor(userId: string) {
    this.userId = userId;
    
    if (!rtdb) {
      throw new Error('Realtime Database not initialized. Please configure NEXT_PUBLIC_FIREBASE_DATABASE_URL');
    }
    
    this.statusRef = ref(rtdb, `status/${userId}`);
  }

  /**
   * Set user online
   */
  async setOnline() {
    try {
      await set(this.statusRef, {
        state: 'online',
        lastChanged: rtdbServerTimestamp()
      });

      // Set offline on disconnect
      onDisconnect(this.statusRef).set({
        state: 'offline',
        lastChanged: rtdbServerTimestamp()
      });
    } catch (error) {
      logger.error('Failed to set online status', error as Error, { userId: this.userId });
    }
  }

  /**
   * Set user offline
   */
  async setOffline() {
    try {
      await set(this.statusRef, {
        state: 'offline',
        lastChanged: rtdbServerTimestamp()
      });
    } catch (error) {
      logger.error('Failed to set offline status', error as Error, { userId: this.userId });
    }
  }

  /**
   * Subscribe to presence changes for all users
   */
  subscribeToPresence(callback: (presence: { [userId: string]: PresenceState }) => void) {
    if (!rtdb) {
      logger.warn('Realtime Database not available, presence tracking disabled');
      return;
    }
    
    const allStatusRef = ref(rtdb, 'status');

    this.unsubscribe = onValue(allStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      callback(data);
    });
  }

  /**
   * Cleanup
   */
  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
