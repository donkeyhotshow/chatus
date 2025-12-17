
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

  // Active Game View with Premium Header
  if (activeGameId) {
    if (activeGameId === 'maze' && gameState?.type === 'maze') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-black/40 backdrop-blur-md">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 animate-pulse">
            <Puzzle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Maze Active</h3>
          <p className="text-neutral-400 mb-8 max-w-xs leading-relaxed">Go to the &apos;Canvas&apos; tab to solve the maze together with your team.</p>
          <Button onClick={handleEndGame} variant="destructive" className="rounded-full px-8 hover:scale-105 transition-transform">
            End Maze Session
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

    // Game Container with consistent header
    return (
      <div className="flex flex-col h-full relative">
        {/* Minimalist Game Header */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            onClick={handleEndGame}
            variant="ghost"
            size="sm"
            className="bg-black/20 hover:bg-white/10 text-white/70 hover:text-white backdrop-blur-md border border-white/5 rounded-full px-4 transition-all hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
        </div>

        <div className="flex-1 h-full">
          {gameState && gameState.type === activeGameId ? (
            (() => {
              const GameLoadingFallback = () => (
                <div className="h-full w-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin"></div>
                    <span className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase">Loading Game...</span>
                  </div>
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
              return gameComponents[activeGameId] || null;
            })()
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/10 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="font-mono text-cyan-500/70 tracking-widest text-sm">INITIALIZING...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lobby View
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Game Lobby</h2>
          <div className="px-2 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            {gamesList.length} Games Available
          </div>
        </div>
        <p className="text-sm text-neutral-400">Select a game to play with your team.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-hide">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
          {gamesList.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              title={game.name}
              description={game.description}
              icon={<game.icon className="w-6 h-6" />}
              isLoading={loadingGameId === game.id}
              onClick={() => handleStartGame(game.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
