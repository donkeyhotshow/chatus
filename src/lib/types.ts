
import type { Timestamp } from 'firebase/firestore';

export interface FirebaseError extends Error {
  code?: string;
  message: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
  username: string;
}

export interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  createdAt: Timestamp;
  user: UserProfile;
  senderId: string; // Quick access to sender ID for filtering/indexing
  reactions: Reaction[];
  delivered: boolean; // True when received by the other user
  seen: boolean; // True when read by the other user (only when chat is open)
  disappearAt?: Timestamp;
  type?: 'text' | 'sticker' | 'image' | 'doodle' | 'system';
  replyTo?: { id: string; text: string; senderName: string } | null;
  clientMessageId?: string; // For deduplication
}

export interface Room {
  id: string;
  participants: string[];
  participantProfiles?: UserProfile[];
  createdAt?: Timestamp | Date;
  lastUpdated?: Timestamp | Date;
  settings?: {
    maxParticipants?: number;
    isPrivate?: boolean;
    [key: string]: unknown;
  };
  creatorId?: string;
  isActive?: boolean;
  name?: string;
}

export interface User {
  id: string;
  uid?: string;
  displayName: string;
  email?: string | null;
  isAnonymous?: boolean;
  isOnline?: boolean;
  lastSeen?: Date;
  avatar: string | null;
}

export type ChatMessage = Message & {
  roomId?: string;
};

export type BrushType = 'normal' | 'neon' | 'dashed' | 'calligraphy';

export interface CanvasPath {
  id: string;
  sheetId: string;
  user: UserProfile;
  points: number[];
  color: string;
  strokeWidth: number;
  tool: 'pen' | 'eraser';
  brush: BrushType;
  velocities?: number[];
  createdAt: Timestamp | Date; // Can be Date for local, or Timestamp for Firestore
  clientStrokeId?: string; // For deduplication on reconnect
  styleMetadata?: string; // Serialized CanvasStyleMetadata for style preservation
}


export interface CanvasState {
  paths: { [id: string]: Omit<CanvasPath, 'createdAt'> };
  cursors: { [userId: string]: { x: number; y: number } };
}

export type AppType = 'canvas' | 'games';

export type GameType = 'tic-tac-toe' | 'rock-paper-scissors' | 'click-war' | 'dice-roll' | 'maze' | 'physics-sandbox' | 'tower-defense' | 'car-race';

// --- Tower Defense Specific Types ---
export type TDNode = {
  id: string;
  x: number;
  y: number;
  isPath: boolean;
  isStart?: boolean;
  isEnd?: boolean;
  nextId?: string;
};
export type TDGrid = TDNode[];


export interface TDTower {
  id: string;
  x: number;
  y: number;
  type: 'basic' | 'fast' | 'heavy';
  level: number;
  cost: number;
  range: number;
  damage: number;
  fireRate: number; // shots per second
  lastFired: number; // timestamp
  ownerId?: string; // ID игрока, построившего башню
}

export interface TDEnemy {
  id: string;
  type: 'basic' | 'fast' | 'tank';
  health: number;
  maxHealth: number;
  speed: number;
  pathIndex: number;
  position: { x: number; y: number };
  value: number; // resources dropped on defeat
  pathId?: number; // ID дорожки, по которой движется враг
}

export interface GameState {
  type: GameType;
  hostId?: string; // ID of the user who started the game
  // Tic-Tac-Toe
  board?: (string | null)[];
  currentPlayer?: string;
  winner?: string | null;
  // Rock-Paper-Scissors
  moves?: { [userId: string]: 'rock' | 'paper' | 'scissors' };
  result?: string | null;
  // Click War
  scores?: { [userId: string]: number };
  active?: boolean;
  startTime?: number | null; // Timestamp начала игры для синхронизации таймера
  // Dice Roll
  diceRoll?: { [userId: string]: number };
  // Maze
  maze?: string | number[][];
  // Tower Defense
  tdGrid?: TDGrid;
  tdTowers?: TDTower[];
  tdEnemies?: TDEnemy[];
  tdWave?: number;
  tdBaseHealth?: number;
  tdResources?: number;
  tdStatus?: 'waiting' | 'in-progress' | 'game-over-win' | 'game-over-loss';
  tdPathsFlat?: { [pathId: string]: { x: number; y: number }[] }; // Flattened paths to avoid nested arrays
  tdScores?: { [userId: string]: number }; // Очки игроков (leaderboard)
  tdSelectedTower?: string | null; // ID выбранной башни для апгрейда
  // Car Race
  carRacePlayers?: { [oderId: string]: {
    id: string;
    name: string;
    x: number;
    y: number;
    rotation: number;
    color: number;
  }};
}
