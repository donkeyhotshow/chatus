/**
 * Navigation State Hook - P1-NAV-001
 *
 * React hook for managing browser navigation state.
 * Integrates NavigationStateManager with React components.
 *
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  NavigationState,
  NavigationView,
  createNavigationState,
  pushNavigationState,
  replaceNavigationState,
  setupHistoryListener,
  getCurrentNavigationState,
  navigateBack,
  canNavigateBack,
} from '@/lib/navigation-state';
import { logger } from '@/lib/logger';

interface UseNavigationStateOptions {
  roomId?: string;
  initialView?: NavigationView;
  onNavigate?: (state: NavigationState) => void;
}

interface UseNavigationStateReturn {
  /** Navigate to a specific view */
  navigateTo: (view: NavigationView, options?: { gameType?: string }) => void;
  /** Go back to previous state */
  goBack: () => boolean;
  /** Check if can go back */
  canGoBack: boolean;
  /** Get current navigation state */
  currentState: NavigationState | null;
  /** Update current state without navigation */
  updateState: (view: NavigationView, options?: { gameType?: string }) => void;
}

export function useNavigationState({
  roomId,
  initialView = 'chat',
  onNavigate,
}: UseNavigationStateOptions): UseNavigationStateReturn {
  const currentStateRef = useRef<NavigationState | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize state on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Check if we have existing state
    const existingState = getCurrentNavigationState();

    if (existingState && existingState.roomId === roomId) {
      // Use existing state
      currentStateRef.current = existingState;
      logger.debug('[useNavigationState] Using existing state', {
        view: existingState.currentView,
        roomId: existingState.roomId,
      });
    } else if (roomId) {
      // Create initial state
      const initialState = createNavigationState(initialView, { roomId });
      replaceNavigationState(initialState);
      currentStateRef.current = initialState;
      logger.debug('[useNavigationState] Created initial state', {
        view: initialView,
        roomId,
      });
    }
  }, [roomId, initialView]);

  // Setup history listener
  useEffect(() => {
    const cleanup = setupHistoryListener((state) => {
      currentStateRef.current = state;

      // Call onNavigate callback if provided
      if (onNavigate) {
        onNavigate(state);
      }

      logger.debug('[useNavigationState] Navigation state changed', {
        view: state.currentView,
        roomId: state.roomId,
      });
    });

    return cleanup;
  }, [onNavigate]);

  // Navigate to a specific view
  const navigateTo = useCallback((
    view: NavigationView,
    options?: { gameType?: string }
  ) => {
    const previousState = currentStateRef.current || undefined;

    const newState = createNavigationState(view, {
      roomId,
      gameType: options?.gameType,
      previousState,
    });

    pushNavigationState(newState);
    currentStateRef.current = newState;

    // Call onNavigate callback
    if (onNavigate) {
      onNavigate(newState);
    }

    logger.debug('[useNavigationState] Navigated to', {
      view,
      roomId,
      gameType: options?.gameType,
    });
  }, [roomId, onNavigate]);

  // Update state without adding to history
  const updateState = useCallback((
    view: NavigationView,
    options?: { gameType?: string }
  ) => {
    const newState = createNavigationState(view, {
      roomId,
      gameType: options?.gameType,
      previousState: currentStateRef.current?.previousState,
    });

    replaceNavigationState(newState);
    currentStateRef.current = newState;

    logger.debug('[useNavigationState] Updated state', {
      view,
      roomId,
    });
  }, [roomId]);

  // Go back
  const goBack = useCallback((): boolean => {
    return navigateBack();
  }, []);

  return {
    navigateTo,
    goBack,
    canGoBack: canNavigateBack(),
    currentState: currentStateRef.current,
    updateState,
  };
}
