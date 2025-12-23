'use client';

import { logger } from './logger';

/**
 * Canvas Stabilizer - Provides smooth, stable drawing with rAF-based rendering
 *
 * Features:
 * - Point buffering for smooth line rendering
 * - requestAnimationFrame-based flushing to prevent jank
 * - Reliable canvas image capture
 * - Proper resource cleanup
 *
 * Requirements: 19.1, 19.2, 19.3, 19.4
 */

export interface Point {
  x: number;
  y: number;
  timestamp?: number;
}

export interface CanvasDrawState {
  isDrawing: boolean;
  lastPoint: Point | null;
  pendingPoints: Point[];
  animationFrameId: number | null;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
}

export interface DrawConfig {
  color: string;
  strokeWidth: number;
  brushType: 'normal' | 'neon' | 'dashed' | 'calligraphy';
  tool: 'pen' | 'eraser';
}

// Minimum distance between points to reduce noise (in pixels)
const MIN_POINT_DISTANCE = 2;

// Maximum points to buffer before forcing a flush
const MAX_BUFFER_SIZE = 50;

/**
 * Initialize canvas stabilizer state
 */
export function initCanvasStabilizer(canvas: HTMLCanvasElement): CanvasDrawState {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    logger.warn('Failed to get canvas 2D context');
  }

  return {
    isDrawing: false,
    lastPoint: null,
    pendingPoints: [],
    animationFrameId: null,
    canvas,
    ctx,
  };
}

/**
 * Calculate distance between two points
 */
function getDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Process a draw event with point buffering
 * Filters out points that are too close together to reduce noise
 */
export function processDrawEvent(
  state: CanvasDrawState,
  point: Point
): CanvasDrawState {
  // If not drawing, just return current state
  if (!state.isDrawing) {
    return state;
  }

  const newPoint: Point = {
    x: point.x,
    y: point.y,
    timestamp: Date.now(),
  };

  // Filter out points that are too close to the last point
  if (state.lastPoint) {
    const distance = getDistance(state.lastPoint, newPoint);
    if (distance < MIN_POINT_DISTANCE) {
      return state;
    }
  }

  // Add point to buffer
  const newPendingPoints = [...state.pendingPoints, newPoint];

  return {
    ...state,
    lastPoint: newPoint,
    pendingPoints: newPendingPoints,
  };
}

/**
 * Start drawing - initialize state for a new
*/
export function startDrawing(
  state: CanvasDrawState,
  startPoint: Point
): CanvasDrawState {
  return {
    ...state,
    isDrawing: true,
    lastPoint: startPoint,
    pendingPoints: [startPoint],
  };
}

/**
 * Stop drawing - finalize the current stroke
 */
export function stopDrawing(state: CanvasDrawState): CanvasDrawState {
  return {
    ...state,
    isDrawing: false,
  };
}

/**
 * Get all points as a flat array [x1, y1, x2, y2, ...]
 */
export function getPointsArray(state: CanvasDrawState): number[] {
  const points: number[] = [];
  for (const p of state.pendingPoints) {
    points.push(p.x, p.y);
  }
  return points;
}

/**
 * Clear pending points after they've been processed
 */
export function clearPendingPoints(state: CanvasDrawState): CanvasDrawState {
  return {
    ...state,
    pendingPoints: [],
    lastPoint: null,
  };
}

/**
 * Flush pending points using requestAnimationFrame for smooth rendering
 * Returns a promise that resolves when the frame is rendered
 */
export function flushPendingPoints(
  state: CanvasDrawState,
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  onRender?: (points: Point[]) => void
): Promise<CanvasDrawState> {
  return new Promise((resolve) => {
    // Cancel any existing animation frame
    if (state.animationFrameId !== null) {
      cancelAnimationFrame(state.animationFrameId);
    }

    // If no points to render, resolve immediately
    if (state.pendingPoints.length < 2) {
      resolve(state);
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      try {
        renderPoints(ctx, state.pendingPoints, config);

        if (onRender) {
          onRender(state.pendingPoints);
        }
      } catch (error) {
        logger.error('Error rendering canvas points', error as Error);
      }

      resolve({
        ...state,
        animationFrameId: null,
      });
    });

    // Update state with new animation frame ID
    state.animationFrameId = animationFrameId;
  });
}

