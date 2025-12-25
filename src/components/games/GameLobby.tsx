"use client";

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Gamepad, ArrowLeft, Dices, Hand, Swords } from 'lucide-react';
import { UserProfile, GameType, GameState } from '@/lib/types';
import { useChatService } from '@/hooks/useChatService';
import { useDoc } from '@/hooks/useDoc';
import { doc } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { cn } from '@/lib/utils';

// Lazy load game components
const TicTacToe = lazy(() => import('./TicTacToe').then(m => ({ default: m.TicTacToe })));
const RockPaperScissors = lazy(() => import('./RockPaperScissors').then(m => ({ default: m.RockPaperScissors })));
const ClickWar = lazy(() => import('./ClickWar').then(m => ({ default: m.ClickWar })));
const DiceRoll = lazy(() => import('./DiceRoll').then(m => ({ default: m.DiceRoll })));

type GameDefinition = {
  id: GameType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
};

// Список игр для двоих
const gamesList: GameDefinition[] = [
  { id: 'tic-tac-toe', name: 'Крестики-нолики', description: 'Классическая игра', icon: Gamepad, color: 'var(--game-primary)' },
  { id: 'rock-paper-scissors', name: 'Камень-ножницы-бумага', description: 'Кто победит?', icon: Hand, color: 'var(--game-primary)' },
  { id: 'dice-roll', name: 'Кости', description: 'Бросьте кости', icon: Dices, color: 'var(--game-primary)' },
  { id: 'click-war', name: 'Кликер', description: 'Кто быстрее?', icon: Swords, color: 'var(--game-primary)' },
];

type GameLobbyProps = {
  roomId: string;
  user: UserProfile;
  otherUser?: UserProfile;
};

// Минималистичный loading - Dark Minimalism Theme
function GameLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-xl animate-fade-in">
        <div className="w-10 h-10 border-2 border-[var(--glass-border)] border-t-[var(--game-primary)] rounded-full animate-spin" />
        <span className="text-sm text-[var(--text-secondary)] font-medium">Загрузка...</span>
      </div>
    </div>
  );
}

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
      <div className="flex flex-col h-full bg-[var(--bg-primary)]">
        {/* Back button with game title - Glass effect */}
        <div className="p-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl flex items-center justify-between">
          <button
            onClick={handleEndGame}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-xl transition-all hover:-translate-y-0.5"
            aria-label="Вернуться к списку игр"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
          {currentGame && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--game-primary)]/10 border border-[var(--game-primary)]/20">
              <currentGame.icon className="w-4 h-4" style={{ color: 'var(--game-primary)' }} />
              <span className="font-semibold text-[var(--text-primary)]">{currentGame.name}</span>
            </div>
          )}
        </div>

        {/* Game content */}
        <div className="flex-1 overflow-hidden">
          {gameState && gameState.type === activeGameId ? (
            <Suspense fallback={<GameLoading />}>
              {activeGameId === 'tic-tac-toe' && <TicTacToe {...commonProps} gameState={gameState} />}
              {activeGameId === 'rock-paper-scissors' && <RockPaperScissors {...commonProps} gameState={gameState} />}
              {activeGameId === 'click-war' && <ClickWar {...commonProps} gameState={gameState} />}
              {activeGameId === 'dice-roll' && <DiceRoll {...commonProps} gameState={gameState} />}
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
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header - Glass effect */}
      <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--game-primary)] to-[var(--warning)] shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <Gamepad className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Игры</h2>
            <p className="text-xs text-[var(--text-muted)]">Выберите игру для двоих</p>
          </div>
        </div>
      </div>

      {/* Games list - Dark Minimalism cards */}
      <div className="flex-1 overflow-y-auto mobile-scroll-y game-lobby-content p-4">
        <div className="grid grid-cols-2 gap-4">
          {gamesList.map((game, index) => {
            const isLoading = loadingGameId === game.id;
            const Icon = game.icon;

            return (
              <button
                key={game.id}
                onClick={() => handleStartGame(game.id)}
                disabled={isLoading}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all min-h-[140px]",
                  "bg-[var(--bg-card)] border-[var(--glass-border)]",
                  "hover:bg-[var(--bg-tertiary)] hover:border-[var(--game-primary)]/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
                  "hover:-translate-y-1",
                  "active:scale-[0.98]",
                  isLoading && "opacity-50 pointer-events-none",
                  "animate-fade-in-up"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--game-primary)] to-[var(--warning)] shadow-[0_4px_12px_rgba(245,158,11,0.25)] transition-transform group-hover:scale-110"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icon className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{game.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{game.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint - Glass card */}
        <div className="mt-6 p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-sm">
          <p className="text-xs text-[var(--text-secondary)] text-center flex items-center justify-center gap-2">
            <span className="text-base">💡</span>
            Игры синхронизируются в реальном времени с вашим собеседником
          </p>
        </div>
      </div>
    </div>
  );
}
