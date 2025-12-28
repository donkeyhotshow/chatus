'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

interface PendingMessage {
  id: string;
  roomId: string;
  content: string;
  timestamp: number;
  retries: number;
}

interface BackgroundSyncConfig {
  maxRetries?: number;
  retryDelay?: number;
  storageKey?: string;
}

const DEFAULT_CONFIG: Required<BackgroundSyncConfig> = {
  maxRetries: 5,
  retryDelay: 3000,
  storageKey: 'chatus_pending_messages',
};

/**
 * Hook for background sync of messages when offline
 * Stores pending messages in localStorage and syncs when online
 */
export function useBackgroundSync(
  sendMessage: (roomId: string, content: string) => Promise<boolean>,
  config: BackgroundSyncConfig = {}
) {
  const { maxRetries, retryDelay, storageKey } = { ...DEFAULT_CONFIG, ...config };

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Load pending messages from storage
  const loadPending = useCallback((): PendingMessage[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  // Save pending messages to storage
  const savePending = useCallback((messages: PendingMessage[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
      setPendingCount(messages.length);
    } catch (e) {
      console.error('[BackgroundSync] Failed to save pending messages:', e);
    }
  }, [storageKey]);

  // Add message to pending queue
  const queueMessage = useCallback((roomId: string, content: string): string => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const pending = loadPending();

    const newMessage: PendingMessage = {
      id,
      roomId,
      content,
      timestamp: Date.now(),
      retries: 0,
    };

    pending.push(newMessage);
    savePending(pending);

    // Try to sync immediately if online
    if (isOnlineRef.current) {
      syncPending();
    }

    return id;
  }, [loadPending, savePending]);

  // Remove message from pending queue
  const removePending = useCallback((id: string) => {
    const pending = loadPending();
    const filtered = pending.filter(m => m.id !== id);
    savePending(filtered);
  }, [loadPending, savePending]);

  // Sync pending messages
  const syncPending = useCallback(async () => {
    if (isSyncing || !isOnlineRef.current) return;

    const pending = loadPending();
    if (pending.length === 0) return;

    setIsSyncing(true);

    const stillPending: PendingMessage[] = [];

    for (const msg of pending) {
      try {
        const success = await sendMessage(msg.roomId, msg.content);

        if (!success) {
          // Increment retry count
          msg.retries++;

          if (msg.retries < maxRetries) {
            stillPending.push(msg);
          } else {
            console.warn('[BackgroundSync] Message exceeded max retries:', msg.id);
            // Could emit event for failed messages
          }
        }
        // Success - message not added to stillPending
      } catch (error) {
        console.error('[BackgroundSync] Failed to send message:', error);
        msg.retries++;

        if (msg.retries < maxRetries) {
          stillPending.push(msg);
        }
      }
    }

    savePending(stillPending);
    setIsSyncing(false);
  }, [isSyncing, loadPending, savePending, sendMessage, maxRetries]);

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      isOnlineRef.current = true;
      // Sync when coming back online
      syncPending();
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    setPendingCount(loadPending().length);

    // Periodic sync attempt
    syncIntervalRef.current = setInterval(() => {
      if (isOnlineRef.current) {
        syncPending();
      }
    }, retryDelay);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [loadPending, syncPending, retryDelay]);

  // Register service worker sync if available
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSync = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-messages');
        }
      } catch {
        // Background sync not supported
        console.log('[BackgroundSync] Background sync not supported');
      }
    };

    registerSync();
  }, []);

  return {
    queueMessage,
    removePending,
    syncPending,
    pendingCount,
    isSyncing,
    isOnline: isOnlineRef.current,
  };
}

/**
 * Simplified hook for checking if there are pending messages
 */
export function usePendingMessages(storageKey = 'chatus_pending_messages') {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPending = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        const pending = stored ? JSON.parse(stored) : [];
        setCount(pending.length);
      } catch {
        setCount(0);
      }
    };

    checkPending();

    // Listen for storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        checkPending();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  return count;
}
