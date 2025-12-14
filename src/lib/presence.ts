import { ref, onDisconnect, set, push, onValue, remove } from "firebase/database";
import { db } from "./firebase";

export function createPresenceManager(userId: string) {
  if (typeof window === "undefined") {
    throw new Error("createPresenceManager can only be used in the browser");
  }

  const connectionsRef = ref(db, `connections/${userId}`);
  const userStatusRef = ref(db, `status/${userId}`);
  const myConnRef = push(connectionsRef);

  // write my connection and ensure it's removed on disconnect
  set(myConnRef, { connectedAt: Date.now(), userAgent: navigator.userAgent });
  onDisconnect(myConnRef).remove();
  onDisconnect(userStatusRef).set({ state: "offline", activeConnections: 0, lastChanged: Date.now() });

  function updateStatusFromCount(count: number) {
    set(userStatusRef, { state: count > 0 ? "online" : "offline", activeConnections: count, lastChanged: Date.now() });
  }

  // listen to connections count and update status accordingly
  onValue(connectionsRef, (snap) => {
    const count = snap.exists() ? (snap.numChildren ? snap.numChildren() : Object.keys(snap.val() || {}).length) : 0;
    updateStatusFromCount(count);
  });

  // Helpers
  async function goOffline() {
    try {
      await remove(myConnRef);
    } catch (e) {
      // best-effort
    }
  }

  async function goOnline() {
    try {
      await set(myConnRef, { connectedAt: Date.now(), userAgent: navigator.userAgent });
    } catch (e) {
      // best-effort
    }
  }

  // Keep events minimal; rely on onDisconnect for cleanup
  window.addEventListener("online", goOnline);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") goOnline();
  });

  return { goOnline, goOffline };
}

'use client';

import { logger } from './logger';
import { PresenceManager as RTDBPresenceManager } from './realtime';

/**
 * Presence management utilities
 * Handles cleanup on page unload, visibility changes, etc.
 */

type CleanupCallback = () => void | Promise<void>;

const cleanupCallbacks = new Set<CleanupCallback>();

/**
 * Register a cleanup callback that will be called on page unload
 */
export function registerCleanup(callback: CleanupCallback): () => void {
  cleanupCallbacks.add(callback);
  
  return () => {
    cleanupCallbacks.delete(callback);
  };
}

/**
 * Execute all registered cleanup callbacks
 */
async function executeCleanup() {
  const promises = Array.from(cleanupCallbacks).map(async (callback) => {
    try {
      await callback();
    } catch (error) {
      logger.error('Cleanup callback failed', error as Error);
    }
  });
  
  await Promise.all(promises);
}

// Setup beforeunload handler
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (event) => {
    // Execute cleanup synchronously for beforeunload
    // Note: async operations may not complete, but we try
    executeCleanup().catch(err => {
      logger.error('Failed to execute cleanup on beforeunload', err as Error);
    });
  });

  // Also handle visibility change (tab switch, minimize)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Execute cleanup when tab becomes hidden
      executeCleanup().catch(err => {
        logger.error('Failed to execute cleanup on visibility change', err as Error);
      });
    }
  });
}

/**
 * Hook for React components to register cleanup
 */
export function usePresenceCleanup(callback: CleanupCallback) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const unregister = registerCleanup(callback);
    return () => {
      unregister();
    };
  }, [callback]);
}

// Import React only for the hook
import React from 'react';

/**
 * High-level Presence API (wrapper around RTDB PresenceManager)
 *
 * This file provides:
 * - registerCleanup / usePresenceCleanup utilities (above)
 * - createPresenceManager(userId) factory which initializes the per-connection
 *   PresenceManager from `src/lib/realtime.ts`, starts presence, and registers
 *   cleanup handlers to goOffline on unload/visibility change.
 *
 * Rationale: keep low-level RTDB implementation in `realtime.ts`, expose a
 * stable, testable API here used by React providers and hooks.
 */

export interface PresenceManagerHandle {
  goOnline: (userId: string) => Promise<void>;
  goOffline: () => Promise<void>;
  subscribeToPresence: (callback: (presence: { [userId: string]: unknown }) => void) => void;
  disconnect: () => void;
  // expose connId for debugging/telemetry
  connId?: string | null;
}

/**
 * Create and initialize a per-connection PresenceManager for the given userId.
 * The manager is started (goOnline) immediately and will be cleaned up on page
 * unload / tab visibility change via `registerCleanup`.
 */
export function createPresenceManager(userId: string): PresenceManagerHandle {
  const manager = new RTDBPresenceManager(userId);

  // Start presence; swallow errors but log them
  manager.goOnline(userId).catch((err) => {
    logger.error('createPresenceManager: failed to goOnline', err as Error, { userId });
  });

  // Ensure we go offline on cleanup
  // Also register listeners to attempt restore on network/window events
  const tryRestore = () => {
    // If there's no active connId, try to re-establish presence
    // manager.connId is internal; check safely
    const connId = (manager as any).connId;
    if (!connId) {
      manager.goOnline(userId).catch((err) => {
        logger.debug('createPresenceManager: restore attempt failed', { error: String(err), userId });
      });
    }
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      tryRestore();
    }
  };

  window.addEventListener('online', tryRestore);
  window.addEventListener('focus', tryRestore);
  document.addEventListener('visibilitychange', onVisibilityChange);

  registerCleanup(() => {
    try {
      window.removeEventListener('online', tryRestore);
      window.removeEventListener('focus', tryRestore);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      return manager.goOffline();
      } catch (err) {
      logger.error('createPresenceManager: cleanup goOffline failed', err as Error, { userId });
      return Promise.resolve();
    }
  });

  return manager as unknown as PresenceManagerHandle;
}

