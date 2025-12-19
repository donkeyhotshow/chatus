import { TouchEvent, useState } from 'react';

interface SwipeInput {
    onSwipedLeft?: () => void;
    onSwipedRight?: () => void;
    onSwipedUp?: () => void;
    onSwipedDown?: () => void;
}

interface SwipeResult {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
}

export const useSwipe = ({ onSwipedLeft, onSwipedRight, onSwipedUp, onSwipedDown }: SwipeInput): SwipeResult => {
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);

    // Minimum distance required for a swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null); // Reset touch end
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);

        if (isHorizontal) {
            const isLeftSwipe = distanceX > minSwipeDistance;
            const isRightSwipe = distanceX < -minSwipeDistance;

            if (isLeftSwipe && onSwipedLeft) {
                onSwipedLeft();
            }
            if (isRightSwipe && onSwipedRight) {
                onSwipedRight();
            }
        } else {
            // Vertical swipe
            const isUpSwipe = distanceY > minSwipeDistance;
            const isDownSwipe = distanceY < -minSwipeDistance;

            if (isUpSwipe && onSwipedUp) {
                onSwipedUp();
            }
            if (isDownSwipe && onSwipedDown) {
                onSwipedDown();
            }
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};
