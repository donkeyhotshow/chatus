"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

type VerticalResizerProps = {
    onResize: (height: number) => void;
    minHeight?: number;
    maxHeight?: number;
    className?: string;
    disabled?: boolean;
};

export function VerticalResizer({
    onResize,
    minHeight = 100,
    maxHeight = 500,
    className,
    disabled = false
}: VerticalResizerProps) {
    const [isResizing, setIsResizing] = useState(false);
    const startYRef = useRef<number>(0);
    const startHeightRef = useRef<number>(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (disabled) return;

        e.preventDefault();
        setIsResizing(true);
        startYRef.current = e.clientY;

        // Get current height from parent
        const parent = (e.target as HTMLElement).parentElement;
        if (parent) {
            startHeightRef.current = parent.offsetHeight;
        }

        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    }, [disabled]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const deltaY = startYRef.current - e.clientY; // Inverted for natural feel
        const newHeight = Math.min(
            Math.max(startHeightRef.current + deltaY, minHeight),
            maxHeight
        );

        onResize(newHeight);
    }, [isResizing, minHeight, maxHeight, onResize]);

    const handleMouseUp = useCallback(() => {
        if (!isResizing) return;

        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
        return undefined;
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Touch events for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled) return;

        e.preventDefault();
        setIsResizing(true);
        startYRef.current = e.touches[0]?.clientY ?? 0;

        const parent = (e.target as HTMLElement).parentElement;
        if (parent) {
            startHeightRef.current = parent.offsetHeight;
        }
    }, [disabled]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isResizing) return;

        const deltaY = startYRef.current - (e.touches[0]?.clientY ?? 0);
        const newHeight = Math.min(
            Math.max(startHeightRef.current + deltaY, minHeight),
            maxHeight
        );

        onResize(newHeight);
    }, [isResizing, minHeight, maxHeight, onResize]);

    const handleTouchEnd = useCallback(() => {
        if (!isResizing) return;
        setIsResizing(false);
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);

            return () => {
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
        return undefined;
    }, [isResizing, handleTouchMove, handleTouchEnd]);

    return (
        <div
            className={cn(
                'relative h-1 bg-transparent hover:bg-violet-400/50 cursor-row-resize group transition-colors touch-target',
                isResizing && 'bg-violet-400/70',
                disabled && 'cursor-default hover:bg-transparent',
                className
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Visual indicator */}
            <div className={cn(
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                isResizing && 'opacity-100 bg-violet-400 shadow-lg shadow-violet-400/50'
            )} />

            {/* Resize dots indicator */}
            <div className={cn(
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-60 transition-opacity',
                isResizing && 'opacity-100'
            )}>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>

            {/* Touch-friendly area */}
            <div className="absolute -top-2 -bottom-2 left-0 right-0 bg-transparent" />
        </div>
    );
}
