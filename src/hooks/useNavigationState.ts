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

  // Initialize state on mount - FIXED: Parse URL params first
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // CRITICAL FIX: First check URL for view parameter
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    const gameTypeFromUrl = urlParams.get('game');

    // Determine initial view from URL or fallback
    let effectiveInitialView: NavigationView = initialView;
    if (viewFromUrl === 'game') {
      effectiveInitialView = 'game';
    } else if (viewFromUrl === 'canvas') {
      effectiveInitialView = 'canvas';
    }

    // Check if we have existing state that matches current URL
    const existingState = getCurrentNavigationState();

    if (existingState && existingState.roomId === roomId && existingState.currentView === effectiveInitialView) {
      // Use existing state only if it matches URL
      currentStateRef.current = existingState;
      logger.debug('[useNavigationState] Using existing state', {
        view: existingState.currentView,
        roomId: existingState.roomId,
      });

      // Notify callback about initial state from URL
      if (onNavigate && effectiveInitialView !== 'chat') {
        onNavigate(existingState);
      }
    } else if (roomId) {
      // Create state from URL parameters
      const initialState = createNavigationState(effectiveInitialView, {
        roomId,
        gameType: gameTypeFromUrl || undefined,
      });
      replaceNavigationState(initialState);
      currentStateRef.current = initialState;
      logger.debug('[useNavigationState] Created initial state from URL', {
        view: effectiveInitialView,
        roomId,
        gameType: gameTypeFromUrl,
      });

      // Notify callback about initial state from URL
      if (onNavigate && effectiveInitialView !== 'chat') {
        onNavigate(initialState);
      }
    }
  }, [roomId, initialView, onNavigate]);

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
