/**
 * Context Indicator - P2-CONTEXT-001
 *
 * Provides breadcrumb navigation and context information
 * to help users understand their current location in the app.
 *
 * Requirements: 24.1, 24.2, 24.3, 24.4
 */

import { NavigationState, NavigationView } from './navigation-state';

/**
 * Represents a single item in the breadcrumb navigation
 */
export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
}

/**
 * Game type to display name mapping
 */
const GAME_DISPLAY_NAMES: Record<string, string> = {
  'tic-tac-toe': 'Крестики-нолики',
  'tictactoe': 'Крестики-нолики',
  'dice': 'Кости',
  'dice-roll': 'Кости',
  'rock-paper-scissors': 'Камень-ножницы-бумага',
  'rps': 'Камень-ножницы-бумага',
  'click-war': 'Кликер',
  'tower-defense': 'Башенная защита',
  'maze': 'Лабиринт',
  'physics': 'Физика',
};

/**
 * View type to icon mapping (using emoji for simplicity)
 */
const VIEW_ICONS: Record<NavigationView, string> = {
  rooms: '🏠',
  chat: '💬',
  game: '🎮',
  canvas: '🎨',
};

/**
 * View type to default label mapping
 */
const VIEW_LABELS: Record<NavigationView, string> = {
  rooms: 'Комнаты',
  chat: 'Чат',
  game: 'Игра',
  canvas: 'Холст',
};


/**
 * Build a breadcrumb navigation chain from the current navigation state.
 * Returns an array of BreadcrumbItem objects representing the path.
 *
 * @param state - Current navigation state
 * @param roomName - Optional room name to display instead of ID
 * @returns Array of breadcrumb items
 */
export function buildBreadcrumb(
  state: NavigationState | null,
  roomName?: string
): BreadcrumbItem[] {
  if (!state) {
    return [
      {
        label: VIEW_LABELS.rooms,
        path: '/',
        icon: VIEW_ICONS.rooms,
      },
    ];
  }

  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with rooms
  breadcrumbs.push({
    label: VIEW_LABELS.rooms,
    path: '/',
    icon: VIEW_ICONS.rooms,
  });

  // Add chat room if we're in a room context
  if (state.currentView !== 'rooms' && state.roomId) {
    const roomLabel = roomName || formatRoomId(state.roomId);
    breadcrumbs.push({
      label: roomLabel,
      path: `/chat/${state.roomId}`,
      icon: VIEW_ICONS.chat,
    });
  }

  // Add game or canvas if applicable
  if (state.currentView === 'game' && state.roomId) {
    const gameLabel = getGameDisplayName(state.gameType);
    breadcrumbs.push({
      label: gameLabel,
      path: `/chat/${state.roomId}?view=game${state.gameType ? `&game=${state.gameType}` : ''}`,
      icon: VIEW_ICONS.game,
    });
  } else if (state.currentView === 'canvas' && state.roomId) {
    breadcrumbs.push({
      label: VIEW_LABELS.canvas,
      path: `/chat/${state.roomId}?view=canvas`,
      icon: VIEW_ICONS.canvas,
    });
  }

  return breadcrumbs;
}


/**
 * Get the title for the current context.
 * This is used for the header display.
 *
 * @param state - Current navigation state
 * @param roomName - Optional room name to display
 * @returns Context title string
 */
export function getContextTitle(
  state: NavigationState | null,
  roomName?: string
): string {
  if (!state) {
    return VIEW_LABELS.rooms;
  }

  switch (state.currentView) {
    case 'rooms':
      return VIEW_LABELS.rooms;

    case 'chat':
      return roomName || formatRoomId(state.roomId) || VIEW_LABELS.chat;

    case 'game': {
      const gameName = getGameDisplayName(state.gameType);
      const room = roomName || formatRoomId(state.roomId);
      return room ? `${room} > ${gameName}` : gameName;
    }

    case 'canvas': {
      const room = roomName || formatRoomId(state.roomId);
      return room ? `${room} > ${VIEW_LABELS.canvas}` : VIEW_LABELS.canvas;
    }

    default:
      return VIEW_LABELS.rooms;
  }
}

/**
 * Get the icon for the current view type.
 *
 * @param view - Navigation view type
 * @returns Icon string (emoji)
 */
export function getContextIcon(view: NavigationView): string {
  return VIEW_ICONS[view] || VIEW_ICONS.rooms;
}


/**
 * Get the display name for a game type.
 *
 * @param gameType - Game type identifier
 * @returns Human-readable game name
 */
export function getGameDisplayName(gameType?: string): string {
  if (!gameType) {
    return VIEW_LABELS.game;
  }

  const normalizedType = gameType.toLowerCase().trim();
  return GAME_DISPLAY_NAMES[normalizedType] || capitalizeGameType(gameType);
}

/**
 * Format a room ID for display.
 * Converts technical IDs to more readable format.
 *
 * @param roomId - Room identifier
 * @returns Formatted room name
 */
function formatRoomId(roomId?: string): string {
  if (!roomId) {
    return '';
  }

  // If it looks like a UUID or technical ID, truncate it
  if (roomId.length > 20 || /^[a-f0-9-]{20,}$/i.test(roomId)) {
    return `Комната ${roomId.substring(0, 8)}...`;
  }

  // Otherwise, capitalize first letter and return
  return roomId.charAt(0).toUpperCase() + roomId.slice(1);
}

/**
 * Capitalize a game type string for display.
 *
 * @param gameType - Game type string
 * @returns Capitalized string
 */
function capitalizeGameType(gameType: string): string {
  return gameType
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


/**
 * Check if the current state represents a nested view (game or canvas).
 *
 * @param state - Navigation state
 * @returns True if in a nested view
 */
export function isNestedView(state: NavigationState | null): boolean {
  if (!state) return false;
  return state.currentView === 'game' || state.currentView === 'canvas';
}

/**
 * Get the parent path for the current state.
 * Used for "back" navigation.
 *
 * @param state - Navigation state
 * @returns Parent path or '/' if at root
 */
export function getParentPath(state: NavigationState | null): string {
  if (!state) return '/';

  switch (state.currentView) {
    case 'game':
    case 'canvas':
      return state.roomId ? `/chat/${state.roomId}` : '/';
    case 'chat':
      return '/';
    default:
      return '/';
  }
}
