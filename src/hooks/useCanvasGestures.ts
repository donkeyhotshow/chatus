/**
 * Canvas Gestures Hook
 *
 * Улучшенная обработка жестов для canvas:
 * - Palm rejection для планшетов
 * - Zoom/Pan жесты
 * - Pressure sensitivity
 */

'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface Point {
  x: nu
 number;
  pressure?: number;
  timestamp: number;
}

interface GestureState {
  scale: number;
  translateX: number;
  translateY: number;
  isDrawing: boolean;
  isPinching: boolean;
  isPanning: boolean;
}

interface CanvasGesturesOptions {
  /** Минимальный масштаб */
  minScale?: number;
  /** Максимальный масштаб */
  maxScale?: number;
  /** Включить palm rejection */
  palmRejection?: boolean;
  /** Минимальный размер касания для palm rejection (px) */
  palmThreshold?: number;
  /** Callback при изменении масштаба/позиции */
  onTransformChange?: (state: Pick<GestureState, 'scale' | 'translateX' | 'translateY'>) => void;
  /** Callback при начале рисования */
  onDrawStart?: (point: Point) => void;
  /** Callback при рисовании */
  onDrawMove?: (point: Point) => void;
  /** Callback при окончании рисования */
  onDrawEnd?: () => void;
}

const DEFAULT_OPTIONS: Required<Omit<CanvasGesturesOptions, 'onTransformChange' | 'onDrawStart' | 'onDrawMove' | 'onDrawEnd'>> = {
  minScale: 0.5,
  maxScale: 5,
  palmRejection: true,
  palmThreshold: 40, // Касания больше 40px считаются ладонью
};

/**
 * Определяет, является ли касание ладонью
 */
function isPalmTouch(touch: Touch): boolean {
  // Проверяем размер касания (radiusX/radiusY)
  const radiusX = (touch as any).radiusX || 0;
  const radiusY = (touch as any).radiusY || 0;
  const maxRadius = Math.max(radiusX, radiusY);

  // Большие касания (> 40px) скорее всего ладонь
  if (maxRadius > DEFAULT_OPTIONS.palmThreshold) {
    return true;
  }

  // Проверяем force (давление) - очень сильное давление может быть ладонью
  const force = touch.force || 0;
  if (force > 0.8 && maxRadius > 20) {
    return true;
  }

  return false;
}

/**
 * Фильтрует касания, убирая ладони
 */
function filterPalmTouches(touches: TouchList, palmRejection: boolean): Touch[] {
  if (!palmRejection) {
    return Array.from(touches);
  }

  const validTouches: Touch[] = [];

  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    if (!isPalmTouch(touch)) {
      validTouches.push(touch);
    }
  }

  return validTouches;
}

/**
 * Вычисляет расстояние между двумя точками
 */
function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Вычисляет центр между двумя точками
 */
