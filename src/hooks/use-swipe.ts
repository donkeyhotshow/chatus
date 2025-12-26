import { TouchEvent, useState, useRef, useCallback } from 'react';

interface SwipeInput {
    onSwipedLeft?: () => void;
    onSwipedRight?: () => void;
    onSwipedUp?: () => void;
    onSwipedDown?: () => void;
    /** Minimum distance in pixels for swipe to trigger (default: 80) */
    minSwipeDistance?: number;
    /** Maximum time in ms for swipe gesture (default: 300) */
    maxSwipeTime?: number;
    /** Minimum velocity for swipe (default: 0.3 px/ms) */
    minVelocity?: number;
    /** Disable swipes (useful when scrolling) */
    disabled?: boolean;
    /** Prevent swipes on interactive elements */
    preventOnInteractive?: boolean;
}

interface SwipeResult {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
}

// Elements that should not trigger swipes
const INTERACTIVE_ELEMENTS = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'CANVAS'];
const INTERACTIVE_ROLES = ['button', 'link', 'textbox', 'slider', 'scrollbar'];

export const useSwipe = ({
    onSwipedLeft,
    onSwipedRight,
    onSwipedUp,
    onSwipedDown,
    minSwipeDistance = 80,  // Increased from 50 to prevent accidental swipes
    maxSwipeTime = 300,
    minVelocity = 0.3,
    disabled = false,
    preventOnInteractive = true
}: SwipeInput): SwipeResult => {
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);
    const touchStartTimeRef = useRef<number>(0);
    const isScrollingRef = useRef<boolean>(false);
    const isInteractiveRef = useRef<boolean>(false);

    const isInteractiveElement = useCallback((target: EventTarget | null): boolean => {
        if (!target || !(target instanceof HTMLElement)) return false;

        // Check tag name
        if (INTERACTIVE_ELEMENTS.includes(target.tagName)) return true;

        // Check role attribute
        const role = target.getAttribute('role');
        if (role && INTERACTIVE_ROLES.includes(role)) return true;

        // Check if element or parent has contenteditable
        if (target.isContentEditable) return true;

        // Check for scrollable containers
        const style = window.getComputedStyle(target);
        if (style.overflowX === 'auto' || style.overflowX === 'scroll' ||
            style.overflowY === 'auto' || style.overflowY === 'scroll') {
            // Check if actually scrollable
            if (target.scrollWidth > target.clientWidth || target.scrollHeight > target.clientHeight) {
                return true;
            }
        }

        // Check parent elements (up to 5 levels)
        let parent = target.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
            if (INTERACTIVE_ELEMENTS.includes(parent.tagName)) return true;
            const parentRole = parent.getAttribute('role');
            if (parentRole && INTERACTIVE_ROLES.includes(parentRole)) return true;
            parent = parent.parentElement;
            depth++;
        }

        return false;
    }, []);

    const onTouchStart = useCallback((e: TouchEvent) => {
        if (disabled) return;

        // Check if touch started on interactive element
        if (preventOnInteractive && isInteractiveElement(e.target)) {
            isInteractiveRef.current = true;
            return;
        }

        isInteractiveRef.current = false;
        setTouchEnd(null);
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
        touchStartTimeRef.current = Date.now();
        isScrollingRef.current = false;
    }, [disabled, preventOnInteractive, isInteractiveElement]);

    const onTouchMove = useCallback((e: TouchEvent) => {
        if (disabled || !touchStart || isInteractiveRef.current) return;

        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;

        // Detect if user is scrolling vertically (not swiping)
        const deltaX = Math.abs(currentX - touchStart.x);
        const deltaY = Math.abs(currentY - touchStart.y);

        // If vertical movement is dominant early on, mark as scrolling
        // More strict: vertical must be 1.5x horizontal to be considered scrolling
        if (!isScrollingRef.current && deltaY > 15 && deltaY > deltaX * 1.5) {
            isScrollingRef.current = true;
        }

        setTouchEnd({
            x: currentX,
            y: currentY
        });
    }, [disabled, touchStart]);

    const onTouchEnd = useCallback(() => {
        if (disabled || !touchStart || !touchEnd || isScrollingRef.current || isInteractiveRef.current) {
            setTouchStart(null);
            setTouchEnd(null);
            isInteractiveRef.current = false;
            return;
        }

        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        const absDistanceX = Math.abs(distanceX);
        const absDistanceY = Math.abs(distanceY);

        // Calculate time and velocity
        const swipeTime = Date.now() - touchStartTimeRef.current;
        const velocity = Math.max(absDistanceX, absDistanceY) / swipeTime;

        // Only trigger if:
        // 1. Distance is sufficient
        // 2. Time is within limit
        // 3. Velocity is sufficient
        // 4. Horizontal movement is dominant for horizontal swipes (1.5x ratio)
        const isValidSwipe = swipeTime < maxSwipeTime && velocity >= minVelocity;
        const isHorizontal = absDistanceX > absDistanceY * 1.5; // Must be clearly horizontal

        if (isValidSwipe && isHorizontal && absDistanceX >= minSwipeDistance) {
            if (distanceX > 0 && onSwipedLeft) {
                onSwipedLeft();
            } else if (distanceX < 0 && onSwipedRight) {
                onSwipedRight();
            }
        } else if (isValidSwipe && !isHorizontal && absDistanceY >= minSwipeDistance) {
            // Vertical swipes (less common, keep stricter)
            if (distanceY > 0 && onSwipedUp) {
                onSwipedUp();
            } else if (distanceY < 0 && onSwipedDown) {
                onSwipedDown();
            }
        }

        setTouchStart(null);
        setTouchEnd(null);
        isInteractiveRef.current = false;
    }, [disabled, touchStart, touchEnd, minSwipeDistance, maxSwipeTime, minVelocity, onSwipedLeft, onSwipedRight, onSwipedUp, onSwipedDown]);

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};
