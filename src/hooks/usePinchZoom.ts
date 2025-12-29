'use client';

import { useCallback, useRef, useState } from 'react';

interface PinchState {
  scale: number;
  originX: number;
  originY: number;
  isPinching: boolean;
  initialDistance: number;
}

interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  onPinchStart?: () => void;
  onPinchMove?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
  onDoubleTap?: () => void;
}

interface MinimalTouch {
  clientX: number;
  clientY: number;
}

function getDistance(touch1: MinimalTouch, touch2: MinimalTouch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getCenter(touch1: MinimalTouch, touch2: MinimalTouch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

export function usePinchZoom(options: UsePinchZoomOptions = {}) {
  const {
    minScale = 0.5,
    maxScale = 4,
    onPinchStart,
    onPinchMove,
    onPinchEnd,
    onDoubleTap,
  } = options;

  const [state, setState] = useState<PinchState>({
    scale: 1,
    originX: 0,
    originY: 0,
    isPinching: false,
    initialDistance: 0,
  });

  const initialDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);
  const lastTapTime = useRef<number>(0);
  const lastTapPosition = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      // Double tap detection
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const now = Date.now();
        const tapPosition = { x: touch.clientX, y: touch.clientY };

        if (
          lastTapTime.current &&
          now - lastTapTime.current < 300 &&
          lastTapPosition.current
        ) {
          const dx = tapPosition.x - lastTapPosition.current.x;
          const dy = tapPosition.y - lastTapPosition.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 50) {
            onDoubleTap?.();
            lastTapTime.current = 0;
            lastTapPosition.current = null;
            return;
          }
        }

        lastTapTime.current = now;
        lastTapPosition.current = tapPosition;
      }

      // Pinch start
      if (e.touches.length === 2) {
        const distance = getDistance(e.touches[0], e.touches[1]);
        const center = getCenter(e.touches[0], e.touches[1]);

        initialDistance.current = distance;
        initialScale.current = state.scale;

        setState((prev) => ({
          ...prev,
          isPinching: true,
          initialDistance: distance,
          originX: center.x,
          originY: center.y,
        }));

        onPinchStart?.();
      }
    },
    [state.scale, onPinchStart, onDoubleTap]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (e.touches.length !== 2 || !initialDistance.current) return;

      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getCenter(e.touches[0], e.touches[1]);

      const scaleChange = distance / initialDistance.current;
      let newScale = initialScale.current * scaleChange;

      // Clamp scale
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      setState((prev) => ({
        ...prev,
        scale: newScale,
        originX: center.x,
        originY: center.y,
      }));

      onPinchMove?.(newScale);
    },
    [minScale, maxScale, onPinchMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (e.touches.length < 2 && state.isPinching) {
        setState((prev) => ({
          ...prev,
          isPinching: false,
        }));

        onPinchEnd?.(state.scale);
        initialDistance.current = 0;
      }
    },
    [state.isPinching, state.scale, onPinchEnd]
  );

  const resetScale = useCallback(() => {
    setState({
      scale: 1,
      originX: 0,
      originY: 0,
      isPinching: false,
      initialDistance: 0,
    });
  }, []);

  const setScale = useCallback(
    (newScale: number) => {
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      setState((prev) => ({
        ...prev,
        scale: clampedScale,
      }));
    },
    [minScale, maxScale]
  );

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };

  return {
    ...state,
    handlers,
    resetScale,
    setScale,
    zoomIn: () => setScale(state.scale * 1.2),
    zoomOut: () => setScale(state.scale / 1.2),
  };
}

export default usePinchZoom;
