"ust";

import { useEffect, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

interface UseMemoryMonitorOptions {
  /** Interval in ms to check memory (default: 30000 = 30s) */
  interval?: number;
  /** Threshold in MB to warn about high memory usage (default: 100) */
  warningThresholdMB?: number;
  /** Callback when memory exceeds threshold */
  onHighMemory?: (usedMB: number) => void;
  /** Enable logging (default: false in production) */
  enableLogging?: boolean;
}

/**
 * Hook to monitor memory usage and detect potential memory leaks
 * IMP-003: Memory leak detection for long sessions
 *
 * @example
 * ```tsx
 * useMemoryMonitor({
 *   warningThresholdMB: 150,
 *   onHighMemory: (usedMB) => {
 *     console.warn(`High memory usage: ${usedMB}MB`);
 *   }
 * });
 * ```
 */
export function useMemoryMonitor(options: UseMemoryMonitorOptions = {}) {
  const {
    interval = 30000,
    warningThresholdMB = 100,
    onHighMemory,
    enableLogging = process.env.NODE_ENV === "development",
  } = options;

  const previousMemoryRef = useRef<number>(0);
  const checkCountRef = useRef<number>(0);
  const memoryHistoryRef = useRef<number[]>([]);

  const checkMemory = useCallback(() => {
    const perf = performance as PerformanceWithMemory;

    if (!perf.memory) {
      // Memory API not available (Firefox, Safari)
      return null;
    }

    const usedMB = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(perf.memory.totalJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024);

    checkCountRef.current += 1;
    memoryHistoryRef.current.push(usedMB);

    // Keep only last 10 readings
    if (memoryHistoryRef.current.length > 10) {
      memoryHistoryRef.current.shift();
    }

    // Calculate memory growth trend
    const history = memoryHistoryRef.current;
    const isGrowing =
      history.length >= 3 &&
      history[history.length - 1] > history[history.length - 2] &&
      history[history.length - 2] > history[history.length - 3];

    // Detect potential leak: consistent growth over multiple checks
    const potentialLeak =
      history.length >= 5 &&
      history[history.length - 1] - history[0] > 20 && // 20MB growth
      isGrowing;

    if (enableLogging && checkCountRef.current % 5 === 0) {
      logger.info("Memory check", {
        usedMB,
        totalMB,
        limitMB,
        checkCount: checkCountRef.current,
        trend: isGrowing ? "growing" : "stable",
        potentialLeak,
      });
    }

    // Warn if memory exceeds threshold
    if (usedMB > warningThresholdMB) {
      if (enableLogging) {
        logger.warn("High memory usage detected", {
          usedMB,
          thresholdMB: warningThresholdMB,
          potentialLeak,
        });
      }
      onHighMemory?.(usedMB);
    }

    // Warn about potential memory leak
    if (potentialLeak && enableLogging) {
      logger.warn("Potential memory leak detected", {
        history: history.slice(-5),
        growthMB: history[history.length - 1] - history[0],
      });
    }

    previousMemoryRef.current = usedMB;

    return {
      usedMB,
      totalMB,
      limitMB,
      isGrowing,
      potentialLeak,
    };
  }, [warningThresholdMB, onHighMemory, enableLogging]);

  useEffect(() => {
    // Initial check
    checkMemory();

    // Set up interval
    const intervalId = setInterval(checkMemory, interval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [checkMemory, interval]);

  return {
    checkMemory,
    getHistory: () => [...memoryHistoryRef.current],
  };
}

/**
 * Utility to force garbage collection (only works in Chrome with --expose-gc flag)
 * Useful for testing memory leaks
 */
export function forceGC() {
  if (typeof window !== "undefined" && "gc" in window) {
    (window as Window & { gc?: () => void }).gc?.();
    logger.info("Forced garbage collection");
  }
}
