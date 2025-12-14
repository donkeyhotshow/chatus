import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatService } from '@/services/ChatService';
import type { UserProfile } from '@/lib/types';

// --- Mocks ---
// Create mocks inside vi.mock to avoid hoisting issues
const mockFirestoreFns = {
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  runTransaction: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  writeBatchDelete: vi.fn(),
  writeBatchCommit: vi.fn(),
  deleteDoc: vi.fn(),
};

vi.mock('firebase/firestore', () => {
  // Re-create mocks inside to avoid hoisting issues
  const mocks = {
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    runTransaction: vi.fn(),
    updateDoc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    writeBatchDelete: vi.fn(),
    writeBatchCommit: vi.fn(),
    deleteDoc: vi.fn(),
  };
  
  // Store references globally for test access
  (globalThis as any).__mockFirestoreFns = mocks;
  
  return {
    getFirestore: vi.fn(() => ({})),
    collection: (...args: any[]) => ({ __type: 'collection', args }),
    doc: (...args: any[]) => ({ path: args.join('/') }),
    query: (...args: any[]) => ({ __type: 'query', args }),
    orderBy: (...args: any[]) => ({ __type: 'orderBy', args }),
    where: (...args: any[]) => ({ __type: 'where', args }),
    startAfter: (...args: any[]) => ({ __type: 'startAfter', args }),
    limit: (...args: any[]) => ({ __type: 'limit', args }),
    onSnapshot: (_ref: any, onNext?: any) => {
      // minimal snapshot payloads to keep initialization stable
      if (onNext) {
        onNext({
          exists: () => true,
          data: () => ({ participantProfiles: [], typing: [] }),
          empty: true,
          docs: [],
        });
      }
      return () => {};
    },
    getDocs: mocks.getDocs,
    addDoc: mocks.addDoc,
    serverTimestamp: () => ({ toMillis: () => Date.now() }),
    runTransaction: mocks.runTransaction,
    updateDoc: mocks.updateDoc,
    arrayUnion: (...values: any[]) => ({ arrayUnion: values }),
    arrayRemove: (...values: any[]) => ({ arrayRemove: values }),
    getDoc: mocks.getDoc,
    setDoc: mocks.setDoc,
    writeBatch: () => ({
      delete: mocks.writeBatchDelete,
      commit: mocks.writeBatchCommit,
    }),
    deleteDoc: mocks.deleteDoc,
    Timestamp: { now: () => ({ toMillis: () => Date.now() }) },
    Firestore: class {},
    DocumentSnapshot: class {},
    increment: (...args: any[]) => ({ increment: args }),
  };
});

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(async () => ({ user: { uid: 'auth-uid' } })),
  Auth: class {},
  getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/storage', () => {
  const uploadBytes = vi.fn(async () => ({ ref: { fullPath: 'path' } }));
  const getDownloadURL = vi.fn(async () => 'https://example.com/test.png');
  const ref = vi.fn((_storage: any, path: string) => ({ path }));
  return { getStorage: vi.fn(() => ({})), uploadBytes, getDownloadURL, ref, FirebaseStorage: class {} };
});

// --- Helpers ---
const noopFirestore = {} as any;
const noopAuth = {} as any;
const noopStorage = {} as any;

const user: UserProfile = { id: 'user-1', name: 'Alice', avatar: 'x' };

function createService() {
  const service = new ChatService('room-1', noopFirestore, noopAuth, noopStorage);
  (service as any).currentUser = user; // bypass join for focused unit tests
  return service;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// Get mocks from global after vi.mock hoisting
const getMocks = () => (globalThis as any).__mockFirestoreFns || mockFirestoreFns;

describe('ChatService rate limiting', () => {
  it('enforces cooldown between messages', async () => {
    vi.useFakeTimers();
    const mocks = getMocks();
    mocks.addDoc.mockResolvedValue({});
    mocks.getDocs.mockResolvedValue({ empty: true, docs: [] });
    const service = createService();

    await service.sendMessage({ text: 'hello', user, senderId: user.id, type: 'text' });

    await expect(
      service.sendMessage({ text: 'second', user, senderId: user.id, type: 'text' })
    ).rejects.toThrow('System cooldown active');

    await vi.advanceTimersByTimeAsync(600);
    await service.sendMessage({ text: 'third', user, senderId: user.id, type: 'text' });

    expect(mocks.addDoc).toHaveBeenCalledTimes(2);
  });

  it('mutes user after flood threshold', async () => {
    vi.useFakeTimers();
    const mocks = getMocks();
    mocks.addDoc.mockResolvedValue({});
    mocks.getDocs.mockResolvedValue({ empty: true, docs: [] });
    const service = createService();

    // 5 rapid messages trigger mute on next attempt
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(600);
      await service.sendMessage({ text: `m${i}`, user, senderId: user.id, type: 'text' });
    }

    await expect(
      service.sendMessage({ text: 'muted', user, senderId: user.id, type: 'text' })
    ).rejects.toThrow('You are temporarily muted');
  });
});

describe('ChatService reactions', () => {
  it('toggles reaction add/remove idempotently', async () => {
    vi.useFakeTimers();
    const mocks = getMocks();
    mocks.getDocs.mockResolvedValue({ empty: true, docs: [] });
    let storedReactions: any[] = [];

    mocks.runTransaction.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
      const messageData = { reactions: [...storedReactions] };
      const tx = {
        get: vi.fn(async () => ({
          exists: () => true,
          data: () => messageData,
        })),
        update: vi.fn((_ref: any, data: any) => {
          storedReactions = data.reactions;
        }),
      };
      await fn(tx as any);
    });

    const service = createService();

    await service.toggleReaction('msg-1', '😀', user);
    expect(storedReactions).toEqual([{ emoji: '😀', userId: user.id, username: user.name }]);

    await service.toggleReaction('msg-1', '😀', user);
    expect(storedReactions).toEqual([]);
  });
});

describe('ChatService canvas helpers', () => {
  it('clears canvas sheet via batch delete', async () => {
    vi.useFakeTimers();
    const mocks = getMocks();
    // Mock initial messages load
    mocks.getDocs.mockResolvedValueOnce({ 
      empty: true, 
      docs: [] 
    });
    const fakeDoc = { ref: 'ref-1' };
    // Mock canvas paths query
    mocks.getDocs.mockResolvedValueOnce({ 
      docs: [fakeDoc],
      empty: false
    });
    mocks.writeBatchCommit.mockResolvedValueOnce(undefined);

    const service = createService();
    await service.clearCanvasSheet('sheet-1');

    expect(mocks.writeBatchDelete).toHaveBeenCalledWith(fakeDoc.ref);
    expect(mocks.writeBatchCommit).toHaveBeenCalledTimes(1);
  });
});

