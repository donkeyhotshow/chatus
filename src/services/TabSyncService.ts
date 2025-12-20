"use client";

import { logger } from "@/lib/logger";
import { Message } from "@/lib/types";

type SyncEventType = 'NEW_MESSAGE' | 'MESSAGE_DELETED' | 'REACTION_ADDED' | 'USER_TYPING' | 'PRESENCE_UPDATE';

interface SyncEvent {
  type: SyncEventType;
  roomId: string;
  payload: any;
  timestamp: number;
  tabId: string;
}

type SyncListener = (event: SyncEvent) => void;

const CHANNEL_NAME = 'chatus-tab-sync';

class TabSyncService {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private listeners: Map<SyncEventType, Set<SyncListener>> = new Map();

  constructor() {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initChannel();
  }

  private initChannel() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      logger.warn('BroadcastChannel not supported');
      return;
    }

    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<SyncEvent>) => {
        this.handleMessage(event.data);
      };
      logger.info('TabSyncService initialized', { tabId: this.tabId });
    } catch (error) {
      logger.error('Failed to initialize BroadcastChannel', error as Error);
    }
  }

  private handleMessage(event: SyncEvent) {
    // Ignore messages from this tab
    if (event.tabId === this.tabId) return;

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
    if (!this.channel) return;

    const event: SyncEvent = {
      type,
      roomId,
      payload,
      timestamp: Date.now(),
      tabId: this.tabId,
    };

    try {
      this.channel.postMessage(event);
    } catch (error) {
      logger.error('Failed to broadcast sync event', error as Error);
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

  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
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
