
"use client";

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Gamepad, ArrowLeft, Swords, Dices, Hand, Puzzle, Box, Castle } from 'lucide-react';
import { GameCard } from './GameCard';
import { UserProfile, GameType, GameState, TDGrid, TDNode } from '@/lib/types';

// Lazy load game components
const TicTacToe = lazy(() => import('./TicTacToe').then(m => ({ default: m.TicTacToe })));
const RockPaperScissors = lazy(() => import('./RockPaperScissors').then(m => ({ default: m.RockPaperScissors })));
const ClickWar = lazy(() => import('./ClickWar').then(m => ({ default: m.ClickWar })));
const DiceRoll = lazy(() => import('./DiceRoll').then(m => ({ default: m.DiceRoll })));
const PhysicsWorld = lazy(() => import('./PhysicsWorld'));
const TowerDefense = lazy(() => import('./TowerDefense').then(m => ({ default: m.TowerDefense })));
import { Button } from '@/components/ui/button';
import { useChatService } from '@/hooks/useChatService';
import { generateMaze } from '@/lib/maze-generator';
import { useDoc } from '@/hooks/useDoc';
import { doc } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';

type GameDefinition = {
  id: GameType;
  name: string;
  description: string;
  icon: React.ElementType;
};

const gamesList: GameDefinition[] = [
  { id: 'tower-defense', name: 'Tower Defense', description: 'Defend the base together.', icon: Castle },
  { id: 'physics-sandbox', name: 'Physics Sandbox', description: 'Build, destroy, interact.', icon: Box },
  { id: 'maze', name: 'Collaborative Maze', description: 'Find the exit together.', icon: Puzzle },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Classic brain-teaser.', icon: Gamepad },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', description: 'A game of chance.', icon: Hand },
  { id: 'click-war', name: 'Click War', description: 'Out-click your opponent.', icon: Swords },
  { id: 'dice-roll', name: 'Dice Roll', description: 'Simple dice roller.', icon: Dices },
];

type GameLobbyProps = {
  roomId: string;
  user: UserProfile;
  otherUser?: UserProfile;
};

const generateTDGrid = (width: number, height: number): { grid: TDGrid; pathsFlat: { [pathId: string]: { x: number; y: number }[] } } => {
  const grid: TDNode[] = [];
  const paths: { x: number; y: number }[][] = [];

  // Генерируем несколько параллельных дорожек
  const numPaths = 3; // 3 дорожки
  const pathSpacing = Math.floor(height / (numPaths + 1));

  let idCounter = 0;
  const allPathCoords = new Set<string>();

  // Создаем несколько дорожек
  for (let pathIdx = 0; pathIdx < numPaths; pathIdx++) {
    const pathY = pathSpacing * (pathIdx + 1);
    const path: { x: number; y: number }[] = [];

    // Генерируем путь: слева направо, затем вниз, затем справа налево
    for (let x = 0; x < width; x++) {
      path.push({ x, y: pathY });
      allPathCoords.add(`${x},${pathY}`);
    }

    // Добавляем вертикальный участок вниз (кроме последней дорожки)
    if (pathIdx < numPaths - 1) {
      for (let y = pathY + 1; y < pathSpacing * (pathIdx + 2); y++) {
        path.push({ x: width - 1, y });
        allPathCoords.add(`${width - 1},${y}`);
      }
    }

    paths.push(path);
  }

  // Создаем узлы сетки из всех дорожек
  const pathNodes = new Map<string, TDNode>();

  paths.forEach((path, pathIdx) => {
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const key = `${p.x},${p.y}`;

      if (!pathNodes.has(key)) {
        const isStart = i === 0 && pathIdx === 0;
        const isEnd = i === path.length - 1 && pathIdx === paths.length - 1;
        const nextP = i < path.length - 1 ? path[i + 1] : null;
        const nextId = nextP ? `p${idCounter + 1}` : undefined;

        pathNodes.set(key, {
          id: `p${idCounter++}`,
          x: p.x,
          y: p.y,
          isPath: true,
          isStart,
          isEnd,
          nextId,
        });
      }
    }
  });

  // Добавляем все узлы дорожек в сетку
  pathNodes.forEach(node => grid.push(node));

  // Заполняем не-дорожные узлы
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!allPathCoords.has(`${x},${y}`)) {
        grid.push({ id: `b${x}_${y}`, x, y, isPath: false });
      }
    }
  }

  // Конвертируем пути в координаты пикселей для врагов
  // Flatten to avoid nested arrays - use map with string keys
  const pathsFlat: { [pathId: string]: { x: number; y: number }[] } = {};
  paths.forEach((path, idx) => {
    pathsFlat[`path${idx}`] = path.map(p => ({
      x: p.x * 40 + 20, // CELL_SIZE / 2
      y: p.y * 40 + 20
    }));
  });

  return { grid, pathsFlat };
};


