import React, { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface SnakePlayer {
  id: string;
  body: Point[];
  color: string;
  score: number;
}

export const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState<SnakePlayer[]>([]);
  const [food, setFood] = useState<Point>({ x: 10, y: 10 });
  
  const GRID_SIZE = 20;
  const CANVAS_SIZE = 400;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw Grid
      ctx.strokeStyle = '#1a1a1a';
      for (let i = 0; i < CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
      }

      // Draw Food
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';
      ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
      ctx.shadowBlur = 0;

      // Draw Players
      players.forEach(player => {
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = player.color;
        player.body.forEach((part, index) => {
          const opacity = 1 - (index / player.body.length) * 0.5;
          ctx.globalAlpha = opacity;
          ctx.fillRect(part.x * GRID_SIZE + 1, part.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
    };

    render();
  }, [players, food]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white font-mono">
      <div className="mb-4 flex gap-8">
        <div className="text-cyan-400">SCORE: {players[0]?.score || 0}</div>
        <div className="text-neutral-500">ROOM: LOCAL_DEV</div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="border border-white/10 rounded-lg shadow-2xl shadow-cyan-500/10"
      />
      <div className="mt-8 text-[10px] text-neutral-600 uppercase tracking-widest">
        Use Arrow Keys to Move • Multiplayer Sync via Redis
      </div>
    </div>
  );
};
