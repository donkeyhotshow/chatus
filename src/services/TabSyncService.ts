"use client";

import { logger } from "@/lib/logger";
import { Message } from "@/lib/types";

type SyncEventType = 'NEW_MESSAGE' | 'MESSAGE_DELETED' | 'REACTION_ADDED' | 'USER_TYPING' | 'PRESENCE_UPDATE' | 'USER_ONLINE' | 'USER_OFFLINE' | 'ROOM_STATE_SYNC';

interface SyncEvent {
  type: SyncEventType;
  roomId: string;
  payload: any;
  timestamp: number;
  tabId: string;
}

type SyncListener = (event: SyncEvent) => void;

const CHANNEL_NAME = 'chatus-tab-sync';
const STORAGE_KEY = 'chatus-tab-sync-fallback';
const HEARTBEAT_INTERVAL = 2000;
const STORAGE_POLL_INTERVAL = 500;

class TabSyncService {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private listeners: Map<SyncEventType, Set<SyncListener>> = new Map();
  private useStorageFallback: boolean = false;
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private storagePollInterval: NodeJS.Timeout | null = null;
  private lastProcessedTimestamp: number = 0;
  private isLeader: boolean = false;
  private leaderCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initChannel();
    this.initLeaderElection();
  }

  private initChannel() {
    if (typeof window === 'undefined') return;

    // Пробуем BroadcastChannel
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<SyncEvent>) => {
          this.handleMessage(event.data);
        };
        this.channel.onmessageerror = () => {
          logger.warn('BroadcastChannel message error, falling back to localStorage');
          this.enableStorageFallback();
        };
        logger.info('TabSyncService initialized with BroadcastChannel', { tabId: this.tabId });
      } catch (error) {
        logger.warn('Failed to initialize BroadcastChannel, using localStorage fallback', { error });
        this.enableStorageFallback();
      }
    } else {
      logger.info('BroadcastChannel not supported, using localStorage fallback');
      this.enableStorageFallback();
    }

    // Всегда включаем localStorage как дополнительный канал для надёжности
    this.setupStorageListener();
  }

  private enableStorageFallback() {
    this.useStorageFallback = true;
    this.setupStorageListener();
    this.startStoragePolling();
  }

  private setupStorageListener() {
    if (typeof window === 'undefined') return;

    this.storageListener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const event = JSON.parse(e.newValue) as SyncEvent;
          if (event.timestamp > this.lastProcessedTimestamp) {
            this.handleMessage(event);
            this.lastProcessedTimestamp = event.timestamp;
          }
        } catch (error) {
          logger.error('Failed to parse storage sync event', error as Error);
        }
      }
    };

    window.addEventListener('storage', this.storageListener);
  }

  private startStoragePolling() {
    // Polling для случаев когда storage event не срабатывает (та же вкладка)
    this.storagePollInterval = setInterval(() => {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const event = JSON.parse(data) as SyncEvent;
          if (event.timestamp > this.lastProcessedTimestamp && event.tabId !== this.tabId) {
            this.handleMessage(event);
            this.lastProcessedTimestamp = event.timestamp;
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }, STORAGE_POLL_INTERVAL);
  }

  private initLeaderElection() {
    // Простая leader election для координации между вкладками
    const LEADER_KEY = 'chatus-tab-leader';
    const LEADER_TIMEOUT = 5000;

    const checkLeader = () => {
      try {
        const leaderData = localStorage.getItem(LEADER_KEY);
        if (leaderData) {
          const { tabId, timestamp } = JSON.parse(leaderData);
          if (Date.now() - timestamp < LEADER_TIMEOUT && tabId !== this.tabId) {
            this.isLeader = false;
            return;
          }
        }
        // Становимся лидером
        localStorage.setItem(LEADER_KEY, JSON.stringify({
          tabId: this.tabId,
          timestamp: Date.now()
        }));
        this.isLeader = true;
      } catch {
        // Ignore errors
      }
    };

    checkLeader();
    this.leaderCheckInterval = setInterval(checkLeader, LEADER_TIMEOUT / 2);

    // Heartbeat для поддержания лидерства
    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader) {
        try {
          localStorage.setItem(LEADER_KEY, JSON.stringify({
            tabId: this.tabId,
            timestamp: Date.now()
          }));
        } catch {
          // Ignore errors
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  private handleMessage(event: SyncEvent) {
    // Ignore messages from this tab
    if (event.tabId === this.tabId) return;

    // Проверяем, не устарело ли сообщение (старше 30 секунд)
    if (Date.now() - event.timestamp > 30000) return;

    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in sync listener', error as Error);
        }
      });
    }
  }

  broadcast(type: SyncEventType, roomId: string, payload: any) {
    const event: SyncEvent = {
      type,
      roomId,
      payload,
      timestamp: Date.now(),
      tabId: this.tabId,
    };

    // Отправляем через BroadcastChannel если доступен
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (error) {
        logger.error('Failed to broadcast via BroadcastChannel', error as Error);
      }
    }

    // Всегда дублируем в localStorage для надёжности
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
    } catch (error) {
      logger.error('Failed to broadcast via localStorage', error as Error);
    }
  }

  subscribe(type: SyncEventType, listener: SyncListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  // Convenience methods
  broadcastNewMessage(roomId: string, message: Message) {
    this.broadcast('NEW_MESSAGE', roomId, message);
  }

  broadcastMessageDeleted(roomId: string, messageId: string) {
    this.broadcast('MESSAGE_DELETED', roomId, { messageId });
  }

  broadcastReaction(roomId: string, messageId: string, emoji: string, userId: string) {
    this.broadcast('REACTION_ADDED', roomId, { messageId, emoji, userId });
  }

  broadcastTyping(roomId: string, userId: string, isTyping: boolean) {
    this.broadcast('USER_TYPING', roomId, { userId, isTyping });
  }

  broadcastPresence(roomId: string, userId: string, isOnline: boolean) {
    this.broadcast(isOnline ? 'USER_ONLINE' : 'USER_OFFLINE', roomId, { userId, isOnline });
  }

  broadcastRoomState(roomId: string, state: any) {
    this.broadcast('ROOM_STATE_SYNC', roomId, state);
  }

  getTabId(): string {
    return this.tabId;
  }

  isLeaderTab(): boolean {
    return this.isLeader;
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.storagePollInterval) {
      clearInterval(this.storagePollInterval);
    }
    if (this.leaderCheckInterval) {
      clearInterval(this.leaderCheckInterval);
    }
    this.listeners.clear();

    // Очищаем лидерство если мы были лидером
    if (this.isLeader) {
      try {
        localStorage.removeItem('chatus-tab-leader');
      } catch {
        // Ignore
      }
    }
  }
}

// Singleton
let tabSyncInstance: TabSyncService | null = null;

export function getTabSyncService(): TabSyncService {
  if (!tabSyncInstance) {
    tabSyncInstance = new TabSyncService();
  }
  return tabSyncInstance;
}

export { TabSyncService, type SyncEvent, type SyncEventType };
