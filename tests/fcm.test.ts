import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({
  getClientFirebase: () => ({
    app: {},
    firestore: {},
    messaging: {},
  })
}));

vi.mock('firebase/messaging', async () => {
  return {
    getToken: vi.fn(async () => 'token-abc-123'),
    onMessage: vi.fn()
  };
});

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    connectFirestoreEmulator: vi.fn(),
    doc: vi.fn((_firestore: any, path: string, id?: string) => ({ path: `${path}/${id}` })),
    setDoc: vi.fn(async () => ({})),
    getDoc: vi.fn(async () => ({
      exists: () => true,
      data: () => ({ fcmTokens: [{ token: 'mock-fcm-token', timestamp: new Date() }] })
    })),
    arrayUnion: vi.fn((obj: any) => obj)
  };
});

// Mock Notification API
const originalNotification = globalThis.Notification;

describe('FCMManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    globalThis.Notification = {
      requestPermission: vi.fn(async () => 'granted')
    };
  });

  afterEach(() => {
    // @ts-ignore
    globalThis.Notification = originalNotification;
  });

  it('initializes and saves token to firestore when permission granted', async () => {
    const { FCMManager } = await import('@/lib/firebase-messaging');
    const { setDoc } = await import('firebase/firestore');
    const manager = new FCMManager();
    await manager.initialize('user-1');
    expect(setDoc).toHaveBeenCalled();
  });
});

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc } from 'firebase/firestore';
import { FCMManager } from '../src/lib/firebase-messaging';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Mocking Firebase Messaging
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => ({})),
  getToken: vi.fn(() => Promise.resolve('mock-fcm-token')),
  onMessage: vi.fn(),
}));

// --- Firebase Emulator Setup ---
const config = {
  projectId: "demo-test-project",
};
const app = initializeApp(config);
const firestore = getFirestore(app);
connectFirestoreEmulator(firestore, "localhost", 8080);

// --- Utility to clear Firestore for tests ---
async function clearFirestore() {
  // In a real project, you'd use the Firebase Admin SDK to clear collections
  // For client-side tests, we'll just delete specific documents created by tests.
}

describe('FCMManager Integration', () => {
  const userId = 'testUserFCM123';
  let fcmManager: FCMManager;

  beforeEach(async () => {
    await clearFirestore();
    fcmManager = new FCMManager();
    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        requestPermission: vi.fn(() => Promise.resolve('granted')),
        permission: 'granted',
      },
      writable: true,
    });
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = "mock-vapid-key";
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await clearFirestore();
  });

  test('should request notification permission and save token', async () => {
    await fcmManager.initialize(userId);

    expect(window.Notification.requestPermission).toHaveBeenCalled();
    expect(getToken).toHaveBeenCalled();

    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    expect(userDoc.exists()).toBe(true);
    expect(userDoc.data()?.fcmTokens).toEqual(expect.arrayContaining([
      expect.objectContaining({ token: 'mock-fcm-token' })
    ]));
  });

  test('should not initialize if notifications not supported', async () => {
    Object.defineProperty(window, 'Notification', { value: undefined, writable: true });
    await fcmManager.initialize(userId);
    expect(getToken).not.toHaveBeenCalled();
  });

  test('should not save token if permission denied', async () => {
    (window.Notification.requestPermission as any).mockResolvedValueOnce('denied');
    await fcmManager.initialize(userId);
    expect(getToken).not.toHaveBeenCalled();
  });

  test('should register onMessage listener', async () => {
    await fcmManager.initialize(userId);
    expect(onMessage).toHaveBeenCalled();
  });

  test('should display notification for foreground message if document is hidden', async () => {
    // Mock Notification constructor
    global.Notification = vi.fn() as any;

    await fcmManager.initialize(userId);
    (document as any).hidden = true; // Simulate hidden document
    const mockPayload = {
      notification: { title: 'Test Title', body: 'Test Body' },
      data: { roomId: 'testRoom' }
    };

    // Manually trigger the onMessage callback
    const onMessageCallback = (onMessage as any).mock.calls[0][1];
    onMessageCallback(mockPayload);

    expect(global.Notification).toHaveBeenCalledWith('Test Title', {
      body: 'Test Body',
      icon: '/firebase-logo.png',
      tag: 'testRoom'
    });
  });
});
