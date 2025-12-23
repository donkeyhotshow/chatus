/**
 * Property-Based Tests for TouchTargetEnhancer
 *
 * **Feature: chatus-bug-fixes, Property 15: Touch Target Minimum Si
*Validates: Requirements 15.1, 15.2, 15.3**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  MIN_TOUCH_TARGET_SIZE,
  MOBILE_BREAKPOINT,
  calculateTouchPadding,
  isMobileViewport,
  meetsMinimumTouchTarget,
  getEffectiveTouchTargetSize,
  getTouchTargetStyles,
  type ElementDimensions,
} from '@/lib/touch-targets';

describe('TouchTargetEnhancer', () => {
  describe('Property 15: Touch Target Minimum Size', () => {
    /**
     * Property: For any element dimensions, calculateTouchPadding SHALL return
     * padding values that result in effective dimensions >= 44x44 pixels.
     *
     * **Feature: chatus-bug-fixes, Property 15: Touch Target Minimum Size**
     * **Validates: Requirements 15.1, 15.2, 15.3**
     */
    it('should always produce touch targets >= 44x44 pixels after padding', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.integer({ min: 0, max: 200 }),
            height: fc.integer({ min: 0, max: 200 }),
          }),
          (dimensions: ElementDimensions) => {
            const config = calculateTouchPadding(dimensions);
            const effectiveSize = getEffectiveTouchTargetSize(dimensions, {
              x: config.paddingX,
              y: config.paddingY,
            });

            // Effective size must meet minimum requirements
            expect(effectiveSize.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(effectiveSize.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any element that already meets minimum size,
     * calculateTouchPadding SHALL return zero padding.
     *
     * **Feature: chatus-bug-fixes, Property 15: Touch Target Minimum Size**
     * **Validates: Requirements 15.1, 15.2, 15.3**
     */
    it('should return zero padding for elements already meeting minimum size', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 200 }),
            height: fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 200 }),
          }),
          (dimensions: ElementDimensions) => {
            const config = calculateTouchPadding(dimensions);

            // No padding needed for elements already meeting minimum
            expect(config.paddingX).toBe(0);
            expect(config.paddingY).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any element smaller than minimum size,
     * calculateTouchPadding SHALL return positive padding.
     *
     * **Feature: chatus-bug-fixes, Property 15: Touch Target Minimum Size**
     * **Validates: Requirements 15.1, 15.2, 15.3**
     */
    it('should return positive padding for undersized elements', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.integer({ min: 0, max: MIN_TOUCH_TARGET_SIZE - 1 }),
            height: fc.integer({ min: 0, max: MIN_TOUCH_TARGET_SIZE - 1 }),
          }),
          (dimensions: ElementDimensions) => {
            const config = calculateTouchPadding(dimensions);

            // Padding must be positive for undersized elements
            expect(config.paddingX).toBeGreaterThan(0);
            expect(config.paddingY).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: meetsMinimumTouchTarget SHALL return true if and only if
     * both dimensions are >= 44 pixels.
     *
     * **Feature: chatus-bug-fixes, Property 15: Touch Target Minimum Size**
     * **Validates: Requirements 15.1, 15.2, 15.3**
     */
    it('should correctly identify elements meeting minimum size', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.integer({ min: 0, max: 200 }),
            height: fc.integer({ min: 0, max: 200 }),
          }),
          (dimensions: ElementDimensions) => {
            const meets = meetsMinimumTouchTarget(dimensions);
            const expected =
              dimensions.width >= MIN_TOUCH_TARGET_SIZE &&
              dimensions.height >= MIN_TOUCH_TARGET_SIZE;

            expect(meets).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: getTouchTargetStyles SHALL always return minWidth and minHeight
     * of at least 44px.
     *
     * **Feature: chatus-bug-fixes, Property 15: Touch Target Minimum Size**
     * **Validates: Requirements 15.1, 15.2, 15.3**
     */
    it('should generate styles with minimum 44px dimensions', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.integer({ min: 0, max: 200 }),
            height: fc.integer({ min: 0, max: 200 }),
          }),
          (dimensions: ElementDimensions) => {
            const config = calculateTouchPadding(dimensions);
            const styles = getTouchTargetStyles(config);

            // Parse the pixel values from styles
            const minWidth = parseInt(styles.minWidth, 10);
            const minHeight = parseInt(styles.minHeight, 10);

            expect(minWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isMobileViewport', () => {
    let originalWindow: typeof globalThis.window;

    beforeEach(() => {
      originalWindow = globalThis.window;
    });

    afterEach(() => {
      globalThis.window = originalWindow;
    });

    it('should return true for viewport width < 768px', () => {
      // Mock window with mobile width
      Object.defineProperty(globalThis, 'window', {
        value: { innerWidth: 375 },
        writable: true,
        configurable: true,
      });

      expect(isMobileViewport()).toBe(true);
    });

    it('should return false for viewport width >= 768px', () => {
      // Mock window with desktop width
      Object.defineProperty(globalThis, 'window', {
        value: { innerWidth: 1024 },
        writable: true,
        configurable: true,
      });

      expect(isMobileViewport()).toBe(false);
    });

    it('should return false for viewport width exactly at breakpoint', () => {
      // Mock window at breakpoint
      Object.defineProperty(globalThis, 'window', {
        value: { innerWidth: MOBILE_BREAKPOINT },
        writable: true,
        configurable: true,
      });

      expect(isMobileViewport()).toBe(false);
    });
  });

  describe('Constants', () => {
    it('should have MIN_TOUCH_TARGET_SIZE of 44', () => {
      expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
    });

    it('should have MOBILE_BREAKPOINT of 768', () => {
      expect(MOBILE_BREAKPOINT).toBe(768);
    });
  });
});