function getCenter(p1: { x: number; y: number }, p2: { x: number; y: number }): { x: number; y: number } {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function useCanvasGestures(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: CanvasGesturesOptions = {}
) {
  const {
    minScale = DEFAULT_OPTIONS.minScale,
    maxScale = DEFAULT_OPTIONS.maxScale,
    palmRejection = DEFAULT_OPTIONS.palmRejection,
    onTransformChange,
    onDrawStart,
    onDrawMove,
    onDrawEnd,
  } = options;

  const [gestureState, setGestureState] = useState<GestureState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDrawing: false,
    isPinching: false,
    isPanning: false,
  });

  // Refs для отслеживания состояния жестов
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPanPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeDrawingTouchId = useRef<number | null>(null);
  const gestureStateRef = useRef(gestureState);

  // Синхронизируем ref с state
  useEffect(() => {
    gestureStateRef.current = gestureState;
  }, [gestureState]);

  /**
   * Преобразует координаты экрана в координаты canvas
   */
  const screenToCanvas = useCallback((clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const state = gestureStateRef.current;

    // Учитываем масштаб и смещение
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now(),
    };
  }, [canvasRef]);

  /**
   * Обработчик начала касания
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const validTouches = filterPalmTouches(e.touches, palmRejection);

    if (validTouches.length === 0) {
      return; // Все касания - ладони
    }

    if (validTouches.length === 2) {
      // Начало pinch-to-zoom
      e.preventDefault();

      const touch1 = validTouches[0];
      const touch2 = validTouches[1];

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      lastTouchDistance.current = getDistance(p1, p2);
      lastTouchCenter.current = getCenter(p1, p2);

      setGestureState(prev => ({ ...prev, isPinching: true, isDrawing: false }));
      activeDrawingTouchId.current = null;

    } else if (validTouches.length === 1 && !gestureStateRef.current.isPinching) {
      // Начало рисования (только если не pinch)
      const touch = validTouches[0];
      activeDrawingTouchId.current = touch.identifier;

      const point = screenToCanvas(touch.clientX, touch.clientY);
      if (point) {
        // Добавляем pressure если доступно
        point.pressure = touch.force || 0.5;

        setGestureState(prev => ({ ...prev, isDrawing: true }));
        onDrawStart?.(point);
      }
    }
  }, [palmRejection, screenToCanvas, onDrawStart]);

  /**
   * Обработчик движения касания
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const validTouches = filterPalmTouches(e.touches, palmRejection);
    const state = gestureStateRef.current;

    if (validTouches.length === 2 && state.isPinching) {
      // Pinch-to-zoom
      e.preventDefault();

      const touch1 = validTouches[0];
      const touch2 = validTouches[1];

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      const currentDistance = getDistance(p1, p2);
      const currentCenter = getCenter(p1, p2);

      // Вычисляем изменение масштаба
      const deltaScale = currentDistance / lastTouchDistance.current;
      const newScale = Math.min(Math.max(state.scale * deltaScale, minScale), maxScale);

      // Вычисляем смещение (pan во время zoom)
      const dx = currentCenter.x - lastTouchCenter.current.x;
      const dy = currentCenter.y - lastTouchCenter.current.y;

      const newTranslateX = state.translateX + dx;
      const newTranslateY = state.translateY + dy;

      lastTouchDistance.current = currentDistance;
      lastTouchCenter.current = currentCenter;

      setGestureState(prev => ({
        ...prev,
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      }));

      onTransformChange?.({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      });

    } else if (validTouches.length === 1 && state.isDrawing) {
      // Рисование
      const touch = validTouches.find(t => t.identifier === activeDrawingTouchId.current);
      if (!touch) return;

      const point = screenToCanvas(touch.clientX, touch.clientY);
      if (point) {
        point.pressure = touch.force || 0.5;
        onDrawMove?.(point);
      }
    }
  }, [palmRejection, minScale, maxScale, screenToCanvas, onTransformChange, onDrawMove]);

  /**
   * Обработчик окончания касания
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const remainingTouches = filterPalmTouches(e.touches, palmRejection);
    const state = gestureStateRef.current;

    if (remainingTouches.length < 2 && state.isPinching) {
      // Окончание pinch
      setGestureState(prev => ({ ...prev, isPinching: false }));
    }

    if (remainingTouches.length === 0 && state.isDrawing) {
      // Окончание рисования
      setGestureState(prev => ({ ...prev, isDrawing: false }));
      activeDrawingTouchId.current = null;
      onDrawEnd?.();
    }
  }, [palmRejection, onDrawEnd]);

  /**
   * Обработчик колеса мыши (zoom на десктопе)
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const state = gestureStateRef.current;

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      e.preventDefault();

      const delta = -e.deltaY;
      const factor = Math.pow(1.1, delta / 100);
      const newScale = Math.min(Math.max(state.scale * factor, minScale), maxScale);

      setGestureState(prev => ({ ...prev, scale: newScale }));
      onTransformChange?.({
        scale: newScale,
        translateX: state.translateX,
        translateY: state.translateY,
      });
    } else {
      // Pan
      const newTranslateX = state.translateX - e.deltaX;
      const newTranslateY = state.translateY - e.deltaY;

      setGestureState(prev => ({
        ...prev,
        translateX: newTranslateX,
        translateY: newTranslateY,
      }));

      onTransformChange?.({
        scale: state.scale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      });
    }
  }, [minScale, maxScale, onTransformChange]);

  /**
   * Сброс трансформации
   */
  const resetTransform = useCallback(() => {
    setGestureState(prev => ({
      ...prev,
      scale: 1,
      translateX: 0,
      translateY: 0,
    }));
    onTransformChange?.({ scale: 1, translateX: 0, translateY: 0 });
  }, [onTransformChange]);

  /**
   * Установка масштаба
   */
  const setScale = useCallback((scale: number) => {
    const clampedScale = Math.min(Math.max(scale, minScale), maxScale);
    setGestureState(prev => ({ ...prev, scale: clampedScale }));
    onTransformChange?.({
      scale: clampedScale,
      translateX: gestureStateRef.current.translateX,
      translateY: gestureStateRef.current.translateY,
    });
  }, [minScale, maxScale, onTransformChange]);

  return {
    gestureState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onWheel: handleWheel,
    },
    resetTransform,
    setScale,
    screenToCanvas,
  };
}

export type { Point, GestureState, CanvasGesturesOptions };
