import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-lict';
import { useIsMobile, useDeviceInfo, useHapticFeedback } from '@/hooks/use-mobile';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
});

// Mock navigator.vibrate
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: mockVibrate,
});

describe('use-mobile hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default matchMedia mock
        mockMatchMedia.mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('useIsMobile', () => {
        it('returns false for desktop width', () => {
            // Mock desktop width
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1024,
            });

            const { result } = renderHook(() => useIsMobile());

            expect(result.current).toBe(false);
        });

        it('returns true for mobile width', () => {
            // Mock mobile width
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            mockMatchMedia.mockImplementation((query) => ({
                matches: true,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }));

            const { result } = renderHook(() => useIsMobile());

            expect(result.current).toBe(true);
        });
    });

    describe('useDeviceInfo', () => {
        it('detects mobile device correctly', () => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: 667,
            });

            const { result } = renderHook(() => useDeviceInfo());

            expect(result.current.isMobile).toBe(true);
            expect(result.current.isTablet).toBe(false);
            expect(result.current.isDesktop).toBe(false);
            expect(result.current.orientation).toBe('portrait');
        });

        it('detects tablet device correctly', () => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 800,
            });

            const { result } = renderHook(() => useDeviceInfo());

            expect(result.current.isMobile).toBe(false);
            expect(result.current.isTablet).toBe(true);
            expect(result.current.isDesktop).toBe(false);
        });

        it('detects landscape orientation', () => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 667,
            });

            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: 375,
            });

            const { result } = renderHook(() => useDeviceInfo());

            expect(result.current.orientation).toBe('landscape');
        });
    });

    describe('useHapticFeedback', () => {
        it('provides vibration functions', () => {
            const { result } = renderHook(() => useHapticFeedback());

            expect(typeof result.current.vibrate).toBe('function');
            expect(typeof result.current.lightTap).toBe('function');
            expect(typeof result.current.mediumTap).toBe('function');
            expect(typeof result.current.heavyTap).toBe('function');
            expect(typeof result.current.doubleTap).toBe('function');
            expect(typeof result.current.errorFeedback).toBe('function');
            expect(typeof result.current.successFeedback).toBe('function');
        });

        it('calls navigator.vibrate with correct patterns', () => {
            const { result } = renderHook(() => useHapticFeedback());

            act(() => {
                result.current.lightTap();
            });
            expect(mockVibrate).toHaveBeenCalledWith(10);

            act(() => {
                result.current.doubleTap();
            });
            expect(mockVibrate).toHaveBeenCalledWith([10, 50, 10]);

            act(() => {
                result.current.errorFeedback();
            });
            expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
        });

        it('handles custom vibration patterns', () => {
            const { result } = renderHook(() => useHapticFeedback());

            act(() => {
                result.current.vibrate([20, 30, 20]);
            });

            expect(mockVibrate).toHaveBeenCalledWith([20, 30, 20]);
        });
    });
});
