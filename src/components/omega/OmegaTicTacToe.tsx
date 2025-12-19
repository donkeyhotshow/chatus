"use client";

import { memo, useState, useCallback } from 'react';

type Player = 'X' | 'O' | null;
type Board = Player[];

interface OmegaTicTacToeProps {
  onClose: () => void;
  onRematch: () => void;
}

const checkWinner = (board: Board): Player | 'draw' | null => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(c => c !== null) ? 'draw' : null;
};

export const OmegaTicTacToe = memo(function OmegaTicTacToe({ onClose, onRematch }: OmegaTicTacToeProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const winner = checkWinner(board);

  const handleCell = useCallback((i: number) => {
    if (board[i] || winner) return;
    if ('vibrate' in navigator) navigator.vibrate(5);
    const newBoard = [...board];
    newBoard[i] = isXTurn ? 'X' : 'O';
    setBoard(newBoard);
    setIsXTurn(!isXTurn);
  }, [board, isXTurn, winner]);

  const reset = () => { setBoard(Array(9).fill(null)); setIsXTurn(true); onRematch(); };

  return (
    <div className="ttt-container">
      <div className="ttt-status">
        {winner ? (winner === 'draw' ? 'Ничья!' : `Победил ${winner}!`) : `Ход: ${isXTurn ? 'X' : 'O'}`}
      </div>
      <div className="ttt-board">
        {board.map((cell, i) => (
          <button key={i} className="ttt-cell" onClick={() => handleCell(i)}>
            {cell && <span className={cell === 'X' ? 'x' : 'o'}>{cell}</span>}
          </button>
        ))}
      </div>
      <div className="ttt-controls">
        <button className="ttt-btn" onClick={reset}>Новая игра</button>
        <button className="ttt-btn secondary" onClick={onClose}>Выйти</button>
      </div>
      <style jsx>{`
        .ttt-container { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .ttt-status { font-size: 18px; font-weight: 600; color: #8b5cf6; }
        .ttt-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .ttt-cell { width: 76px; height: 76px; background: #1a1a1a; border: none; border-radius: 12px; font-size: 36px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .ttt-cell:hover { background: rgba(139,92,246,0.2); }
        .ttt-cell .x { color: #10b981; }
        .ttt-cell .o { color: #f59e0b; }
        .ttt-controls { display: flex; gap: 12px; }
        .ttt-btn { padding: 10px 20px; background: #8b5cf6; border: none; border-radius: 20px; color: #fff; font-weight: 500; cursor: pointer; }
        .ttt-btn:hover { background: #7c3aed; }
        .ttt-btn.secondary { background: #2a2a2a; }
      `}</style>
    </div>
  );
});

export default OmegaTicTacToe;
