import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatService } from '@/hooks/useChatService';
import { rProfile } from '@/lib/types';

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

// Mock ChatService
const mockChatService = {
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    gameStates: {},
    hasMoreMessages: true,
    isInitialLoad: true,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    joinRoom: vi.fn(),
    disconnect: vi.fn(),
};

vi.mock('@/services/ChatService', () => ({
    getChatService: vi.fn(() => mockChatService),
}));

describe('useChatService', () => {
    const mockUser: UserProfile = {
        id: 'user1',
        name: 'Test User',
        avatar: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock service state
        mockChatService.messages = [];
        mockChatService.onlineUsers = [];
        mockChatService.typingUsers = [];
        mockChatService.gameStates = {};
        mockChatService.hasMoreMessages = true;
        mockChatService.isInitialLoad = true;
    });

    it('initializes with correct default state', () => {
        const { result } = renderHook(() => useChatService('test-room', mockUser));

        expect(result.current.messages).toEqual([]);
        expect(result.current.onlineUsers).toEqual([]);
        expect(result.current.typingUsers).toEqual([]);
        expect(result.current.gameStates).toEqual({});
        expect(result.current.hasMoreMessages).toBe(true);
        expect(result.current.isInitialLoad).toBe(true);
        expect(result.current.service).toBe(mockChatService);
    });

    it('subscribes to service updates on mount', () => {
        renderHook(() => useChatService('test-room', mockUser));

        expect(mockChatService.subscribe).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useChatService('test-room', mockUser));

        unmount();

        expect(mockChatService.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('updates state when service state changes', () => {
        let updateCallback: () => void;

        mockChatService.subscribe = vi.fn((callback) => {
            updateCallback = callback;
        });

        const { result } = renderHook(() => useChatService('test-room', mockUser));

        // Simulate service state change
        act(() => {
            mockChatService.messages = [
                {
                    id: '1',
                    text: 'Test message',
                    user: mockUser,
                    senderId: mockUser.id,
                    createdAt: { toMillis: () => Date.now() } as any,
                    reactions: [],
                    delivered: true,
                    seen: false,
                    type: 'text',
                },
            ];
            mockChatService.isInitialLoad = false;

            updateCallback();
        });

        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].text).toBe('Test message');
        expect(result.current.isInitialLoad).toBe(false);
    });

    it('prevents excessive re-renders with state change detection', () => {
        let updateCallback: () => void;
        const renderSpy = vi.fn();

        mockChatService.subscribe = vi.fn((callback) => {
            updateCallback = callback;
        });

        const { result } = renderHook(() => {
            renderSpy();
            return useChatService('test-room', mockUser);
        });

        // Initial render
        expect(renderSpy).toHaveBeenCalledTimes(1);

        // Simulate multiple updates with same data
        act(() => {
            updateCallback(); // No state change
            updateCallback(); // No state change
            updateCallback(); // No state change
        });

        // Should not cause additional renders
        expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('handles connection state correctly', () => {
        const { useConnectionManager } = require('@/hooks/useConnectionManager');

        vi.mocked(useConnectionManager).mockReturnValue({
            isOnline: false,
            isConnected: false,
            isReconnecting: true,
            handleConnectionSuccess: vi.fn(),
            handleConnectionError: vi.fn(),
        });

        const { result } = renderHook(() => useChatService('test-room', mockUser));

        expect(result.current.connectionState.isOnline).toBe(false);
        expect(result.current.connectionState.isConnected).toBe(false);
        expect(result.current.connectionState.isReconnecting).toBe(true);
    });

    it('handles room changes correctly', () => {
        const { result, rerender } = renderHook(
            ({ roomId }) => useChatService(roomId, mockUser),
            { initialProps: { roomId: 'room1' } }
        );

        expect(mockChatService.subscribe).toHaveBeenCalledTimes(1);

        // Change room
        rerender({ roomId: 'room2' });

        // Should unsubscribe from old service and subscribe to new one
        expect(mockChatService.unsubscribe).toHaveBeenCalledTimes(1);
        expect(mockChatService.subscribe).toHaveBeenCalledTimes(2);
    });

    it('handles missing Firebase context gracefully', () => {
        const { useFirebase } = require('@/components/firebase/FirebaseProvider');

        vi.mocked(useFirebase).mockReturnValue(null);

        const { result } = renderHook(() => useChatService('test-room', mockUser));

        // Should not crash and return null service
        expect(result.current.service).toBeNull();
    });
});
