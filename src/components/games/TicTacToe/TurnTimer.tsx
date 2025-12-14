import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GameSoundService } from '@/services/games/GameSoundService';

interface TicTacToeState {
  status: 'waiting' | 'in_progress' | 'finished';
  lastMoveTime?: any; // Firestore Timestamp
  createdAt?: any; // Firestore Timestamp
  currentTurn: 'player1' | 'player2';
  players: {
    player1: { uid: string; symbol: 'X' | 'O' };
    player2: { uid: string; symbol: 'X' | 'O' };
  };
}

interface TurnTimerProps {
  game: TicTacToeState;
  currentUserId: string;
  soundService: GameSoundService;
  moveTimeLimit?: number; // seconds, default 30
}

export function TurnTimer({ game, currentUserId, soundService, moveTimeLimit = 30 }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(moveTimeLimit);
  const isMyTurn = game?.players && game.players[game.currentTurn]?.uid === currentUserId;

  useEffect(() => {
    if (!game || game.status !== 'in_progress') return;

    const interval = setInterval(() => {
      const lastMoveMillis =
        (game.lastMoveTime && typeof game.lastMoveTime.toMillis === 'function'
          ? game.lastMoveTime.toMillis()
          : typeof game.lastMoveTime === 'number'
          ? game.lastMoveTime
          : game.createdAt && typeof game.createdAt.toMillis === 'function'
          ? game.createdAt.toMillis()
          : Date.now());

      const elapsed = Math.floor((Date.now() - lastMoveMillis) / 1000);
      const remaining = Math.max(0, moveTimeLimit - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 5 && remaining > 0 && isMyTurn) {
        soundService.play('tick');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.lastMoveTime, game?.status, moveTimeLimit, isMyTurn, soundService]);

  const progress = (timeLeft / moveTimeLimit) * 100;
  const colorClass = timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">{isMyTurn ? 'Your turn' : "Opponent's turn"}</span>
        <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : ''}`}>{timeLeft}s</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full ${colorClass}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
