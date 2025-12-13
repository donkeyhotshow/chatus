/**
 * Тесты для проверки исправления дублирования в ChatService.disconnect()
 * 
 * Проверяет исправление из рефакторинга:
 * - Отсутствие дублирования установки callback
 * - Правильная очистка всех ресурсов
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

const mockMessageQueue = {
  setSendCallback: vi.fn()
};

vi.mock('@/services/MessageQueue', () => ({
  getMessageQueue: () => mockMessageQueue
}));

describe('ChatService - Disconnect', () => {
  let chatService: ChatService;
  let mockFirestore: Firestore;
  let mockAuth: Auth;
  let mockStorage: FirebaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFirestore = {} as Firestore;
    mockAuth = {} as Auth;
    mockStorage = {} as FirebaseStorage;

    chatService = new ChatService('test-room', mockFirestore, mockAuth, mockStorage);
  });

  it('should set message queue callback only once on disconnect', async () => {
    // Set initial callback
    mockMessageQueue.setSendCallback.mockClear();

    await chatService.disconnect();

    // Should be called only once (not twice as before fix)
    expect(mockMessageQueue.setSendCallback).toHaveBeenCalledTimes(1);
  });

  it('should clear all subscriptions on disconnect', async () => {
    const unsubscribes = (chatService as any).unsubscribes as Array<() => void>;
    const mockUnsub = vi.fn();
    unsubscribes.push(mockUnsub);

    await chatService.disconnect();

    expect(mockUnsub).toHaveBeenCalled();
    expect(unsubscribes.length).toBe(0);
  });

  it('should clear timers on disconnect', async () => {
    // Set up timers
    const muteTimer = setTimeout(() => {}, 1000);
    const muteCountdownTimer = setInterval(() => {}, 1000);
    
    (chatService as any).muteTimer = muteTimer;
    (chatService as any).muteCountdownTimer = muteCountdownTimer;

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    await chatService.disconnect();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(muteTimer);
    expect(clearIntervalSpy).toHaveBeenCalledWith(muteCountdownTimer);
  });

  it('should reset state on disconnect', async () => {
    // Set some state
    (chatService as any).currentUser = { id: 'user1', name: 'User', avatar: '' };
    (chatService as any).isJoining = true;
    (chatService as any).sentMessageIds.add('msg1');
    (chatService as any).receivedMessageIds.add('msg2');

    await chatService.disconnect();

    expect((chatService as any).currentUser).toBeNull();
    expect((chatService as any).isJoining).toBe(false);
    expect((chatService as any).sentMessageIds.size).toBe(0);
    expect((chatService as any).receivedMessageIds.size).toBe(0);
  });
});

