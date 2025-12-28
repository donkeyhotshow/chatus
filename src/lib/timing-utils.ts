/**
 * Timing utilities for performance monitoring
 */

/**
 * Create a performance timer for measuring code execution
 */
export function createTimer(label: string) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    },
    elapsed: () => performance.now() - start,
  };
}

/**
 * Debounce function with immediate option
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function (this: unknown, ...args: Parameters<T>) {
    const callNow = immediate && !timeoutId;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, delay);
    
    if (callNow) {
      fn.apply(this, args);
    }
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Request animation frame with FPS limiting
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  fps = 60
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  const frameInterval = 1000 / fps;
  let rafId: number | null = null;
  
  return function (this: unknown, ...args: Parameters<T>) {
    const currentTime = performance.now();
    
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      if (currentTime - lastTime >= frameInterval) {
        lastTime = currentTime;
        fn.apply(this, args);
      }
      rafId = null;
    });
  };
}
