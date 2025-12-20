"use client";

import { useEffect, useState, useCallback } from 'react';
import { getOfflineQueue, QueuedMessage } from '@/services/OfflineMessageQueue';
import { getTabSyncService } from '@/services/TabSyncService';
import { Message } from '@/lib/types';

interface UseOfflineSyncOptions {
  roomId: string;
  onNewMessage?: (message: Message) => void;
  onMessageDeleted?: (messageId: string) => void;
}

export function useOfflineSync({ roomId, onNewMessage, onMessageDeleted }: UseOfflineSyncOptions) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to offline queue changes
  useEffect(() => {
    const queue = getOfflineQueue();

    const updateCount = () => {
      const roomMessages = queue.getQueue().filter(m => m.roomId === roomId);
      setPendingCount(roomMessages.length);
    };

    updateCount();
    const unsubscribe = queue.subscribe(updateCount);

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // Subscribe to tab sync events
  useEffect(() => {
    const tabSync = getTabSyncService();

    const unsubNewMessage = tabSync.subscribe('NEW_MESSAGE', (event) => {
      if (event.roomId === roomId && onNewMessage) {
        onNewMessage(event.payload as Message);
      }
    });

    const unsubDeleted = tabSync.subscribe('MESSAGE_DELETED', (event) => {
      if (event.roomId === roomId && onMessageDeleted) {
        onMessageDeleted(event.payload.messageId);
      }
    });

    return () => {
      unsubNewMessage();
      unsubDeleted();
    };
  }, [roomId, onNewMessage, onMessageDeleted]);

  // Queue message for offline sending
  const queueMessage = useCallback((message: Omit<QueuedMessage, 'retryCount'>) => {
    const queue = getOfflineQueue();
    queue.add(message);
  }, []);

  // Broadcast message to other tabs
  const broadcastMessage = useCallback((message: Message) => {
    const tabSync = getTabSyncService();
    tabSync.broadcastNewMessage(roomId, message);
  }, [roomId]);

  // Broadcast message deletion
  const broadcastDeletion = useCallback((messageId: string) => {
    const tabSync = getTabSyncService();
    tabSync.broadcastMessageDeleted(roomId, messageId);
  }, [roomId]);

  return {
    isOnline,
    pendingCount,
    queueMessage,
    broadcastMessage,
    broadcastDeletion,
  };
}
