"use client";

import {
  ref,
  onValue,
  set,
  remove,
  Database,
  off,
  onDisconnect,
} from "firebase/database";
import { logger } from "@/lib/logger";

export interface SnakeData {
  userId: string;
  userName: string;
  body: { x: number; y: number }[];
  direction: { x: number; y: number };
  score: number;
  color: string;
  isDead: boolean;
}

export interface SnakeGameState {
  players: { [userId: string]: SnakeData };
  food: { x: number; y: number };
  active: boolean;
  startTime?: number;
}

export class RealtimeSnakeService {
  private db: Database;
  private roomId: string;
  private userId: string;
  private gameRef;
  private myPlayerRef;

  constructor(db: Database, roomId: string, userId: string) {
    this.db = db;
    this.roomId = roomId;
    this.userId = userId;
    this.gameRef = ref(db, `games/${roomId}/snake`);
    this.myPlayerRef = ref(db, `games/${roomId}/snake/players/${userId}`);

    // Cleanup on disconnect
    onDisconnect(this.myPlayerRef).remove();
  }

  subscribe(onUpdate: (state: SnakeGameState) => void) {
    const unsubscribe = onValue(this.gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        onUpdate(data as SnakeGameState);
      }
    });
    return () => off(this.gameRef, "value", unsubscribe);
  }

  updateMySnake(data: Omit<SnakeData, "userId">) {
    set(this.myPlayerRef, { ...data, userId: this.userId });
  }

  updateFood(food: { x: number; y: number }) {
    set(ref(this.db, `games/${this.roomId}/snake/food`), food);
  }

  setGameState(active: boolean, startTime?: number) {
    set(ref(this.db, `games/${this.roomId}/snake/active`), active);
    if (startTime) {
      set(ref(this.db, `games/${this.roomId}/snake/startTime`), startTime);
    }
  }

  async clearGame() {
    try {
      await remove(this.gameRef);
    } catch (error) {
      logger.error("Failed to clear snake game", error as Error);
    }
  }

  destroy() {
    off(this.gameRef);
    remove(this.myPlayerRef);
  }
}
