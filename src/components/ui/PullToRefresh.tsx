"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
    className?: string;
    threshold?: number;
    disabled?: boolean;
}

/**
 * PullToRefresh - Компонент pull-to-refresh дльных устройств
 * Этап 2: UX улучшения - реализация pull-to-refresh в списке чатов
 */
export function PullToRefresh({
    children,
    onRefresh,
    className,
    threshold = 80,
    disabled = false,
}: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef(0);
    const currentYRef = useRef(0);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (disabled || isRefreshing) return;

        const container = containerRef.current;
        if (!container) return;

        // Only start pull if at top of scroll
        if (container.scrollTop > 0) return;

        startYRef.current = e.touches[0].clientY;
        setIsPulling(true);
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling || disabled || isRefreshing) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) {
            setIsPulling(false);
            setPullDistance(0);
            return;
        }

        currentYRef.current = e.touches[0].clientY;
        const distance = Math.max(0, currentYRef.current - startYRef.current);

        // Apply resistance - pull gets harder as you go
        const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(resistedDistance);

        // Prevent default scroll when pulling
        if (distance > 10) {
            e.preventDefault();
        }
    }, [isPulling, disabled, isRefreshing, threshold]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling || disabled) return;

        setIsPulling(false);

        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(threshold * 0.6); // Keep indicator visible

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(15);
            }

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [isPulling, disabled, pullDistance, threshold, isRefreshing, onRefresh]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    const progress = Math.min(pullDistance / threshold, 1);
    const showIndicator = pullDistance > 10 || isRefreshing;

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-auto", className)}
        >
            {/* Pull indicator */}
            <div
                className={cn(
                    "absolute left-0 right-0 flex items-center justify-center z-10 transition-opacity duration-200",
                    showIndicator ? "opacity-100" : "opacity-0"
                )}
                style={{
                    top: 0,
                    height: `${pullDistance}px`,
                    minHeight: showIndicator ? '40px' : 0,
                }}
            >
                <div
                    className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full",
                        "bg-[var(--bg-tertiary)] border border-white/[0.1]",
                        "transition-transform duration-200"
                    )}
                    style={{
                        transform: `scale(${0.5 + progress * 0.5})`,
                    }}
                >
                    <RefreshCw
                        className={cn(
                            "w-5 h-5 text-[var(--accent-primary)]",
                            isRefreshing && "animate-pull-rotate"
                        )}
                        style={{
                            transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)`,
                        }}
                    />
                </div>
            </div>

            {/* Content with pull offset */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isPulling ? 'none' : 'transform 0.2s ease-out',
                }}
            >
                {children}
            </div>
        </div>
    );
}
