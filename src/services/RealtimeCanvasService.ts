"use client";

import {
  ref,
  push,
  onChildAdded,
  onChildRemoved,
  set,
  remove,
  onValue,
  off,
  serverTimestamp,
  Database,
} from "firebase/database";
import { logger } from "@/lib/logger";

/**
 * Canvas stroke data structure
 */
export interface CanvasStroke {
  id?: string;
  points: number[]; // Flat array [x1,, ...]
  color: string;
  width: number;
  tool: "pen" | "eraser";
  brush?: "normal" | "neon" | "dashed" | "calligraphy";
  userId: string;
  userName?: string;
  timestamp?: number;
}

/**
 * Remote cursor data structure
 */
export interface RemoteCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
}

/**
 * Callback types
 */
type StrokeCallback = (stroke: CanvasStroke) => void;
type StrokeRemovedCallback = (strokeId: string) => void;
type CursorCallback = (cursors: Map<string, RemoteCursor>) => void;

/**
 * RealtimeCanvasService - Optimized canvas sync using Firebase Realtime Database
 *
 * BUG-004 FIX: Uses Realtime Database instead of Firestore for < 100ms latency
 * IMP-002: Implements remote cursor tracking
 *
 * Features:
 * - Real-time stroke synchronization (< 100ms latency)
 * - Remote cursor tracking
 * - Stroke batching for performance
 * - Automatic cleanup on disconnect
 */
export class RealtimeCanvasService {
  private db: Database;
  private roomId: string;
  private canvasId: string;
  private userId: string;
  private userName: string;

  // Refs
  private strokesRef;
  private cursorsRef;
  private myCursorRef;

  // Listeners
  private strokeAddedUnsubscribe: (() => void) | null = null;
  private strokeRemovedUnsubscribe: (() => void) | null = null;
  private cursorsUnsubscribe: (() => void) | null = null;

  // Callbacks
  private onStrokeAdded: StrokeCallback | null = null;
  private onStrokeRemoved: StrokeRemovedCallback | null = null;
  private onCursorsUpdate: CursorCallback | null = null;

