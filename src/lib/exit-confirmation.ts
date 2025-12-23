/*
t Confirmr - P2-EXIT-001
 * Man
it confirmation dialogs for games, can rooms.
 * Checks for unsaved changes and provides appropriate confirmation messages.
 *
 * Requirements: 25.1, 25.2, 25.3, 25.4
 */

import { logger } from './logger';

export type ExitView = 'game' | 'canvas' | 'room';

export interface ExitContext {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Current view type */
  currentView: ExitView;
  /** Callback when exit is confirmed */
  onConfirm: () => void;
  /** Callback when exit is cancelled */
  onCancel: () => void;
}

export interface ExitConfirmationResult {
  /** Whether to show confirmation dialog */
  shouldShowDialog: boolean;
  /** Title for the dialog */
  title: string;
  /** Message for the dialog */
  message: string;
  /** Confirm button text */
  confirmText: string;
  /** Cancel button text */
  cancelText: string;
}

/**
 * View-specific exit messages
 */
const EXIT_MESSAGES: Record<ExitView, { title: string; message: string; confirmText: string }> = {
  game: {
    title: 'Выйти из игры?',
    message: 'Текущий прогресс игры будет потерян.',
    confirmText: 'Выйти',
  },
  canvas: {
    title: 'Выйти из холста?',
    message: 'Несохранённые изменения будут потеряны. Отправьте рисунок в чат, чтобы сохранить его.',
    confirmText: 'Выйти',
  },
  room: {
    title: 'Покинуть комнату?',
    message: 'Вы уверены, что хотите покинуть эту комнату?',
    confirmText: 'Покинуть',
  },
};

/**
 * Check if exit confirmation should be shown based on context.
 *
 * @param context - Exit context with unsaved changes flag and view type
 * @returns Whether to show confirmation dialog
 */
export function shouldShowExitConfirmation(context: ExitContext): boolean {
  // Always show confirmation for canvas with unsaved changes
  if (context.currentView === 'canvas' && context.hasUnsavedChanges) {
    return true;
  }

  // Show confirmation for active games
  if (context.currentView === 'game' && context.hasUnsavedChanges) {
    return true;
  }

  // Don't show confirmation for room exit without unsaved changes
  if (context.currentView === 'room' && !context.hasUnsavedChanges) {
    return false;
  }

  // Default: show confirmation if there are unsaved changes
  return context.hasUnsavedChanges;
}

/**
 * Get the exit confirmation message for a specific view.
 *
 * @param view - Current view type
 * @returns Confirmation message configuration
 */
export function getExitConfirmationMessage(view: ExitView): ExitConfirmationResult {
  const config = EXIT_MESSAGES[view];

  return {
    shouldShowDialog: true,
    title: config.title,
    message: config.message,
    confirmText: config.confirmText,
    cancelText: 'Отмена',
  };
}

/**
 * Handle exit request with optional confirmation.
 *
 * @param context - Exit context
 * @returns Promise that resolves when exit is handled
 */
export function handleExitRequest(context: ExitContext): void {
  const shouldConfirm = shouldShowExitConfirmation(context);

  if (!shouldConfirm) {
    // No confirmation needed, proceed with exit
    logger.debug('[ExitConfirmation] Exiting without confirmation', {
      view: context.currentView,
    });
    context.onConfirm();
    return;
  }

  // Confirmation is needed - the UI component should show the dialog
  // This function just logs the request
  logger.debug('[ExitConfirmation] Exit confirmation required', {
    view: context.currentView,
    hasUnsavedChanges: context.hasUnsavedChanges,
  });
}

/**
 * Create an exit context for a specific view.
 *
 * @param view - View type
 * @param hasUnsavedChanges - Whether there are unsaved changes
 * @param onConfirm - Callback when exit is confirmed
 * @param onCancel - Callback when exit is cancelled
 * @returns Exit context object
 */
export function createExitContext(
  view: ExitView,
  hasUnsavedChanges: boolean,
  onConfirm: () => void,
  onCancel: () => void = () => {}
): ExitContext {
  return {
    currentView: view,
    hasUnsavedChanges,
    onConfirm,
    onCancel,
  };
}

/**
 * Check if a view type supports exit confirmation.
 *
 * @param view - View type to check
 * @returns Whether the view supports exit confirmation
 */
export function supportsExitConfirmation(view: string): view is ExitView {
  return view === 'game' || view === 'canvas' || view === 'room';
}
