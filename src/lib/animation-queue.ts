/**
 * AnimationQueue - Manages animation tasks with timeout guarantees
 *
 * Ensures animations complete within specified timeouts and handles
 * graceful degradation when animations fail or take too long.
 *
 * **Feature: chatus-bug-fixes, Property 7: Animation Timing Guarantee**
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */

export interface AnimationTask {
  id: string;
  duration: number;
  onComplete: () => void;
  onError?: (error: Error) => void;
}

export interface AnimationQueueConfig {
  maxTimeout: number; // Maximum time for any animation (default: 2000ms)
  maxQueueSize: number; // Maximum number of queued animations
}

export interface QueuedAnimation {
  task: AnimationTask;
  timeoutId: ReturnType<typeof setTimeout> | null;
  startTime: number;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'error';
}

const DEFAULT_CONFIG: AnimationQueueConfig = {
  maxTimeout: 2000,
  maxQueueSize: 10,
};

export class AnimationQueue {
  private queue: Map<string, QueuedAnimation> = new Map();
  private config: AnimationQueueConfig;
  private isProcessing: boolean = false;

  constructor(config: Partial<AnimationQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Enqueue an animation task with timeout guarantee
   * Animation will complete within maxTimeout (default 2000ms)
   */
  enqueue(task: AnimationTask): boolean {
    // Validate task
    if (!task || !task.id || typeof task.onComplete !== 'function') {
      return false;
    }

    // Check queue size limit
    if (this.queue.size >= this.config.maxQueueSize) {
      // Remove oldest completed/cancelled tasks
      this.cleanupCompletedTasks();

      if (this.queue.size >= this.config.maxQueueSize) {
        const error = new Error('Animation queue is full');
        task.onError?.(error);
        return false;
      }
    }

    // Cancel existing animation with same ID
    if (this.queue.has(task.id)) {
      this.cancel(task.id);
    }

    const queuedAnimation: QueuedAnimation = {
      task,
      timeoutId: null,
      startTime: Date.now(),
      status: 'pending',
    };

    this.queue.set(task.id, queuedAnimation);
    this.processNext();

    return true;
  }

  /**
   * Cancel a specific animation by ID
   */
  cancel(id: string): boolean {
    const animation = this.queue.get(id);
    if (!animation) {
      return false;
    }

    if (animation.timeoutId) {
      clearTimeout(animation.timeoutId);
    }

    animation.status = 'cancelled';
    this.queue.delete(id);

    return true;
  }

  /**
   * Clear all animations from the queue
   */
  clear(): void {
    for (const [id, animation] of this.queue) {
      if (animation.timeoutId) {
        clearTimeout(animation.timeoutId);
      }
    }
    this.queue.clear();
    this.isProcessing = false;
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Check if an animation is currently running
   */
  isAnimationRunning(id: string): boolean {
    const animation = this.queue.get(id);
    return animation?.status === 'running';
  }

  /**
   * Get animation status
   */
  getAnimationStatus(id: string): QueuedAnimation['status'] | null {
    return this.queue.get(id)?.status ?? null;
  }

  private processNext(): void {
    if (this.isProcessing) {
      return;
    }

    // Find next pending animation
    let nextAnimation: QueuedAnimation | null = null;
    let nextId: string | null = null;

    for (const [id, animation] of this.queue) {
      if (animation.status === 'pending') {
        nextAnimation = animation;
        nextId = id;
        break;
      }
    }

    if (!nextAnimation || !nextId) {
      return;
    }

    this.isProcessing = true;
    nextAnimation.status = 'running';
    nextAnimation.startTime = Date.now();

    const { task } = nextAnimation;
    const effectiveDuration = Math.min(task.duration, this.config.maxTimeout);

    // Set up timeout guarantee
    nextAnimation.timeoutId = setTimeout(() => {
      this.completeAnimation(nextId!, nextAnimation!);
    }, effectiveDuration);
  }

  private completeAnimation(id: string, animation: QueuedAnimation): void {
    if (animation.status !== 'running') {
      return;
    }

    const elapsed = Date.now() - animation.startTime;

    try {
      animation.task.onComplete();
      animation.status = 'completed';
    } catch (error) {
      animation.status = 'error';
      const err = error instanceof Error ? error : new Error(String(error));
      animation.task.onError?.(err);
    }

    if (animation.timeoutId) {
      clearTimeout(animation.timeoutId);
      animation.timeoutId = null;
    }

    this.queue.delete(id);
    this.isProcessing = false;

    // Process next animation in queue
    this.processNext();
  }

  private cleanupCompletedTasks(): void {
    for (const [id, animation] of this.queue) {
      if (animation.status === 'completed' || animation.status === 'cancelled' || animation.status === 'error') {
        this.queue.delete(id);
      }
    }
  }
}

/**
 * Calculate remaining time for an animation to complete within timeout
 */
export function calculateRemainingTime(startTime: number, maxTimeout: number): number {
  const elapsed = Date.now() - startTime;
  return Math.max(0, maxTimeout - elapsed);
}

/**
 * Check if animation duration is within acceptable limits
 */
export function isValidAnimationDuration(duration: number, maxTimeout: number = 2000): boolean {
  return typeof duration === 'number' && duration > 0 && duration <= maxTimeout && Number.isFinite(duration);
}

/**
 * Create a default animation queue instance
 */
export function createAnimationQueue(config?: Partial<AnimationQueueConfig>): AnimationQueue {
  return new AnimationQueue(config);
}

// Default export for convenience
export default AnimationQueue;
