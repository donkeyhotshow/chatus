"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

interface PullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    maxPull?: number;
    disabled?: boolean;
}

interface PullToRefreshState {
    isPulling: boolean;
    pullDistance: number;
    isRefreshing: boolean;
}

/**
 * usePullToRefresh - Implements pull-to-refresh gesture for mobile
 *
 * @param options Configuration options
 * @returns State and ref to attach to scrollable container
 */
export function usePullToRefresh({
    onRefresh,
    threshold = 80,
    maxPull = 120,
    disabled = false,
}: PullToRefreshOptions) {
    const [state, setState] = useState<PullToRefreshState>({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef<number>(0);
    const currentYRef = useRef<number>(0);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (disabled || state.isRefreshing) return;

        const container = containerRef.current;
        if (!container) return;

        // Only start pull if at top of scroll
        if (container.scrollTop > 0) return;

        startYRef.current = e.touches[0].clientY;
        currentYRef.current = e.touches[0].clientY;
    }, [disabled, state.isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (disabled || state.isRefreshing) return;
        if (startYRef.current === 0) return;

        const container = containerRef.current;
        if (!container) return;

        // Only allow pull if at top
        if (container.scrollTop > 0) {
            startYRef.current = 0;
            setState(prev => ({ ...prev, isPulling: false, pullDistance: 0 }));
            return;
        }

        currentYRef.current = e.touches[0].clientY;
        const pullDistance = Math.min(
            Math.max(0, currentYRef.current - startYRef.current),
            maxPull
        );

        if (pullDistance > 0) {
            e.preventDefault();
            setState(prev => ({
                ...prev,
                isPulling: true,
                pullDistance,
            }));
        }
    }, [disabled, state.isRefreshing, maxPull]);

    const handleTouchEnd = useCallback(async () => {
        if (disabled || state.isRefreshing) return;

        const pullDistance = state.pullDistance;
        startYRef.current = 0;
        currentYRef.current = 0;

        if (pullDistance >= threshold) {
            setState(prev => ({ ...prev, isRefreshing: true, pullDistance: threshold }));

            try {
                await onRefresh();
            } finally {
                setState({ isPulling: false, pullDistance: 0, isRefreshing: false });
            }
        } else {
            setState({ isPulling: false, pullDistance: 0, isRefreshing: false });
        }
    }, [disabled, state.isRefreshing, state.pullDistance, threshold, onRefresh]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || disabled) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

    return {
        containerRef,
        ...state,
        progress: Math.min(state.pullDistance / threshold, 1),
    };
}

/**
 * PullToRefreshIndicator - Visual indicator for pull-to-refresh
 */
export function PullToRefreshIndicator({
    pullDistance,
    isRefreshing,
    threshold = 80,
}: {
    pullDistance: number;
    isRefreshing: boolean;
    threshold?: number;
}) {
    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 180;

    if (pullDistance === 0 && !isRefreshing) return null;

    return (
        <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
            style={{
                height: pullDistance,
                transition: isRefreshing ? 'none' : 'height 0.2s ease-out',
            }}
        >
            <div
                className={`w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] flex items-center justify-center bg-[var(--bg-secondary)] ${
                    isRefreshing ? 'animate-spin' : ''
                }`}
                style={{
                    transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
                    opacity: Math.min(progress * 2, 1),
                }}
            >
                {isRefreshing ? (
                    <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
                ) : (
                    <svg
                        className="w-4 h-4 text-[var(--accent-primary)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                    </svg>
                )}
            </div>
        </div>
    );
}
