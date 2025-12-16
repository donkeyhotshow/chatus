"use client";

import { useEffect, useRef, useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface KeyboardAwareInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onKeyboardShow?: () => void;
    onKeyboardHide?: () => void;
    stickyOnKeyboard?: boolean;
}

export const KeyboardAwareInput = forwardRef<HTMLInputElement, KeyboardAwareInputProps>(
    ({ onKeyboardShow, onKeyboardHide, stickyOnKeyboard = true, className, ...props }, ref) => {
        const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
        const [initialViewportHeight, setInitialViewportHeight] = useState(0);
        const inputRef = useRef<HTMLInputElement | null>(null);

        useEffect(() => {
            // Store initial viewport height
            setInitialViewportHeight(window.visualViewport?.height || window.innerHeight);

            const handleViewportChange = () => {
                const currentHeight = window.visualViewport?.height || window.innerHeight;
                const heightDifference = initialViewportHeight - currentHeight;

                // Keyboard is considered visible if viewport height decreased by more than 150px
                const keyboardVisible = heightDifference > 150;

                if (keyboardVisible !== isKeyboardVisible) {
                    setIsKeyboardVisible(keyboardVisible);

                    if (keyboardVisible) {
                        onKeyboardShow?.();

                        // Scroll input into view if sticky
                        if (stickyOnKeyboard && inputRef.current) {
                            setTimeout(() => {
                                inputRef.current?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center'
                                });
                            }, 100);
                        }
                    } else {
                        onKeyboardHide?.();
                    }
                }
            };

            // Listen to visual viewport changes (better for keyboard detection)
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', handleViewportChange);
                return () => {
                    window.visualViewport?.removeEventListener('resize', handleViewportChange);
                };
            } else {
                // Fallback for older browsers
                window.addEventListener('resize', handleViewportChange);
                return () => {
                    window.removeEventListener('resize', handleViewportChange);
                };
            }
        }, [initialViewportHeight, isKeyboardVisible, onKeyboardShow, onKeyboardHide, stickyOnKeyboard]);

        return (
            <div className={cn(
                "relative transition-all duration-300",
                isKeyboardVisible && stickyOnKeyboard && "transform translate-y-0"
            )}>
                <input
                    ref={(node) => {
                        inputRef.current = node;
                        if (typeof ref === 'function') {
                            ref(node);
                        } else if (ref) {
                            ref.current = node;
                        }
                    }}
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

// Hook for keyboard awareness
export function useKeyboardAware() {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [initialViewportHeight] = useState(() =>
        window.visualViewport?.height || window.innerHeight
    );

    useEffect(() => {
        const handleViewportChange = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;

            setKeyboardHeight(Math.max(0, heightDifference));
            setIsKeyboardVisible(heightDifference > 150);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            return () => {
                window.visualViewport?.removeEventListener('resize', handleViewportChange);
            };
        } else {
            window.addEventListener('resize', handleViewportChange);
            return () => {
                window.removeEventListener('resize', handleViewportChange);
            };
        }
    }, [initialViewportHeight]);

    return {
        isKeyboardVisible,
        keyboardHeight,
        initialViewportHeight,
    };
}

// Component that adjusts its position when keyboard is visible
export function KeyboardAwareContainer({
    children,
    className = "",
    adjustmentOffset = 0
}: {
    children: React.ReactNode;
    className?: string;
    adjustmentOffset?: number;
}) {
    const { isKeyboardVisible, keyboardHeight } = useKeyboardAware();

    return (
        <div
            className={cn("transition-all duration-300", className)}
            style={{
                transform: isKeyboardVisible
                    ? `translateY(-${Math.max(0, keyboardHeight - adjustmentOffset)}px)`
                    : 'translateY(0)',
            }}
        >
            {children}
        </div>
    );
}
