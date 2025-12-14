import React from 'react';
import { motion } from 'framer-motion';

function getLineCoords(index: number) {
  // Map cell index (0..8) to SVG coords (approx within 300x300)
  const col = index % 3;
  const row = Math.floor(index / 3);
  const cellSize = 100;
  const padding = 50;
  return {
    x: padding + col * cellSize + cellSize / 2,
    y: padding + row * cellSize + cellSize / 2,
  };
}

export function WinningLineOverlay({ cells }: { cells: number[] }) {
  if (!cells || cells.length < 3) return null;

  const start = getLineCoords(cells[0]);
  const end = getLineCoords(cells[2]);

  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 300 300">
      <motion.line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
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


