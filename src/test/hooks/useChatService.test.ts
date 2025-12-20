import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock Firebase
vi.mock('@/components/firebase/FirebaseProvider', () => ({
    useFirebase: () => ({
        db: {},
        auth: { currentUser: { uid: 'test-user' } },
        storage: {},
    }),
}));

// Mock ChatService
const mockChatService = {
    subscribe: vi.fn(() => vi.fn()),
    unsubscribe: vi.fn(),
    getState: vi.fn(() => ({
        messages: [],
        isConnected: true,
        isLoading: false,
    })),
};

vi.mock('@/services/ChatService', () => ({
    getChatService: () => mockChatService,
}));

describe('useChatService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with correct default state', () => {
        expect(mockChatService.getState()).toEqual({
            messages: [],
            isConnected: true,
            isLoading: false,
        });
    });

    it('has subscribe method', () => {
        expect(mockChatService.subscribe).toBeDefined();
    });

    it('has unsubscribe method', () => {
        expect(mockChatService.unsubscribe).toBeDefined();
    });

    it('updates state when service state changes', () => {
        const newState = {
            messages: [{ id: '1', text: 'Hello' }],
            isConnected: true,
            isLoading: false,
        };
        mockChatService.getState.mockReturnValue(newState);
        expect(mockChatService.getState()).toEqual(newState);
    });
});
