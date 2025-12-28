"use cl

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualScrollOptions<T> {
  items: T[];
  estimatedItemHeight: number;
  overscan?: number;
  getItemKey: (item: T, index: number) => string;
}

interface VirtualItem<T> {
  item: T;
  index: number;
  offsetTop: number;
  height: number;
  key: string;
}

interface VirtualScrollResult<T> {
  virtualItems: VirtualItem<T>[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  isAtBottom: boolean;
  isAtTop: boolean;
  visibleRange: { start: number; end: number };
  measureItem: (index: number, height: number) => void;
}

/**
 * useEnhancedVirtualScroll - Advanced virtualized scrolling for large lists
 *
 * Features:
 * - Dynamic item heights with measurement
 * - Smooth scrolling
 * - Overscan for smoother scrolling
 * - Scroll position tracking
 * - Optimized for chat messages (100+ items)
 */
export function useEnhancedVirtualScroll<T>({
  items,
  estimatedItemHeight,
  overscan = 5,
  getItemKey,
}: VirtualScrollOptions<T>): VirtualScrollResult<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());

  // Calculate item heights and offsets
  const { itemOffsets, totalHeight } = useMemo(() => {
    const offsets: number[] = [];
    let currentOffset = 0;

    items.forEach((_, index) => {
      offsets.push(currentOffset);
      const height = measuredHeights.get(index) ?? estimatedItemHeight;
      currentOffset += height;
    });

    return { itemOffsets: offsets, totalHeight: currentOffset };
  }, [items, estimatedItemHeight, measuredHeights]);

  // Find visible range using binary search
  const visibleRange = useMemo(() => {
    if (items.length === 0) return { start: 0, end: 0 };

    // Binary search for start index
    let start = 0;
    let end = items.length - 1;

    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      const height = measuredHeights.get(mid) ?? estimatedItemHeight;

      if (itemOffsets[mid] + height < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    const startIdx = Math.max(0, start - overscan);

    // Find end index
    let endIdx = startIdx;
    const viewportEnd = scrollTop + containerHeight;

    while (endIdx < items.length && itemOffsets[endIdx] < viewportEnd) {
      endIdx++;
    }

    endIdx = Math.min(items.length, endIdx + overscan);

    return { start: startIdx, end: endIdx };
  }, [items.length, itemOffsets, scrollTop, containerHeight, overscan, measuredHeights, estimatedItemHeight]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const result: VirtualItem<T>[] = [];

    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      const item = items[i];
      if (!item) continue;

      result.push({
        item,
        index: i,
        offsetTop: itemOffsets[i],
        height: measuredHeights.get(i) ?? estimatedItemHeight,
        key: getItemKey(item, i),
      });
    }

    return result;
  }, [items, visibleRange, itemOffsets, measuredHeights, estimatedItemHeight, getItemKey]);

  // Track scroll position
  const isAtBottom = useMemo(() => {
    const threshold = 100; // pixels from bottom
    return scrollTop + containerHeight >= totalHeight - threshold;
  }, [scrollTop, containerHeight, totalHeight]);

  const isAtTop = useMemo(() => {
    return scrollTop <= 10;
  }, [scrollTop]);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    // Initial measurement
    handleResize();

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Measure item height
  const measureItem = useCallback((index: number, height: number) => {
    setMeasuredHeights((prev) => {
      if (prev.get(index) === height) return prev;
      const next = new Map(prev);
      next.set(index, height);
      return next;
    });
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container || index < 0 || index >= items.length) return;

      container.scrollTo({
        top: itemOffsets[index],
        behavior,
      });
    },
    [items.length, itemOffsets]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: totalHeight,
        behavior,
      });
    },
    [totalHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
    scrollToBottom,
    isAtBottom,
    isAtTop,
    visibleRange,
    measureItem,
  };
}

export default useEnhancedVirtualScroll;
