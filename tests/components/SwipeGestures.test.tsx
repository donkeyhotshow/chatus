import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-libr';
import { SwipeGestures } from '@/components/mobile/SwipeGestures';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, onPanStart, onPan, onPanEnd, ...props }: any) => (
            <div
                data-testid="swipe-container"
                onMouseDown={onPanStart}
                onMouseMove={onPan}
                onMouseUp={onPanEnd}
                {...props}
            >
                {children}
            </div>
        )
    },
    useMotionValue: () => ({ set: vi.fn() }),
    useTransform: () => 0,
    PanInfo: {}
}));

describe('SwipeGestures', () => {
    const mockCallbacks = {
        onSwipeLeft: vi.fn(),
        onSwipeRight: vi.fn(),
        onSwipeUp: vi.fn(),
        onSwipeDown: vi.fn(),
        onPinch: vi.fn(),
        onLongPress: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders children correctly', () => {
        render(
            <SwipeGestures>
                <div>Test Content</div>
            </SwipeGestures>
        );

        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(
            <SwipeGestures className="custom-class">
                <div>Test</div>
            </SwipeGestures>
        );

        const container = screen.getByTestId('swipe-container');
        expect(container).toHaveClass('custom-class');
    });

    it('does not trigger callbacks when disabled', () => {
        render(
            <SwipeGestures {...mockCallbacks} disabled={true}>
                <div>Test</div>
            </SwipeGestures>
        );

        const container = screen.getByTestId('swipe-container');

        // Simulate pan events
        container.dispatchEvent(new MouseEvent('mousedown'));
        container.dispatchEvent(new MouseEvent('mousemove'));
        container.dispatchEvent(new MouseEvent('mouseup'));

        expect(mockCallbacks.onSwipeLeft).not.toHaveBeenCalled();
        expect(mockCallbacks.onSwipeRight).not.toHaveBeenCalled();
    });

    it('triggers long press callback after duration', () => {
        render(
            <SwipeGestures
                {...mockCallbacks}
                enableLongPress={true}
                longPressDuration={500}
            >
                <div>Test</div>
            </SwipeGestures>
        );

        const container = screen.getByTestId('swipe-container');

        // Start long press
        container.dispatchEvent(new MouseEvent('mousedown'));

        // Fast forward time
        vi.advanceTimersByTime(500);

        expect(mockCallbacks.onLongPress).toHaveBeenCalled();
    });

    it('cancels long press on movement', () => {
        render(
            <SwipeGestures
                {...mockCallbacks}
                enableLongPress={true}
                longPressDuration={500}
            >
                <div>Test</div>
            </SwipeGestures>
        );

        const container = screen.getByTestId('swipe-container');

        // Start long press
        container.dispatchEvent(new MouseEvent('mousedown'));

        // Move before timeout
        vi.advanceTimersByTime(200);
        container.dispatchEvent(new MouseEvent('mousemove'));

        // Complete timeout
        vi.advanceTimersByTime(300);

        expect(mockCallbacks.onLongPress).not.toHaveBeenCalled();
    });
});
