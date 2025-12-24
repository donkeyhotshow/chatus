export type GameId = 'snake' | 'tetris' | 'chess' | 'tictactoe';

export interface PlayerState {
  id: string;
  name: string;
  ready: boolean;
  score: number;
  position?: { x: number; y: number };
}

export interface GameSession {
  sessionId: string;
  gameId: GameId;
  roomId: string;
  iframeSrc: string;
  gameStateId: string;
  wsEndpoint: string;
  players: PlayerState[];
}

export interface GameState<T = any> {
  roomId: string;
  players: PlayerState[];
  gameData: T;
  lastUpdate: number;
}
