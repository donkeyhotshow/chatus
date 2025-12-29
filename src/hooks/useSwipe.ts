'use client';

import { useCallback, useRef, useState } from 'react';
export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeState {
  direction: SwipeDirection;
  deltaX: number;
  deltaY: number;
  velocity: number;
  isSwiping: boolean;
}

interface UseSwipeOptions {
  threshold?: number; // Minimum distance to trigger swipe (default: 50px)
  velocityThreshold?: number; // Minimum velocity to trigger swipe (default: 0.3)
  preventScroll?: boolean; // Prevent default scroll behavior
  onSwipeStart?: () => void;
  onSwipeMove?: (state: SwipeState) => void;
  onSwipeEnd?: (direction: SwipeDirection) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipe(options: UseSwipeOptions = {}) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventScroll = false,
    onSwipeStart,
    onSwipeMove,
    onSwipeEnd,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = options;

  const [state, setState] = useState<SwipeState>({
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    isSwiping: false,
  });

  const startPoint = useRef<TouchPoint | null>(null);
  const lastPoint = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      const touch = e.touches[0];
      const point: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      startPoint.current = point;
      lastPoint.current = point;

      setState({
        direction: null,
        deltaX: 0,
        deltaY: 0,
        velocity: 0,
        isSwiping: true,
      });

      onSwipeStart?.();
    },
    [onSwipeStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!startPoint.current) return;

      const touch = e.touches[0];
      const currentPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const deltaX = currentPoint.x - startPoint.current.x;
      const deltaY = currentPoint.y - startPoint.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine direction
      let direction: SwipeDirection = null;
      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Calculate velocity
      const timeDelta = currentPoint.time - (lastPoint.current?.time || currentPoint.time);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = timeDelta > 0 ? distance / timeDelta : 0;

      // Prevent scroll if horizontal swipe
      if (preventScroll && absDeltaX > absDeltaY && absDeltaX > 10) {
        e.preventDefault();
      }

      const newState: SwipeState = {
        direction,
        deltaX,
        deltaY,
        velocity,
        isSwiping: true,
      };

      setState(newState);
      onSwipeMove?.(newState);

      lastPoint.current = currentPoint;
    },
    [preventScroll, onSwipeMove]
  );

  const handleTouchEnd = useCallback(() => {
    if (!startPoint.current || !lastPoint.current) {
      setState((prev) => ({ ...prev, isSwiping: false }));
      return;
    }

    const deltaX = lastPoint.current.x - startPoint.current.x;
    const deltaY = lastPoint.current.y - startPoint.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Calculate final velocity
    const timeDelta = lastPoint.current.time - startPoint.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = timeDelta > 0 ? distance / timeDelta : 0;

    // Determine if swipe was significant
    const isSignificantSwipe =
      distance >= threshold || velocity >= velocityThreshold;

    let finalDirection: SwipeDirection = null;

    if (isSignificantSwipe) {
      if (absDeltaX > absDeltaY) {
        finalDirection = deltaX > 0 ? 'right' : 'left';
        if (finalDirection === 'left') onSwipeLeft?.();
        if (finalDirection === 'right') onSwipeRight?.();
      } else {
        finalDirection = deltaY > 0 ? 'down' : 'up';
        if (finalDirection === 'up') onSwipeUp?.();
        if (finalDirection === 'down') onSwipeDown?.();
      }
    }

    setState({
      direction: finalDirection,
      deltaX,
      deltaY,
      velocity,
      isSwiping: false,
    });

    onSwipeEnd?.(finalDirection);

    startPoint.current = null;
    lastPoint.current = null;
  }, [threshold, velocityThreshold, onSwipeEnd, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };

  return {
    ...state,
    handlers,
    reset: () =>
      setState({
        direction: null,
        deltaX: 0,
        deltaY: 0,
        velocity: 0,
        isSwiping: false,
      }),
  };
}

export default useSwipe;
