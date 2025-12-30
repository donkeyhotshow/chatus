"use client";

import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { doc } from 'firebase/firestore';
import { Gamepad, ArrowLeft, Dices, Hand, Swords, Car, Zap, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile, GameType, GameState } from '@/lib/types';
import { useChatService } from '@/hooks/useChatService';
import { useDoc } from '@/hooks/useDoc';
import { useFirebase } from '../firebase/FirebaseProvider';
import { EmptyGames, EmptySearchResults } from '@/components/ui/EmptyState';

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
      {/* Icon skeleton */}
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/[0.06] skeleton-shimmer" />

      {/* Text skeleton */}
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="h-4 w-24 rounded bg-white/[0.06] skeleton-shimmer" />
        <div className="h-3 w-20 rounded bg-white/[0.04] skeleton-shimmer" />

        {/* Badge skeleton */}
        <div className="flex items-center gap-2 mt-1">
          <div className="h-5 w-14 rounded-full bg-white/[0.04] skeleton-shimmer" />
          <div className="h-3 w-10 rounded bg-white/[0.03] skeleton-shimmer" />
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

// Список игр для двоих
const gamesList: GameDefinition[] = [
  { id: 'tic-tac-toe', name: 'Крестики-нолики', description: 'Классическая игра', icon: Gamepad, gradient: 'from-violet-600 to-purple-700', difficulty: 'easy', players: '1-2' },
  { id: 'rock-paper-scissors', name: 'Камень-ножницы-бумага', description: 'Кто победит?', icon: Hand, gradient: 'from-pink-600 to-rose-700', difficulty: 'easy', players: '2' },
  { id: 'dice-roll', name: 'Кости', description: 'Бросьте кости', icon: Dices, gradient: 'from-amber-500 to-orange-600', difficulty: 'easy', players: '1-4' },
  { id: 'click-war', name: 'Кликер', description: 'Кто быстрее?', icon: Swords, gradient: 'from-emerald-500 to-teal-600', difficulty: 'medium', players: '2' },
  { id: 'car-race', name: 'Car Race', description: 'Гонки в реальном времени', icon: Car, gradient: 'from-blue-500 to-cyan-600', difficulty: 'hard', players: '1-2' },
  { id: 'snake', name: 'Змейка', description: 'Классика на двоих', icon: Gamepad, gradient: 'from-emerald-600 to-green-700', difficulty: 'medium', players: '1-2' },
  { id: 'vibe-jet', name: 'Vibe Jet', description: 'Воздушный бой в 3D', icon: Zap, gradient: 'from-violet-500 to-fuchsia-600', difficulty: 'hard', players: '1' },
  { id: 'minesweeper' as any, name: 'Сапёр', description: 'Скоро...', icon: Gamepad, gradient: 'from-gray-600 to-slate-700', difficulty: 'medium', players: '1', isComingSoon: true },
  { id: 'sudoku' as any, name: 'Судоку', description: 'Скоро...', icon: Gamepad, gradient: 'from-blue-600 to-indigo-700', difficulty: 'hard', players: '1', isComingSoon: true },
];

// Difficulty config - Stage 5.2 Accessibility (Contrast)
const difficultyConfig = {
  easy: { 
    label: 'Легко', 
    color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', 
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(16, 185, 129, 0.05) 2px, rgba(16, 185, 129, 0.05) 4px)'
  },
  medium: { 
    label: 'Средне', 
    color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30', 
    pattern: 'repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(245, 158, 11, 0.05) 2px, rgba(245, 158, 11, 0.05) 4px)'
  },
  hard: { 
    label: 'Сложно', 
    color: 'bg-rose-500/20 text-rose-300 border border-rose-500/30', 
    pattern: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(239, 68, 68, 0.05) 2px, rgba(239, 68, 68, 0.05) 4px)'
  },
};

type GameLobbyProps = {
  roomId: string;
  user: UserProfile;
  otherUser?: UserProfile;
};

