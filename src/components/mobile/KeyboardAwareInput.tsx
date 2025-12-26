"use client";

import { useEffect, useRef, useState, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
    type ViewportState,
    createInitialViewportState,
    updateViewportState,
    calculateViewportAdjustment,
    scrollInputIntoView,
    restoreViewport,
    getDeviceOrientation,
    isAndroid,
    DEFAULT_KEYBOARD_THRESHOLD_PORTRAIT,
    DEFAULT_KEYBOARD_THRESHOLD_LANDSCAPE,
} from '@/lib/viewport-manager';

interface KeyboardAwareInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onKeyboardShow?: () => void;
    onKeyboardHide?: () => void;
    stickyOnKeyboard?: boolean;
}

// Определяем ориентацию экрана (using viewport-manager)
function getOrientation(): 'portrait' | 'landscape' {
    return getDeviceOrientation();
}

export const KeyboardAwareInput = forwardRef<HTMLInputElement, KeyboardAwareInputProps>(
    ({ onKeyboardShow, onKeyboardHide, stickyOnKeyboard = true, className, ...props }, ref) => {
        const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
        const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
        const inputRef = useRef<HTMLInputElement | null>(null);
        const viewportStateRef = useRef<ViewportState>(createInitialViewportState());
        const containerRef = useRef<HTMLDivElement | null>(null);

        // Обновляем начальную высоту при изменении ориентации
        const updateInitialHeight = useCallback(() => {
            viewportStateRef.current = createInitialViewportState();
            setOrientation(getOrientation());
        }, []);

        useEffect(() => {
            updateInitialHeight();

            const handleViewportChange = () => {
                const previousState = viewportStateRef.current;
                const currentOrientation = getOrientation();

                // В ландшафтном режиме порог меньше, т.к. клавиатура занимает больше места
                const threshold = currentOrientation === 'landscape'
                    ? DEFAULT_KEYBOARD_THRESHOLD_LANDSCAPE
                    : DEFAULT_KEYBOARD_THRESHOLD_PORTRAIT;

                // Update viewport state using ViewportManager
                const newState = updateViewportState(previousState, { keyboardThreshold: threshold });
                viewportStateRef.current = newState;

                if (newState.isKeyboardVisible !== isKeyboardVisible) {
                    setIsKeyboardVisible(newState.isKeyboardVisible);

                    if (newState.isKeyboardVisible) {
                        onKeyboardShow?.();

                        // Use ViewportManager's scrollInputIntoView for Android
                        if (stickyOnKeyboard && inputRef.current) {
                            scrollInputIntoView(
                                inputRef.current,
                                newState.keyboardHeight,
                                { smoothScroll: true }
                            );
                        }
                    } else {
                        onKeyboardHide?.();
                        // Restore viewport state
                        viewportStateRef.current = restoreViewport(newState);
                    }
                }

                setOrientation(currentOrientation);
            };

            const handleOrientationChange = () => {
                // При смене ориентации сбрасываем состояние клавиатуры
                setIsKeyboardVisible(false);
                viewportStateRef.current = restoreViewport(viewportStateRef.current);
                // Даём время на перерисовку
                setTimeout(updateInitialHeight, 300);
            };

            // Listen to visual viewport changes
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', handleViewportChange);
                window.visualViewport.addEventListener('scroll', handleViewportChange);
            }

            window.addEventListener('resize', handleViewportChange);
            window.addEventListener('orientationchange', handleOrientationChange);

            // Также слушаем screen.orientation если доступен
            if (screen.orientation) {
                screen.orientation.addEventListener('change', handleOrientationChange);
            }

            return () => {
                if (window.visualViewport) {
                    window.visualViewport.removeEventListener('resize', handleViewportChange);
                    window.visualViewport.removeEventListener('scroll', handleViewportChange);
                }
                window.removeEventListener('resize', handleViewportChange);
                window.removeEventListener('orientationchange', handleOrientationChange);
                if (screen.orientation) {
                    screen.orientation.removeEventListener('change', handleOrientationChange);
                }
            };
        }, [isKeyboardVisible, onKeyboardShow, onKeyboardHide, stickyOnKeyboard, updateInitialHeight]);

        // Обработка фокуса для Android и ландшафтного режима
        const handleFocus = useCallback(() => {
            const currentState = viewportStateRef.current;

            // Android-specific: scroll input into view on focus
            if (isAndroid() && inputRef.current) {
                setTimeout(() => {
                    scrollInputIntoView(
                        inputRef.current,
                        currentState.keyboardHeight,
                        { smoothScroll: true }
                    );
                }, 300);
            } else if (orientation === 'landscape' && inputRef.current) {
                // В ландшафте при фокусе сразу скроллим
                setTimeout(() => {
                    inputRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 300);
            }
        }, [orientation]);

        return (
            <div
                ref={containerRef}
                className={cn(
                    "relative transition-all duration-300",
                    isKeyboardVisible && stickyOnKeyboard && "transform translate-y-0",
                    // В ландшафтном режиме с клавиатурой добавляем отступ снизу
                    isKeyboardVisible && orientation === 'landscape' && "pb-2"
                )}
                style={{
                    // В ландшафтном режиме фиксируем позицию
                    ...(isKeyboardVisible && orientation === 'landscape' ? {
                        position: 'sticky' as const,
                        bottom: 0,
                        zIndex: 50,
                        backgroundColor: 'var(--bg-secondary)',
                    } : {})
                }}
            >
                <input
                    ref={(node) => {
                        inputRef.current = node;
                        if (typeof ref === 'function') {
                            ref(node);
                        } else if (ref) {
                            ref.current = node;
                        }
                    }}
                    onFocus={handleFocus}
                    className={cn(
                        "w-full transition-all duration-300",
                        isKeyboardVisible && "ring-2 ring-violet-500/50",
                        className
                    )}
                    {...props}
                />

                {/* Keyboard indicator */}
                {isKeyboardVisible && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                )}
            </div>
        );
    }
);

