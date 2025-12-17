"use client";

import { useState, useEffect, useCallback } from 'react';

interface MobileState {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: 'portrait' | 'landscape';
    viewportHeight: number;
    viewportWidth: number;
    isKeyboardVisible: boolean;
    safeAreaInsets: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

interface MobileCapabilities {
    hasTouch: boolean;
    hasHover: boolean;
    supportsVibration: boolean;
    supportsOrientationChange: boolean;
    isStandalone: boolean; // PWA mode
}

export function useMobileEnhanced() {
    const [mobileState, setMobileState] = useState<MobileState>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
        viewportHeight: 0,
        viewportWidth: 0,
        isKeyboardVisible: false,
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const [capabilities, setCapabilities] = useState<MobileCapabilities>({
        hasTouch: false,
        hasHover: true,
        supportsVibration: false,
        supportsOrientationChange: false,
        isStandalone: false
    });

    // Detect device capabilities
    const detectCapabilities = useCallback(() => {
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const hasHover = window.matchMedia('(hover: hover)').matches;
        const supportsVibration = 'vibrate' in navigator;
        const supportsOrientationChange = 'orientation' in window;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        setCapabilities({
            hasTouch,
            hasHover,
            supportsVibration,
            supportsOrientationChange,
            isStandalone
        });
    }, []);

    // Get safe area insets
    const getSafeAreaInsets = useCallback(() => {
        const computedStyle = getComputedStyle(document.documentElement);

        return {
            top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
            bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
            left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
            right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0')
        };
    }, []);

    // Update mobile state
    const updateMobileState = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        const isDesktop = width >= 1024;

        const orientation = width > height ? 'landscape' : 'portrait';

        // Detect keyboard visibility (heuristic for mobile)
        const isKeyboardVisible = isMobile &&
            window.visualViewport ?
            window.visualViewport.height < height * 0.75 :
            false;

        setMobileState({
            isMobile,
            isTablet,
            isDesktop,
            orientation,
            viewportHeight: height,
            viewportWidth: width,
            isKeyboardVisible,
            safeAreaInsets: getSafeAreaInsets()
        });
    }, [getSafeAreaInsets]);

    // Haptic feedback helper
    const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
        if (capabilities.supportsVibration) {
            navigator.vibrate(pattern);
        }
    }, [capabilities.supportsVibration]);

    // Orientation lock helper (for games)
    const lockOrientation = useCallback(async (orientation: 'portrait' | 'landscape') => {
        if ('screen' in window && 'orientation' in window.screen) {
            try {
                await (window.screen.orientation as any).lock(orientation);
                return true;
            } catch (error) {
                console.warn('Orientation lock failed:', error);
                return false;
            }
        }
        return false;
    }, []);

    // Unlock orientation
    const unlockOrientation = useCallback(() => {
        if ('screen' in window && 'orientation' in window.screen) {
            try {
                (window.screen.orientation as any).unlock();
            } catch (error) {
                console.warn('Orientation unlock failed:', error);
            }
        }
    }, []);

    // Setup event listeners
    useEffect(() => {
        detectCapabilities();
        updateMobileState();

        const handleResize = () => updateMobileState();
        const handleOrientationChange = () => {
            // Delay to ensure dimensions are updated
            setTimeout(updateMobileState, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);

        // Visual viewport API for keyboard detection
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateMobileState);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);

            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', updateMobileState);
            }
        };
    }, [detectCapabilities, updateMobileState]);

    return {
        ...mobileState,
        capabilities,
        triggerHaptic,
        lockOrientation,
        unlockOrientation,

        // Convenience methods
        isPortrait: mobileState.orientation === 'portrait',
        isLandscape: mobileState.orientation === 'landscape',
        isTouchDevice: capabilities.hasTouch,
        isPWA: capabilities.isStandalone,

        // Responsive helpers
        showMobileLayout: mobileState.isMobile,
        showTabletLayout: mobileState.isTablet,
        showDesktopLayout: mobileState.isDesktop,

        // Breakpoint helpers
        isSmall: mobileState.viewportWidth < 640,
        isMedium: mobileState.viewportWidth >= 640 && mobileState.viewportWidth < 1024,
        isLarge: mobileState.viewportWidth >= 1024,
        isXLarge: mobileState.viewportWidth >= 1280,
    };
}