  // Batching
  private strokeBuffer: Omit<CanvasStroke, "id">[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 16; // ~60fps
  private readonly MAX_BATCH_SIZE = 5;

  // Cursor throttling
  private lastCursorUpdate = 0;
  private readonly CURSOR_THROTTLE = 50; // 20fps for cursors

  constructor(
    db: Database,
    roomId: string,
    canvasId: string,
    userId: string,
    userName: string
  ) {
    this.db = db;
    this.roomId = roomId;
    this.canvasId = canvasId;
    this.userId = userId;
    this.userName = userName;

    // Initialize refs
    this.strokesRef = ref(db, `canvas/${roomId}/${canvasId}/strokes`);
    this.cursorsRef = ref(db, `canvas/${roomId}/${canvasId}/cursors`);
    this.myCursorRef = ref(
      db,
      `canvas/${roomId}/${canvasId}/cursors/${userId}`
    );

    logger.info("RealtimeCanvasService initialized", {
      roomId,
      canvasId,
      userId,
    });
  }

  /**
   * Subscribe to stroke updates
   */
  subscribeToStrokes(
    onAdded: StrokeCallback,
    onRemoved?: StrokeRemovedCallback
  ): void {
    this.onStrokeAdded = onAdded;
    this.onStrokeRemoved = onRemoved || null;

    // Listen for new strokes (onChildAdded is much faster than onValue)
    const unsubAdded = onChildAdded(this.strokesRef, (snapshot) => {
      const stroke = snapshot.val() as CanvasStroke;
      if (stroke && snapshot.key) {
        // Skip own strokes (already rendered locally)
        if (stroke.userId === this.userId) return;

        this.onStrokeAdded?.({
          ...stroke,
          id: snapshot.key,
        });
      }
    });

    // Listen for removed strokes
    const unsubRemoved = onChildRemoved(this.strokesRef, (snapshot) => {
      if (snapshot.key) {
        this.onStrokeRemoved?.(snapshot.key);
      }
    });

    this.strokeAddedUnsubscribe = () => off(this.strokesRef, "child_added");
    this.strokeRemovedUnsubscribe = () => off(this.strokesRef, "child_removed");

    logger.info("Subscribed to canvas strokes");
  }

  /**
   * Subscribe to remote cursors
   */
  subscribeToCursors(onUpdate: CursorCallback): void {
    this.onCursorsUpdate = onUpdate;

    const unsubscribe = onValue(this.cursorsRef, (snapshot) => {
      const cursors = new Map<string, RemoteCursor>();
      const data = snapshot.val();

      if (data) {
        Object.entries(data).forEach(([oderId, cursor]) => {
          // Skip own cursor
          if (oderId === this.userId) return;

          const cursorData = cursor as RemoteCursor;
          // Only show cursors updated in last 5 seconds
          if (Date.now() - cursorData.lastUpdate < 5000) {
            cursors.set(oderId, cursorData);
          }
        });
      }

      this.onCursorsUpdate?.(cursors);
    });

    this.cursorsUnsubscribe = () => off(this.cursorsRef, "value");

    logger.info("Subscribed to remote cursors");
  }

  /**
   * Add a stroke (with batching for performance)
   */
  addStroke(stroke: Omit<CanvasStroke, "id" | "userId" | "timestamp">): void {
    const fullStroke: Omit<CanvasStroke, "id"> = {
      ...stroke,
      userId: this.userId,
      userName: this.userName,
      timestamp: Date.now(),
    };

    this.strokeBuffer.push(fullStroke);

    // Flush immediately if batch is full
    if (this.strokeBuffer.length >= this.MAX_BATCH_SIZE) {
      this.flushStrokes();
      return;
    }

    // Schedule batch flush
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushStrokes();
      }, this.BATCH_DELAY);
    }
  }

  /**
   * Flush stroke buffer to database
   */
  private async flushStrokes(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.strokeBuffer.length === 0) return;

    const strokes = [...this.strokeBuffer];
    this.strokeBuffer = [];

    try {
      // Send all strokes in parallel
      await Promise.all(
        strokes.map((stroke) => push(this.strokesRef, stroke))
      );
    } catch (error) {
      logger.error("Failed to save strokes", error as Error, {
        count: strokes.length,
      });
      // Re-add failed strokes for retry
      this.strokeBuffer.unshift(...strokes);
    }
  }

  /**
   * Update cursor position (throttled)
   */
  updateCursor(x: number, y: number, color: string): void {
    const now = Date.now();
    if (now - this.lastCursorUpdate < this.CURSOR_THROTTLE) return;

    this.lastCursorUpdate = now;

    const cursor: RemoteCursor = {
      userId: this.userId,
      userName: this.userName,
      x,
      y,
      color,
      lastUpdate: now,
    };

    set(this.myCursorRef, cursor).catch((error) => {
      logger.warn("Failed to update cursor", { error });
    });
  }

  /**
   * Clear all strokes on canvas
   */
  async clearCanvas(): Promise<void> {
    try {
      await remove(this.strokesRef);
      logger.info("Canvas cleared");
    } catch (error) {
      logger.error("Failed to clear canvas", error as Error);
      throw error;
    }
  }

  /**
   * Remove own cursor on disconnect
   */
  private removeCursor(): void {
    remove(this.myCursorRef).catch(() => {
      // Ignore errors on cleanup
    });
  }

  /**
   * Cleanup and unsubscribe
   */
  destroy(): void {
    // Flush remaining strokes
    this.flushStrokes();

    // Clear timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Unsubscribe from listeners
    this.strokeAddedUnsubscribe?.();
    this.strokeRemovedUnsubscribe?.();
    this.cursorsUnsubscribe?.();

    // Remove cursor
    this.removeCursor();

    // Clear callbacks
    this.onStrokeAdded = null;
    this.onStrokeRemoved = null;
    this.onCursorsUpdate = null;

    logger.info("RealtimeCanvasService destroyed");
  }
}

/**
 * Factory function to create RealtimeCanvasService
 */
export function createRealtimeCanvasService(
  db: Database,
  roomId: string,
  canvasId: string,
  userId: string,
  userName: string
): RealtimeCanvasService {
  return new RealtimeCanvasService(db, roomId, canvasId, userId, userName);
}
