
"use client";

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  Gamepad, ArrowLeft, Swords, Dices, Hand, Puzzle,
  Box, Castle, Search, Filter, Star, TrendingUp,
  Clock, Users, Trophy
} from 'lucide-react';
import { GameCard } from './GameCard';
import { UserProfile, GameType, GameState, TDGrid, TDNode } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChatService } from '@/hooks/useChatService';
import { generateMaze } from '@/lib/maze-generator';
import { useDoc } from '@/hooks/useDoc';
import { doc } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load game components
const TicTacToe = lazy(() => import('./TicTacToe').then(m => ({ default: m.TicTacToe })));
const RockPaperScissors = lazy(() => import('./RockPaperScissors').then(m => ({ default: m.RockPaperScissors })));
const ClickWar = lazy(() => import('./ClickWar').then(m => ({ default: m.ClickWar })));
const DiceRoll = lazy(() => import('./DiceRoll').then(m => ({ default: m.DiceRoll })));
const PhysicsWorld = lazy(() => import('./PhysicsWorld'));
const TowerDefense = lazy(() => import('./TowerDefense').then(m => ({ default: m.TowerDefense })));

type GameDefinition = {
  id: GameType;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'Classic' | 'Action' | 'Strategy' | 'Sandbox';
  rating: number;
  players: string;
};

// Упрощенный список игр - только простые и быстрые для двоих
const gamesList: GameDefinition[] = [
  { id: 'tic-tac-toe', name: 'Крестики-нолики', description: 'Классическая игра', icon: Gamepad, category: 'Classic', rating: 4.5, players: '2' },
  { id: 'rock-paper-scissors', name: 'Камень-ножницы-бумага', description: 'Кто победит?', icon: Hand, category: 'Classic', rating: 4.4, players: '2' },
  { id: 'dice-roll', name: 'Кости', description: 'Бросьте кости', icon: Dices, category: 'Classic', rating: 4.2, players: '1-2' },
  { id: 'click-war', name: 'Кликер', description: 'Кто быстрее?', icon: Swords, category: 'Action', rating: 4.6, players: '2' },
];

type GameLobbyProps = {
  roomId: string;
  user: UserProfile;
  otherUser?: UserProfile;
};

export function GameLobby({ roomId, user, otherUser }: GameLobbyProps) {
  const [activeGameId, setActiveGameId] = useState<GameType | null>(null);
  const [loadingGameId, setLoadingGameId] = useState<GameType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

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
      const maze = generateMaze(21, 15);
      initialState = { ...initialState, maze: JSON.stringify(maze), hostId };
      service.sendSystemMessage(`${user.name} начал Collaborative Maze!`);
    } else if (gameId === 'physics-sandbox') {
      service.sendSystemMessage(`${user.name} открыл Physics Sandbox.`);
      initialState = { hostId };
    }

    setActiveGameId(gameId);
    await service.updateGameState(gameId, initialState);
    setLoadingGameId(null);
  };

  const handleEndGame = async () => {
    if (activeGameId && service) {
      const gameIdToEnd = activeGameId;
      setActiveGameId(null);
      await service.deleteGame(gameIdToEnd);
    }
  };

  const categories = ['All', 'Classic', 'Action', 'Strategy', 'Sandbox'];

  const filteredGames = useMemo(() => {
    return gamesList.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  if (activeGameId) {
    if (activeGameId === 'maze' && gameState?.type === 'maze') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/20"
          >
            <Puzzle className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-3xl font-black text-white mb-3 tracking-tight">ЛАБИРИНТ АКТИВЕН</h3>
          <p className="text-neutral-400 mb-10 max-w-xs leading-relaxed">Перейдите во вкладку &apos;Холст&apos;, чтобы решать лабиринт вместе.</p>
          <Button onClick={handleEndGame} variant="destructive" className="rounded-2xl px-10 h-14 text-lg font-bold hover:scale-105 transition-transform">
            Завершить сессию
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

    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-4 left-4 z-50">
          <Button
            onClick={handleEndGame}
            variant="ghost"
            size="sm"
            className="bg-black/40 hover:bg-white/10 text-white/70 hover:text-white backdrop-blur-xl border border-white/10 rounded-2xl px-5 h-10 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад в лобби
          </Button>
        </div>

        <div className="flex-1 h-full">
          {gameState && gameState.type === activeGameId ? (
            (() => {
              const GameLoadingFallback = () => (
                <div className="h-full w-full flex items-center justify-center bg-black/50 backdrop-blur-xl">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-white/5 border-t-cyan-500 rounded-full animate-spin"></div>
                    <span className="text-sm font-black text-cyan-400 tracking-[0.3em] uppercase">Загрузка игры...</span>
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
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-white/5 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="font-black text-cyan-500/70 tracking-[0.3em] text-sm uppercase">Инициализация...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Lobby Header */}
      <div className="p-8 pb-4 shrink-0 space-y-6">
        <div className="flex flex-col gap-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
            <span className="hover:text-neutral-400 cursor-pointer transition-colors" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>Lobby</span>
            <span>/</span>
            <span className="text-cyan-500/80">{activeCategory}</span>
            {searchQuery && (
              <>
                <span>/</span>
                <span className="text-white/60">Search: {searchQuery}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                ИГРОВОЙ ХАБ <TrendingUp className="text-cyan-400 w-6 h-6" />
              </h2>
              <p className="text-sm text-neutral-500 font-medium">Выберите игру, чтобы бросить вызов другу.</p>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold text-white">Top Rated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-cyan-400 transition-colors" />
            <Input
              placeholder="Поиск игр..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 bg-white/5 border-white/5 rounded-2xl focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 h-12 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="flex-1 overflow-y-auto p-8 pt-2 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {filteredGames.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-24"
            >
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.name}
                  description={game.description}
                  icon={<game.icon className="w-8 h-8" />}
                  category={game.category}
                  rating={game.rating}
                  players={game.players}
                  isLoading={loadingGameId === game.id}
                  onClick={() => handleStartGame(game.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-64 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                <Search className="w-8 h-8 text-neutral-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-white">Ничего не найдено</h4>
                <p className="text-neutral-500">Попробуйте изменить параметры поиска или фильтры.</p>
              </div>
              <Button variant="ghost" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
                Сбросить фильтры
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
