"use client";

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { doc } from 'firebase/firestore';
import { Gamepad, ArrowLeft, Dices, Hand, Swords, Car, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile, GameType, GameState } from '@/lib/types';
import { useChatService } from '@/hooks/useChatService';
import { useDoc } from '@/hooks/useDoc';
import { useFirebase } from '../firebase/FirebaseProvider';

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
};

// Список игр для двоих
const gamesList: GameDefinition[] = [
  { id: 'tic-tac-toe', name: 'Крестики-нолики', description: 'Классическая игра', icon: Gamepad, gradient: 'from-violet-600 to-purple-700' },
  { id: 'rock-paper-scissors', name: 'Камень-ножницы-бумага', description: 'Кто победит?', icon: Hand, gradient: 'from-pink-600 to-rose-700' },
  { id: 'dice-roll', name: 'Кости', description: 'Бросьте кости', icon: Dices, gradient: 'from-amber-500 to-orange-600' },
  { id: 'click-war', name: 'Кликер', description: 'Кто быстрее?', icon: Swords, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'car-race', name: 'Car Race', description: 'Гонки в реальном времени', icon: Car, gradient: 'from-blue-500 to-cyan-600' },
  { id: 'snake', name: 'Змейка', description: 'Классика на двоих', icon: Gamepad, gradient: 'from-emerald-600 to-green-700' },
  { id: 'vibe-jet', name: 'Vibe Jet', description: 'Воздушный бой в 3D', icon: Zap, gradient: 'from-violet-500 to-fuchsia-600' },
];

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

  const firebase = useFirebase();
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
        {/* Back button with game title - Glass effect */}
        <div className="p-3 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between">
          <button
            onClick={handleEndGame}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:-translate-y-0.5"
            aria-label="Вернуться к списку игр"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
          {currentGame && (() => {
            const GameIcon = currentGame.icon;
            return (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r shadow-lg",
                currentGame.gradient
              )}>
                <GameIcon className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">{currentGame.name}</span>
              </div>
            );
          })()}
        </div>

        {/* Game content */}
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
            </Suspense>
          ) : (
            <GameLoading />
          )}
        </div>
      </div>
    );
  }

  // Лобі - Dark Minimalism Theme
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header - Glass effect */}
      <div className="p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-fuchsia-700 shadow-lg shadow-purple-500/25">
            <Gamepad className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Игры</h2>
            <p className="text-xs text-white/50">Выберите игру для двоих</p>
          </div>
        </div>
      </div>

      {/* Games list - Dark Minimalism cards */}
      <div className="flex-1 overflow-y-auto mobile-scroll-y game-lobby-content p-4">
        <div className="games-grid">
          {gamesList.map((game, index) => {
            const isLoading = loadingGameId === game.id;
            const Icon = game.icon;

            return (
              <button
                key={game.id}
                onClick={() => handleStartGame(game.id)}
                disabled={isLoading}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 min-h-[140px]",
                  "bg-white/[0.02] border-white/[0.06]",
                  "hover:bg-white/[0.05] hover:border-white/10 hover:shadow-xl hover:shadow-purple-500/5",
                  "hover:-translate-y-1",
                  "active:scale-[0.98]",
                  isLoading && "opacity-50 pointer-events-none",
                  "animate-fade-in-up"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                  game.gradient
                )}>
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icon className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{game.name}</p>
                  <p className="text-xs text-white/40 mt-1">{game.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint - Glass card */}
        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-xs text-white/40 text-center flex items-center justify-center gap-2">
            <span className="text-base">💡</span>
            Игры синхронизируются в реальном времени
          </p>
        </div>
      </div>
    </div>
  );
}