KeyboardAwareInput.displayName = 'KeyboardAwareInput';

// Hook for keyboard awareness with landscape support
export function useKeyboardAware() {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const viewportStateRef = useRef<ViewportState>(
        typeof window !== 'undefined'
            ? createInitialViewportState()
            : { originalHeight: 0, currentHeight: 0, keyboardHeight: 0, isKeyboardVisible: false }
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateInitialHeight = () => {
            viewportStateRef.current = createInitialViewportState();
            setOrientation(getOrientation());
        };

        const handleViewportChange = () => {
            const currentOrientation = getOrientation();

            // Адаптивный порог в зависимости от ориентации
            const threshold = currentOrientation === 'landscape'
                ? DEFAULT_KEYBOARD_THRESHOLD_LANDSCAPE
                : DEFAULT_KEYBOARD_THRESHOLD_PORTRAIT;

            // Update viewport state using ViewportManager
            const newState = updateViewportState(viewportStateRef.current, { keyboardThreshold: threshold });
            viewportStateRef.current = newState;

            setKeyboardHeight(newState.keyboardHeight);
            setIsKeyboardVisible(newState.isKeyboardVisible);
            setOrientation(currentOrientation);
        };

        const handleOrientationChange = () => {
            setIsKeyboardVisible(false);
            setKeyboardHeight(0);
            viewportStateRef.current = restoreViewport(viewportStateRef.current);
            setTimeout(updateInitialHeight, 300);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
        }
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
            }
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    return {
        isKeyboardVisible,
        keyboardHeight,
        orientation,
        isLandscape: orientation === 'landscape',
        initialViewportHeight: viewportStateRef.current.originalHeight,
        // Expose ViewportManager functions for advanced usage
        calculateAdjustment: () => calculateViewportAdjustment(viewportStateRef.current),
        scrollInputIntoView: (element: HTMLElement | null) =>
            scrollInputIntoView(element, viewportStateRef.current.keyboardHeight),
    };
}

// Component that adjusts its position when keyboard is visible
export function KeyboardAwareContainer({
    children,
    className = "",
    adjustmentOffset = 0,
    stickToBottom = false
}: {
    children: React.ReactNode;
    className?: string;
    adjustmentOffset?: number;
    stickToBottom?: boolean;
}) {
    const { isKeyboardVisible, keyboardHeight, isLandscape, calculateAdjustment } = useKeyboardAware();

    // Calculate viewport adjustment using ViewportManager
    const viewportAdjustment = calculateAdjustment();

    // В ландшафтном режиме используем другую стратегию
    const landscapeStyles = isKeyboardVisible && isLandscape ? {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-secondary)',
        padding: '8px 16px',
        borderTop: '1px solid var(--border-primary)',
        maxHeight: `calc(100vh - ${keyboardHeight}px)`,
        overflowY: 'auto' as const,
    } : {};

    // Use ViewportManager's calculated adjustment for portrait mode
    const portraitStyles = isKeyboardVisible && !isLandscape ? {
        transform: `translateY(-${Math.max(0, viewportAdjustment - adjustmentOffset)}px)`,
    } : {};

    return (
        <div
            className={cn(
                "transition-all duration-300",
                stickToBottom && isKeyboardVisible && "sticky bottom-0",
                className
            )}
            style={{
                ...portraitStyles,
                ...landscapeStyles,
            }}
        >
            {children}
        </div>
    );
}

// Специальный компонент для input в ландшафтном режиме
export function LandscapeKeyboardInput({
    children,
    className = ""
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const { isKeyboardVisible, isLandscape } = useKeyboardAware();

    if (!isKeyboardVisible || !isLandscape) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]",
                className
            )}
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {children}
        </div>
    );
}
