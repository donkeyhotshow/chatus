"use client";

import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { doc } from 'firebase/firestore';
import { Gamepad, ArrowLeft, Dices, Hand, Swords, Car, Zap, Search, Castle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile, GameType, GameState } from '@/lib/types';
import { useChatService } from '@/hooks/useChatService';
import { useDoc } from '@/hooks/useDoc';
import { useFirebase } from '../firebase/FirebaseProvider';
import { EmptyGames, EmptySearch } from '@/components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

// Skeleton component for game cards
function GameCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 md:gap-3 p-4 md:p-5 rounded-2xl border min-h-[140px] md:min-h-[160px]",
        "bg-white/[0.02] border-white/[0.06]",
        "animate-pulse"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/[0.06]" />
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="h-4 w-24 rounded bg-white/[0.06]" />
        <div className="h-3 w-20 rounded bg-white/[0.04]" />
        <div className="flex items-center gap-2 mt-1">
          <div className="h-5 w-14 rounded-full bg-white/[0.04]" />
          <div className="h-3 w-10 rounded bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

// Lazy load game components
const TicTacToe = lazy(() => import('./TicTacToe').then(m => ({ default: m.TicTacToe })));
const RockPaperScissors = lazy(() => import('./RockPaperScissors').then(m => ({ default: m.RockPaperScissors })));
const ClickWar = lazy(() => import('./ClickWar').then(m => ({ default: m.ClickWar })));
const DiceRoll = lazy(() => import('./DiceRoll').then(m => ({ default: m.DiceRoll })));
const CarRace = lazy(() => import('./CarRace').then(m => ({ default: m.CarRace })));
const SnakeGame = lazy(() => import('./SnakeGame').then(m => ({ default: m.SnakeGame })));
const VibeJet = lazy(() => import('./VibeJet'));
const TowerDefense = lazy(() => import('./TowerDefense').then(m => ({ default: m.TowerDefense })));
const PhysicsWorld = lazy(() => import('./PhysicsWorld'));

type GameDefinition = {
  id: GameType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  difficulty: 'easy' | 'medium' | 'hard';
  players: string;
  isComingSoon?: boolean;
};

const gamesList: GameDefinition[] = [
  { id: 'tic-tac-toe', name: 'Крестики-нолики', description: 'Классическая игра', icon: Gamepad, gradient: 'from-violet-600 to-purple-700', difficulty: 'easy', players: '1-2' },
  { id: 'rock-paper-scissors', name: 'Камень-ножницы-бумага', description: 'Кто победит?', icon: Hand, gradient: 'from-pink-600 to-rose-700', difficulty: 'easy', players: '2' },
  { id: 'dice-roll', name: 'Кости', description: 'Бросьте кости', icon: Dices, gradient: 'from-amber-500 to-orange-600', difficulty: 'easy', players: '1-4' },
  { id: 'click-war', name: 'Кликер', description: 'Кто быстрее?', icon: Swords, gradient: 'from-emerald-500 to-teal-600', difficulty: 'medium', players: '2' },
  { id: 'car-race', name: 'Car Race', description: 'Гонки в реальном времени', icon: Car, gradient: 'from-blue-500 to-cyan-600', difficulty: 'hard', players: '1-2' },
  { id: 'snake', name: 'Змейка', description: 'Классика на двоих', icon: Gamepad, gradient: 'from-emerald-600 to-green-700', difficulty: 'medium', players: '1-2' },
  { id: 'vibe-jet', name: 'Vibe Jet', description: 'Воздушный бой в 3D', icon: Zap, gradient: 'from-violet-500 to-fuchsia-600', difficulty: 'hard', players: '1' },
  { id: 'tower-defense' as any, name: 'Tower Defense', description: 'Защити свою базу', icon: Castle, gradient: 'from-indigo-600 to-blue-700', difficulty: 'hard', players: '1' },
  { id: 'physics-world' as any, name: 'Физика', description: 'Песочница с физикой', icon: RefreshCw, gradient: 'from-emerald-500 to-green-600', difficulty: 'easy', players: '1' },
];

