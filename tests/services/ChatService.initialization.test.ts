/**
 * Test for ChatService initialization fixes
 * Verifies that lazy initialization prevents "Cannot access before initialization" errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChatService } from '@/services/ChatService';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';

// Mock Firebase modules
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    where: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    runTransaction: vi.fn(),
    limit: vi.fn(),
    updateDoc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    writeBatch: vi.fn(),
    getDocs: vi.fn(),
    startAfter: vi.fn(),
    arrayRemove: vi.fn(),
  };
});

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('@/lib/realtime', () => ({
  TypingManager: vi.fn(),
}));

vi.mock('@/lib/firebase-config', () => ({
  isFirebaseConfigValid: vi.fn(() => true),
}));

vi.mock('@/lib/demo-mode', () => ({
  isDemoMode: vi.fn(() => false),
}));

describe('ChatService Initialization', () => {
  let mockFirestore: Firestore;
  let mockAuth: Auth;
  let mockStorage: FirebaseStorage;

  beforeEach(() => {
    // Create mock Firebase instances
    mockFirestore = {} as Firestore;
    mockAuth = {} as Auth;
    mockStorage = {} as FirebaseStorage;
    
    // Clear any existing service instances
    vi.clearAllMocks();
  });

  it('should create ChatService without initialization errors', () => {
    // This test verifies that the lazy initialization pattern works
    // and doesn't throw "Cannot access before initialization" errors
    expect(() => {
      const service = getChatService('test-room-1', mockFirestore, mockAuth, mockStorage);
      expect(service).toBeDefined();
    }).not.toThrow();
  });

  it('should create multiple ChatService instances for different rooms', () => {
    // Verify singleton pattern works per room
    const service1 = getChatService('room-1', mockFirestore, mockAuth, mockStorage);
    const service2 = getChatService('room-2', mockFirestore, mockAuth, mockStorage);
    const service1Again = getChatService('room-1', mockFirestore, mockAuth, mockStorage);

    expect(service1).toBeDefined();
    expect(service2).toBeDefined();
    expect(service1).toBe(service1Again); // Same room returns same instance
    expect(service1).not.toBe(service2); // Different rooms get different instances
  });

  it('should handle messageQueue lazy initialization', async () => {
    const service = getChatService('test-room-3', mockFirestore, mockAuth, mockStorage);
    
    // The messageQueue should be accessible without errors
    // This would fail with "Cannot access 'c' before initialization" if not properly lazy-loaded
    expect(() => {
      // Access a method that uses messageQueue internally
      service.disconnect();
    }).not.toThrow();
  });
});
