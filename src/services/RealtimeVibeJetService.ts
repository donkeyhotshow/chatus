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

export interface VibeJetPlayerData {
  userId: string;
  userName: string;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  health: number;
  score: number;
  isDead: boolean;
}

export interface VibeJetGameState {
  players: { [userId: string]: VibeJetPlayerData };
  active: boolean;
  startTime?: number;
}

export class RealtimeVibeJetService {
  private db: Database;
  private roomId: string;
  private userId: string;
  private gameRef;
  private myPlayerRef;

  constructor(db: Database, roomId: string, userId: string) {
    this.db = db;
    this.roomId = roomId;
    this.userId = userId;
    this.gameRef = ref(db, `games/${roomId}/vibejet`);
    this.myPlayerRef = ref(db, `games/${roomId}/vibejet/players/${userId}`);

    // Cleanup on disconnect
    onDisconnect(this.myPlayerRef).remove();
  }

  subscribe(onUpdate: (state: VibeJetGameState) => void) {
    const unsubscribe = onValue(this.gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        onUpdate(data as VibeJetGameState);
      }
    });
    return () => off(this.gameRef, "value", unsubscribe);
  }

  updateMyPlayer(data: Omit<VibeJetPlayerData, "userId">) {
    set(this.myPlayerRef, { ...data, userId: this.userId });
  }

  setGameState(active: boolean, startTime?: number) {
    set(ref(this.db, `games/${this.roomId}/vibejet/active`), active);
    if (startTime) {
      set(ref(this.db, `games/${this.roomId}/vibejet/startTime`), startTime);
    }
  }

  async clearGame() {
    try {
      await remove(this.gameRef);
    } catch (error) {
      logger.error("Failed to clear vibejet game", error as Error);
    }
  }

  destroy() {
    off(this.gameRef);
    remove(this.myPlayerRef).catch(err => logger.error("Failed to remove player on destroy", err));
  }
}
