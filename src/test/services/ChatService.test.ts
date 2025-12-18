import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '@/services/ChatService';
import { UserProfile } from '@/lib/types';

// Mock Firebase modules
const mockFirestore = {} as any;
const mockAuth = {} as any;
const mockStorage = {} as any;

// Mock sub-services
const mockMessageService = {
    messages: [],
    isInitialLoad: true,
    hasMoreMessages: true,
    setCurrentUser: vi.fn(),
    loadInitialMessages: vi.fn(),
    sendMessage: vi.fn(),
    deleteMessage: vi.fn(),
    toggleReaction: vi.fn(),
    markMessagesAsSeen: vi.fn(),
    markMessagesAsDelivered: vi.fn(),
    loadMoreMessages: vi.fn(),
    disconnect: vi.fn(),
};

const mockPresenceService = {
    onlineUsers: [],
    typingUsers: [],
    setCurrentUser: vi.fn(),
    initListeners: vi.fn(),
    sendTyping: vi.fn(),
    stopTyping: vi.fn(),
    disconnect: vi.fn(),
};

const mockGameService = {
    gameStates: {},
    initListeners: vi.fn(),
    updateGameState: vi.fn(),
    deleteGame: vi.fn(),
    disconnect: vi.fn(),
};

vi.mock('@/services/MessageService', () => ({
    MessageService: vi.fn(() => mockMessageService),
}));

vi.mock('@/services/PresenceService', () => ({
    PresenceService: vi.fn(() => mockPresenceService),
}));

vi.mock('@/services/GameService', () => ({
    GameService: vi.fn(() => mockGameService),
}));

vi.mock('@/services/MessageQueue', () => ({
    getMessageQueue: vi.fn(() => ({
        enqueue: vi.fn(),
        setSendCallback: vi.fn(),
    })),
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(),
}));

vi.mock('@/lib/demo-mode', () => ({
    isDemoMode: vi.fn(() => false),
}));

describe('ChatService', () => {
    let chatService: ChatService;
    const mockUser: UserProfile = {
        id: 'user1',
        name: 'Test User',
        avatar: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        chatService = new ChatService('test-room', mockFirestore, mockAuth, mockStorage);
    });

    it('initializes with correct default state', () => {
        expect(chatService.messages).toEqual([]);
        expect(chatService.onlineUsers).toEqual([]);
        expect(chatService.typingUsers).toEqual([]);
        expect(chatService.gameStates).toEqual({});
        expect(chatService.isInitialLoad).toBe(true);
        expect(chatService.hasMoreMessages).toBe(true);
    });

    it('syncs state from sub-services correctly', () => {
        // Update mock service states
        mockMessageService.messages = [
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
        mockMessageService.isInitialLoad = false;
        mockPresenceService.onlineUsers = [mockUser];
        mockPresenceService.typingUsers = ['user2'];

        // Trigger sync
        (chatService as any).syncAndNotify();

        expect(chatService.messages).toEqual(mockMessageService.messages);
        expect(chatService.isInitialLoad).toBe(false);
        expect(chatService.onlineUsers).toEqual([mockUser]);
        expect(chatService.typingUsers).toEqual(['user2']);
    });

    it('debounces notifications to prevent excessive updates', async () => {
        const listener = vi.fn();
        chatService.subscribe(listener);

        // Trigger multiple rapid updates
        (chatService as any).debouncedNotify();
        (chatService as any).debouncedNotify();
        (chatService as any).debouncedNotify();

        // Should only notify once after debounce delay
        expect(listener).not.toHaveBeenCalled();

        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('handles joinRoom correctly', async () => {
        const { runTransaction } = require('firebase/firestore');

        vi.mocked(runTransaction).mockImplementation(async (db, callback) => {
            const mockTransaction = {
                get: vi.fn().mockResolvedValue({
                    exists: () => false,
                }),
                set: vi.fn(),
                update: vi.fn(),
            };
            await callback(mockTransaction);
        });

        await chatService.joinRoom(mockUser, false);

        expect(mockMessageService.setCurrentUser).toHaveBeenCalledWith(mockUser);
        expect(mockPresenceService.setCurrentUser).toHaveBeenCalledWith(mockUser);
        expect(mockMessageService.loadInitialMessages).toHaveBeenCalled();
    });

    it('prevents race conditions in joinRoom', async () => {
        const { runTransaction } = require('firebase/firestore');

        vi.mocked(runTransaction).mockImplementation(async (db, callback) => {
            // Simulate slow transaction
            await new Promise(resolve => setTimeout(resolve, 100));
            const mockTransaction = {
                get: vi.fn().mockResolvedValue({ exists: () => false }),
                set: vi.fn(),
                update: vi.fn(),
            };
            await callback(mockTransaction);
        });

        // Start multiple join operations simultaneously
        const promise1 = chatService.joinRoom(mockUser, false);
        const promise2 = chatService.joinRoom(mockUser, false);
        const promise3 = chatService.joinRoom(mockUser, false);

        await Promise.all([promise1, promise2, promise3]);

        // Should only call setCurrentUser once (no race condition)
        expect(mockMessageService.setCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('handles sendMessage delegation', async () => {
        const messageData = {
            text: 'Test message',
            user: mockUser,
            senderId: mockUser.id,
            type: 'text' as const,
        };

        await chatService.sendMessage(messageData);

        expect(mockMessageService.sendMessage).toHaveBeenCalledWith(messageData, undefined);
    });

    it('handles typing status correctly', () => {
        chatService.sendTyping();
        expect(mockPresenceService.sendTyping).toHaveBeenCalled();

        chatService.stopTyping();
        expect(mockPresenceService.stopTyping).toHaveBeenCalled();

        chatService.setTypingStatus(true);
        expect(mockPresenceService.sendTyping).toHaveBeenCalledTimes(2);

        chatService.setTypingStatus(false);
        expect(mockPresenceService.stopTyping).toHaveBeenCalledTimes(2);
    });

    it('handles subscription management', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        chatService.subscribe(listener1);
        chatService.subscribe(listener2);

        // Trigger notification
        (chatService as any).notify();

        expect(listener1).toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();

        // Unsubscribe one listener
        chatService.unsubscribe(listener1);
        vi.clearAllMocks();

        // Trigger notification again
        (chatService as any).notify();

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
    });

    it('handles disconnect correctly', async () => {
        chatService['currentUser'] = mockUser;

        await chatService.disconnect();

        expect(mockMessageService.disconnect).toHaveBeenCalled();
        expect(mockPresenceService.disconnect).toHaveBeenCalled();
        expect(mockGameService.disconnect).toHaveBeenCalled();
        expect(chatService['currentUser']).toBeNull();
        expect(chatService['isJoining']).toBe(false);
        expect(chatService['joinPromise']).toBeNull();
    });

    it('handles demo mode correctly', async () => {
        const { isDemoMode } = require('@/lib/demo-mode');
        vi.mocked(isDemoMode).mockReturnValue(true);

        await chatService.joinRoom(mockUser, false);

        // Should skip Firebase operations in demo mode
        expect(mockMessageService.loadInitialMessages).toHaveBeenCalled();
        expect(mockPresenceService.initListeners).toHaveBeenCalled();
    });

    it('handles image upload in demo mode', async () => {
        const { isDemoMode } = require('@/lib/demo-mode');
        vi.mocked(isDemoMode).mockReturnValue(true);

        const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
        const result = await chatService.uploadImage(mockFile);

        expect(result).toMatch(/^data:image/); // Should return data URL in demo mode
    });
});
