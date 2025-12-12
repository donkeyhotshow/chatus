'use client';

import { logger } from './logger';

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
  if (typeof window === 'undefined') return;

  React.useEffect(() => {
    const unregister = registerCleanup(callback);
    return () => {
      unregister();
    };
  }, [callback]);
}

// Import React only for the hook
import React from 'react';

