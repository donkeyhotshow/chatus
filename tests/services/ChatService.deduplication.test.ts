/**
 * Тесты для проверки дедупликации сообщений в ChatService
 * 
 * Проверяет исправления из рефакторинга:
 * - Предотвращение дублирования отправленных сообщений
 * - Предотвращение дублирования полученных сообщений
 * - Очистка старых ID для предотвращения утечек памяти
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService } from '@/services/ChatService';
import { Firestore, Auth, FirebaseStorage } from 'firebase/firestore';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('@/lib/error-emitter', () => ({
  errorEmitter: {
    emit: vi.fn()
  }
}));

vi.mock('firebase/firestore', () => {
  const addDoc = vi.fn(async () => ({}));
  return {
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(() => ({})),
    doc: vi.fn(() => ({ path: '' })),
    query: vi.fn(),
    orderBy: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    onSnapshot: vi.fn((_ref: any, onNext?: any) => {
      if (onNext) {
        onNext({
          exists: () => false,
          data: () => ({}),
          empty: true,
          docs: [],
        });
      }
      return vi.fn();
    }),
    getDocs: vi.fn(async () => ({ docs: [], empty: true })),
    addDoc,
    serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
    runTransaction: vi.fn(),
    updateDoc: vi.fn(),
    arrayRemove: vi.fn(),
    arrayUnion: vi.fn(),
    getDoc: vi.fn(async () => ({ exists: () => false })),
    setDoc: vi.fn(),
    writeBatch: vi.fn(() => ({
      delete: vi.fn(),
      commit: vi.fn(),
    })),
    deleteDoc: vi.fn(),
    Timestamp: { now: () => ({ toMillis: () => Date.now() }) },
    Firestore: class {},
    DocumentSnapshot: class {},
  };
});

vi.mock('@/lib/demo-mode', () => ({
  isDemoMode: vi.fn(() => true),
}));

vi.mock('@/lib/firebase-config', () => ({
  isFirebaseConfigValid: vi.fn(() => true),
}));

vi.mock('@/lib/realtime', () => ({
  TypingManager: vi.fn(() => ({
    subscribeToTyping: vi.fn(),
    sendTyping: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

vi.mock('@/services/MessageQueue', () => ({
  getMessageQueue: () => ({
    setSendCallback: vi.fn(),
  }),
}));

describe('ChatService - Deduplication', () => {
  let chatService: ChatService;
  let mockFirestore: Firestore;
  let mockAuth: Auth;
  let mockStorage: FirebaseStorage;
  const user = { id: 'user1', name: 'User', avatar: '' };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    vi.useRealTimers();

    // Create mock instances
    mockFirestore = {} as Firestore;
    mockAuth = {} as Auth;
    mockStorage = {} as FirebaseStorage;

    chatService = new ChatService('test-room', mockFirestore, mockAuth, mockStorage);
    (chatService as any).currentUser = user;
    (chatService as any).messageCooldown = 0;
    (chatService as any).checkMessageRate = () => {};
  });

  it('should prevent duplicate message sending', async () => {
    const messageData = {
      text: 'Test message',
      user,
      senderId: user.id,
      type: 'text' as const
    };

    const clientMessageId = 'msg-123';

    await chatService.sendMessage(messageData, clientMessageId);
    await chatService.sendMessage(messageData, clientMessageId);

    const sentIds = (chatService as any).sentMessageIds as Set<string>;
    expect(sentIds.has(clientMessageId)).toBe(true);
    expect(sentIds.size).toBe(1);
  });

  it('should clean up old sent message IDs', async () => {
    const messageData = {
      text: 'Test',
      user,
      senderId: user.id,
      type: 'text' as const
    };

    // Send 150 messages to trigger cleanup
    for (let i = 0; i < 150; i++) {
      await chatService.sendMessage(messageData, `msg-${i}`);
    }

    // Access private property through type assertion for testing
    const sentIds = (chatService as any).sentMessageIds as Set<string>;
    
    // Should keep only last 100 IDs
    expect(sentIds.size).toBeLessThanOrEqual(100);
  });

  it('should handle message ID cleanup on error', async () => {
    const messageData = {
      text: 'Test',
      user,
      senderId: user.id,
      type: 'text' as const
    };

    const clientMessageId = 'msg-error';

    // Force non-demo path with failing addDoc
    const { isDemoMode } = await import('@/lib/demo-mode');
    const { addDoc } = await import('firebase/firestore');
    (isDemoMode as vi.Mock).mockReturnValue(false);
    (addDoc as vi.Mock).mockRejectedValue(new Error('Network error'));

    // Try to send message
    try {
      await chatService.sendMessage(messageData, clientMessageId);
    } catch (error) {
      // Expected to fail
    }

    // ID should be removed from sent set to allow retry
    const sentIds = (chatService as any).sentMessageIds as Set<string>;
    expect(sentIds.has(clientMessageId)).toBe(false);
  });
});
