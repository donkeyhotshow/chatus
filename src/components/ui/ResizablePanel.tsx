"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ResizablePanelProps = {
    children: ReactNode;
    defaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
    className?: string;
    resizeHandle?: 'left' | 'right';
    onResize?: (width: number) => void;
    disabled?: boolean;
};

export function ResizablePanel({
    children,
    defaultWidth = 320,
    minWidth = 200,
    maxWidth = 600,
    className,
    resizeHandle = 'left',
    onResize,
    disabled = false
}: ResizablePanelProps) {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (disabled) return;

        e.preventDefault();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [width, disabled]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = resizeHandle === 'left'
            ? startXRef.current - e.clientX
            : e.clientX - startXRef.current;

        const newWidth = Math.min(
            Math.max(startWidthRef.current + deltaX, minWidth),
            maxWidth
        );

        setWidth(newWidth);
        onResize?.(newWidth);
    }, [isResizing, resizeHandle, minWidth, maxWidth, onResize]);

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
        startXRef.current = e.touches[0]?.clientX ?? 0;
        startWidthRef.current = width;
    }, [width, disabled]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isResizing) return;

        const deltaX = resizeHandle === 'left'
            ? startXRef.current - (e.touches[0]?.clientX ?? 0)
            : (e.touches[0]?.clientX ?? 0) - startXRef.current;

        const newWidth = Math.min(
            Math.max(startWidthRef.current + deltaX, minWidth),
            maxWidth
        );

        setWidth(newWidth);
        onResize?.(newWidth);
    }, [isResizing, resizeHandle, minWidth, maxWidth, onResize]);

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
            ref={panelRef}
            className={cn('relative flex-shrink-0 transition-none', className)}
            style={{ width: `${width}px` }}
        >
            {/* Resize handle */}
            {!disabled && (
                <div
                    className={cn(
                        'absolute top-0 bottom-0 w-1 bg-transparent hover:bg-violet-400/50 cursor-col-resize z-50 group transition-colors',
                        resizeHandle === 'left' ? '-left-0.5' : '-right-0.5',
                        isResizing && 'bg-violet-400/70'
                    )}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    {/* Visual indicator */}
                    <div className={cn(
                        'absolute top-1/2 -translate-y-1/2 w-1 h-12 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                        resizeHandle === 'left' ? 'left-0' : 'right-0',
                        isResizing && 'opacity-100 bg-violet-400 shadow-lg shadow-violet-400/50'
                    )} />

                    {/* Resize dots indicator */}
                    <div className={cn(
                        'absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-60 transition-opacity',
                        resizeHandle === 'left' ? '-left-1' : '-right-1',
                        isResizing && 'opacity-100'
                    )}>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>

                    {/* Touch-friendly area */}
                    <div className={cn(
                        'absolute top-0 bottom-0 w-4 bg-transparent',
                        resizeHandle === 'left' ? '-left-2' : '-right-2'
                    )} />
                </div>
            )}

            {/* Resize tooltip */}
            {isResizing && (
                <div className={cn(
                    'absolute top-4 z-60 bg-black/90 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none',
                    resizeHandle === 'left' ? 'left-4' : 'right-4'
                )}>
                    {width}px
                </div>
            )}

            {children}
        </div>
    );
}
