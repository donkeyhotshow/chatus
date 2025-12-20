import { expect, vi, beforeEach, afterEach, describe, it } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useChatService } from '@/hooks/useChatService';
import { UserProfile } from '@/lib/types';

// Mock Firebase context
const mockFirebaseContext = {
    db: {} as any,
    auth: {} as any,
    storage: {} as any,
};

vi.mock('@/components/firebase/FirebaseProvider', () => ({
    useFirebase: vi.fn(() => mockFirebaseContext),
}));

vi.mock('@/hooks/useConnectionManager', () => ({
    useConnectionManager: vi.fn(() => ({
        isOnline: true,
        isConnected: true,
        isReconnecting: false,
        handleConnectionSuccess: vi.fn(),
        handleConnectionError: vi.fn(),
    })),
}));

// Mock ChatService with cleanup tracking
const mockUnsubscribe = vi.fn();
const mockDisconnect = vi.fn();
const mockChatService = {
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    gameStates: {},
    hasMoreMessages: true,
    isInitialLoad: true,
    subscribe: vi.fn(),
    unsubscribe: mockUnsubscribe,
    joinRoom: vi.fn(),
    disconnect: mockDisconnect,
};

vi.mock('@/services/ChatService', () => ({
    getChatService: vi.fn(() => mockChatService),
}));

describe('Memory Leak Tests', () => {
    const mockUser: UserProfile = {
        id: 'user1',
        name: 'Test User',
        avatar: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('properly cleans up subscriptions on unmount', () => {
        const { unmount } = renderHook(() => useChatService('test-room', mockUser));

        expect(mockChatService.subscribe).toHaveBeenCalledTimes(1);

        unmount();

        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('handles rapid mount/unmount cycles without memory leaks', () => {
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
            const { unmount } = renderHook(() => useChatService(`room-${i}`, mockUser));
            unmount();
        }

        // Should have equal subscribe/unsubscribe calls
        expect(mockChatService.subscribe).toHaveBeenCalledTimes(iterations);
        expect(mockUnsubscribe).toHaveBeenCalledTimes(iterations);
    });

    it('prevents listener accumulation', () => {
        const listeners: (() => void)[] = [];

        mockChatService.subscribe = vi.fn((listener) => {
            listeners.push(listener);
        });

        mockChatService.unsubscribe = vi.fn((listener) => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        });

        // Mount and unmount multiple hooks
        for (let i = 0; i < 10; i++) {
            const { unmount } = renderHook(() => useChatService('test-room', mockUser));
            unmount();
        }

        // Should not accumulate listeners
        expect(listeners).toHaveLength(0);
    });

    it('handles component re-renders without creating new subscriptions', () => {
        let renderCount = 0;

        const { rerender } = renderHook(() => {
            renderCount++;
            return useChatService('test-room', mockUser);
        });

        expect(mockChatService.subscribe).toHaveBeenCalledTimes(1);
        expect(renderCount).toBe(1);

        // Force re-render with same props
        rerender();
        rerender();
        rerender();

        // Should not create new subscriptions
        expect(mockChatService.subscribe).toHaveBeenCalledTimes(1);
        expect(renderCount).toBe(4);
    });

    it('cleans up timers and intervals', async () => {
        const originalSetTimeout = global.setTimeout;
        const originalSetInterval = global.setInterval;
        const originalClearTimeout = global.clearTimeout;
        const originalClearInterval = global.clearInterval;

        const activeTimeouts = new Set<NodeJS.Timeout>();
        const activeIntervals = new Set<NodeJS.Timeout>();

        global.setTimeout = vi.fn((callback, delay) => {
            const id = originalSetTimeout(callback, delay);
            activeTimeouts.add(id);
            return id;
        });

        global.setInterval = vi.fn((callback, delay) => {
            const id = originalSetInterval(callback, delay);
            activeIntervals.add(id);
            return id;
        });

        global.clearTimeout = vi.fn((id) => {
            activeTimeouts.delete(id);
            return originalClearTimeout(id);
        });

        global.clearInterval = vi.fn((id) => {
            activeIntervals.delete(id);
            return originalClearInterval(id);
        });

        const { unmount } = renderHook(() => useChatService('test-room', mockUser));

        // Simulate some async operations that might create timers
        await new Promise(resolve => setTimeout(resolve, 10));

        unmount();

        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 50));

        // Restore original functions
        global.setTimeout = originalSetTimeout;
        global.setInterval = originalSetInterval;
        global.clearTimeout = originalClearTimeout;
        global.clearInterval = originalClearInterval;

        // Check that timers were cleaned up
        expect(activeTimeouts.size).toBe(0);
        expect(activeIntervals.size).toBe(0);
    });

    it('handles state updates after unmount gracefully', () => {
        let updateCallback: (() => void) | null = null;

        mockChatService.subscribe = vi.fn((callback) => {
            updateCallback = callback;
        });

        const { unmount } = renderHook(() => useChatService('test-room', mockUser));

        unmount();

        // Try to trigger update after unmount
        expect(() => {
            if (updateCallback) {
                updateCallback();
            }
        }).not.toThrow();
    });

    it('prevents infinite re-render loops', () => {
        let updateCount = 0;
        const maxUpdates = 100;

        mockChatService.subscribe = vi.fn((callback) => {
            // Simulate rapid updates
            const interval = setInterval(() => {
                updateCount++;
                if (updateCount < maxUpdates) {
                    callback();
                } else {
                    clearInterval(interval);
                }
            }, 1);
        });

        const renderSpy = vi.fn();

        const { unmount } = renderHook(() => {
            renderSpy();
            return useChatService('test-room', mockUser);
        });

        // Wait for updates to complete
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                unmount();

                // Should not cause excessive re-renders
                expect(renderSpy.mock.calls.length).toBeLessThan(maxUpdates);
                resolve();
            }, 200);
        });
    });
});
