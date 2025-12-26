/**
 * Property-Based Tests for ViewportManager
 *
 * **Feature: chatus-bug-fixes, Property 4: Viewport Adjustmentd-Trip**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  type ViewportState,
  createInitialViewportState,
  calculateViewportAdjustment,
  restoreViewport,
  isViewportRestored,
  simulateKeyboardShow,
  simulateKeyboardHide,
  DEFAULT_KEYBOARD_THRESHOLD_PORTRAIT,
  DEFAULT_KEYBOARD_THRESHOLD_LANDSCAPE,
} from '@/lib/viewport-manager';

describe('ViewportManager', () => {
  describe('Property 4: Viewport Adjustment Round-Trip', () => {
    /**
     * Property: For any keyboard show/hide cycle, the viewport SHALL return
     * to its original state after the keyboard closes.
     *
     * **Feature: chatus-bug-fixes, Property 4: Viewport Adjustment Round-Trip**
     * **Validates: Requirements 5.1, 5.2, 5.3**
     */
    it('should restore viewport to original state after keyboard show/hide cycle', () => {
      fc.assert(
        fc.property(
          // Generate valid viewport heights (typical mobile screen heights)
          fc.integer({ min: 400, max: 1200 }),
          // Generate valid keyboard heights (typical keyboard heights)
          fc.integer({ min: 200, max: 400 }),
          (originalHeight, keyboardHeight) => {
            // Create initial state
            const initialState: ViewportState = {
              originalHeight,
              currentHeight: originalHeight,
              keyboardHeight: 0,
              isKeyboardVisible: false,
            };

            // Simulate keyboard show
            const stateWithKeyboard = simulateKeyboardShow(initialState, keyboardHeight);

            // Verify keyboard is visible
            expect(stateWithKeyboard.isKeyboardVisible).toBe(true);
            expect(stateWithKeyboard.keyboardHeight).toBe(keyboardHeight);

            // Simulate keyboard hide
            const restoredState = simulateKeyboardHide(stateWithKeyboard);

            // Verify round-trip: viewport should be restored
            expect(isViewportRestored(initialState, restoredState)).toBe(true);
            expect(restoredState.isKeyboardVisible).toBe(false);
            expect(restoredState.keyboardHeight).toBe(0);
            expect(restoredState.currentHeight).toBe(initialState.originalHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: calculateViewportAdjustment SHALL return 0 when keyboard is not visible.
     *
     * **Feature: chatus-bug-fixes, Property 4: Viewport Adjustment Round-Trip**
     * **Validates: Requirements 5.3**
     */
    it('should return zero adjustment when keyboard is not visible', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1200 }),
          (originalHeight) => {
            const state: ViewportState = {
              originalHeight,
              currentHeight: originalHeight,
              keyboardHeight: 0,
              isKeyboardVisible: false,
            };

            const adjustment = calculateViewportAdjustment(state);
            expect(adjustment).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: calculateViewportAdjustment SHALL return keyboard height when keyboard is visible.
     *
     * **Feature: chatus-bug-fixes, Property 4: Viewport Adjustment Round-Trip**
     * **Validates: Requirements 5.1, 5.2**
     */
    it('should return keyboard height as adjustment when keyboard is visible', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1200 }),
          fc.integer({ min: 100, max: 400 }),
          (originalHeight, keyboardHeight) => {
            const state: ViewportState = {
              originalHeight,
              currentHeight: originalHeight - keyboardHeight,
              keyboardHeight,
              isKeyboardVisible: true,
            };

            const adjustment = calculateViewportAdjustment(state);
            expect(adjustment).toBe(keyboardHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: restoreViewport SHALL always produce a state with keyboard hidden.
     *
     * **Feature: chatus-bug-fixes, Property 4: Viewport Adjustment Round-Trip**
     * **Validates: Requirements 5.3**
     */
    it('should always produce hidden keyboard state after restore', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1200 }),
          fc.integer({ min: 0, max: 400 }),
          fc.boolean(),
          (originalHeight, keyboardHeight, wasVisible) => {
            const state: ViewportState = {
              originalHeight,
              currentHeight: wasVisible ? originalHeight - keyboardHeight : originalHeight,
              keyboardHeight: wasVisible ? keyboardHeight : 0,
              isKeyboardVisible: wasVisible,
            };

            const restored = restoreViewport(state);

            expect(restored.isKeyboardVisible).toBe(false);
            expect(restored.keyboardHeight).toBe(0);
            expect(restored.currentHeight).toBe(originalHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Multiple keyboard show/hide cycles SHALL always restore to original state.
     *
     * **Feature: chatus-bug-fixes, Property 4: Viewport Adjustment Round-Trip**
     * **Validates: Requirements 5.1, 5.2, 5.3**
     */
    it('should restore to original state after multiple keyboard cycles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1200 }),
          fc.array(fc.integer({ min: 150, max: 400 }), { minLength: 1, maxLength: 5 }),
          (originalHeight, keyboardHeights) => {
            const initialState: ViewportState = {
              originalHeight,
              currentHeight: originalHeight,
              keyboardHeight: 0,
              isKeyboardVisible: false,
            };

            let currentState = initialState;

            // Simulate multiple keyboard show/hide cycles
            for (const kbHeight of keyboardHeights) {
              // Show keyboard
              currentState = simulateKeyboardShow(currentState, kbHeight);
              expect(currentState.isKeyboardVisible).toBe(true);

              // Hide keyboard
              currentState = simulateKeyboardHide(currentState);
              expect(currentState.isKeyboardVisible).toBe(false);
            }

            // After all cycles, should be restored to original
            expect(isViewportRestored(initialState, currentState)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Keyboard height SHALL never be negative.
     *
     * **Feature: chatus-bug-fixes, Property 4: Viewport Adjustment Round-Trip**
     * **Validates: Requirements 5.1**
     */
    it('should never produce negative keyboard height', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1200 }),
          fc.integer({ min: -500, max: 500 }),
          (originalHeight, heightChange) => {
            const state: ViewportState = {
              originalHeight,
              currentHeight: originalHeight,
              keyboardHeight: 0,
              isKeyboardVisible: false,
            };

            // Simulate with any height change (including negative)
            const newState = simulateKeyboardShow(state, heightChange);

            // Keyboard height should never be negative
            expect(newState.keyboardHeight).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Current height SHALL never exceed original height.
     *
     * **Feature: chatus-bug-fixes, Property 4: Viewport Adjustment Round-Trip**
     * **Validates: Requirements 5.1, 5.3**
     */
    it('should never have current height exceed original height', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1200 }),
          fc.integer({ min: 0, max: 400 }),
          (originalHeight, keyboardHeight) => {
            const initialState: ViewportState = {
              originalHeight,
              currentHeight: originalHeight,
              keyboardHeight: 0,
              isKeyboardVisible: false,
            };

            const stateWithKeyboard = simulateKeyboardShow(initialState, keyboardHeight);

            // Current height should never exceed original
            expect(stateWithKeyboard.currentHeight).toBeLessThanOrEqual(originalHeight);

            const restoredState = simulateKeyboardHide(stateWithKeyboard);

            // After restore, current height should equal original
            expect(restoredState.currentHeight).toBe(originalHeight);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Threshold Detection', () => {
    it('should have correct default thresholds', () => {
      expect(DEFAULT_KEYBOARD_THRESHOLD_PORTRAIT).toBe(150);
      expect(DEFAULT_KEYBOARD_THRESHOLD_LANDSCAPE).toBe(100);
    });
  });

  describe('createInitialViewportState', () => {
    let originalWindow: typeof globalThis.window;

    beforeEach(() => {
      originalWindow = globalThis.window;
    });

    afterEach(() => {
      globalThis.window = originalWindow;
    });

    it('should create state with current viewport height', () => {
      // Mock window with visualViewport
      Object.defineProperty(globalThis, 'window', {
        value: {
          visualViewport: { height: 800 },
          innerHeight: 800,
        },
        writable: true,
        configurable: true,
      });

      const state = createInitialViewportState();

      expect(state.originalHeight).toBe(800);
      expect(state.currentHeight).toBe(800);
      expect(state.keyboardHeight).toBe(0);
      expect(state.isKeyboardVisible).toBe(false);
    });
  });
});
