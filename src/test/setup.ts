import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Make React available globally for JSX
globalThis.React = React;

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
    getApps: vi.fn(() => []),
    getApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    connectFirestoreEmulator: vi.fn(),
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
    Timestamp: {
        now: vi.fn(() => ({ toMillis: () => Date.now() })),
        fromDate: vi.fn((date) => ({ toMillis: () => date.getTime() })),
    },
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    connectAuthEmulator: vi.fn(),
    signInAnonymously: vi.fn(),
    onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(),
    connectStorageEmulator: vi.fn(),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};
