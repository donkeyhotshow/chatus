import { GameId, GameSession, PlayerState } from './types/game';
import { v4 as uuidv4 } from 'uuid';

export class GameLauncherService {
  private sessions: Map<string, GameSession> = new Map();

  /**
   * Launches a new game session
   */
  public async launchGame(gameId: GameId, roomId: string, players: string[]): Promise<GameSession> {
    const sessionId = uuidv4();
    
    // In a real microservice architecture, this would call the specific game service
    // to initialize a room and get the endpoint.
    // For now, we simulate the response.
    
    const session: GameSession = {
      sessionId,
      gameId,
      roomId,
      iframeSrc: this.getGameUrl(gameId, sessionId),
      gameStateId: `state-${sessionId}`,
      wsEndpoint: process.env.NEXT_PUBLIC_GAMES_WS_URL || 'wss://games.chatus.io/ws',
      players: players.map(id => ({
        id,
        name: 'Player', // Should be fetched from user service
        ready: false,
        score: 0
      }))
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  private getGameUrl(gameId: GameId, sessionId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_GAMES_BASE_URL || 'http://localhost:3002';
    return `${baseUrl}/room/${sessionId}?game=${gameId}`;
  }

  public getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }
}

export const gameLauncherService = new GameLauncherService();
