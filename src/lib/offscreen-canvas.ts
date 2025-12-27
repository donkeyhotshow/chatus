/**
 * P1 FIX: OffscreenCanvas utility for better canvas performance
 * Uses OffscreenCanvasvailable, falls back to regular canvas
 */

export interface CanvasRenderer {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  isOffscreen: boolean;
  width: number;
  height: number;
}

/**
 * Check if OffscreenCanvas is supported
 */
export function isOffscreenCanvasSupported(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return typeof OffscreenCanvas !== 'undefined' &&
           new OffscreenCanvas(1, 1).getContext('2d') !== null;
  } catch {
    return false;
  }
}

/**
 * Create an offscreen canvas renderer
 * Falls back to regular canvas if OffscreenCanvas is not supported
 */
export function createOffscreenRenderer(
  width: number,
  height: number
): CanvasRenderer {
  if (isOffscreenCanvasSupported()) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    return { canvas, ctx, isOffscreen: true, width, height };
  }

  // Fallback for Safari and older browsers
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx, isOffscreen: false, width, height };
}

/**
 * Transfer offscreen canvas to main canvas
 */
export function transferToMainCanvas(
  renderer: CanvasRenderer,
  mainCanvas: HTMLCanvasElement
): void {
  const mainCtx = mainCanvas.getContext('2d');
  if (!mainCtx) return;

  if (renderer.isOffscreen && renderer.canvas instanceof OffscreenCanvas) {
    // Use transferToImageBitmap for best performance
    const bitmap = renderer.canvas.transferToImageBitmap();
    mainCtx.drawImage(bitmap, 0, 0);
    bitmap.close();
  } else if (renderer.canvas instanceof HTMLCanvasElement) {
    mainCtx.drawImage(renderer.canvas, 0, 0);
  }
}

/**
 * Create a cached layer for static content
 * Useful for backgrounds, grids, etc.
 */
export function createCachedLayer(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void
): CanvasRenderer {
  const renderer = createOffscreenRenderer(width, height);

  if (renderer.ctx) {
    drawFn(renderer.ctx);
  }

  return renderer;
}

/**
 * Double buffering for smooth animations
 */
export class DoubleBuffer {
  private front: CanvasRenderer;
  private back: CanvasRenderer;
  private mainCanvas: HTMLCanvasElement;

  constructor(mainCanvas: HTMLCanvasElement) {
    this.mainCanvas = mainCanvas;
    const { width, height } = mainCanvas;

    this.front = createOffscreenRenderer(width, height);
    this.back = createOffscreenRenderer(width, height);
  }

  /**
   * Get the back buffer context for drawing
   */
  getContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
    return this.back.ctx;
  }

  /**
   * Clear the back buffer
   */
  clear(): void {
    if (this.back.ctx) {
      this.back.ctx.clearRect(0, 0, this.back.width, this.back.height);
    }
  }

  /**
   * Swap buffers and render to main canvas
   */
  swap(): void {
    // Swap front and back
    [this.front, this.back] = [this.back, this.front];

    // Transfer to main canvas
    transferToMainCanvas(this.front, this.mainCanvas);
  }

  /**
   * Resize buffers
   */
  resize(width: number, height: number): void {
    this.front = createOffscreenRenderer(width, height);
    this.back = createOffscreenRenderer(width, height);
  }
}

/**
 * Path caching for complex shapes
 */
export class PathCache {
  private cache = new Map<string, Path2D>();

  /**
   * Get or create a cached path
   */
  getPath(key: string, createFn: () => Path2D): Path2D {
    let path = this.cache.get(key);

    if (!path) {
      path = createFn();
      this.cache.set(key, path);
    }

    return path;
  }

  /**
   * Clear a specific path
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached paths
   */
  clear(): void {
    this.cache.clear();
  }
}