const difficultyConfig = {
  easy: { label: 'Легко', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  medium: { label: 'Средне', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  hard: { label: 'Сложно', color: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' },
};

function GameLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
        <div className="w-10 h-10 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
        <span className="text-sm text-white/50 font-medium">Загрузка...</span>
      </div>
    </div>
  );
}

export function GameLobby({ roomId, user, otherUser }: GameLobbyProps) {
  const [activeGameId, setActiveGameId] = useState<GameType | null>(null);
  const [loadingGameId, setLoadingGameId] = useState<GameType | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const firebase = useFirebase();
  const db = firebase?.db;
  const { service } = useChatService(roomId, user);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const gameDocRef = useMemo(() => {
    if (!activeGameId || !db) return null;
    return doc(db, 'rooms', roomId, 'games', activeGameId);
  }, [db, roomId, activeGameId]);

  const { data: gameState } = useDoc<GameState>(gameDocRef);

  const handleUpdateGameState = useCallback((newState: Partial<GameState>) => {
    if (activeGameId && service) service.updateGameState(activeGameId, newState);
  }, [activeGameId, service]);

  const handleStartGame = async (gameId: GameType) => {
    if (!service) return;
    setLoadingGameId(gameId);
    const hostId = user.id;
    const AI_PLAYER_ID = '__AI__';

    const initialStates: { [key in GameType]?: Partial<GameState> } = {
      'tic-tac-toe': { board: Array(9).fill(null), currentPlayer: hostId, winner: null, hostId, ...(otherUser ? {} : { aiPlayerId: AI_PLAYER_ID }) },
      'rock-paper-scissors': { moves: {}, result: null, hostId },
      'click-war': { scores: {}, active: false, startTime: null, hostId },
      'dice-roll': { diceRoll: {}, hostId },
      'car-race': { carRacePlayers: {}, hostId },
      'snake': { snakeActive: false, hostId },
      'vibe-jet': { vibeJetPlayers: {}, hostId },
      'tower-defense' as any: { tdTowers: [], tdEnemies: [], tdWave: 0, tdBaseHealth: 20, tdResources: 100, tdStatus: 'waiting', hostId },
      'physics-world' as any: { hostId },
    };

    const initialState: Partial<GameState> = { type: gameId, ...initialStates[gameId] };
    setActiveGameId(gameId);
    await service.updateGameState(gameId, initialState);
    setLoadingGameId(null);
  };

  const handleEndGame = async () => {
    if (activeGameId && service) {
      const id = activeGameId;
      setActiveGameId(null);
      await service.deleteGame(id);
    }
  };

  const filteredGames = useMemo(() => {
    return gamesList.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || game.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [searchQuery, filterDifficulty]);

  if (activeGameId) {
    const commonProps = { onGameEnd: handleEndGame, updateGameState: handleUpdateGameState, user, otherUser, roomId };
    return (
      <div className="flex flex-col h-full bg-black">
        <div className="flex-1 overflow-hidden">
          {gameState && gameState.type === activeGameId ? (
            <Suspense fallback={<GameLoading />}>
              {activeGameId === 'tic-tac-toe' && <TicTacToe {...commonProps} gameState={gameState} />}
              {activeGameId === 'rock-paper-scissors' && <RockPaperScissors {...commonProps} gameState={gameState} />}
              {activeGameId === 'click-war' && <ClickWar {...commonProps} gameState={gameState} />}
              {activeGameId === 'dice-roll' && <DiceRoll {...commonProps} gameState={gameState} />}
              {activeGameId === 'car-race' && <CarRace {...commonProps} gameState={gameState} />}
              {activeGameId === 'snake' && <SnakeGame {...commonProps} gameState={gameState} />}
              {activeGameId === 'vibe-jet' && <VibeJet {...commonProps} />}
              {activeGameId === 'tower-defense' && <TowerDefense {...commonProps} gameState={gameState} />}
              {activeGameId === 'physics-world' && <PhysicsWorld {...commonProps} />}
            </Suspense>
          ) : (
            <GameLoading />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      <div className="p-6 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-700 shadow-lg shadow-purple-500/20">
              <Gamepad className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Игровой зал</h2>
              <p className="text-sm text-white/40">Выберите развлечение на сегодня</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск игр..."
                className="w-full pl-10 pr-4 h-11 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/[0.05] outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff)}
                  className={cn(
                    "px-4 h-11 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap",
                    filterDifficulty === diff 
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-lg shadow-violet-500/10" 
                      : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                  )}
                >
                  {diff === 'all' ? 'Все' : difficultyConfig[diff].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {isInitialLoading ? (
            [...Array(6)].map((_, i) => <GameCardSkeleton key={i} index={i} />)
          ) : filteredGames.length > 0 ? (
            filteredGames.map((game, i) => {
              const isLoading = loadingGameId === game.id;
              const Icon = game.icon;
              return (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleStartGame(game.id)}
                  disabled={isLoading}
                  className={cn(
                    "group relative flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all duration-500 min-h-[180px]",
                    "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-2xl hover:-translate-y-1",
                    isLoading && "opacity-50 pointer-events-none"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                    game.gradient
                  )}>
                    {isLoading ? (
                      <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white tracking-tight">{game.name}</p>
                    <p className="text-xs text-white/40 mt-1 line-clamp-1">{game.description}</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider", difficultyConfig[game.difficulty].color)}>
                        {difficultyConfig[game.difficulty].label}
                      </span>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{game.players} ИГРОКА</span>
                    </div>
                  </div>
                </motion.button>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center opacity-40">
              <Search className="w-12 h-12 mb-4" />
              <p>Игры не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