/**
 * Render points to canvas context with smooth curves
 */
function renderPoints(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  config: DrawConfig
): void {
  if (points.length < 2) return;

  ctx.save();

  // Set composite operation based on tool
  const isErasing = config.tool === 'eraser';
  ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';

  // Set line style
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = isErasing ? '#000000' : config.color;
  ctx.lineWidth = config.strokeWidth;

  // Apply brush-specific styles
  if (config.brushType === 'dashed') {
    ctx.setLineDash([config.strokeWidth * 2, config.strokeWidth * 3]);
  } else {
    ctx.setLineDash([]);
  }

  // Neon effect
  if (!isErasing && config.brushType === 'neon') {
    ctx.shadowColor = config.color;
    ctx.shadowBlur = config.strokeWidth * 1.5;
    ctx.globalAlpha = 0.8;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Draw smooth curve through points
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length >= 3) {
    // Use quadratic curves for smooth lines
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // Draw to the last point
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    ctx.quadraticCurveTo(secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y);
  } else {
    // Just two points - draw a line
    ctx.lineTo(points[1].x, points[1].y);
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Capture canvas image as a Blob
 * Uses a temporary canvas to ensure complete capture with background
 */
export async function captureCanvasImage(
  canvas: HTMLCanvasElement,
  backgroundColor: string = '#0d0d0d'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create temporary canvas for capture
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        reject(new Error('Failed to get temporary canvas context'));
        return;
      }

      // Fill background
      tempCtx.fillStyle = backgroundColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the main canvas content
      tempCtx.drawImage(canvas, 0, 0);

      // Convert to blob with retry logic
      let attempts = 0;
      const maxAttempts = 3;

      const tryCapture = () => {
        attempts++;

        tempCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else if (attempts < maxAttempts) {
              // Retry after a short delay
              setTimeout(tryCapture, 100);
            } else {
              reject(new Error('Failed to create canvas blob after multiple attempts'));
            }
          },
          'image/png',
          1.0
        );
      };

      tryCapture();
    } catch (error) {
      logger.error('Error capturing canvas image', error as Error);
      reject(error);
    }
  });
}

/**
 * Clean up canvas resources and cancel pending operations
 */
export function cleanupCanvasResources(state: CanvasDrawState): CanvasDrawState {
  // Cancel any pending animation frame
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
  }

  return {
    ...state,
    isDrawing: false,
    lastPoint: null,
    pendingPoints: [],
    animationFrameId: null,
  };
}

/**
 * Check if buffer should be flushed (reached max size)
 */
export function shouldFlushBuffer(state: CanvasDrawState): boolean {
  return state.pendingPoints.length >= MAX_BUFFER_SIZE;
}

/**
 * Create a throttled draw handler using rAF
 */
export function createThrottledDrawHandler(
  onDraw: (point: Point) => void
): (point: Point) => void {
  let lastFrameTime = 0;
  let pendingPoint: Point | null = null;
  let rafId: number | null = null;

  const FRAME_INTERVAL = 16; // ~60fps

  return (point: Point) => {
    pendingPoint = point;

    if (rafId !== null) {
      return; // Already have a pending frame
    }

    const now = performance.now();
    const timeSinceLastFrame = now - lastFrameTime;

    if (timeSinceLastFrame >= FRAME_INTERVAL) {
      // Execute immediately
      lastFrameTime = now;
      if (pendingPoint) {
        onDraw(pendingPoint);
        pendingPoint = null;
      }
    } else {
      // Schedule for next frame
      rafId = requestAnimationFrame(() => {
        rafId = null;
        lastFrameTime = performance.now();
        if (pendingPoint) {
          onDraw(pendingPoint);
          pendingPoint = null;
        }
      });
    }
  };
}

/**
 * Cleanup throttled handler
 */
export function cleanupThrottledHandler(rafId: number | null): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
}