// Минималистичный loading - Dark Minimalism Theme
function GameLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-fade-in">
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

  const firebase = useFirebase();

  // Simulate initial loading for skeleton effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);
  const db = firebase?.db;
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

    // AI player ID for single player games
    const AI_PLAYER_ID = '__AI__';

    const initialStates: { [key in GameType]?: Partial<GameState> } = {
      'tic-tac-toe': {
        board: Array(9).fill(null),
        currentPlayer: hostId,
        winner: null,
        hostId,
        // Initialize AI player if no other user
        ...(otherUser ? {} : { aiPlayerId: AI_PLAYER_ID })
      },
      'rock-paper-scissors': { moves: {}, result: null, hostId },
      'click-war': { scores: {}, active: false, startTime: null, hostId },
      'dice-roll': { diceRoll: {}, hostId },
      'car-race': { carRacePlayers: {}, hostId },
      'snake': { snakeActive: false, hostId },
      'vibe-jet': { vibeJetPlayers: {}, hostId },
    };

    const initialState: Partial<GameState> = { type: gameId, ...initialStates[gameId] };

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

  // Активна гра - Dark Minimalism Theme
  if (activeGameId) {
    const currentGame = gamesList.find(g => g.id === activeGameId);
    const commonProps = {
      onGameEnd: handleEndGame,
      updateGameState: handleUpdateGameState,
      user,
      otherUser,
      roomId
    };

    return (
      <div className="flex flex-col h-full bg-black">
        {/* Back button with game title - Glass effect - Mobile optimized */}
        <div className="p-2 md:p-3 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between game-header">
          <button
            onClick={handleEndGame}
            className="flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] min-h-[44px] text-[var(--font-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl transition-all touch-target"
            aria-label="Вернуться к списку игр"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
          {currentGame && (() => {
            const GameIcon = currentGame.icon;
            return (
              <div className={cn(
                "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-gradient-to-r shadow-lg",
                currentGame.gradient
              )}>
                <GameIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                <span className="font-semibold text-white text-xs md:text-sm">{currentGame.name}</span>
              </div>
            );
          })()}
        </div>

        {/* Game content */}
        <div className="flex-1 overflow-hidden game-play-area">
          {gameState && gameState.type === activeGameId ? (
            <Suspense fallback={<GameLoading />}>
              {activeGameId === 'tic-tac-toe' && <TicTacToe {...commonProps} gameState={gameState} />}
              {activeGameId === 'rock-paper-scissors' && <RockPaperScissors {...commonProps} gameState={gameState} />}
              {activeGameId === 'click-war' && <ClickWar {...commonProps} gameState={gameState} />}
              {activeGameId === 'dice-roll' && <DiceRoll {...commonProps} gameState={gameState} />}
              {activeGameId === 'car-race' && <CarRace {...commonProps} gameState={gameState} />}
              {activeGameId === 'snake' && <SnakeGame {...commonProps} gameState={gameState} />}
              {activeGameId === 'vibe-jet' && <VibeJet />}
            </Suspense>
          ) : (
            <GameLoading />
          )}
        </div>
      </div>
    );
  }

  // Лобі - Dark Minimalism Theme
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const filteredGames = useMemo(() => {
    return gamesList.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || game.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [searchQuery, filterDifficulty]);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header - Glass effect - Mobile optimized */}
      <div className="p-[var(--space-4)] border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl game-lobby-header">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-[var(--space-4)]">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-fuchsia-700 shadow-lg shadow-purple-500/25">
              <Gamepad className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-[var(--h2-size)] font-semibold text-[var(--text-primary)]">Игры</h2>
              <p className="text-[var(--font-caption)] text-[var(--text-muted)]">Выберите игру для двоих</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск игр..."
                className="w-full pl-10 pr-4 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:border-violet-500/50 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff)}
                  className={cn(
                    "px-4 h-10 rounded-xl text-xs font-medium border transition-all whitespace-nowrap",
                    filterDifficulty === diff 
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300" 
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                  )}
                >
                  {diff === 'all' ? 'Все' : difficultyConfig[diff].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Games list - Dark Minimalism cards */}
      <div className="flex-1 overflow-y-auto mobile-scroll-y game-lobby-content p-3 md:p-4">
        <div className="games-grid">
          {isInitialLoading ? (
            // Skeleton loading state
            <>
              {[...Array(7)].map((_, index) => (
                <GameCardSkeleton key={index} index={index} />
              ))}
            </>
          ) : filteredGames.length > 0 ? (
            // Actual game cards with stagger animation
            filteredGames.map((game, index) => {
              const isLoading = loadingGameId === game.id;
              const Icon = game.icon;

              return (
                <button
                  key={game.id}
                  onClick={() => !game.isComingSoon && handleStartGame(game.id)}
                  disabled={isLoading || game.isComingSoon}
                  className={cn(
                    "flex flex-col items-center gap-[var(--space-3)] p-[var(--space-4)] rounded-2xl border transition-all duration-300 min-h-[160px] relative overflow-hidden",
                    "bg-[var(--bg-secondary)] border-[var(--border-subtle)]",
                    !game.isComingSoon && "hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-games)]/30 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]",
                    game.isComingSoon && "opacity-60 grayscale cursor-not-allowed",
                    "touch-target",
                    isLoading && "opacity-50 pointer-events-none",
                    "animate-fade-in-up"
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  aria-label={game.isComingSoon ? `Игра ${game.name} скоро появится` : `Запустить игру ${game.name}`}
                >
                  {game.isComingSoon && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-violet-500 text-[8px] font-bold text-white rounded-full uppercase tracking-tighter z-10">
                      Soon
                    </div>
                  )}
                  <div className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                    game.gradient
                  )}>
                    {isLoading ? (
                      <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[var(--font-body)] font-semibold text-[var(--text-primary)]">{game.name}</p>
                    <p className="text-[var(--font-caption)] text-[var(--text-muted)] mt-1">{game.description}</p>
                    {/* Difficulty badge - Phase 4 Accessibility */}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span 
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[var(--font-caption)] font-medium flex items-center gap-1",
                          difficultyConfig[game.difficulty].color
                        )}
                        style={{ backgroundImage: difficultyConfig[game.difficulty].pattern }}
                      >
                        {difficultyConfig[game.difficulty].label}
                      </span>
                      <span className="text-[var(--font-caption)] text-[var(--text-disabled)]">{game.players} чел.</span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full flex justify-center py-12">
               {searchQuery ? <EmptySearchResults /> : <EmptyGames />}
            </div>
          )}
        </div>

        {/* Hint - Glass card */}
        <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-[11px] md:text-xs text-white/40 text-center flex items-center justify-center gap-2">
            <span className="text-sm md:text-base">💡</span>
            Игры синхронизируются в реальном времени
          </p>
        </div>
      </div>
    </div>
  );
}
