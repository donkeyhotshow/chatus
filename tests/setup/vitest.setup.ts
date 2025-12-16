import { vi } from 'vitest';
import { setupFirebaseMocks, setupTestEnv } from './firebase-mock';

// Setup test environment
setupTestEnv();

// Setup Firebase mocks
setupFirebaseMocks();

// Polyfill для WebSocket, чтобы избежать ReferenceError в Node/Vitest
if (!(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };
}

// Условный импорт @testing-library/jest-dom (если установлен)
try {
  require('@testing-library/jest-dom');
} catch {
  // Библиотека не установлена, пропускаем
}

// Use fake timers where tests need to control cooldowns/mutes.
// Can be overridden in individual tests with vi.useRealTimers()
vi.useFakeTimers();

// Mock window.matchMedia for components that use it (если window доступен)
if (typeof window !== 'undefined') {
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

  // Mock IntersectionObserver
  (global as any).IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
      return [];
    }
    unobserve() { }
  };
}
