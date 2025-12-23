/**
 * Session Manager - P0 Critical Fix
 *
 * Handles:
 * - Session persistence across page refresigation
 * - Room state restoration
 * - Tab visibility handling
 * - Graceful reconnection
 */

import { logger } from './logger';

const SESSION_KEY = 'chat-session';
const ROOM_STATE_KEY = 'chat-room-state';
const TAB_ID_KEY = 'chat-tab-id';

export interface ChatSession {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  joinedAt: number;
  lastActiveAt: number;
  tabId: string;
}

export interface RoomState {
  roomId: string;
  activeTab: string;
  scrollPosition: number;
  draftMessage: string;
  lastMessageId: string | null;
  canvasState: string | null;
  gameState: string | null;
}

// Generate unique tab ID
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create tab ID
export function getTabId(): string {
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

/**
 * Save current session to storage
 */
export function saveSession(session: Omit<ChatSession, 'tabId' | 'lastActiveAt'>): void {
  try {
    const fullSession: ChatSession = {
      ...session,
      tabId: getTabId(),
      lastActiveAt: Date.now(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(fullSession));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fullSession));

    logger.debug('[SessionManager] Session saved', { roomId: session.roomId });
  } catch (error) {
    logger.error('[SessionManager] Failed to save session', error as Error);
  }
}

/**
 * Get current session from storage
 */
export function getSession(): ChatSession | null {
  try {
    // Try sessionStorage first (current tab)
    let sessionStr = sessionStorage.getItem(SESSION_KEY);

    // Fallback to localStorage (cross-tab)
    if (!sessionStr) {
      sessionStr = localStorage.getItem(SESSION_KEY);
    }

    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr) as ChatSession;

    // Check if session is still valid (not older than 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - session.lastActiveAt > maxAge) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    logger.warn('[SessionManager] Failed to get session', { error });
    return null;
  }
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(): void {
  const session = getSession();
  if (session) {
    session.lastActiveAt = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

/**
 * Clear session from storage
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ROOM_STATE_KEY);
  sessionStorage.removeItem(ROOM_STATE_KEY);
}

/**
 * Save room state for restoration
 */
export function saveRoomState(state: RoomState): void {
  try {
    localStorage.setItem(ROOM_STATE_KEY, JSON.stringify(state));
    sessionStorage.setItem(ROOM_STATE_KEY, JSON.stringify(state));
    logger.debug('[SessionManager] Room state saved', { roomId: state.roomId });
  } catch (error) {
    logger.error('[SessionManager] Failed to save room state', error as Error);
  }
}

/**
 * Get room state for restoration
 */
export function getRoomState(roomId: string): RoomState | null {
  try {
    // Try sessionStorage first
    let stateStr = sessionStorage.getItem(ROOM_STATE_KEY);

    // Fallback to localStorage
    if (!stateStr) {
      stateStr = localStorage.getItem(ROOM_STATE_KEY);
    }

    if (!stateStr) return null;

    const state = JSON.parse(stateStr) as RoomState;

    // Only return if roomId matches
    if (state.roomId !== roomId) return null;

    return state;
  } catch (error) {
    logger.warn('[SessionManager] Failed to get room state', { error });
    return null;
  }
}

/**
 * Check if we should restore session for given roomId
 */
export function shouldRestoreSession(roomId: string): boolean {
  const session = getSession();
  return session !== null && session.roomId === roomId;
}

/**
 * Handle page visibility change
 */
export function setupVisibilityHandler(onVisible: () => void, onHidden: () => void): () => void {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateSessionActivity();
      onVisible();
    } else {
      onHidden();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Handle before unload - save state
 */
export function setupBeforeUnloadHandler(getState: () => RoomState | null): () => void {
  const handleBeforeUnload = () => {
    const state = getState();
    if (state) {
      saveRoomState(state);
    }
    updateSessionActivity();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

/**
 * Handle popstate (back/forward navigation)
 */
export function setupPopstateHandler(onNavigate: () => void): () => void {
  const handlePopstate = () => {
    updateSessionActivity();
    onNavigate();
  };

  window.addEventListener('popstate', handlePopstate);

  return () => {
    window.removeEventListener('popstate', handlePopstate);
  };
}
