/**
me Stability Utilities
 * Provides common utilities for game stability, performance, and error handling
 */

// ============================================
// VALUE SANITIZATION
// ============================================

/**
 * Sanitize numeric value - prevents NaN, Infinity, and out-of-range values
 */
export function sanitizeNumber(value: number, defaultValue = 0, min = -Infinity, max = Infinity): number {
  if (!Number.isFinite(value)) return defaultValue;
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Safe division - prevents division by zero
 */
export function safeDivide(a: number, b: number, defaultValue = 0): number {
  if (b === 0 || !Number.isFinite(b)) return defaultValue;
  const result = a / b;
  return Number.isFinite(result) ? result : defaultValue;
}

// ============================================
// FRAME RATE LIMITING
// ============================================

/**
 * Creates a frame rate limiter for game loops
 */
export function createFrameLimiter(targetFPS = 60) {
  const frameTime = 1000 / targetFPS;
  let lastFrameTime = 0;

  return {
    shouldUpdate(currentTime: number): boolean {
      if (currentTime - lastFrameTime < frameTime) return false;
      lastFrameTime = currentTime;
      return true;
    },
    reset() {
      lastFrameTime = 0;
    },
    getLastFrameTime() {
      return lastFrameTime;
    }
  };
}

/**
 * Calculate delta time with max cap to prevent physics explosions
 */
export function calculateDeltaTime(currentTime: number, lastTime: number, maxDelta = 0.1): number {
  const delta = (currentTime - lastTime) / 1000;
  return Math.min(delta, maxDelta);
}

// ============================================
// CLICK/TAP PROTECTION
// ============================================

/**
 * Creates a click rate limiter to prevent spam clicking
 */
export function createClickLimiter(maxClicksPerSecond = 20) {
  const clickTimes: number[] = [];

  return {
    canClick(): boolean {
      const now = Date.now();
      // Remove clicks older than 1 second
      while (clickTimes.length > 0 && now - clickTimes[0] > 1000) {
        clickTimes.shift();
      }
      return clickTimes.length < maxClicksPerSecond;
    },
    recordClick() {
      clickTimes.push(Date.now());
    },
    reset() {
      clickTimes.length = 0;
    }
  };
}

/**
 * Creates a debounced action handler
 */
export function createDebouncedAction(delay = 100) {
  let lastActionTime = 0;

  return {
    canAct(): boolean {
      const now = Date.now();
      if (now - lastActionTime < delay) return false;
      lastActionTime = now;
      return true;
    },
    reset() {
      lastActionTime = 0;
    }
  };
}

// ============================================
// MEMORY MANAGEMENT
// ============================================

/**
 * Creates a limited array that automatically removes old items
 */
export function createLimitedArray<T>(maxSize: number) {
  const items: T[] = [];

  return {
    push(item: T) {
      items.push(item);
      while (items.length > maxSize) {
        items.shift();
      }
    },
    getItems(): T[] {
      return items;
    },
    clear() {
      items.length = 0;
    },
    get length() {
      return items.length;
    },
    filter(predicate: (item: T) => boolean) {
      const filtered = items.filter(predicate);
      items.length = 0;
      items.push(...filtered);
    }
  };
}

/**
 * Cleanup helper for game resources
 */
export function createCleanupManager() {
  const cleanupFns: (() => void)[] = [];
  const timeoutIds: ReturnType<typeof setTimeout>[] = [];
  const intervalIds: ReturnType<typeof setInterval>[] = [];
  const rafIds: number[] = [];

  return {
    addCleanup(fn: () => void) {
      cleanupFns.push(fn);
    },
    setTimeout(fn: () => void, delay: number) {
      const id = setTimeout(fn, delay);
      timeoutIds.push(id);
      return id;
    },
    setInterval(fn: () => void, delay: number) {
      const id = setInterval(fn, delay);
      intervalIds.push(id);
      return id;
    },
    requestAnimationFrame(fn: FrameRequestCallback) {
      const id = requestAnimationFrame(fn);
      rafIds.push(id);
      return id;
    },
    cleanup() {
      cleanupFns.forEach(fn => {
        try { fn(); } catch (e) { console.error('Cleanup error:', e); }
      });
      timeoutIds.forEach(id => clearTimeout(id));
      intervalIds.forEach(id => clearInterval(id));
      rafIds.forEach(id => cancelAnimationFrame(id));
      cleanupFns.length = 0;
      timeoutIds.length = 0;
      intervalIds.length = 0;
      rafIds.length = 0;
    }
  };
}

// ============================================
// CANVAS UTILITIES
// ============================================

/**
 * Safe canvas context getter
 */
export function getCanvasContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  if (!canvas) return null;
  try {
    return canvas.getContext('2d');
  } catch (e) {
    console.error('Failed to get canvas context:', e);
    return null;
  }
}

/**
 * Check if canvas is supported
 */
export function isCanvasSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  } catch {
    return false;
  }
}

/**
 * Safe canvas resize with max dimensions
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  maxWidth = 2000,
  maxHeight = 2000
) {
  canvas.width = Math.min(width, maxWidth);
  canvas.height = Math.min(height, maxHeight);
}

/**
 * Clear canvas safely
 */
export function clearCanvas(ctx: CanvasRenderingContext2D | null, canvas: HTMLCanvasElement | null) {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ============================================
// COLLISION DETECTION
// ============================================

/**
 * Rectangle collision detection with null checks
 */
export function checkRectCollision(
  rect1: { x: number; y: number; width: number; height: number } | null | undefined,
  rect2: { x: number; y: number; width: number; height: number } | null | undefined
): boolean {
  if (!rect1 || !rect2) return false;

  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Circle collision detection with null checks
 */
export function checkCircleCollision(
  circle1: { x: number; y: number; radius: number } | null | undefined,
  circle2: { x: number; y: number; radius: number } | null | undefined
): boolean {
  if (!circle1 || !circle2) return false;

  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < circle1.radius + circle2.radius;
}

// ============================================
// VISIBILITY & FOCUS HANDLING
// ============================================

/**
 * Creates visibility change handler for pausing games
 */
export function createVisibilityHandler(onHidden: () => void, onVisible: () => void) {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      onHidden();
    } else {
      onVisible();
    }
  };

  const handleBlur = () => onHidden();
  const handleFocus = () => onVisible();

  return {
    attach() {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
    },
    detach() {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    }
  };
}

// ============================================
// LOGGING
// ============================================

const DEBUG = process.env.NODE_ENV === 'development';

export function gameLog(message: string, data?: unknown) {
  if (!DEBUG) return;
  console.log(`[Game ${new Date().toISOString()}] ${message}`, data ?? '');
}

export function gameWarn(message: string, data?: unknown) {
  console.warn(`[Game Warning] ${message}`, data ?? '');
}

export function gameError(message: string, error?: unknown) {
  console.error(`[Game Error] ${message}`, error ?? '');
}
