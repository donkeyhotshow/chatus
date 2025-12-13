"use client";

import { useEffect, useState } from 'react';

const EMOJI_COUNT = 30;

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  rotation: number;
  size: number;
};

export function EmojiRain({ emoji }: { emoji: string }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: EMOJI_COUNT }).map((_, i) => ({
      id: i,
      x: 50,
      y: 100,
      vx: (Math.random() - 0.5) * 15,
      vy: -15 - Math.random() * 10,
      opacity: 1,
      rotation: Math.random() * 360,
      size: 1.5 + Math.random() * 1.5,
    }));
    setParticles(newParticles);
  }, [emoji]);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      setParticles(prevParticles => {
        const updatedParticles = prevParticles.map(p => {
          const newVy = p.vy + 0.5; // Gravity
          return {
            ...p,
            x: p.x + p.vx * 0.1,
            y: p.y + newVy * 0.1,
            vx: p.vx * 0.99, // Air resistance
            vy: newVy,
            opacity: p.opacity - 0.01,
            rotation: p.rotation + p.vx * 0.5,
          };
        }).filter(p => p.opacity > 0);

        if (updatedParticles.length === 0) {
          cancelAnimationFrame(animationFrameId);
          return [];
        }
        return updatedParticles;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  if (particles.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            opacity: p.opacity,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            fontSize: `${p.size}rem`,
            willChange: 'transform, opacity',
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}
