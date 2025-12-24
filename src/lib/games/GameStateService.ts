import { createClient } from 'redis';
import { GameState } from './types/game';

export class GameStateService {
  private client;
  private subscriber;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = createClient({ url: redisUrl });
    this.subscriber = this.client.duplicate();
    
    this.client.connect().catch(console.error);
    this.subscriber.connect().catch(console.error);
  }

  async publish(roomId: string, state: GameState) {
    const payload = JSON.stringify(state);
    await this.client.set(`game:state:${roomId}`, payload);
    await this.client.publish(`game:update:${roomId}`, payload);
  }

  async subscribe(roomId: string, callback: (state: GameState) => void) {
    await this.subscriber.subscribe(`game:update:${roomId}`, (message) => {
      callback(JSON.parse(message));
    });
  }

  async getState(roomId: string): Promise<GameState | null> {
    const data = await this.client.get(`game:state:${roomId}`);
    return data ? JSON.parse(data) : null;
  }
}

export const gameStateService = new GameStateService();
