import { useEffect, useRef, useCallback } from 'react';

type CleanupFn = () => void;

/**
 * Hook for managing cleanup functions
 * Automatically runs all registered cleanup functions on unmount
 * Prevents memory leaks from timers, event listeners, etc.
 */
export function useCleanup() {
  const cleanupFns = useRef<CleanupFn[]>([]);

  const addCleanup = useCallback((fn: CleanupFn) => {
    cleanupFns.current.push(fn);
  }, []);

  const runCleanup = useCallback(() => {
    cleanupFns.current.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('[useCleanup] Cleanup error:', err);
      }
    });
    cleanupFns.current = [];
  }, []);

  useEffect(() => {
    return () => {
      runCleanup();
    };
  }, [runCleanup]);

  return { addCleanup, runCleanup };
}

/**
 * Hook for managing intervals with automatic cleanup
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook for managing timeouts with automatic cleanup
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * Hook for managing RAF with automatic cleanup
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, isActive: boolean = true) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) return;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive]);
}
