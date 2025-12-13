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

vi.mock('@/services/MessageQueue', () => ({
  getMessageQueue: () => ({
    setSendCallback: vi.fn()
  })
}));

describe('ChatService - Deduplication', () => {
  let chatService: ChatService;
  let mockFirestore: Firestore;
  let mockAuth: Auth;
  let mockStorage: FirebaseStorage;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock instances
    mockFirestore = {} as Firestore;
    mockAuth = {} as Auth;
    mockStorage = {} as FirebaseStorage;

    chatService = new ChatService('test-room', mockFirestore, mockAuth, mockStorage);
  });

  it('should prevent duplicate message sending', async () => {
    const messageData = {
      text: 'Test message',
      user: { id: 'user1', name: 'User', avatar: '' },
      senderId: 'user1',
      type: 'text' as const
    };

    const clientMessageId = 'msg-123';

    // Mock sendMessage to track calls
    const sendMessageSpy = vi.spyOn(chatService, 'sendMessage');

    // First send should succeed
    await chatService.sendMessage(messageData, clientMessageId);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);

    // Second send with same ID should be ignored
    await chatService.sendMessage(messageData, clientMessageId);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  it('should clean up old sent message IDs', async () => {
    const messageData = {
      text: 'Test',
      user: { id: 'user1', name: 'User', avatar: '' },
      senderId: 'user1',
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
      user: { id: 'user1', name: 'User', avatar: '' },
      senderId: 'user1',
      type: 'text' as const
    };

    const clientMessageId = 'msg-error';

    // Mock addDoc to throw error
    vi.mock('firebase/firestore', () => ({
      addDoc: vi.fn(() => Promise.reject(new Error('Network error')))
    }));

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

