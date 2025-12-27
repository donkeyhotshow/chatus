"use client";

import { useCallback, useRef, useState } from 'react';
import { hapticFeedback } from '@/lib/game-utils';

interface LongPressOptions {
    onLongPress: () => void;
    onClick?: () => void;
    delay?: number;
    disabled?: boolean;
}

interface LongPressResult {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    isPressed: boolean;
}

/**
 * useLongPress - Hook for detecting long press gestures
 * Used for context menus on mobile (copy, delete, reply)
 */
export function useLongPress({
    onLongPress,
    onClick,
    delay = 500,
    disabled = false,
}: LongPressOptions): LongPressResult {
    const [isPressed, setIsPressed] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);
    const startPosRef = useRef<{ x: number; y: number } | null>(null);

    const start = useCallback((x: number, y: number) => {
        if (disabled) return;

        isLongPressRef.current = false;
        startPosRef.current = { x, y };
        setIsPressed(true);

        timerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            hapticFeedback('medium');
            onLongPress();
            setIsPressed(false);
        }, delay);
    }, [disabled, delay, onLongPress]);

    const cancel = useCallback((triggerClick = false) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (triggerClick && !isLongPressRef.current && onClick) {
            onClick();
        }

        setIsPressed(false);
        startPosRef.current = null;
    }, [onClick]);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        start(touch.clientX, touch.clientY);
    }, [start]);

    const onTouchEnd = useCallback(() => {
        cancel(true);
    }, [cancel]);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!startPosRef.current) return;

        const touch = e.touches[0];
        const moveThreshold = 10;
        const dx = Math.abs(touch.clientX - startPosRef.current.x);
        const dy = Math.abs(touch.clientY - startPosRef.current.y);

        // Cancel if moved too much
        if (dx > moveThreshold || dy > moveThreshold) {
            cancel(false);
        }
    }, [cancel]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        start(e.clientX, e.clientY);
    }, [start]);

    const onMouseUp = useCallback(() => {
        cancel(true);
    }, [cancel]);

    const onMouseLeave = useCallback(() => {
        cancel(false);
    }, [cancel]);

    return {
        onTouchStart,
        onTouchEnd,
        onTouchMove,
        onMouseDown,
        onMouseUp,
        onMouseLeave,
        isPressed,
    };
}
