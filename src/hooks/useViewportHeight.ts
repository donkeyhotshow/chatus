"usclient";

import { useEffect, useCallback } from 'react';

/**
 * useViewportHeight - Sets CSS custom property --vh for real viewport height
 *
 * Fixes iOS Safari 100vh issue where 100vh includes the address bar.
 * Sets --vh to 1% of the actual visible viewport height.
 *
 * Usage in CSS: height: calc(var(--vh, 1vh) * 100);
 */
export function useViewportHeight() {
    const setViewportHeight = useCallback(() => {
        // Use visualViewport if available (more accurate on mobile)
        const vh = window.visualViewport
            ? window.visualViewport.height * 0.01
            : window.innerHeight * 0.01;

        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }, []);

    useEffect(() => {
        // Set initial value
        setViewportHeight();

        // Update on resize
        window.addEventListener('resize', setViewportHeight);

        // Update on orientation change
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(setViewportHeight, 100);
        });

        // Use visualViewport API if available
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', setViewportHeight);
        }

        return () => {
            window.removeEventListener('resize', setViewportHeight);
            window.removeEventListener('orientationchange', setViewportHeight);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', setViewportHeight);
            }
        };
    }, [setViewportHeight]);
}

/**
 * useOrientationChange - Detects orientation changes
 */
export function useOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void) {
    useEffect(() => {
        const getOrientation = (): 'portrait' | 'landscape' => {
            if (screen.orientation) {
                return screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait';
            }
            return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        };

        const handleOrientationChange = () => {
            // Delay to allow orientation change to complete
            setTimeout(() => {
                callback(getOrientation());
            }, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);

        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        }

        // Initial call
        callback(getOrientation());

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            if (screen.orientation) {
                screen.orientation.removeEventListener('change', handleOrientationChange);
            }
        };
    }, [callback]);
}
