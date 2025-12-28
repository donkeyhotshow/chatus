"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, UserProfile } from '@/lib/types';
import { RealtimeSnakeService, SnakeGameState, SnakeData } from '@/services/RealtimeSnakeService';
import { db as realtimeDb } from '@/lib/firebase';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from '../ui/premium-card';
import { PremiumButton } from '../ui/premium-button';
import { Trophy, Zap, Gamepad2, Star, Flame, Clock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { hapticFeedback } from '@/lib/game-utils';
import { formatGameTime } from '@/utils/time';
import { ExitButton } from '../ui/ExitButton';
import { useIsMobile } from '@/hooks/use-mobile';

interface SnakeGameProps {
  onGameEnd: () => void;
  updateGameState: (newState: Partial<GameState>) => void;
  gameState: GameState;
  user: UserProfile;
  otherUser?: UserProfile;
  roomId: string;
}

const GRID_CELLS = 20;
const INITIAL_SPEED = 140;
const MIN_SPEED = 50;
const SPEED_BOOST_DURATION = 3000;

type FoodType = 'normal' | 'golden' | 'speed' | 'shrink';

interface Food {
  x: number;
  y: number;
  type: FoodType;
  spawnTime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export function SnakeGame({ onGameEnd, gameState, user, otherUser, roomId }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rtState, setRtState] = useState<SnakeGameState | null>(null);
  const rtServiceRef = useRef<RealtimeSnakeService | null>(null);
  const isMobile = useIsMobile();

  // Responsive canvas size
  const [canvasSize, setCanvasSize] = useState(400);
  const gridSize = canvasSize / GRID_CELLS;

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const maxSize = isMobile ? Math.min(containerWidth - 32, 340) : Math.min(containerWidth - 32, 480);
      const size = Math.floor(maxSize / GRID_CELLS) * GRID_CELLS;
      setCanvasSize(Math.max(260, size));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isMobile]);

  const [mySnake, setMySnake] = useState<Omit<SnakeData, 'userId'>>({
    userName: user.name,
    body: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
    direction: { x: 1, y: 0 },
    score: 0,
    color: '#8B5CF6',
    isDead: false
  });

  const [aiSnake, setAiSnake] = useState<Omit<SnakeData, 'userId'> | null>(null);
  const [food, setFood] = useState<Food | null>(null);
  const [combo, setCombo] = useState(0);
  const [speedBoost, setSpeedBoost] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const isInitializedRef = useRef(false);
  const gameActiveRef = useRef(false);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speedBoostTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef(0);

  // Swipe handling for mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
      if (dx > 0 && directionRef.current.x === 0) {
        nextDirectionRef.current = { x: 1, y: 0 };
        hapticFeedback('light');
      } else if (dx < 0 && directionRef.current.x === 0) {
        nextDirectionRef.current = { x: -1, y: 0 };
        hapticFeedback('light');
      }
    } else if (Math.abs(dy) > minSwipe) {
      if (dy > 0 && directionRef.current.y === 0) {
        nextDirectionRef.current = { x: 0, y: 1 };
        hapticFeedback('light');
      } else if (dy < 0 && directionRef.current.y === 0) {
        nextDirectionRef.current = { x: 0, y: -1 };
        hapticFeedback('light');
      }
    }
    touchStartRef.current = null;
  }, []);

  // Direction change handler for buttons
  const changeDirection = useCallback((newDir: { x: number; y: number }) => {
    if ((newDir.x !== 0 && directionRef.current.x === 0) ||
        (newDir.y !== 0 && directionRef.current.y === 0)) {
      nextDirectionRef.current = newDir;
      hapticFeedback('light');
    }
  }, []);

  // Initialize RTDB Service
  useEffect(() => {
    if (!realtimeDb || !roomId || !user) return;
    if (isInitializedRef.current) return;

    try {
      const service = new RealtimeSnakeService(realtimeDb, roomId, user.id);
      rtServiceRef.current = service;
      isInitializedRef.current = true;

      const unsub = service.subscribe((state) => {
        setRtState(state);
        gameActiveRef.current = state?.active || false;
      });

      return () => {
        unsub();
        service.destroy();
        rtServiceRef.current = null;
        isInitializedRef.current = false;
        gameActiveRef.current = false;
      };
    } catch (error) {
      console.error('[SnakeGame] Failed to initialize service:', error);
    }
  }, [roomId, user]);

  // Sync snake to RTDB
  useEffect(() => {
    if (rtServiceRef.current && rtState?.active && !mySnake.isDead) {
      try {
        rtServiceRef.current.updateMySnake(mySnake);
      } catch (error) {
        console.error('[SnakeGame] Failed to sync snake:', error);
      }
    }
  }, [mySnake, rtState?.active]);

  // Game timer
  useEffect(() => {
    if (!rtState?.active) {
      setGameTime(0);
      return;
    }

    if (!gameStartTimeRef.current || gameStartTimeRef.current === 0) {
      gameStartTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = gameStartTimeRef.current;

      if (!startTime || startTime > now || startTime < now - 3600000) {
        gameStartTimeRef.current = now;
        setGameTime(0);
        return;
      }

      const elapsed = Math.floor((now - startTime) / 1000);
      setGameTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [rtState?.active]);

  // Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (y === 0) nextDirectionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown': case 's': case 'S':
          if (y === 0) nextDirectionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft': case 'a': case 'A':
          if (x === 0) nextDirectionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight': case 'd': case 'D':
          if (x === 0) nextDirectionRef.current = { x: 1, y: 0 };
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Spawn food
  const spawnFood = useCallback(() => {
    let attempts = 0;
    let newFood: Food = {
      x: Math.floor(Math.random() * GRID_CELLS),
      y: Math.floor(Math.random() * GRID_CELLS),
      type: 'normal',
      spawnTime: Date.now()
    };

    const rand = Math.random();
    if (rand < 0.1) newFood.type = 'golden';
    else if (rand < 0.2) newFood.type = 'speed';
    else if (rand < 0.25) newFood.type = 'shrink';

    while (attempts < 10) {
      const onSnake = mySnake.body.some(p => p.x === newFood.x && p.y === newFood.y) ||
                      (aiSnake?.body.some(p => p.x === newFood.x && p.y === newFood.y));
      if (!onSnake) break;
      newFood.x = Math.floor(Math.random() * GRID_CELLS);
      newFood.y = Math.floor(Math.random() * GRID_CELLS);
      attempts++;
    }

    setFood(newFood);
    if (rtServiceRef.current) {
      try {
        rtServiceRef.current.updateFood({ x: newFood.x, y: newFood.y });
      } catch (error) {
        console.error('[SnakeGame] Failed to spawn food:', error);
      }
    }
  }, [mySnake.body, aiSnake?.body]);

  // Add particles
  const addParticles = useCallback((x: number, y: number, color: string, count: number, gs: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x * gs + gs / 2,
        y: y * gs + gs / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color,
        size: 3 + Math.random() * 3
      });
    }
    setParticles(prev => [...prev.slice(-30), ...newParticles]);
  }, []);

  const handleStart = useCallback(() => {
    const isHost = user.id === gameState.hostId || !gameState.hostId;
    const startX = isHost ? 5 : 15;
    const startDir = isHost ? { x: 1, y: 0 } : { x: -1, y: 0 };

    const initialSnake = {
      userName: user.name,
      body: [{ x: startX, y: 10 }, { x: startX - startDir.x, y: 10 }, { x: startX - startDir.x * 2, y: 10 }],
      direction: startDir,
      score: 0,
      color: isHost ? '#8B5CF6' : '#EC4899',
      isDead: false
    };

    directionRef.current = startDir;
    nextDirectionRef.current = startDir;
    setMySnake(initialSnake);
    setCombo(0);
    setSpeedBoost(false);
    setParticles([]);

    gameStartTimeRef.current = Date.now();
    setGameTime(0);

    if (rtServiceRef.current) {
      rtServiceRef.current.setGameState(true, Date.now());
    } else {
      setRtState(prev => prev ? { ...prev, active: true } : { active: true, food: { x: 10, y: 10 }, players: {} });
    }

    spawnFood();

    if (!otherUser) {
      const initialAiSnake = {
        userName: 'AI Bot 🤖',
        body: [{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }],
        direction: { x: -1, y: 0 },
        score: 0,
        color: '#EC4899',
        isDead: false
      };
      setAiSnake(initialAiSnake);
      if (rtServiceRef.current) {
        rtServiceRef.current.updateOtherSnake('ai-bot', initialAiSnake);
      }
    }

    hapticFeedback('medium');
  }, [user.id, user.name, gameState.hostId, otherUser, spawnFood]);

  // Game Loop
  useEffect(() => {
    if (!rtState?.active || mySnake.isDead) return;

    let rafId: number;
    const isHost = user.id === gameState.hostId;

    const move = () => {
      const now = Date.now();
      let speed = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(mySnake.score / 3) * 8);
      if (speedBoost) speed = Math.max(40, speed - 40);

      if (now - lastMoveTimeRef.current < speed) {
        rafId = requestAnimationFrame(move);
        return;
      }

      lastMoveTimeRef.current = now;
      directionRef.current = nextDirectionRef.current;

      setParticles(prev => prev.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        p.size *= 0.95;
        return p.life > 0;
      }));

      setMySnake(prev => {
        if (prev.isDead) return prev;

        const head = {
          x: prev.body[0].x + directionRef.current.x,
          y: prev.body[0].y + directionRef.current.y
        };

        // Wall wrapping
        if (head.x < 0) head.x = GRID_CELLS - 1;
        if (head.x >= GRID_CELLS) head.x = 0;
        if (head.y < 0) head.y = GRID_CELLS - 1;
        if (head.y >= GRID_CELLS) head.y = 0;

        // Self collision
        if (prev.body.some(part => part.x === head.x && part.y === head.y)) {
          hapticFeedback('heavy');
          addParticles(head.x, head.y, '#ef4444', 15, gridSize);
          return { ...prev, isDead: true };
        }

        // Other snake collision
        if (rtState.players) {
          const otherSnakes = Object.values(rtState.players).filter(p => p.userId !== user.id);
          for (const other of otherSnakes) {
            if (other.body.some(part => part.x === head.x && part.y === head.y)) {
              hapticFeedback('heavy');
              addParticles(head.x, head.y, '#ef4444', 15, gridSize);
              return { ...prev, isDead: true };
            }
          }
        }

        const newBody = [head, ...prev.body];
        let newScore = prev.score;
        let ateFood = false;

        if (food && head.x === food.x && head.y === food.y) {
          ateFood = true;
          let points = 1;
          let particleColor = '#22c55e';

          switch (food.type) {
            case 'golden':
              points = 3;
              particleColor = '#fbbf24';
              break;
            case 'speed':
              points = 1;
              particleColor = '#3b82f6';
              setSpeedBoost(true);
              if (speedBoostTimeoutRef.current) clearTimeout(speedBoostTimeoutRef.current);
              speedBoostTimeoutRef.current = setTimeout(() => setSpeedBoost(false), SPEED_BOOST_DURATION);
              break;
            case 'shrink':
              points = 2;
              particleColor = '#a855f7';
              if (newBody.length > 5) {
                newBody.pop();
                newBody.pop();
              }
              break;
          }

          setCombo(c => {
            const newCombo = c + 1;
            if (newCombo > 1) points += Math.floor(newCombo / 2);
            return newCombo;
          });

          if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
          comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000);

          newScore += points;
          addParticles(head.x, head.y, particleColor, 10, gridSize);
          spawnFood();
          hapticFeedback('light');
        }

        if (!ateFood) {
          newBody.pop();
        }

        return { ...prev, body: newBody, score: newScore, direction: directionRef.current };
      });

      // Update AI Snake
      if (isHost && !otherUser && aiSnake && !aiSnake.isDead) {
        setAiSnake(prev => {
          if (!prev || prev.isDead) return prev;

          const head = prev.body[0];
          let nextDir = prev.direction;

          if (food) {
            const possibleDirs = [
              { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
            ].filter(d => !(d.x === -prev.direction.x && d.y === -prev.direction.y));

            let bestDir = nextDir;
            let bestScore = -Infinity;

            for (const d of possibleDirs) {
              const nextHead = { x: head.x + d.x, y: head.y + d.y };

              if (nextHead.x < 0 || nextHead.x >= GRID_CELLS || nextHead.y < 0 || nextHead.y >= GRID_CELLS) continue;
              if (prev.body.some(p => p.x === nextHead.x && p.y === nextHead.y)) continue;
              if (mySnake.body.some(p => p.x === nextHead.x && p.y === nextHead.y)) continue;

              const dist = Math.abs(nextHead.x - food.x) + Math.abs(nextHead.y - food.y);
              const score = -dist + Math.random() * 2;

              if (score > bestScore) {
                bestScore = score;
                bestDir = d;
              }
            }
            nextDir = bestDir;
          }

          const newAiHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };

          if (newAiHead.x < 0) newAiHead.x = GRID_CELLS - 1;
          if (newAiHead.x >= GRID_CELLS) newAiHead.x = 0;
          if (newAiHead.y < 0) newAiHead.y = GRID_CELLS - 1;
          if (newAiHead.y >= GRID_CELLS) newAiHead.y = 0;

          if (prev.body.some(part => part.x === newAiHead.x && part.y === newAiHead.y)) {
            return { ...prev, isDead: true };
          }

          const newAiBody = [newAiHead, ...prev.body];
          let newAiScore = prev.score;

          if (food && newAiHead.x === food.x && newAiHead.y === food.y) {
            newAiScore += food.type === 'golden' ? 3 : 1;
            spawnFood();
          } else {
            newAiBody.pop();
          }

          const updatedAi = { ...prev, body: newAiBody, score: newAiScore, direction: nextDir };
          rtServiceRef.current?.updateOtherSnake('ai-bot', updatedAi);
          return updatedAi;
        });
      }

      rafId = requestAnimationFrame(move);
    };

    rafId = requestAnimationFrame(move);
    return () => cancelAnimationFrame(rafId);
  }, [rtState?.active, rtState?.players, mySnake.isDead, mySnake.score, mySnake.body, aiSnake, food, speedBoost, user.id, gameState.hostId, otherUser, spawnFood, addParticles, gridSize]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gs = gridSize;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvasSize; i += gs) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvasSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvasSize, i); ctx.stroke();
    }

    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Food
    if (food) {
      let foodColor = '#22c55e';
      let glowColor = '#22c55e';

      switch (food.type) {
        case 'golden':
          foodColor = '#fbbf24';
          glowColor = '#fbbf24';
          break;
        case 'speed':
          foodColor = '#3b82f6';
          glowColor = '#3b82f6';
          break;
        case 'shrink':
          foodColor = '#a855f7';
          glowColor = '#a855f7';
          break;
      }

      const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
      const size = (gs / 2 - 3) * pulse;

      ctx.fillStyle = foodColor;
      ctx.shadowBlur = 12;
      ctx.shadowColor = glowColor;
      ctx.beginPath();
      ctx.arc(food.x * gs + gs / 2, food.y * gs + gs / 2, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (food.type !== 'normal') {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(8, gs * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        const symbol = food.type === 'golden' ? '★' : food.type === 'speed' ? '⚡' : '↓';
        ctx.fillText(symbol, food.x * gs + gs / 2, food.y * gs + gs / 2 + 4);
      }
    }

    // Draw Snakes
    const drawSnake = (player: SnakeData) => {
      ctx.fillStyle = player.color;

      player.body.forEach((part, index) => {
        const isHead = index === 0;
        const opacity = isHead ? 1 : 1 - (index / player.body.length) * 0.5;
        ctx.globalAlpha = player.isDead ? opacity * 0.3 : opacity;

        const padding = isHead ? 1 : 2;
        const size = gs - padding * 2;
        const x = part.x * gs + padding;
        const y = part.y * gs + padding;

        if (isHead && !player.isDead) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = player.color;
        }

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, size, size, isHead ? 6 : 4);
        } else {
          ctx.rect(x, y, size, size);
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHead && !player.isDead) {
          ctx.fillStyle = 'white';
          const eyeSize = Math.max(2, gs * 0.15);
          const eyeOffset = gs * 0.25;
          ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(x + size - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
          ctx.fillStyle = player.color;
        }
      });

      ctx.globalAlpha = 1;
    };

    if (rtState?.players) {
      Object.values(rtState.players).forEach(drawSnake);
    }
  }, [rtState, food, particles, canvasSize, gridSize]);

  const isGameOver = rtState?.active && Object.values(rtState.players || {}).every(p => p.isDead);
  const winner = isGameOver ? Object.values(rtState.players || {}).sort((a, b) => b.score - a.score)[0] : null;
  const aiScore = Object.values(rtState?.players || {}).find(p => p.userId !== user.id)?.score || 0;

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Header */
      <div className="w-full flex items-center justify-between mb-3">
        <ExitButton onExit={onGameEnd} />
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm font-mono text-[var(--text-secondary)]">
            {formatGameTime(gameTime)}
          </span>
        </div>
      </div>

      {/* Score Display */}
      <div className="w-full flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{user.name}</span>
          <span className="text-lg font-bold text-[var(--accent-primary)]">{mySnake.score}</span>
          {combo > 1 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
              x{combo}
            </span>
          )}
          {speedBoost && (
            <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-pink-400">{aiScore}</span>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {otherUser?.name || 'AI Bot 🤖'}
          </span>
          <div className="w-3 h-3 rounded-full bg-pink-500" />
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="rounded-xl border-2 border-white/10 touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* Start Screen */}
        <AnimatePresence>
          {!rtState?.active && !isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl"
            >
              <Gamepad2 className="w-16 h-16 text-[var(--accent-primary)] mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Snake Battle</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6 text-center px-4">
                {isMobile ? 'Свайпайте для управления' : 'WASD или стрелки для управления'}
              </p>
              <PremiumButton onClick={handleStart} size="lg">
                <Zap className="w-5 h-5 mr-2" />
                Начать игру
              </PremiumButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Screen */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-xl"
            >
              <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Игра окончена!</h2>
              {winner && (
                <p className="text-lg text-[var(--text-secondary)] mb-2">
                  Победитель: <span className="text-[var(--accent-primary)] font-semibold">{winner.userName}</span>
                </p>
              )}
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--accent-primary)]">{mySnake.score}</p>
                  <p className="text-xs text-[var(--text-muted)]">Ваш счёт</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-400">{aiScore}</p>
                  <p className="text-xs text-[var(--text-muted)]">Противник</p>
                </div>
              </div>
              <div className="flex gap-3">
                <PremiumButton onClick={handleStart} variant="default">
                  <Star className="w-4 h-4 mr-2" />
                  Играть снова
                </PremiumButton>
                <PremiumButton onClick={onGameEnd} variant="outline">
                  Выйти
                </PremiumButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Controls */}
      {isMobile && rtState?.active && !mySnake.isDead && (
        <div className="mt-4 grid grid-cols-3 gap-2 w-[180px]">
          <div />
          <button
            onClick={() => changeDirection({ x: 0, y: -1 })}
            className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ChevronUp className="w-8 h-8 text-white" />
          </button>
          <div />
          <button
            onClick={() => changeDirection({ x: -1, y: 0 })}
            className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={() => changeDirection({ x: 0, y: 1 })}
            className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ChevronDown className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={() => changeDirection({ x: 1, y: 0 })}
            className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>+1</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span>+3 ★</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>⚡ Speed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>↓ Shrink</span>
        </div>
      </div>
    </div>
  );
}
