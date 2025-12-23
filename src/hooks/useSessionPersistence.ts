/**
 * Session Persistence Hook - P0 Critical Fix
 *
 * Handles:
 * - Automatic session save/restore
 * - Roersistence
 * - Tab visibility handling
 * - Back/forward navigation
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  saveSession,
  getSession,
  saveRoomState,
  getRoomState,
  setupVisibilityHandler,
  setupBeforeUnloadHandler,
  setupPopstateHandler,
  updateSessionActivity,
  RoomState,
  ChatSession,
} from '@/lib/session-manager';
import { UserProfile } from '@/lib/types';
import { logger } from '@/lib/logger';

interface UseSessionPersistenceOptions {
  roomId: string;
  user: UserProfile | null;
  activeTab: string;
  onRestore?: (state: RoomState) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export function useSessionPersistence({
  roomId,
  user,
  activeTab,
  onRestore,
  onVisibilityChange,
}: UseSessionPersistenceOptions) {
  const scrollPositionRef = useRef(0);
  const draftMessageRef = useRef('');
  const lastMessageIdRef = useRef<string | null>(null);

  // Save session when user joins
  useEffect(() => {
    if (!user || !roomId) return;

    saveSession({
      roomId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      joinedAt: Date.now(),
    });

    logger.debug('[useSessionPersistence] Session saved', { roomId, userId: user.id });
  }, [user, roomId]);

  // Restore room state on mount
  useEffect(() => {
    if (!roomId) return;

    const savedState = getRoomState(roomId);
    if (savedState && onRestore) {
      logger.info('[useSessionPersistence] Restoring room state', { roomId });
      onRestore(savedState);
    }
  }, [roomId, onRestore]);

  // Get current room state for saving
  const getCurrentState = useCallback((): RoomState | null => {
    if (!roomId) return null;

    return {
      roomId,
      activeTab,
      scrollPosition: scrollPositionRef.current,
      draftMessage: draftMessageRef.current,
      lastMessageId: lastMessageIdRef.current,
      canvasState: null, // Can be extended to save canvas state
      gameState: null, // Can be extended to save game state
    };
  }, [roomId, activeTab]);

  // Setup visibility handler
  useEffect(() => {
    const cleanup = setupVisibilityHandler(
      () => {
        // Tab became visible
        logger.debug('[useSessionPersistence] Tab visible');
        onVisibilityChange?.(true);
      },
      () => {
        // Tab became hidden - save state
        logger.debug('[useSessionPersistence] Tab hidden, saving state');
        const state = getCurrentState();
        if (state) {
          saveRoomState(state);
        }
        onVisibilityChange?.(false);
      }
    );

    return cleanup;
  }, [getCurrentState, onVisibilityChange]);

  // Setup beforeunload handler
  useEffect(() => {
    const cleanup = setupBeforeUnloadHandler(getCurrentState);
    return cleanup;
  }, [getCurrentState]);

  // Setup popstate handler (back/forward navigation)
  useEffect(() => {
    const cleanup = setupPopstateHandler(() => {
      logger.debug('[useSessionPersistence] Navigation detected');
      // State will be restored on next mount
    });
    return cleanup;
  }, []);

  // Periodic activity update
  useEffect(() => {
    const interval = setInterval(() => {
      updateSessionActivity();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // Methods to update refs
  const updateScrollPosition = useCallback((position: number) => {
    scrollPositionRef.current = position;
  }, []);

  const updateDraftMessage = useCallback((message: string) => {
    draftMessageRef.current = message;
  }, []);

  const updateLastMessageId = useCallback((messageId: string | null) => {
    lastMessageIdRef.current = messageId;
  }, []);

  // Manual save
  const saveCurrentState = useCallback(() => {
    const state = getCurrentState();
    if (state) {
      saveRoomState(state);
    }
  }, [getCurrentState]);

  return {
    updateScrollPosition,
    updateDraftMessage,
    updateLastMessageId,
    saveCurrentState,
  };
}

/**
 * Check if there's a session to restore for given roomId
 */
export function useSessionCheck(roomId: string): {
  hasSession: boolean;
  session: ChatSession | null;
} {
  const session = getSession();
  const hasSession = session !== null && session.roomId === roomId;

  return {
    hasSession,
    session: hasSession ? session : null,
  };
}
