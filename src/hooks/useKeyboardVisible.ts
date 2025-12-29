"use client";

import { useState, useEffect } from 'react';

export function useKeyboardVisible() {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            // If the visual viewport height is significantly smaller than the window height,
            // the keyboard is likely visible.
            if (window.visualViewport) {
                const isVisible = window.visualViewport.height < window.innerHeight * 0.75;
                setIsKeyboardVisible(isVisible);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            return () => window.visualViewport?.removeEventListener('resize', handleResize);
        }
    }, []);

    return isKeyboardVisible;
}
