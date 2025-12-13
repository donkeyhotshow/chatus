'use client';

import { Message } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Message queue for offline support
 * Stores messages in IndexedDB and retries sending when connection is restored
 */

interface PendingMessage {
  id: string;
  clientMessageId: string;
  messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'delivered' | 'seen'>;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'ChatMessageQueue';
const DB_VERSION = 1;
const STORE_NAME = 'pendingMessages';
const MAX_RETRY_COUNT = 5;
const RETRY_DELAY = 1000; // 1 second

export class MessageQueue {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = true;
  private retryTimer: NodeJS.Timeout | null = null;
  private sendCallback: ((messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'delivered' | 'seen'>, clientMessageId?: string) => Promise<void>) | null = null;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
      this.setupNetworkListeners();
    }
  }

  private async initDB(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', new Error('IndexedDB open failed'));
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('clientMessageId', 'clientMessageId', { unique: true });
        }
      };
    });
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen to online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('Network online, retrying pending messages');
      this.retryAll();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('Network offline, messages will be queued');
    });

    // Also check navigator.onLine
    this.isOnline = navigator.onLine;
  }

  /**
   * Set the callback function for sending messages
   */
  setSendCallback(
    callback: (messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'delivered' | 'seen'>, clientMessageId?: string) => Promise<void>
  ): void {
    this.sendCallback = callback;
  }

  /**
   * Add a message to the queue
   */
  async add(
    messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'delivered' | 'seen'>,
    clientMessageId: string
  ): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const pendingMessage: PendingMessage = {
      id: clientMessageId,
      clientMessageId,
      messageData,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Try to send immediately if online
    if (this.isOnline && this.sendCallback) {
      try {
        await this.sendCallback(messageData, clientMessageId);
        // Success - don't add to queue
        return;
      } catch (error) {
        // Failed - add to queue for retry
        logger.warn('Failed to send message, adding to queue', { error, clientMessageId });
      }
    }

    // Add to queue
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(pendingMessage);

      request.onsuccess = () => {
        logger.info('Message added to queue', { clientMessageId });
        resolve();
        // Schedule retry if online
        if (this.isOnline) {
          this.scheduleRetry();
        }
      };

      request.onerror = () => {
        logger.error('Failed to add message to queue', new Error('IndexedDB put failed'));
        reject(new Error('Failed to add message to queue'));
      };
    });
  }

  /**
   * Retry sending all pending messages
   */
  async retryAll(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return;
    }

    if (!this.db || !this.sendCallback || !this.isOnline) {
      return;
    }

    const pendingMessages = await this.getAll();

    if (pendingMessages.length === 0) {
      return;
    }

    logger.info(`Retrying ${pendingMessages.length} pending messages`);

    for (const pending of pendingMessages) {
      if (pending.retryCount >= MAX_RETRY_COUNT) {
        // Remove messages that exceeded max retry count
        await this.remove(pending.id);
        logger.warn('Message exceeded max retry count, removing', { clientMessageId: pending.clientMessageId });
        continue;
      }

      try {
        await this.sendCallback(pending.messageData, pending.clientMessageId);
        // Success - remove from queue
        await this.remove(pending.id);
        logger.info('Message sent successfully, removed from queue', { clientMessageId: pending.clientMessageId });
      } catch (error) {
        // Failed - increment retry count
        pending.retryCount++;
        await this.update(pending);
        logger.warn('Message retry failed', { error, clientMessageId: pending.clientMessageId, retryCount: pending.retryCount });
      }

      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Schedule next retry if there are still pending messages
    if (pendingMessages.length > 0) {
      this.scheduleRetry();
    }
  }

  /**
   * Get all pending messages
   */
  private async getAll(): Promise<PendingMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get pending messages'));
      };
    });
  }

  /**
   * Remove a message from the queue
   */
  private async remove(id: string): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window) || !this.db) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to remove message from queue'));
      };
    });
  }

  /**
   * Update a pending message
   */
  private async update(pending: PendingMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(pending);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to update message in queue'));
      };
    });
  }

  /**
   * Schedule a retry after delay
   */
  private scheduleRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = setTimeout(() => {
      this.retryAll();
    }, RETRY_DELAY);
  }

  /**
   * Get count of pending messages
   */
  async getPendingCount(): Promise<number> {
    const messages = await this.getAll();
    return messages.length;
  }

  /**
   * Clear all pending messages
   */
  async clear(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window) || !this.db) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear message queue'));
      };
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}

// Singleton instance
let messageQueueInstance: MessageQueue | null = null;

export function getMessageQueue(): MessageQueue {
  if (!messageQueueInstance) {
    messageQueueInstance = new MessageQueue();
  }
  return messageQueueInstance;
}

