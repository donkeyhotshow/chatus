/**
 * Navigation State Manager - P1-NAV-001
 *
 * Handles browser back/forward navigation without full page reload.
 *Uses History API to manage navigation states for:
 * - Room list
 * - Chat rooms
 * - Games
 * - Canvas
 *
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */

import { logger } from './logger';

export type NavigationView = 'rooms' | 'chat' | 'game' | 'canvas';

export interface NavigationState {
  currentView: NavigationView;
  roomId?: string;
  gameType?: string;
  previousState?: NavigationState;
  timestamp: number;
}

const NAV_STATE_KEY = 'chat-nav-state';
const NAV_HISTORY_KEY = 'chat-nav-history';

// Store listeners for state changes
type StateChangeListener = (state: NavigationState) => void;
let stateChangeListeners: StateChangeListener[] = [];
let isListenerSetup = false;

/**
 * Create a navigation state object
 */
export function createNavigationState(
  view: NavigationView,
  options?: {
    roomId?: string;
    gameType?: string;
    previousState?: NavigationState;
  }
): NavigationState {
  return {
    currentView: view,
    roomId: options?.roomId,
    gameType: options?.gameType,
    previousState: options?.previousState,
    timestamp: Date.now(),
  };
}

/**
 * Push a new navigation state to browser history
 * This allows the back button to navigate within the app
 */
export function pushNavigationState(state: NavigationState): void {
  try {
    // Build URL based on state
    const url = buildUrlFromState(state);

    // Push to browser history
    window.history.pushState(
      { navState: state },
      '',
      url
    );

    // Save to storage for persistence
    saveNavigationState(state);

    logger.debug('[NavigationState] Pushed state', {
      view: state.currentView,
      roomId: state.roomId,
      gameType: state.gameType,
    });
  } catch (error) {
    logger.error('[NavigationState] Failed to push state', error as Error);
  }
}

/**
 * Replace current navigation state without adding to history
 */
export function replaceNavigationState(state: NavigationState): void {
  try {
    const url = buildUrlFromState(state);

    window.history.replaceState(
      { navState: state },
      '',
      url
    );

    saveNavigationState(state);

    logger.debug('[NavigationState] Replaced state', {
      view: state.currentView,
      roomId: state.roomId,
    });
  } catch (error) {
    logger.error('[NavigationState] Failed to replace state', error as Error);
  }
}

/**
 * Handle browser popstate event (back/forward button)
 * Returns the navigation state from the event, or null if not available
 */
export function handlePopState(event: PopStateEvent): NavigationState | null {
  try {
    // Check if event has our navigation state
    if (event.state?.navState) {
      const state = event.state.navState as NavigationState;
      saveNavigationState(state);

      logger.debug('[NavigationState] PopState handled', {
        view: state.currentView,
        roomId: state.roomId,
      });

      return state;
    }

    // Try to restore from URL
    const stateFromUrl = parseStateFromUrl();
    if (stateFromUrl) {
      saveNavigationState(stateFromUrl);
      return stateFromUrl;
    }

    // Fallback to stored state
    return restoreStateFromHistory();
  } catch (error) {
    logger.error('[NavigationState] Failed to handle popstate', error as Error);
    return null;
  }
}

/**
Restore navigation state from storage
 */
export function restoreStateFromHistory(): NavigationState | null {
  try {
    const stored = sessionStorage.getItem(NAV_STATE_KEY);
    if (!stored) {
      // Try localStorage as fallback
      const localStored = localStorage.getItem(NAV_STATE_KEY);
      if (!localStored) return null;
      return JSON.parse(localStored) as NavigationState;
    }
    return JSON.parse(stored) as NavigationState;
  } catch (error) {
    logger.warn('[NavigationState] Failed to restore state', { error });
    return null;
  }
}

/**
 * Setup listener for history changes (popstate events)
 * Returns cleanup function
 */
