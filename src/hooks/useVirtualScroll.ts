"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualScrollOptions<T> {
    items: T[];
    itemHeight: number | ((item: T, index: number) => number);
    overscan?: number;
    containerHeight: number;
}

interface VirtualScrollResult<T> {
    virtualItems: Array<{ item: T; index: number; offsetTop: number }>;
    totalHeight: number;
    containerRef: React.RefObject<HTMLDivElement>;
    scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
}

/**
 * useVirtualScroll - Virtualized scrolling for large lists
 * Renders only visible items + overscan for performance
 */
export function useVirtualScroll<T>({
    items,
    itemHeight,
    overscan = 5,
    containerHeight,
}: VirtualScrollOptions<T>): VirtualScrollResult<T> {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate item heights and offsets
    const { itemOffsets, totalHeight } = useMemo(() => {
        const offsets: number[] = [];
        let currentOffset = 0;

        items.forEach((item, index) => {
            offsets.push(currentOffset);
            const height = typeof itemHeight === 'function'
                ? itemHeight(item, index)
                : itemHeight;
            currentOffset += height;
        });

        return { itemOffsets: offsets, totalHeight: currentOffset };
    }, [items, itemHeight]);

    // Find visible range
    const { startIndex, endIndex } = useMemo(() => {
        if (items.length === 0) return { startIndex: 0, endIndex: 0 };

        // Binary search for start index
        let start = 0;
        let end = items.length - 1;

        while (start < end) {
            const mid = Math.floor((start + end) / 2);
            const height = typeof itemHeight === 'function'
                ? itemHeight(items[mid], mid)
                : itemHeight;

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

        return { startIndex: startIdx, endIndex: endIdx };
    }, [items, itemHeight, itemOffsets, scrollTop, containerHeight, overscan]);

    // Generate virtual items
    const virtualItems = useMemo(() => {
        const result: Array<{ item: T; index: number; offsetTop: number }> = [];

        for (let i = startIndex; i < endIndex; i++) {
            result.push({
                item: items[i],
                index: i,
                offsetTop: itemOffsets[i],
            });
        }

        return result;
    }, [items, startIndex, endIndex, itemOffsets]);

    // Handle scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setScrollTop(container.scrollTop);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to specific index
    const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
        const container = containerRef.current;
        if (!container || index < 0 || index >= items.length) return;

        container.scrollTo({
            top: itemOffsets[index],
            behavior,
        });
    }, [items.length, itemOffsets]);

    // Scroll to bottom
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        const container = containerRef.current;
        if (!container) return;

        container.scrollTo({
            top: totalHeight,
            behavior,
        });
    }, [totalHeight]);

    return {
        virtualItems,
        totalHeight,
        containerRef,
        scrollToIndex,
        scrollToBottom,
    };
}
