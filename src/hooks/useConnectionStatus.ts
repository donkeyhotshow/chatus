/**
 * Connection Status Hook - P0 Critical Fix
 *
 * Provides reactive connection state for components
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getConnectionManager,
  ConnectionState,
  ConnectionStatus
} from '@/lib/connection-manager';

export function useConnectionStatus(): ConnectionState {
  const [state, setState] = useState<ConnectionState>({
    status: 'online',
    isOnline: true,
    isSlow: false,
    lastOnlineAt: null,
    reconnectAttempts: 0,
    effectiveType: null,
    downlink: null,
    rtt: null,
  });

  useEffect(() => {
    const manager = getConnectionManager();
    if (!manager) return;

    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
}

/**
 * Simple hook for just online/offline status
 */
export function useIsOnline(): boolean {
  const { isOnline } = useConnectionStatus();
  return isOnline;
}

/**
 * Hook for slow connection detection
 */
export function useIsSlowConnection(): boolean {
  const { isSlow } = useConnectionStatus();
  return isSlow;
}

export type { ConnectionState, ConnectionStatus };
