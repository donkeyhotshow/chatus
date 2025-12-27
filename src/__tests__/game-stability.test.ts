/**
 * Game Tests
 * Tests for game-stability utilities
 */

import {
  sanitizeNumber,
  clamp,
  safeDivide,
  createFrameLimiter,
  createClickLimiter,
  createDebouncedAction,
  createLimitedArray,
  checkRectCollision,
  checkCircleCollision,
} from '@/lib/game-stability';

describe('Game Stability Utilities', () => {
  describe('sanitizeNumber', () => {
    it('should return default for NaN', () => {
      expect(sanitizeNumber(NaN, 0)).toBe(0);
      expect(sanitizeNumber(NaN, 5)).toBe(5);
    });

    it('should return default for Infinity', () => {
      expect(sanitizeNumber(Infinity, 0)).toBe(0);
      expect(sanitizeNumber(-Infinity, 10)).toBe(10);
    });

    it('should clamp values within range', () => {
      expect(sanitizeNumber(50, 0, 0, 100)).toBe(50);
      expect(sanitizeNumber(150, 0, 0, 100)).toBe(100);
      expect(sanitizeNumber(-50, 0, 0, 100)).toBe(0);
    });

    it('should return valid numbers unchanged', () => {
      expect(sanitizeNumber(42, 0)).toBe(42);
      expect(sanitizeNumber(-10, 0)).toBe(-10);
      expect(sanitizeNumber(0, 5)).toBe(0);
    });
  });

  describe('clamp', () => {
    it('should clamp values correctly', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('safeDivide', () => {
    it('should return default for division by zero', () => {
      expect(safeDivide(10, 0, 0)).toBe(0);
      expect(safeDivide(10, 0, -1)).toBe(-1);
    });

    it('should perform normal division', () => {
      expect(safeDivide(10, 2, 0)).toBe(5);
      expect(safeDivide(9, 3, 0)).toBe(3);
    });
  });

  describe('createFrameLimiter', () => {
    it('should limit frame rate', () => {
      const limiter = createFrameLimiter(60);
      const frameTime = 1000 / 60; // ~16.67ms

      // First frame should always pass (0 - 0 >= frameTime is false, but first call sets lastFrameTime)
      expect(limiter.shouldUpdate(0)).toBe(false); // 0 - 0 = 0 < frameTime

      // Frame after enough time should pass
      expect(limiter.shouldUpdate(frameTime + 1)).toBe(true);

      // Frame within limit should not pass
      expect(limiter.shouldUpdate(frameTime + 5)).toBe(false);

      // Frame after another interval should pass
      expect(limiter.shouldUpdate(frameTime * 2 + 2)).toBe(true);
    });

    it('should reset correctly', () => {
      const limiter = createFrameLimiter(60);
      limiter.shouldUpdate(100);
      limiter.reset();
      expect(limiter.getLastFrameTime()).toBe(0);
    });
  });

  describe('createClickLimiter', () => {
    it('should allow clicks within limit', () => {
      const limiter = createClickLimiter(5);

      for (let i = 0; i < 5; i++) {
        expect(limiter.canClick()).toBe(true);
        limiter.recordClick();
      }
    });

    it('should block clicks over limit', () => {
      const limiter = createClickLimiter(3);

      for (let i = 0; i < 3; i++) {
        limiter.recordClick();
      }

      expect(limiter.canClick()).toBe(false);
    });

    it('should reset correctly', () => {
      const limiter = createClickLimiter(2);
      limiter.recordClick();
      limiter.recordClick();
      limiter.reset();
      expect(limiter.canClick()).toBe(true);
    });
  });

  describe('createDebouncedAction', () => {
    it('should debounce actions', () => {
      const debouncer = createDebouncedAction(100);

      // First call should pass and update lastActionTime
      expect(debouncer.canAct()).toBe(true);
      // Second immediate call should fail
      expect(debouncer.canAct()).toBe(false);
    });
  });

  describe('createLimitedArray', () => {
    it('should limit array size', () => {
      const arr = createLimitedArray<number>(3);

      arr.push(1);
      arr.push(2);
      arr.push(3);
      arr.push(4);

      expect(arr.length).toBe(3);
      expect(arr.getItems()).toEqual([2, 3, 4]);
    });

    it('should filter items', () => {
      const arr = createLimitedArray<number>(10);
      arr.push(1);
      arr.push(2);
      arr.push(3);

      arr.filter(n => n > 1);
      expect(arr.getItems()).toEqual([2, 3]);
    });

    it('should clear correctly', () => {
      const arr = createLimitedArray<number>(10);
      arr.push(1);
      arr.push(2);
      arr.clear();
      expect(arr.length).toBe(0);
    });
  });

  describe('checkRectCollision', () => {
    it('should detect collision', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 5, y: 5, width: 10, height: 10 };

      expect(checkRectCollision(rect1, rect2)).toBe(true);
    });

    it('should detect no collision', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 20, y: 20, width: 10, height: 10 };

      expect(checkRectCollision(rect1, rect2)).toBe(false);
    });

    it('should handle null values', () => {
      expect(checkRectCollision(null, null)).toBe(false);
      expect(checkRectCollision({ x: 0, y: 0, width: 10, height: 10 }, null)).toBe(false);
    });
  });

  describe('checkCircleCollision', () => {
    it('should detect collision', () => {
      const circle1 = { x: 0, y: 0, radius: 10 };
      const circle2 = { x: 15, y: 0, radius: 10 };

      expect(checkCircleCollision(circle1, circle2)).toBe(true);
    });

    it('should detect no collision', () => {
      const circle1 = { x: 0, y: 0, radius: 5 };
      const circle2 = { x: 20, y: 0, radius: 5 };

      expect(checkCircleCollision(circle1, circle2)).toBe(false);
    });

    it('should handle null values', () => {
      expect(checkCircleCollision(null, null)).toBe(false);
    });
  });
});
