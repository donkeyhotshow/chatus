import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GameSoundService } from '@/services/games/GameSoundService';

interface TicTacToeState {
  board: (string | null)[][];
  currentTurn: 'player1' | 'player2';
  players: {
    player1: { uid: string; symbol: 'X' | 'O' };
    player2: { uid: string; symbol: 'X' | 'O' };
  };
  status: 'waiting' | 'in_progress' | 'finished';
  winner: string | null;
  lastMoveTime?: any;
  createdAt?: any;
}

function findWinningLine(board: (string | null)[][]): number[] | null {
  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
      return line.map(([r, col]) => r * 3 + col);
    }
  }
  return null;
}

interface AnimatedTicTacToeBoardProps {
  game: TicTacToeState;
  onCellClick: (row: number, col: number) => void;
  soundService: GameSoundService;
}

export function AnimatedTicTacToeBoard({ game, onCellClick, soundService }: AnimatedTicTacToeBoardProps) {
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  useEffect(() => {
    if (game.winner && game.winner !== 'draw') {
      const line = findWinningLine(game.board);
      setWinningLine(line);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore in SSR or if confetti not available
      }
      soundService.play('win');
    } else if (game.winner === 'draw') {
      soundService.play('draw');
    } else {
      setWinningLine(null);
    }
  }, [game.winner, game.board, soundService]);

  const handleCellClickWithSound = (row: number, col: number) => {
    if (!game.board[row][col] && game.status === 'in_progress') {
      soundService.play('move');
    }
    onCellClick(row, col);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2 p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-2xl">
        {game.board.map((row, i) =>
          row.map((cell, j) => {
            const isWinning = winningLine?.includes(i * 3 + j);

            return (
              <motion.button
                key={`${i}-${j}`}
                className={`
                  w-24 h-24 rounded-lg text-4xl font-bold
                  ${isWinning ? 'bg-yellow-300' : 'bg-white'}
                  hover:scale-105 active:scale-95
                  transition-all duration-200
                  shadow-lg
                `}
                onClick={() => handleCellClickWithSound(i, j)}
                disabled={!!cell || game.status !== 'in_progress'}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: (i * 3 + j) * 0.05,
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={cell === 'X' ? 'text-blue-600' : 'text-red-600'}
                  >
                    {cell}
                  </motion.span>
                )}
              </motion.button>
            );
          })
        )}
      </div>

      {winningLine && <WinningLineOverlay cells={winningLine} />}

      <motion.div
        className="mt-4 text-center text-2xl font-bold"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {game.status === 'in_progress' && (
          <>
            Current turn:{' '}
            <span className={game.currentTurn === 'player1' ? 'text-blue-600' : 'text-red-600'}>
              {game.players[game.currentTurn].symbol}
            </span>
          </>
        )}
      </motion.div>
    </div>
  );
}



interface WinningLineOverlayProps {
  cells: number[];
}

function WinningLineOverlay({ cells }: WinningLineOverlayProps) {
  const getLineCoords = (cellIndex: number) => {
    const row = Math.floor(cellIndex / 3);
    const col = cellIndex % 3;
    const cellSize = 100; // approximate cell size from CSS
    const gapSize = 5; // approximate gap size from CSS
    return {
      x: col * (cellSize + gapSize) + cellSize / 2 + gapSize * 2, // Adjust for padding/gap
      y: row * (cellSize + gapSize) + cellSize / 2 + gapSize * 2, // Adjust for padding/gap
    };
  };

  const startCoords = getLineCoords(cells[0]);
  const endCoords = getLineCoords(cells[2]);

  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 320 320"> {/* Adjusted viewBox */}
      <motion.line
        x1={startCoords.x}
        y1={startCoords.y}
        x2={endCoords.x}
        y2={endCoords.y}
        stroke="#FFD700"
        strokeWidth="8"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </svg>
  );
}
