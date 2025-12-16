'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { Room } from '@/lib/types';
import { logger } from '@/lib/logger';
import { RoomService } from '@/services/RoomService';
import { isDemoMode } from '@/lib/demo-mode';
import { getUserFromStorage } from '@/lib/storage';

interface UseRoomResult {
  room: Room | null;
  isLoading: boolean;
  error: Error | null;
  exists: boolean;
  validate: () => Promise<boolean>;
}

/**
 * Hook for managing room data and validation
 *
 * Features:
 * - Loads room data from Firestore
 * - Validates room existence
 * - Provides room metadata
 */
export function useRoom(roomId: string): UseRoomResult {
  const firebaseContext = useFirebase();
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [exists, setExists] = useState(false);
  const mountedRef = useRef(true);

  // Load room data
  const loadRoom = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!firebaseContext?.db) {
      if (mountedRef.current) setIsLoading(false);
      return;
    }

    // Normalize roomId: decode URI components and remove CR/LF
    let decodedRoomId = roomId;
    try {
      decodedRoomId = decodeURIComponent(roomId);
    } catch {
      // ignore decode errors, use raw
    }
    decodedRoomId = String(decodedRoomId).trim().replace(/[\r\n]+/g, '');

    // In demo mode, create a mock room
    if (isDemoMode()) {
      const mockRoom: Room = {
        id: roomId,
        participants: [],
        participantProfiles: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
        settings: {}
      };
      setRoom(mockRoom);
      setExists(true);
      setIsLoading(false);
      return;
    }

    try {
      if (mountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      logger.debug('Loading room', { roomId, decodedRoomId });
      const roomRef = doc(firebaseContext.db, 'rooms', decodedRoomId);
      const roomDoc = await getDoc(roomRef);

      if (roomDoc.exists()) {
        const roomData = { id: decodedRoomId, ...roomDoc.data() } as Room;
        if (mountedRef.current) {
          setRoom(roomData);
          setExists(true);
        }
      } else {
        // Room missing — attempt to create it automatically with current user as participant
        let created = false;
        try {
          if (firebaseContext.auth?.currentUser) {
            const uid = firebaseContext.auth.currentUser.uid;
            const storedUser = getUserFromStorage();
            const profile = storedUser ?? { id: uid, name: 'Guest', avatar: '' };
            await setDoc(doc(firebaseContext.db, 'rooms', decodedRoomId), {
              participants: [uid],
              participantProfiles: [{ id: uid, name: profile.name, avatar: profile.avatar }],
              typing: [],
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp(),
              settings: {},
            });
            // re-read
            const newDoc = await getDoc(doc(firebaseContext.db, 'rooms', decodedRoomId));
            if (newDoc.exists() && mountedRef.current) {
              const roomData = { id: decodedRoomId, ...newDoc.data() } as Room;
              setRoom(roomData);
              setExists(true);
              created = true;
            }
          }
        } catch (createErr) {
          // ignore creation errors (permission or others), will fall back to no room
          logger.warn('Auto-create room failed', { error: (createErr as Error).message || String(createErr), decodedRoomId });
        }

        if (!created) {
          if (mountedRef.current) {
            setRoom(null);
            setExists(false);
          }
        }
      }
    } catch (err) {
      const error = err as Error;
      const firebaseError = err as { code?: string };

      // Suppress offline errors in demo mode or when client is offline
      if (isDemoMode() ||
        error.message?.includes('client is offline') ||
        error.message?.includes('Failed to get document') ||
        firebaseError.code === 'unavailable') {
        // In demo mode or offline, create mock room
        const mockRoom: Room = {
          id: roomId,
          participants: [],
          participantProfiles: [],
          createdAt: new Date(),
          lastUpdated: new Date(),
          settings: {}
        };
        setRoom(mockRoom);
        setExists(true);
        setIsLoading(false);
        return;
      }

      // If permission denied, attempt to self-join by appending auth.uid to participants
      if (firebaseError && firebaseError.code === 'permission-denied' && firebaseContext?.auth?.currentUser) {
        try {
          const uid = firebaseContext.auth.currentUser.uid;
          const storedUser = getUserFromStorage();
          const profile = storedUser ?? { id: uid, name: 'Guest', avatar: '' };
          // Try to add current user to participants and participantProfiles using arrayUnion
          const joinRoomRef = doc(firebaseContext.db, 'rooms', decodedRoomId);
          await updateDoc(joinRoomRef, {
            participants: arrayUnion(uid),
            participantProfiles: arrayUnion({ id: uid, name: profile.name, avatar: profile.avatar }),
          });
          // After joining, retry loading the room
          const retryDoc = await getDoc(joinRoomRef);
          if (retryDoc.exists()) {
            const roomData = { id: decodedRoomId, ...retryDoc.data() } as Room;
            setRoom(roomData);
            setExists(true);
            setIsLoading(false);
            return;
          }
        } catch (joinErr) {
          // ignore join errors and fall through to logging
          logger.warn('Auto-join attempt failed', { error: (joinErr as Error).message || String(joinErr), roomId: decodedRoomId });
        }
      }
      logger.error('Failed to load room', error, { roomId, decodedRoomId });
      if (mountedRef.current) {
        setError(error);
        setRoom(null);
        setExists(false);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [firebaseContext, roomId]);

  // Validate room existence
  const validate = useCallback(async (): Promise<boolean> => {
    if (!firebaseContext?.db) {
      return false;
    }

    // In demo mode, always return true (room exists)
    if (isDemoMode()) {
      setExists(true);
      return true;
    }

    // Normalize roomId for validation as well
    let decodedRoomId = roomId;
    try {
      decodedRoomId = decodeURIComponent(roomId);
    } catch {
      // ignore
    }
    decodedRoomId = String(decodedRoomId).trim().replace(/[\r\n]+/g, '');

    try {
      const roomService = new RoomService(firebaseContext.db);
      const exists = await roomService.roomExists(decodedRoomId);
      setExists(exists);
      return exists;
    } catch (err) {
      const error = err as Error;
      const firebaseError = err as { code?: string };

      // Suppress offline errors
      if (error.message?.includes('client is offline') ||
        error.message?.includes('Failed to get document') ||
        firebaseError.code === 'unavailable') {
        // In offline mode, assume room exists (for demo mode compatibility)
        if (isDemoMode()) {
          setExists(true);
          return true;
        }
        return false;
      }

      logger.error('Failed to validate room', error, { roomId });
      return false;
    }
  }, [firebaseContext, roomId]);

  // Load room on mount and when roomId changes
  useEffect(() => {
    mountedRef.current = true;
    loadRoom();
    return () => {
      mountedRef.current = false;
    };
  }, [loadRoom]);

  return {
    room,
    isLoading,
    error,
    exists,
    validate,
  };
}
