"use client";

import { logger } from "@/lib/logger";

export interface QueuedMessage {
  id: string;
  roomId: string;
  text?: string;
  imageUrl?: string;
  stickerUrl?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'chatus-offline-queue';
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 1000;

export class OfflineMessageQueue {
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.setupOnlineListener();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
        logger.info(`Loaded ${this.queue.length} offline messages from storage`);
      }
    } catch (error) {
      logger.error('Failed to load offline queue', error as Error);
      this.queue = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save offline queue', error as Error);
    }
  }

  private setupOnlineListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      logger.info('Connection restored, processing offline queue');
      this.processQueue();
    });
  }

  add(message: Omit<QueuedMessage, 'retryCount'>) {
    const queuedMessage: QueuedMessage = {
      ...message,
      retryCount: 0,
    };

    this.queue.push(queuedMessage);
    this.saveToStorage();
    this.notifyListeners();

    logger.info('Message added to offline queue', { messageId: message.id });

    // Try to send immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue(sendFn?: (msg: QueuedMessage) => Promise<void>) {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && navigator.onLine) {
      const message = this.queue[0];

      try {
        if (sendFn) {
          await sendFn(message);
        }

        // Success - remove from queue
        this.queue.shift();
        this.saveToStorage();
        this.notifyListeners();

        logger.info('Offline message sent successfully', { messageId: message.id });
      } catch (error) {
        message.retryCount++;

        if (message.retryCount >= MAX_RETRIES) {
          // Max retries reached - remove and log
          this.queue.shift();
          this.saveToStorage();
          this.notifyListeners();

          logger.error('Failed to send offline message after max retries', error as Error, {
            messageId: message.id,
            retryCount: message.retryCount,
          });
        } else {
          // Wait before next retry with exponential backoff
          const delay = RETRY_DELAY_BASE * Math.pow(2, message.retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.isProcessing = false;
  }

  getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  removeMessage(messageId: string) {
    this.queue = this.queue.filter(m => m.id !== messageId);
    this.saveToStorage();
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance
let offlineQueueInstance: OfflineMessageQueue | null = null;

export function getOfflineQueue(): OfflineMessageQueue {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineMessageQueue();
  }
  return offlineQueueInstance;
}
