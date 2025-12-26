/**
 * Property-Based TestsmeSyncManager
 *
 * **Feature: chatus-bug-fixes, Property 9: Theme State Synchronization**
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  ThemeState,
  ThemeMode,
  loadThemeFromStorage,
  saveThemeToStorage,
  syncThemeState,
  createThemeStateFromToggle,
  isThemeStateSynced,
} from '@/lib/theme-sync';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Mock matchMedia
const createMatchMediaMock = (prefersDark: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

// Arbitrary for ThemeMode
const themeModeArb = fc.constantFrom<ThemeMode>('light', 'dark', 'system');

// Arbitrary for valid ThemeState
const themeStateArb = fc.record({
  isDark: fc.boolean(),
  togglePosition: themeModeArb,
  source: fc.constantFrom<'storage' | 'user' | 'system'>('storage', 'user', 'system'),
});

describe('ThemeSyncManager', () => {
  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();

    // Default to dark mode preference
    Object.defineProperty(global, 'window', {
      value: {
        matchMedia: createMatchMediaMock(true),
        localStorage: localStorageMock,
      },
      writable: true,
    });

    // Mock document
    Object.defineProperty(global, 'document', {
      value: {
        documentElement: {
          setAttribute: vi.fn(),
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
          },
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Property 9: Theme State Synchronization', () => {
    /**
     * Property: For any theme toggle action, the visual toggle state SHALL match
     * the actual theme state both before and after page reload.
     *
     * **Feature: chatus-bug-fixes, Property 9: Theme State Synchronization**
     * **Validates: Requirements 9.1, 9.2, 9.3**
     */
    it('should synchronize toggle state with actual theme for any toggle position', () => {
      fc.assert(
        fc.property(themeModeArb, (togglePosition) => {
          // Create state from toggle
          const state = createThemeStateFromToggle(togglePosition);

          // Sync the state
          const syncedState = syncThemeState(state);

          // Verify synchronization
          if (togglePosition === 'light') {
            expect(syncedState.isDark).toBe(false);
            expect(syncedState.togglePosition).toBe('light');
          } else if (togglePosition === 'dark') {
            expect(syncedState.isDark).toBe(true);
            expect(syncedState.togglePosition).toBe('dark');
          } else {
            // System mode - isDark depends on system preference
            expect(syncedState.togglePosition).toBe('system');
            // isDark should match system preference (mocked as true)
          }

          // State should be synced
          expect(isThemeStateSynced(syncedState)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Save then load should preserve theme state (round-trip)
     *
     * **Feature: chatus-bug-fixes, Property 9: Theme State Synchronization**
     * **Validates: Requirements 9.3**
     */
    it('should preserve theme state through save/load cycle', () => {
      fc.assert(
        fc.property(themeStateArb, (originalState) => {
          // Save state
          saveThemeToStorage(originalState);

          // Load state
          const loadedState = loadThemeFromStorage();

          // Verify round-trip preserves key properties
          expect(loadedState.isDark).toBe(originalState.isDark);
          expect(loadedState.togglePosition).toBe(originalState.togglePosition);
          // Source becomes 'storage' after loading
          expect(loadedState.source).toBe('storage');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: isThemeStateSynced should correctly identify synced states
     *
     * **Feature: chatus-bug-fixes, Property 9: Theme State Synchronization**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('should correctly identify synced vs unsynced states', () => {
      fc.assert(
        fc.property(themeModeArb, fc.boolean(), (togglePosition, isDark) => {
          const state: ThemeState = {
            isDark,
            togglePosition,
            source: 'user',
          };

          const isSynced = isThemeStateSynced(state);

          if (togglePosition === 'light') {
            // Light mode should have isDark = false
            expect(isSynced).toBe(isDark === false);
          } else if (togglePosition === 'dark') {
            // Dark mode should have isDark = true
            expect(isSynced).toBe(isDark === true);
          } else {
            // System mode - depends on system preference (mocked as true)
            const systemPrefersDark = true; // Our mock returns true
            expect(isSynced).toBe(isDark === systemPrefersDark);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: createThemeStateFromToggle should always create synced states
     *
     * **Feature: chatus-bug-fixes, Property 9: Theme State Synchronization**
     * **Validates: Requirements 9.2**
     */
    it('should always create synced states from toggle', () => {
      fc.assert(
        fc.property(themeModeArb, (togglePosition) => {
          const state = createThemeStateFromToggle(togglePosition);

          // State created from toggle should always be synced
          expect(isThemeStateSynced(state)).toBe(true);
          expect(state.source).toBe('user');
          expect(state.togglePosition).toBe(togglePosition);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: syncThemeState should always produce synced states
     *
     * **Feature: chatus-bug-fixes, Property 9: Theme State Synchronization**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('should always produce synced states after sync', () => {
      fc.assert(
        fc.property(themeStateArb, (inputState) => {
          const syncedState = syncThemeState(inputState);

          // After sync, state should always be synced
          expect(isThemeStateSynced(syncedState)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json {{{');

      const state = loadThemeFromStorage();

      // Should return default state
      expect(state.isDark).toBe(true);
      expect(state.togglePosition).toBe('dark');
    });

    it('should handle missing localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const state = loadThemeFromStorage();

      // Should return default state
      expect(state.isDark).toBe(true);
      expect(state.togglePosition).toBe('dark');
    });

    it('should handle invalid togglePosition in storage', () => {
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify({ isDark: true, togglePosition: 'invalid', source: 'storage' })
      );

      const state = loadThemeFromStorage();

      // Should return default state due to invalid togglePosition
      expect(state.togglePosition).toBe('dark');
    });
  });
});
