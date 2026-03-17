import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyNicknameToOwnMessages, resolveNickname, sanitizeMessageText } from '@/components/chat/ChatArea';
import type { Message } from '@/lib/types';

// Mock Firebase context
vi.mock('@/components/firebase/FirebaseProvider', () => ({
    useFirebase: () => ({
        db: {},
        auth: {},
        storage: {},
    }),
    useFirebaseSafe: () => ({
        db: {},
        auth: {},
        storage: {},
    }),
}));

// Mock hooks
vi.mock('@/hooks/useChatService', () => ({
    useChatService: () => ({
        messages: [],
        isConnected: true,
        isLoading: false,
        error: null,
    }),
}));

vi.mock('@/hooks/useRoomManager', () => ({
    useRoomManager: () => ({
        messages: [],
        isConnected: true,
        sendMessage: vi.fn(),
    }),
}));

describe('ChatArea', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('resolves nickname from storage first', () => {
        expect(resolveNickname('StoredName', 'PromptedName')).toBe('StoredName');
    });

    it('falls back to prompted nickname or guest', () => {
        expect(resolveNickname(null, 'PromptedName')).toBe('PromptedName');
        expect(resolveNickname(null, null)).toBe('Гость');
    });

    it('sanitizes message text before send', () => {
        expect(sanitizeMessageText('  <img src=x onerror=alert(1)>hello  ')).toBe('hello');
        expect(sanitizeMessageText('   ')).toBe('');
        expect(sanitizeMessageText('<script>alert(1)</script>')).toBe('');
    });

    it('applies nickname only to own messages', () => {
        const messages = [
            {
                id: '1',
                text: 'mine',
                createdAt: { seconds: 1 } as Message['createdAt'],
                user: { id: 'u1', name: 'OldMe', avatar: '' },
                senderId: 'u1',
                reactions: [],
                delivered: true,
                seen: false,
                type: 'text',
            },
            {
                id: '2',
                text: 'other',
                createdAt: { seconds: 2 } as Message['createdAt'],
                user: { id: 'u2', name: 'Friend', avatar: '' },
                senderId: 'u2',
                reactions: [],
                delivered: true,
                seen: false,
                type: 'text',
            },
        ] as Message[];

        const result = applyNicknameToOwnMessages(messages, 'u1', 'NewNick');
        expect(result[0].user.name).toBe('NewNick');
        expect(result[1].user.name).toBe('Friend');
    });
});
