"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SmartKeyboardHandlerProps {
    children: React.ReactNode;
    onKeyboardToggle?: (isVisible: boolean, height: number) => void;
}

export function SmartKeyboardHandler({ children, onKeyboardToggle }: SmartKeyboardHandlerProps) {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(0);
    const isMobile = useIsMobile();
    const initialViewportHeight = useRef<number>(0);

    // Initialize viewport height
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const height = window.visualViewport?.height || window.innerHeight;
            initialViewportHeight.current = height;
            setViewportHeight(height);
        }
    }, []);

    const handleViewportChange = useCallback(() => {
        if (!isMobile || typeof window === 'undefined') return;

        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDifference = initialViewportHeight.current - currentHeight;

        // Keyboard is considered visible if viewport shrunk by more than 150px
        const keyboardVisible = heightDifference > 150;
        const calculatedKeyboardHeight = keyboardVisible ? heightDifference : 0;

        setKeyboardHeight(calculatedKeyboardHeight);
        setIsKeyboardVisible(keyboardVisible);
        setViewportHeight(currentHeight);

        // Notify parent component
        onKeyboardToggle?.(keyboardVisible, calculatedKeyboardHeight);

        // Adjust body padding to prevent content from being hidden
        if (keyboardVisible) {
            document.body.style.paddingBottom = `${calculatedKeyboardHeight}px`;
        } else {
            document.body.style.paddingBottom = '';
        }
    }, [isMobile, onKeyboardToggle]);

    useEffect(() => {
        if (!isMobile) return;

        // Use Visual Viewport API if available (better for mobile)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            return () => {
                window.visualViewport?.removeEventListener('resize', handleViewportChange);
                document.body.style.paddingBottom = '';
            };
        } else {
            // Fallback to window resize
            window.addEventListener('resize', handleViewportChange);
            return () => {
                window.removeEventListener('resize', handleViewportChange);
                document.body.style.paddingBottom = '';
            };
        }
    }, [isMobile, handleViewportChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.style.paddingBottom = '';
        };
    }, []);

    return (
        <div
            className="relative w-full h-full"
            style={{
                '--keyboard-height': `${keyboardHeight}px`,
                '--viewport-height': `${viewportHeight}px`,
                '--is-keyboard-visible': isKeyboardVisible ? '1' : '0'
            } as React.CSSProperties}
        >
            {children}

            {/* Keyboard spacer for mobile */}
            {isMobile && isKeyboardVisible && (
                <div
                    className="fixed bottom-0 left-0 right-0 pointer-events-none z-0"
                    style={{ height: keyboardHeight }}
                />
            )}
        </div>
    );
}
