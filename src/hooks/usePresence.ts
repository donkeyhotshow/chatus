'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { UserProfile } from '@/lib/types';
import { logger } from '@/lib/logger';
import { registerCleanup } from '@/lib/presence';
import { isDemoMode } from '@/lib/demo-mode';

interface PresenceState {
  isOnline: boolean;
  lastSeen: Date | null;
}

/**
 * Hook for managing user presence (online/offline status)
 * 
 * Features:
 * - Updates isOnline status in Firestore
 * - Updates lastSeen timestamp
 * - Handles cleanup on unmount/disconnect
 * - Handles network status changes
 */
export function usePresence(roomId: string, userId: string | null) {
  const firebaseContext = useFirebase();
  const [presence, setPresence] = useState<PresenceState>({
    isOnline: false,
    lastSeen: null,
  });
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Update presence status
  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!firebaseContext?.db || !userId) return;

    // In demo mode, update local state only
    if (isDemoMode()) {
      setPresence({
        isOnline,
        lastSeen: new Date(),
      });
      return;
    }

    try {
      const userRef = doc(firebaseContext.db, 'users', userId);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp(),
      });

      setPresence({
        isOnline,
        lastSeen: new Date(),
      });
    } catch (error) {
      const err = error as any;
      // Suppress offline errors in demo mode
      if (isDemoMode() || 
          err.message?.includes('client is offline') ||
          err.message?.includes('Failed to get document') ||
          err.code === 'unavailable' ||
          err.code === 'permission-denied') {
        // Update local state only
        setPresence({
          isOnline,
          lastSeen: new Date(),
        });
        return;
      }
      logger.error('Failed to update presence', error as Error, { userId, isOnline });
    }
  }, [firebaseContext, userId]);

  // Set online status
  useEffect(() => {
    if (!userId) return;

    // Set online on mount
    updatePresence(true);

    // Update lastSeen periodically (every 30 seconds)
    updateIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        updatePresence(true);
      }
    }, 30000);

    // Handle network status changes
    const handleOnline = () => {
      if (isMountedRef.current) {
        updatePresence(true);
      }
    };

    const handleOffline = () => {
      if (isMountedRef.current) {
        updatePresence(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register cleanup for beforeunload
    const unregisterCleanup = registerCleanup(async () => {
      await updatePresence(false);
    });

    return () => {
      isMountedRef.current = false;
      
      // Cleanup
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unregisterCleanup();
      
      // Set offline on unmount
      updatePresence(false).catch(err => {
        logger.error('Failed to set offline on unmount', err as Error);
      });
    };
  }, [userId, updatePresence]);

  return {
    isOnline: presence.isOnline,
    lastSeen: presence.lastSeen,
    updatePresence,
  };
}