export function setupHistoryListener(
  onStateChange: (state: NavigationState) => void
): () => void {
  // Add to listeners
  stateChangeListeners.push(onStateChange);

  // Setup global listener only once
  if (!isListenerSetup) {
    const handlePopStateEvent = (event: PopStateEvent) => {
      const state = handlePopState(event);
      if (state) {
        // Notify all listeners
        stateChangeListeners.forEach(listener => {
          try {
            listener(state);
          } catch (error) {
            logger.error('[NavigationState] Listener error', error as Error);
          }
        });
      }
    };

    window.addEventListener('popstate', handlePopStateEvent);
    isListenerSetup = true;

    logger.debug('[NavigationState] History listener setup');
  }

  // Return cleanup function
  return () => {
    stateChangeListeners = stateChangeListeners.filter(l => l !== onStateChange);

    // Note: We don't remove the global listener as other components may still need it
    logger.debug('[NavigationState] Listener removed', {
      remainingListeners: stateChangeListeners.length,
    });
  };
}

/**
 * Navigate back programmatically
 * Returns true if navigation was handled, false if should use default behavior
 */
export function navigateBack(): boolean {
  const currentState = restoreStateFromHistory();

  if (!currentState) {
    return false;
  }

  // If we have a previous state, we can handle this
  if (currentState.previousState) {
    window.history.back();
    return true;
  }

  // Handle based on current view
  switch (currentState.currentView) {
    case 'game':
    case 'canvas':
      // Go back to chat
      window.history.back();
      return true;
    case 'chat':
      // Go back to rooms
      window.history.back();
      return true;
    default:
      return false;
  }
}

/**
 * Get the current navigation state
 */
export function getCurrentNavigationState(): NavigationState | null {
  // First check history state
  if (window.history.state?.navState) {
    return window.history.state.navState as NavigationState;
  }

  // Fallback to stored state
  return restoreStateFromHistory();
}

/**
 * Check if we can navigate back within the app
 */
export function canNavigateBack(): boolean {
  const state = getCurrentNavigationState();
  if (!state) return false;

  return state.currentView !== 'rooms' || !!state.previousState;
}

// ============ Internal Helper Functions ============

/**
 * Build URL from navigation state
 */
function buildUrlFromState(state: NavigationState): string {
  switch (state.currentView) {
    case 'rooms':
      return '/';
    case 'chat':
      return state.roomId ? `/chat/${state.roomId}` : '/';
    case 'game':
      return state.roomId
        ? `/chat/${state.roomId}?view=game${state.gameType ? `&game=${state.gameType}` : ''}`
        : '/';
    case 'canvas':
      return state.roomId ? `/chat/${state.roomId}?view=canvas` : '/';
    default:
      return '/';
  }
}

/**
 * Parse navigation state from current URL
 */
function parseStateFromUrl(): NavigationState | null {
  try {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    // Check for chat room
    const chatMatch = pathname.match(/^\/chat\/([^/]+)/);
    if (chatMatch) {
      const roomId = chatMatch[1];
      const view = searchParams.get('view');
      const gameType = searchParams.get('game');

      if (view === 'game') {
        return createNavigationState('game', { roomId, gameType: gameType || undefined });
      }
      if (view === 'canvas') {
        return createNavigationState('canvas', { roomId });
      }
      return createNavigationState('chat', { roomId });
    }

    // Default to rooms
    if (pathname === '/' || pathname === '') {
      return createNavigationState('rooms');
    }

    return null;
  } catch (error) {
    logger.warn('[NavigationState] Failed to parse URL', { error });
    return null;
  }
}

/**
 * Save navigation state to storage
 */
function saveNavigationState(state: NavigationState): void {
  try {
    const stateJson = JSON.stringify(state);
    sessionStorage.setItem(NAV_STATE_KEY, stateJson);
    localStorage.setItem(NAV_STATE_KEY, stateJson);
  } catch (error) {
    logger.warn('[NavigationState] Failed to save state', { error });
  }
}

/**
 * Clear navigation state from storage
 */
export function clearNavigationState(): void {
  try {
    sessionStorage.removeItem(NAV_STATE_KEY);
    localStorage.removeItem(NAV_STATE_KEY);
    sessionStorage.removeItem(NAV_HISTORY_KEY);
    localStorage.removeItem(NAV_HISTORY_KEY);
  } catch (error) {
    logger.warn('[NavigationState] Failed to clear state', { error });
  }
}