export function GameLobby({ roomId, user, otherUser }: GameLobbyProps) {
  const [activeGameId, setActiveGameId] = useState<GameType | null>(null);
  const [loadingGameId, setLoadingGameId] = useState<GameType | null>(null);

  const { db } = useFirebase()!;
  const { service } = useChatService(roomId, user);

  const gameDocRef = useMemo(() => {
    if (!activeGameId || !db) return null;
    return doc(db, 'rooms', roomId, 'games', activeGameId);
  }, [db, roomId, activeGameId]);

  const { data: gameState } = useDoc<GameState>(gameDocRef);

  const handleUpdateGameState = useCallback((newState: Partial<GameState>) => {
    if (activeGameId && service) {
      service.updateGameState(activeGameId, newState);
    }
  }, [activeGameId, service]);

  const handleStartGame = async (gameId: GameType) => {
    if (!service) return;

    setLoadingGameId(gameId);
    const hostId = user.id;

    const initialStates: { [key in GameType]?: Partial<GameState> } = {
      'tic-tac-toe': { board: Array(9).fill(null), currentPlayer: hostId, winner: null, hostId },
      'rock-paper-scissors': { moves: {}, result: null, hostId },
      'click-war': { scores: {}, active: false, startTime: null, hostId },
      'dice-roll': { diceRoll: {}, hostId },
      'tower-defense': {
        tdTowers: [],
        tdEnemies: [],
        tdWave: 0,
        tdBaseHealth: 20,
        tdResources: 100,
        tdStatus: 'waiting' as const,
        tdScores: {},
        tdSelectedTower: null,
        hostId,
      },
    };

    let initialState: Partial<GameState> = { type: gameId, ...initialStates[gameId] };

    if (gameId === 'maze') {
      const maze = generateMaze(21, 15); // Width, Height
      initialState = { ...initialState, maze: JSON.stringify(maze), hostId };
      service.sendSystemMessage(`${user.name} started a Collaborative Maze!`);
    } else if (gameId === 'physics-sandbox') {
      service.sendSystemMessage(`${user.name} opened the Physics Sandbox.`);
      initialState = { hostId };
    }

    setActiveGameId(gameId);
    await service.updateGameState(gameId, initialState);
    setLoadingGameId(null);
  };

  const handleEndGame = async () => {
    if (activeGameId && service) {
      if (activeGameId === 'maze') {
        service.sendSystemMessage(`The maze has been cleared.`);
      }
      const gameIdToEnd = activeGameId;
      setActiveGameId(null);
      await service.deleteGame(gameIdToEnd);
    }
  };

  if (activeGameId) {
    if (activeGameId === 'maze' && gameState?.type === 'maze') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
          <h3 className="text-lg font-bold text-white">Maze Active</h3>
          <p className="text-sm text-neutral-400 mb-4">Go to the &apos;Canvas&apos; tab to solve it together.</p>
          <Button onClick={handleEndGame} variant="destructive">
            End Maze
          </Button>
        </div>
      )
    }

    const commonProps = {
      onGameEnd: handleEndGame,
      updateGameState: handleUpdateGameState,
      user,
      otherUser,
      roomId
    };

    if (gameState && gameState.type === activeGameId) {
      const GameLoadingFallback = () => (
        <div className="h-full w-full flex items-center justify-center bg-black">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      );

      const gameComponents: { [key in GameType]?: React.ReactElement } = {
        'tic-tac-toe': <Suspense fallback={<GameLoadingFallback />}><TicTacToe {...commonProps} gameState={gameState} /></Suspense>,
        'rock-paper-scissors': <Suspense fallback={<GameLoadingFallback />}><RockPaperScissors {...commonProps} gameState={gameState} /></Suspense>,
        'click-war': <Suspense fallback={<GameLoadingFallback />}><ClickWar {...commonProps} gameState={gameState} /></Suspense>,
        'dice-roll': <Suspense fallback={<GameLoadingFallback />}><DiceRoll {...commonProps} gameState={gameState} /></Suspense>,
        'physics-sandbox': <Suspense fallback={<GameLoadingFallback />}><PhysicsWorld onGameEnd={handleEndGame} user={user} roomId={roomId} /></Suspense>,
        'tower-defense': <Suspense fallback={<GameLoadingFallback />}><TowerDefense {...commonProps} gameState={gameState} /></Suspense>,
      };
      const CurrentGame = gameComponents[activeGameId];
      if (CurrentGame) return CurrentGame;
    }

    // Fallback if gameState is not ready or doesn't match
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-white/70 tracking-widest">LOADING GAME...</span>
        </div>
        <Button onClick={handleEndGame} variant="ghost" size="sm" className="mt-8 text-neutral-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lobby
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col h-full bg-gradient-to-br from-slate-950/50 to-slate-900/80 backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2 tracking-wide">Game Lobby</h2>
        <div className="h-0.5 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-transparent rounded-full"></div>
      </div>
      <div className="space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
        {gamesList.map((game) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={game.name}
            description={game.description}
            icon={<game.icon className="w-7 h-7" />}
            isLoading={loadingGameId === game.id}
            onClick={() => handleStartGame(game.id)}
          />
        ))}
      </div>
    </div>
  );
}
