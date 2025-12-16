// Firebase Mock для тестов
import { vi } from 'vitest';

// Mock Firebase App
export const mockApp = {
    name: 'test-app',
    options: {
        projectId: 'test-project',
        apiKey: 'test-api-key'
    }
};

// Mock Firebase Auth
export const mockAuth = {
    currentUser: null,
    signInAnonymously: vi.fn().mockResolvedValue({
        user: { uid: 'test-user-id', isAnonymous: true }
    }),
    onAuthStateChanged: vi.fn((callback) => {
        callback({ uid: 'test-user-id', isAnonymous: true });
        return vi.fn(); // unsubscribe function
    })
};

// Mock Firebase Database
export const mockDatabase = {
    ref: vi.fn((path) => ({
        push: vi.fn().mockResolvedValue({ key: 'test-key' }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn().mockResolvedValue({ val: () => null }),
        onDisconnect: vi.fn(() => ({
            set: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn().mockResolvedValue(undefined)
        })),
        child: vi.fn((childPath) => mockDatabase.ref(`${path}/${childPath}`)),
        key: 'test-key',
        toString: () => path
    })),
    goOffline: vi.fn(),
    goOnline: vi.fn()
};

// Mock Firebase Firestore
export const mockFirestore = {
    collection: vi.fn((path) => ({
        doc: vi.fn((id) => ({
            id: id || 'test-doc-id',
            get: vi.fn().mockResolvedValue({
                exists: true,
                data: () => ({ test: 'data' }),
                id: id || 'test-doc-id'
            }),
            set: vi.fn().mockResolvedValue(undefined),
            update: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn().mockResolvedValue(undefined),
            onSnapshot: vi.fn((callback) => {
                callback({
                    exists: true,
                    data: () => ({ test: 'data' }),
                    id: id || 'test-doc-id'
                });
                return vi.fn(); // unsubscribe
            })
        })),
        add: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
        where: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({
                docs: [],
                empty: true,
                size: 0
            }),
            onSnapshot: vi.fn((callback) => {
                callback({ docs: [], empty: true, size: 0 });
                return vi.fn();
            })
        })),
        orderBy: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({
                docs: [],
                empty: true,
                size: 0
            }),
            onSnapshot: vi.fn((callback) => {
                callback({ docs: [], empty: true, size: 0 });
                return vi.fn();
            })
        }))
    }))
};

// Mock Firebase Storage
export const mockStorage = {
    ref: vi.fn((path) => ({
        put: vi.fn().mockResolvedValue({
            ref: { getDownloadURL: vi.fn().mockResolvedValue('https://test-url.com/file') }
        }),
        getDownloadURL: vi.fn().mockResolvedValue('https://test-url.com/file'),
        delete: vi.fn().mockResolvedValue(undefined)
    }))
};

// Mock Firebase functions
export const mockFunctions = {
    httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: 'test-result' }))
};

// Setup mocks
export function setupFirebaseMocks() {
    // Mock Firebase modules
    vi.mock('firebase/app', () => ({
        initializeApp: vi.fn(() => mockApp),
        getApps: vi.fn(() => []),
        getApp: vi.fn(() => mockApp)
    }));

    vi.mock('firebase/auth', () => ({
        getAuth: vi.fn(() => mockAuth),
        signInAnonymously: vi.fn(() => mockAuth.signInAnonymously()),
        onAuthStateChanged: vi.fn((auth, callback) => mockAuth.onAuthStateChanged(callback))
    }));

    vi.mock('firebase/database', () => ({
        getDatabase: vi.fn(() => mockDatabase),
        ref: vi.fn((db, path) => mockDatabase.ref(path)),
        push: vi.fn((ref, data) => ref.push(data)),
        set: vi.fn((ref, data) => ref.set(data)),
        update: vi.fn((ref, data) => ref.update(data)),
        remove: vi.fn((ref) => ref.remove()),
        onValue: vi.fn((ref, callback) => {
            callback({ val: () => null, exists: () => false });
            return vi.fn();
        }),
        off: vi.fn(),
        onDisconnect: vi.fn((ref) => ref.onDisconnect()),
        goOffline: vi.fn(() => mockDatabase.goOffline()),
        goOnline: vi.fn(() => mockDatabase.goOnline())
    }));

    vi.mock('firebase/firestore', () => ({
        getFirestore: vi.fn(() => mockFirestore),
        collection: vi.fn((db, path) => mockFirestore.collection(path)),
        doc: vi.fn((db, path) => mockFirestore.collection('').doc(path)),
        addDoc: vi.fn((collection, data) => collection.add(data)),
        setDoc: vi.fn((doc, data) => doc.set(data)),
        updateDoc: vi.fn((doc, data) => doc.update(data)),
        deleteDoc: vi.fn((doc) => doc.delete()),
        getDoc: vi.fn((doc) => doc.get()),
        getDocs: vi.fn((collection) => collection.get()),
        onSnapshot: vi.fn((ref, callback) => ref.onSnapshot(callback)),
        query: vi.fn((collection) => collection),
        where: vi.fn((field, op, value) => ({ where: vi.fn() })),
        orderBy: vi.fn((field, direction) => ({ orderBy: vi.fn() })),
        limit: vi.fn((num) => ({ limit: vi.fn() }))
    }));

    vi.mock('firebase/storage', () => ({
        getStorage: vi.fn(() => mockStorage),
        ref: vi.fn((storage, path) => mockStorage.ref(path)),
        uploadBytes: vi.fn((ref, data) => ref.put(data)),
        getDownloadURL: vi.fn((ref) => ref.getDownloadURL())
    }));

    // Mock our Firebase config
    vi.mock('@/lib/firebase', () => ({
        app: mockApp,
        auth: mockAuth,
        db: mockDatabase,
        firestore: mockFirestore,
        storage: mockStorage,
        getClientFirebase: vi.fn(() => ({
            app: mockApp,
            auth: mockAuth,
            rtdb: mockDatabase,
            firestore: mockFirestore,
            storage: mockStorage,
            analytics: null,
            messaging: null
        }))
    }));
}

// Environment variables for tests
export function setupTestEnv() {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = 'https://test.firebaseio.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:test';
    process.env.NODE_ENV = 'test';
}
