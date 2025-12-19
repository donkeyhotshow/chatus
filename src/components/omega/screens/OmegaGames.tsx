"use client";

import { memo } from 'react';
import { OmegaHeader } from '../OmegaHeader';
import { OmegaTicTacToe } from '../OmegaTicTacToe';

interface OmegaGamesProps {
  activeGame: string | null;
  onStartGame: (game: string) => void;
  onCloseGame: () => void;
}

const games = [
  { id: 'tic-tac-toe', name: 'Крестики-нолики', icon: 'grid_on', desc: 'Классика 3x3' },
  { id: 'rps', name: 'Камень-ножницы', icon: 'pan_tool', desc: 'Игра на удачу' },
  { id: 'dice', name: 'Кости', icon: 'casino', desc: 'Бросок кубика' },
  { id: 'guess', name: 'Угадай число', icon: 'psychology', desc: '1-100' },
];

export const OmegaGames = memo(function OmegaGames({
  activeGame, onStartGame, onCloseGame
}: OmegaGamesProps) {
  if (activeGame === 'tic-tac-toe') {
    return (
      <div className="omega-screen">
        <OmegaHeader title="Крестики-нолики" />
        <div className="omega-game-content">
          <OmegaTicTacToe onClose={onCloseGame} onRematch={() => {}} />
        </div>
        <style jsx>{`
          .omega-screen { display: flex; flex-direction: column; height: 100%; background: #0a0a0a; }
          .omega-game-content { flex: 1; display: flex; align-items: center; justify-content: center; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="omega-screen">
      <OmegaHeader title="Игры" />
      <div className="omega-games-grid">
        {games.map(g => (
          <button key={g.id} className="omega-game-card" onClick={() => onStartGame(g.id)}>
            <div className="omega-game-icon">
              <span className="material-icon}</span>
            </div>
            <div className="omega-game-name">{g.name}</div>
            <div className="omega-game-desc">{g.desc}</div>
          </button>
        ))}
      </div>
      <style jsx>{`
        .omega-screen { display: flex; flex-direction: column; height: 100%; background: #0a0a0a; }
        .omega-games-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 16px; }
        .omega-game-card { background: #1a1a1a; border: none; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; }
        .omega-game-card:hover { background: #2a2a2a; transform: translateY(-4px); }
        .omega-game-icon { width: 60px; height: 60px; background: #2a2a2a; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .omega-game-icon span { font-size: 30px; color: #8b5cf6; }
        .omega-game-name { font-size: 16px; font-weight: 600; color: #fff; }
        .omega-game-desc { font-size: 12px; color: #a1a1aa; }
      `}</style>
    </div>
  );
});

export default OmegaGames;
