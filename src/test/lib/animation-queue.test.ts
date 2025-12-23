/**
 * Property-Based Tests for AnimationQueue
 *
 * **Feature: chatus-bug-fixes, Property 7: Animation Timing Guarantee**
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AnimationQueue,
  AnimationTask,
  createAnimationQueue,
  isValidAnimationDuration,
  calculateRemainingTime,
} from '@/lib/animation-queue';

describe('AnimationQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Property 7: Animation Timing Guarantee', () => {
    /**
     * Property: For any dice roll animation, the animation SHALL complete
     * within 2000ms regardless of system load.
     *
     * **Feature: chatus-bug-fixes, Property 7: Animation Timing Guarantee**
     * **Validates: Requirements 7.1**
     */
    it('should complete any animation within maxTimeout (2000ms)', () => {
      fc.assert(
        fc.property(
          // Generate animation durations from 1ms to 5000ms (some exceed limit)
          fc.integer({ min: 1, max: 5000 }),
          (requestedDuration) => {
            const queue = createAnimationQueue({ maxTimeout: 2000 });
            let completed = false;
            let completionTime = 0;
            const startTime = Date.now();

            const task: AnimationTask = {
              id: `test-${requestedDuration}`,
              duration: requestedDuration,
              onComplete: () => {
                completed = true;
                completionTime = Date.now() - startTime;
              },
            };

            queue.enqueue(task);

            // Advance time to maxTimeout
            vi.advanceTimersByTime(2000);

            // Animation should be completed
            expect(completed).toBe(true);

            // Completion time should be at most maxTimeout
            expect(completionTime).toBeLessThanOrEqual(2000);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Multiple consecutive rolls should queue without freezing.
     *
     * **Feature: chatus-bug-fixes, Property 7: Animation Timing Guarantee**
     * **Validates: Requirements 7.2**
     */
    it('should queue multiple animations without blocking', () => {
      fc.assert(
        fc.property(
          // Generate 2-5 animations with varying durations
          fc.array(fc.integer({ min: 100, max: 800 }), { minLength: 2, maxLength: 5 }),
          (durations) => {
            const queue = createAnimationQueue({ maxTimeout: 2000, maxQueueSize: 10 });
            const completedIds: string[] = [];

            durations.forEach((duration, index) => {
              const task: AnimationTask = {
                id: `animation-${index}`,
                duration,
                onComplete: () => {
                  completedIds.push(`animation-${index}`);
                },
              };
              queue.enqueue(task);
            });

            // Advance time enough for all animations
            vi.advanceTimersByTime(durations.length * 2000);

            // All animations should complete
            expect(completedIds.length).toBe(durations.length);
   // Animations should complete in order
            durations.forEach((_, index) => {
              expect(completedIds[index]).toBe(`animation-${index}`);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Animation errors should trigger graceful degradation.
     *
     * **Feature: chatus-bug-fixes, Property 7: Animation Timing Guarantee**
     * **Validates: Requirements 7.3**
     */
    it('should handle animation errors gracefully', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          (duration) => {
            const queue = createAnimationQueue({ maxTimeout: 2000 });
            let errorHandled = false;
            let errorMessage = '';

            const task: AnimationTask = {
              id: 'error-test',
              duration,
              onComplete: () => {
                throw new Error('Animation failed');
              },
              onError: (error) => {
                errorHandled = true;
                errorMessage = error.message;
              },
            };

            queue.enqueue(task);
            vi.advanceTimersByTime(duration);

            // Error should be handled gracefully
            expect(errorHandled).toBe(true);
            expect(errorMessage).toBe('Animation failed');

            // Queue should continue working
            expect(queue.getQueueSize()).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Queue Management', () => {
    it('should cancel animations correctly', () => {
      const queue = createAnimationQueue();
      let completed = false;

      const task: AnimationTask = {
        id: 'cancel-test',
        duration: 1000,
        onComplete: () => {
          completed = true;
        },
      };

      queue.enqueue(task);
      expect(queue.cancel('cancel-test')).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(completed).toBe(false);
    });

    it('should clear all animations', () => {
      const queue = createAnimationQueue();
      const completedIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        queue.enqueue({
          id: `task-${i}`,
          duration: 500,
          onComplete: () => completedIds.push(`task-${i}`),
        });
      }

      queue.clear();
      vi.advanceTimersByTime(5000);

      expect(completedIds.length).toBe(0);
      expect(queue.getQueueSize()).toBe(0);
    });

    it('should respect maxQueueSize limit', () => {
      const queue = createAnimationQueue({ maxQueueSize: 2 });
      let errorCalled = false;

      // Add 2 tasks (should succeed)
      queue.enqueue({ id: 'task-1', duration: 500, onComplete: () => {} });
      queue.enqueue({ id: 'task-2', duration: 500, onComplete: () => {} });

      // Third task should fail
      const result = queue.enqueue({
        id: 'task-3',
        duration: 500,
        onComplete: () => {},
        onError: () => {
          errorCalled = true;
        },
      });

      expect(result).toBe(false);
      expect(errorCalled).toBe(true);
    });

    it('should replace pending animation with same ID', () => {
      const queue = createAnimationQueue();
      let firstCompleted = false;
      let secondCompleted = false;
      let thirdCompleted = false;

      // First animation starts running immediately
      queue.enqueue({
        id: 'first',
        duration: 1000,
        onComplete: () => {
          firstCompleted = true;
        },
      });

      // Second animation is pending (same ID as third)
      queue.enqueue({
        id: 'same-id',
        duration: 500,
        onComplete: () => {
          secondCompleted = true;
        },
      });

      // Third animation replaces second (both pending with same ID)
      queue.enqueue({
        id: 'same-id',
        duration: 300,
        onComplete: () => {
          thirdCompleted = true;
        },
      });

      vi.advanceTimersByTime(3000);

      expect(firstCompleted).toBe(true);
      expect(secondCompleted).toBe(false); // Was replaced
      expect(thirdCompleted).toBe(true);
    });
  });

  describe('Validation Functions', () => {
    it('should validate animation duration correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 2000 }),
          (duration) => {
            expect(isValidAnimationDuration(duration, 2000)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );

      // Invalid durations
      expect(isValidAnimationDuration(0)).toBe(false);
      expect(isValidAnimationDuration(-1)).toBe(false);
      expect(isValidAnimationDuration(2001)).toBe(false);
      expect(isValidAnimationDuration(Infinity)).toBe(false);
      expect(isValidAnimationDuration(NaN)).toBe(false);
    });

    it('should calculate remaining time correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2000 }),
          fc.integer({ min: 1, max: 2000 }),
          (elapsed, maxTimeout) => {
            const startTime = Date.now() - elapsed;
            const remaining = calculateRemainingTime(startTime, maxTimeout);

            expect(remaining).toBeGreaterThanOrEqual(0);
            expect(remaining).toBeLessThanOrEqual(maxTimeout);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid task gracefully', () => {
      const queue = createAnimationQueue();

      // @ts-expect-error Testing null input
      expect(queue.enqueue(null)).toBe(false);

      // @ts-expect-error Testing undefined input
      expect(queue.enqueue(undefined)).toBe(false);

      // Missing onComplete
      // @ts-expect-error Testing invalid task
      expect(queue.enqueue({ id: 'test', duration: 100 })).toBe(false);

      // Missing id
      // @ts-expect-error Testing invalid task
      expect(queue.enqueue({ duration: 100, onComplete: () => {} })).toBe(false);
    });

    it('should return false when cancelling non-existent animation', () => {
      const queue = createAnimationQueue();
      expect(queue.cancel('non-existent')).toBe(false);
    });

    it('should return correct animation status', () => {
      const queue = createAnimationQueue();

      expect(queue.getAnimationStatus('non-existent')).toBeNull();

      queue.enqueue({
        id: 'status-test',
        duration: 1000,
        onComplete: () => {},
      });

      expect(queue.getAnimationStatus('status-test')).toBe('running');

      vi.advanceTimersByTime(1000);

      expect(queue.getAnimationStatus('status-test')).toBeNull();
    });
  });
});
