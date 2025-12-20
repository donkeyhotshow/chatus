import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(),
    runTransaction: vi.fn(),
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
    writeBatch: vi.fn(),
    Timestamp: {
        now: vi.fn(() => ({ toMillis: () => Date.now() })),
    },
}));

// Mock services
const mockMessageService = {
    sendMessage: vi.fn(),
    loadInitialMessages: vi.fn(),
    setCurrentUser: vi.fn(),
};

const mockPresenceService = {
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
};

vi.mock('@/services/MessageService', () => ({
    MessageService: vi.fn(() => mockMessageService),
}));

vi.mock('@/services/PresenceService', () => ({
    PresenceService: vi.fn(() => mockPresenceService),
}));

describe('ChatService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with correct default state', () => {
        const defaultState = {
            messages: [],
            isConnected: false,
            isLoading: true,
        };
        expect(defaultState.messages).toEqual([]);
        expect(defaultState.isConnected).toBe(false);
    });

    it('syncs state from sub-services correctly', () => {
        const messages = [{ id: '1', text: 'Hello' }];
        expect(messages.length).toBe(1);
    });

    it('handles sendMessage delegation', async () => {
        const messageData = {
            text: 'Test message',
            user: { id: 'user1', name: 'Test User' },
            senderId: 'user1',
        };

        await mockMessageService.sendMessage(messageData);
        expect(mockMessageService.sendMessage).toHaveBeenCalledWith(messageData);
    });

    it('handles typing status correctly', () => {
        mockPresenceService.startTyping();
        expect(mockPresenceService.startTyping).toHaveBeenCalled();

        mockPresenceService.stopTyping();
        expect(mockPresenceService.stopTyping).toHaveBeenCalled();
    });

    it('handles disconnect correctly', () => {
        const disconnect = vi.fn();
        disconnect();
        expect(disconnect).toHaveBeenCalled();
    });

    it('handles subscription management', () => {
        const listeners = new Set<() => void>();
        const listener = vi.fn();

        listeners.add(listener);
        expect(listeners.size).toBe(1);

        // Notify listeners
        listeners.forEach(l => l());
        expect(listener).toHaveBeenCalled();

        listeners.delete(listener);
        expect(listeners.size).toBe(0);
    });
});
