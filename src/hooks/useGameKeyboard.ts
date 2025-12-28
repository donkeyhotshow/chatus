'use client';

import { useEffect, useCallback, useRef } from 'react';
import { hapticFeedback } from '@/lib/game-utils';

type Direction = 'up' | 'down' | 'left' | 'right';
type GameAction = 'select' | 'back' | 'pause' | 'restart';

interface KeyboardConfig {
  onDirection?: (direction: Direction) => void;
  onAction?: (action: GameAction) => void;
  onCellSelect?: (index: number) => void;
  gridSize?: number; // For grid-based games like TicTacToe
  enabled?: boolean;
  preventScroll?: boolean;
}

const DIRECTION_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};

const ACTION_KEYS: Record<string, GameAction> = {
  Enter: 'select',
  ' ': 'select',
  Escape: 'back',
  p: 'pause',
  P: 'pause',
  r: 'restart',
  R: 'restart',
};

/**
 * Hook for keyboard navigation in games
 * Supports arrow keys, WASD, number keys for grid selection
 */
export function useGameKeyboard({
  onDirection,
  onAction,
  onCellSelect,
  gridSize = 3,
  enabled = true,
  preventScroll = true,
}: KeyboardConfig) {
  const focusedCellRef = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const direction = DIRECTION_KEYS[e.key];
      const action = ACTION_KEYS[e.key];

      // Direction keys
      if (direction && onDirection) {
        if (preventScroll) e.preventDefault();
        onDirection(direction);
        hapticFeedback('light');
        return;
      }

      // Action keys
      if (action && onAction) {
        if (preventScroll) e.preventDefault();
        onAction(action);
        hapticFeedback('light');
        return;
      }

      // Number keys for grid selection (1-9)
      if (onCellSelect && /^[1-9]$/.test(e.key)) {
        const cellIndex = parseInt(e.key) - 1;
        if (cellIndex < gridSize * gridSize) {
          e.preventDefault();
          onCellSelect(cellIndex);
          hapticFeedback('light');
        }
        return;
      }

      // Arrow navigation for grid
      if (onCellSelect && direction) {
        e.preventDefault();
        const cols = gridSize;
        const current = focusedCellRef.current;
        let next = current;

        switch (direction) {
          case 'up':
            next = current - cols >= 0 ? current - cols : current;
            break;
          case 'down':
            next = current + cols < gridSize * gridSize ? current + cols : current;
            break;
          case 'left':
            next = current % cols > 0 ? current - 1 : current;
            break;
          case 'right':
            next = (current + 1) % cols !== 0 ? current + 1 : current;
            break;
        }

        focusedCellRef.current = next;

        // Focus the cell element
        const cells = document.querySelectorAll('[data-game-cell]');
        if (cells[next]) {
          (cells[next] as HTMLElement).focus();
        }
      }

      // Enter/Space to select focused cell
      if (onCellSelect && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onCellSelect(focusedCellRef.current);
        hapticFeedback('medium');
      }
    },
    [enabled, onDirection, onAction, onCellSelect, gridSize, preventScroll]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    focusedCell: focusedCellRef.current,
    setFocusedCell: (index: number) => {
      focusedCellRef.current = index;
    },
  };
}

/**
 * Hook specifically for Snake game controls
 */
export function useSnakeKeyboard(
  onDirectionChange: (dir: { x: number; y: number }) => void,
  enabled = true
) {
  const currentDirRef = useRef({ x: 1, y: 0 });

  const handleDirection = useCallback(
    (direction: Direction) => {
      const { x, y } = currentDirRef.current;
      let newDir = { x, y };

      switch (direction) {
        case 'up':
          if (y === 0) newDir = { x: 0, y: -1 };
          break;
        case 'down':
          if (y === 0) newDir = { x: 0, y: 1 };
          break;
        case 'left':
          if (x === 0) newDir = { x: -1, y: 0 };
          break;
        case 'right':
          if (x === 0) newDir = { x: 1, y: 0 };
          break;
      }

      if (newDir.x !== x || newDir.y !== y) {
        currentDirRef.current = newDir;
        onDirectionChange(newDir);
      }
    },
    [onDirectionChange]
  );

  useGameKeyboard({
    onDirection: handleDirection,
    enabled,
    preventScroll: true,
  });

  return {
    setDirection: (dir: { x: number; y: number }) => {
      currentDirRef.current = dir;
    },
  };
}

/**
 * Hook for TicTacToe keyboard navigation
 */
export function useTicTacToeKeyboard(
  onCellClick: (index: number) => void,
  enabled = true
) {
  return useGameKeyboard({
    onCellSelect: onCellClick,
    gridSize: 3,
    enabled,
    preventScroll: true,
  });
}
