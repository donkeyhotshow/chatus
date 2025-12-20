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

// Мінімальний список ігор - тільки швидкі для двох
const gamesList: GameDefinition[] = [
  { id: 'tic-tac-toe', name: 'Хрестики-нулики', description: 'Класична гра', icon: Gamepad, color: 'var(--game-primary)' },
  { id: 'rock-paper-scissors', name: 'Камінь-ножиці-папір', description: 'Хто переможе?', icon: Hand, color: 'var(--game-primary)' },
  { id: 'dice-roll', name: 'Кості', description: 'Киньте кості', icon: Dices, color: 'var(--game-primary)' },
  { id: 'click-war', name: 'Клікер', description: 'Хто швидший?', icon: Swords, color: 'var(--game-primary)' },
];

type GameLobbyProps = {
  roomId: string;
  user: UserProfile;
  otherUser?: UserProfile;
};

// Мінімалістичний loading
function GameLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--border-primary)] border-t-[var(--game-primary)] rounded-full animate-spin" />
        <span className="text-sm text-[var(--text-muted)]">Завантаження...</span>
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

    const initialStates: { [key in GameType]?: Partial<GameState> } = {
      'tic-tac-toe': { board: Array(9).fill(null), currentPlayer: hostId, winner: null, hostId },
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

  // Активна гра
  if (activeGameId) {
    const commonProps = {
      onGameEnd: handleEndGame,
      updateGameState: handleUpdateGameState,
      user,
      otherUser,
      roomId
    };

    return (
      <div className="flex flex-col h-full bg-[var(--bg-primary)]">
        {/* Back button */}
        <div className="p-3 border-b border-[var(--border-primary)]">
          <button
            onClick={handleEndGame}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
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

  // Лобі - мінімалістичний дизайн
  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--game-primary)', opacity: 0.15 }}
          >
            <Gamepad className="w-5 h-5" style={{ color: 'var(--game-primary)' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ігри</h2>
            <p className="text-xs text-[var(--text-muted)]">Виберіть гру для двох</p>
          </div>
        </div>
      </div>

      {/* Games list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {gamesList.map((game) => {
            const isLoading = loadingGameId === game.id;
            const Icon = game.icon;

            return (
              <button
                key={game.id}
                onClick={() => handleStartGame(game.id)}
                disabled={isLoading}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  "bg-[var(--bg-secondary)] border-[var(--border-primary)]",
                  "hover:bg-[var(--bg-tertiary)] hover:border-[var(--game-primary)]/30",
                  "active:scale-[0.98]",
                  isLoading && "opacity-50 pointer-events-none"
                )}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--game-primary)', opacity: 0.15 }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[var(--game-primary)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon className="w-6 h-6" style={{ color: 'var(--game-primary)' }} />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{game.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{game.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        <div className="mt-6 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-muted)] text-center">
            💡 Ігри синхронізуються в реальному часі з вашим співрозмовником
          </p>
        </div>
      </div>
    </div>
  );
}
