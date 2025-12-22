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
  status?: 'pending' | 'sending' | 'failed' | 'sent';
}

const STORAGE_KEY = 'chatus-offline-queue';
const SENT_MESSAGES_KEY = 'chatus-sent-messages';
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 1000;
const MAX_SENT_MESSAGES_CACHE = 100;

export class OfflineMessageQueue {
  private queue: QueuedMessage[] = [];
  private sentMessageIds: Set<string> = new Set();
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();
  private sendCallback: ((msg: QueuedMessage) => Promise<void>) | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;

  constructor() {
    this.loadFromStorage();
    this.loadSentMessages();
    this.setupOnlineListener();
    this.startConnectionMonitor();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
        // Восстанавливаем статус pending для всех сообщений при загрузке
        this.queue = this.queue.map(msg => ({ ...msg, status: 'pending' as const }));
        logger.info(`Loaded ${this.queue.length} offline messages from storage`);
      }
    } catch (error) {
      logger.error('Failed to load offline queue', error as Error);
      this.queue = [];
    }
  }

  private loadSentMessages() {
    try {
      const data = localStorage.getItem(SENT_MESSAGES_KEY);
      if (data) {
        const ids = JSON.parse(data);
        this.sentMessageIds = new Set(ids);
      }
    } catch (error) {
      logger.error('Failed to load sent messages cache', error as Error);
      this.sentMessageIds = new Set();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save offline queue', error as Error);
    }
  }

  private saveSentMessages() {
    try {
      const ids = Array.from(this.sentMessageIds).slice(-MAX_SENT_MESSAGES_CACHE);
      localStorage.setItem(SENT_MESSAGES_KEY, JSON.stringify(ids));
    } catch (error) {
      logger.error('Failed to save sent messages cache', error as Error);
    }
  }

  private setupOnlineListener() {
    if (typeof window === 'undefined') return;

    this.onlineHandler = () => {
      logger.info('Connection restored, processing offline queue');
      this.processQueue();
    };

    this.offlineHandler = () => {
      logger.info('Connection lost, messages will be queued');
      this.notifyListeners();
    };

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.processQueue();
      }
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private startConnectionMonitor() {
    // Периодически проверяем соединение и пытаемся отправить сообщения
    this.connectionCheckInterval = setInterval(() => {
      if (navigator.onLine && this.queue.length > 0 && !this.isProcessing) {
        this.processQueue();
      }
    }, 5000); // Каждые 5 секунд
  }

  setSendCallback(callback: (msg: QueuedMessage) => Promise<void>) {
    this.sendCallback = callback;
    // Если есть сообщения в очереди и мы онлайн, начинаем отправку
    if (this.queue.length > 0 && navigator.onLine) {
      this.processQueue();
    }
  }

  add(message: Omit<QueuedMessage, 'retryCount' | 'status'>) {
    // Проверяем, не было ли это сообщение уже отправлено
    if (this.sentMessageIds.has(message.id)) {
      logger.info('Message already sent, skipping', { messageId: message.id });
      return;
    }

    // Проверяем, нет ли уже такого сообщения в очереди
    if (this.queue.some(m => m.id === message.id)) {
      logger.info('Message already in queue, skipping', { messageId: message.id });
      return;
    }

    const queuedMessage: QueuedMessage = {
      ...message,
      retryCount: 0,
      status: 'pending',
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
    const actualSendFn = sendFn || this.sendCallback;

    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    if (!actualSendFn) {
      logger.warn('No send callback set, cannot process queue');
      return;
    }

    this.isProcessing = true;
    this.notifyListeners();

    const messagesToProcess = [...this.queue];

    for (const message of messagesToProcess) {
      if (!navigator.onLine) {
        break;
      }

      // Пропускаем уже отправленные
      if (this.sentMessageIds.has(message.id)) {
        this.queue = this.queue.filter(m => m.id !== message.id);
        this.saveToStorage();
        continue;
      }

      // Обновляем статус
      message.status = 'sending';
      this.notifyListeners();

      try {
        await actualSendFn(message);

        // Success - remove from queue and mark as sent
        this.queue = this.queue.filter(m => m.id !== message.id);
        this.sentMessageIds.add(message.id);
        this.saveToStorage();
        this.saveSentMessages();
        this.notifyListeners();

        logger.info('Offline message sent successfully', { messageId: message.id });
      } catch (error) {
        message.retryCount++;
        message.status = 'failed';

        if (message.retryCount >= MAX_RETRIES) {
          // Max retries reached - keep in queue but mark as failed
          logger.error('Failed to send offline message after max retries', error as Error, {
            messageId: message.id,
            retryCount: message.retryCount,
          });
        } else {
          // Reset status to pending for retry
          message.status = 'pending';
          // Wait before next retry with exponential backoff
          const delay = RETRY_DELAY_BASE * Math.pow(2, message.retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.saveToStorage();
        this.notifyListeners();
      }
    }

    this.isProcessing = false;
    this.notifyListeners();
  }

  getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  getPendingMessages(roomId?: string): QueuedMessage[] {
    const messages = this.queue.filter(m => m.status !== 'sent');
    if (roomId) {
      return messages.filter(m => m.roomId === roomId);
    }
    return messages;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isMessagePending(messageId: string): boolean {
    return this.queue.some(m => m.id === messageId);
  }

  wasMessageSent(messageId: string): boolean {
    return this.sentMessageIds.has(messageId);
  }

  clear() {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  clearFailed() {
    this.queue = this.queue.filter(m => m.status !== 'failed' || m.retryCount < MAX_RETRIES);
    this.saveToStorage();
    this.notifyListeners();
  }

  retryFailed() {
    this.queue = this.queue.map(m => {
      if (m.status === 'failed') {
        return { ...m, status: 'pending' as const, retryCount: 0 };
      }
      return m;
    });
    this.saveToStorage();
    this.notifyListeners();

    if (navigator.onLine) {
      this.processQueue();
    }
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

  destroy() {
    // Clear interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    // Remove event listeners
    if (typeof window !== 'undefined') {
      if (this.onlineHandler) {
        window.removeEventListener('online', this.onlineHandler);
        this.onlineHandler = null;
      }
      if (this.offlineHandler) {
        window.removeEventListener('offline', this.offlineHandler);
        this.offlineHandler = null;
      }
    }
    if (typeof document !== 'undefined' && this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    // Clear listeners
    this.listeners.clear();
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
