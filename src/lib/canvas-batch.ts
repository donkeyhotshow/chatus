'use client';

import { CanvasPath } from './types';

/**
 * Canvas batching utility
 * Batches canvas strokes to reduce Firestore writes
 */

interface PendingStroke {
  pathData: Omit<CanvasPath, 'id' | 'createdAt'>;
  timestamp: number;
}

class CanvasBatcher {
  private pendingStrokes: PendingStroke[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // ms
  private readonly MAX_BATCH_SIZE = 10;

  constructor(
    private onBatch: (strokes: Omit<CanvasPath, 'id' | 'createdAt'>[]) => Promise<void>
  ) {}

  addStroke(pathData: Omit<CanvasPath, 'id' | 'createdAt'>) {
    this.pendingStrokes.push({
      pathData,
      timestamp: Date.now(),
    });

    // If batch is full, send immediately
    if (this.pendingStrokes.length >= this.MAX_BATCH_SIZE) {
      this.flush();
      return;
    }

    // Otherwise, schedule batch send
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flush();
    }, this.BATCH_DELAY);
  }

  async flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.pendingStrokes.length === 0) {
      return;
    }

    const strokes = this.pendingStrokes.map(s => s.pathData);
    this.pendingStrokes = [];

    try {
      // Send all strokes in parallel
      await Promise.all(strokes.map(stroke => this.onBatch([stroke])));
    } catch (error) {
      console.error('Error flushing canvas batch', error);
      // Re-add failed strokes for retry
      this.pendingStrokes.push(...strokes.map(pathData => ({
        pathData,
        timestamp: Date.now(),
      })));
    }
  }

  destroy() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    // Flush remaining strokes
    this.flush();
  }
}

export function createCanvasBatcher(
  onBatch: (strokes: Omit<CanvasPath, 'id' | 'createdAt'>[]) => Promise<void>
): CanvasBatcher {
  return new CanvasBatcher(onBatch);
}

