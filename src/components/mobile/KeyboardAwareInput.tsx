"use client";

import { useEffect, useRef, useState, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface KeyboardAwareInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onKeyboardShow?: () => void;
    onKeyboardHide?: () => void;
    stickyOnKeyboard?: boolean;
}

// Определяем ориентацию экрана
function getOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') return 'portrait';

    // Используем screen.orientation если доступен
    if (screen.orientation) {
        return screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait';
    }

    // Fallback на сравнение размеров
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

export const KeyboardAwareInput = forwardRef<HTMLInputElement, KeyboardAwareInputProps>(
    ({ onKeyboardShow, onKeyboardHide, stickyOnKeyboard = true, className, ...props }, ref) => {
        const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
        const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
        const inputRef = useRef<HTMLInputElement | null>(null);
        const initialHeightRef = useRef<number>(0);
        const containerRef = useRef<HTMLDivElement | null>(null);

        // Обновляем начальную высоту при изменении ориентации
        const updateInitialHeight = useCallback(() => {
            initialHeightRef.current = window.visualViewport?.height || window.innerHeight;
            setOrientation(getOrientation());
        }, []);

        useEffect(() => {
            updateInitialHeight();

            const handleViewportChange = () => {
                const currentHeight = window.visualViewport?.height || window.innerHeight;
                const heightDifference = initialHeightRef.current - currentHeight;
                const currentOrientation = getOrientation();

                // В ландшафтном режиме порог меньше, т.к. клавиатура занимает больше места
                const threshold = currentOrientation === 'landscape' ? 100 : 150;
                const keyboardVisible = heightDifference > threshold;

                if (keyboardVisible !== isKeyboardVisible) {
                    setIsKeyboardVisible(keyboardVisible);

                    if (keyboardVisible) {
                        onKeyboardShow?.();

                        // В ландшафтном режиме особая обработка
                        if (stickyOnKeyboard && inputRef.current) {
                            setTimeout(() => {
                                if (currentOrientation === 'landscape') {
                                    // В ландшафте скроллим к верху input
                                    inputRef.current?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start',
                                        inline: 'nearest'
                                    });
                                } else {
                                    inputRef.current?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'center'
                                    });
                                }
                            }, 100);
                        }
                    } else {
                        onKeyboardHide?.();
                    }
                }

                setOrientation(currentOrientation);
            };

            const handleOrientationChange = () => {
                // При смене ориентации сбрасываем состояние клавиатуры
                setIsKeyboardVisible(false);
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

        // Обработка фокуса для ландшафтного режима
        const handleFocus = useCallback(() => {
            if (orientation === 'landscape' && inputRef.current) {
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
                        isKeyboardVisible && "ring-2 ring-cyan-500/50",
                        className
                    )}
                    {...props}
                />

                {/* Keyboard indicator */}
                {isKeyboardVisible && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
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
    const initialHeightRef = useRef<number>(
        typeof window !== 'undefined'
            ? (window.visualViewport?.height || window.innerHeight)
            : 0
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateInitialHeight = () => {
            initialHeightRef.current = window.visualViewport?.height || window.innerHeight;
            setOrientation(getOrientation());
        };

        const handleViewportChange = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            const heightDifference = initialHeightRef.current - currentHeight;
            const currentOrientation = getOrientation();

            // Адаптивный порог в зависимости от ориентации
            const threshold = currentOrientation === 'landscape' ? 80 : 150;

            setKeyboardHeight(Math.max(0, heightDifference));
            setIsKeyboardVisible(heightDifference > threshold);
            setOrientation(currentOrientation);
        };

        const handleOrientationChange = () => {
            setIsKeyboardVisible(false);
            setKeyboardHeight(0);
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
        initialViewportHeight: initialHeightRef.current,
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
    const { isKeyboardVisible, keyboardHeight, isLandscape } = useKeyboardAware();

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

    const portraitStyles = isKeyboardVisible && !isLandscape ? {
        transform: `translateY(-${Math.max(0, keyboardHeight - adjustmentOffset)}px)`,
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
