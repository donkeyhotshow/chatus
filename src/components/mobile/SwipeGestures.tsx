"use client";

import { useRef, useCallback, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';

interface SwipeGesturesProps {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onPinch?: (scale: number) => void;
    onLongPress?: () => void;
    threshold?: number;
    className?: string;
    disabled?: boolean;
    enablePinch?: boolean;
    enableLongPress?: boolean;
    longPressDuration?: number;
}

export function SwipeGestures({
    children,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onLongPress,
    threshold = 50,
    className,
    disabled = false,
    enablePinch = false,
    enableLongPress = false,
    longPressDuration = 500
}: SwipeGesturesProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout>();
    const initialDistance = useRef<number>(0);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Transform values for visual feedback
    const rotateX = useTransform(y, [-100, 0, 100], [5, 0, -5]);
    const rotateY = useTransform(x, [-100, 0, 100], [-5, 0, 5]);

    // Calculate distance between two touch points
    const getTouchDistance = (touches: TouchList) => {
        if (touches.length < 2) return 0;
        const touch1 = touches[0];
        const touch2 = touches[1];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    };

    // Handle pan start
    const handlePanStart = useCallback((event: any, info: PanInfo) => {
        if (disabled) return;

        // Start long press timer
        if (enableLongPress && onLongPress) {
            longPressTimer.current = setTimeout(() => {
                onLongPress();
                // Haptic feedback for long press
                if ('vibrate' in navigator) {
                    navigator.vibrate([50, 30, 50]);
                }
            }, longPressDuration);
        }

        // Handle pinch start
        if (enablePinch && event.touches?.length === 2) {
            initialDistance.current = getTouchDistance(event.touches);
        }
    }, [disabled, enableLongPress, onLongPress, longPressDuration, enablePinch]);

    // Handle pan (drag)
    const handlePan = useCallback((event: any, info: PanInfo) => {
        if (disabled) return;

        // Clear long press timer on movement
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = undefined;
        }

        // Handle pinch
        if (enablePinch && onPinch && event.touches?.length === 2) {
            const currentDistance = getTouchDistance(event.touches);
            if (initialDistance.current > 0) {
                const scale = currentDistance / initialDistance.current;
                onPinch(scale);
            }
        }

        // Update motion values for visual feedback
        x.set(info.offset.x);
        y.set(info.offset.y);
    }, [disabled, enablePinch, onPinch, x, y]);

    // Handle pan end
    const handlePanEnd = useCallback((event: any, info: PanInfo) => {
        if (disabled) return;

        // Clear long press timer
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = undefined;
        }

        // Reset motion values
        x.set(0);
        y.set(0);

        const { offset, velocity } = info;
        const absOffsetX = Math.abs(offset.x);
        const absOffsetY = Math.abs(offset.y);
        const absVelocityX = Math.abs(velocity.x);
        const absVelocityY = Math.abs(velocity.y);

        // Determine if it's a valid swipe based on distance and velocity
        const isHorizontalSwipe = absOffsetX > threshold || absVelocityX > 500;
        const isVerticalSwipe = absOffsetY > threshold || absVelocityY > 500;

        // Prioritize the direction with more movement
        if (isHorizontalSwipe && absOffsetX > absOffsetY) {
            // Haptic feedback for swipe
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }

            if (offset.x > 0 && onSwipeRight) {
                onSwipeRight();
            } else if (offset.x < 0 && onSwipeLeft) {
                onSwipeLeft();
            }
        } else if (isVerticalSwipe && absOffsetY > absOffsetX) {
            // Haptic feedback for swipe
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }

            if (offset.y > 0 && onSwipeDown) {
                onSwipeDown();
            } else if (offset.y < 0 && onSwipeUp) {
                onSwipeUp();
            }
        }
    }, [disabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, x, y]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, []);

    return (
        <motion.div
            ref={containerRef}
            className={className}
            style={{
                rotateX,
                rotateY,
                x,
                y
            }}
            onPanStart={handlePanStart}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
            drag={disabled ? false : true}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.2}
            whileDrag={{ scale: 0.98 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
            }}
        >
            {children}
        </motion.div>
    );
}

// Hook for easier swipe gesture integration
export function useSwipeGestures({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50
}: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
}) {
    const startX = useRef(0);
    const startY = useRef(0);
    const startTime = useRef(0);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const touch = e.touches[0];
        startX.current = touch.clientX;
        startY.current = touch.clientY;
        startTime.current = Date.now();
    }, []);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        const endTime = Date.now();

        const deltaX = endX - startX.current;
        const deltaY = endY - startY.current;
        const deltaTime = endTime - startTime.current;

        // Ignore if touch was too long (likely not a swipe)
        if (deltaTime > 300) return;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Check if movement is significant enough
        if (Math.max(absX, absY) < threshold) return;

        // Determine swipe direction
        if (absX > absY) {
            // Horizontal swipe
            if (deltaX > 0 && onSwipeRight) {
                onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
                onSwipeLeft();
            }
        } else {
            // Vertical swipe
            if (deltaY > 0 && onSwipeDown) {
                onSwipeDown();
            } else if (deltaY < 0 && onSwipeUp) {
                onSwipeUp();
            }
        }
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

    return {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd
    };
}
