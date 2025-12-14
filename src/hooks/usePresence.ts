'use client';

import { useEffect, useState, useRef } from 'react';
import { PresenceManager, PresenceState } from '@/lib/realtime';
import { isDemoMode } from '@/lib/demo-mode';

interface UsePresenceReturn {
  isOnline: boolean;
  lastSeen: Date | null;
  updatePresence: (isOnline: boolean) => Promise<void>;
}

/**
 * Hook for managing user presence using Realtime Database
 */
export function usePresence(roomId: string, userId: string | null): UsePresenceReturn {
  const [presence, setPresence] = useState<PresenceState>({
    state: 'offline',
    lastChanged: new Date(),
  });
  const presenceManagerRef = useRef<PresenceManager | null>(null);
  const isMountedRef = useRef(true);

  // Update presence status
  const updatePresence = async (isOnline: boolean) => {
    if (!userId) return;

    if (isDemoMode()) {
      setPresence({
        state: isOnline ? 'online' : 'offline',
        lastChanged: new Date(),
      });
      return;
    }

    if (!presenceManagerRef.current) return;

    if (isOnline) {
      await presenceManagerRef.current.goOnline(userId);
    } else {
      await presenceManagerRef.current.goOffline();
    }
  };

  useEffect(() => {
    if (!userId) return;

    if (isDemoMode()) {
      // In demo mode, just set online
      setPresence({
        state: 'online',
        lastChanged: new Date(),
      });
      return;
    }

    // Initialize presence manager
    presenceManagerRef.current = new PresenceManager(userId);

    // Set online on mount
    presenceManagerRef.current.goOnline(userId);

    // Subscribe to presence changes
    presenceManagerRef.current.subscribeToPresence((presenceData) => {
      if (!isMountedRef.current) return;

      const userPresence = presenceData[userId];
      if (userPresence) {
        setPresence({
          state: userPresence.state,
          lastChanged: new Date(userPresence.lastChanged),
        });
      }
    });

    // Handle network status changes
    const handleOnline = () => {
      if (isMountedRef.current && presenceManagerRef.current) {
        presenceManagerRef.current.goOnline(userId);
      }
    };

    const handleOffline = () => {
      if (isMountedRef.current && presenceManagerRef.current) {
        presenceManagerRef.current.goOffline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMountedRef.current = false;

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      // Cleanup
      if (presenceManagerRef.current) {
        presenceManagerRef.current.disconnect();
        presenceManagerRef.current = null;
      }
    };
  }, [userId]);

  return {
    isOnline: presence.state === 'online',
    lastSeen: presence.lastChanged,
    updatePresence,
  };
}

