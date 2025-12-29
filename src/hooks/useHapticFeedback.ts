"use client";

import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [50],
  success: [10, 50, 10],
  error: [50, 30, 50],
  warning: [30, 20, 30],
};

/**
 * P3 FIX: Hook for haptic feedback in games and UI interactions
 * Provides vibration patterns for different feedback types
 */
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: HapticPattern | number[] = 'light') => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      return false;
    }

    try {
      const vibrationPattern = Array.isArray(pattern)
        ? pattern
        : HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.light;

      return navigator.vibrate(vibrationPattern);
    } catch {
      return false;
    }
  }, []);

  const lightTap = useCallback(() => vibrate('light'), [vibrate]);
  const mediumTap = useCallback(() => vibrate('medium'), [vibrate]);
  const heavyTap = useCallback(() => vibrate('heavy'), [vibrate]);
  const success = useCallback(() => vibrate('success'), [vibrate]);
  const error = useCallback(() => vibrate('error'), [vibrate]);
  const warning = useCallback(() => vibrate('warning'), [vibrate]);

  // Game-specific patterns
  const gameClick = useCallback(() => vibrate([10]), [vibrate]);
  const gameWin = useCallback(() => vibrate([100, 50, 100, 50, 200]), [vibrate]);
  const gameLose = useCallback(() => vibrate([200, 100, 200]), [vibrate]);
  const gameScore = useCallback(() => vibrate([15, 30, 15]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
    warning,
    // Game-specific
    gameClick,
    gameWin,
    gameLose,
    gameScore,
  };
}

/**
 * Simple vibrate function for use outside of React components
 */
export function vibrate(pattern: HapticPattern | number[] = 'light'): boolean {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }

  try {
    const vibrationPattern = Array.isArray(pattern)
      ? pattern
      : HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.light;

    return navigator.vibrate(vibrationPattern);
  } catch {
    return false;
  }
}

export default useHapticFeedback;
