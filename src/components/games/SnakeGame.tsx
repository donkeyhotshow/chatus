"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, UserProfile } from '@/lib/types';
import { RealtimeSnakeService, SnakeGameState, SnakeData } from '@/services/RealtimeSnakeService';
import { db as realtimeDb } from '@/lib/firebase';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle, PremiumCardFooter } from '../ui/premium-card';
import { PremiumButton } from '../ui/premium-button';
import { Trophy, Zap, ArrowLeft, Gamepad2, Star, Flame, Clock } from 'lucide-react';
import { hapticFeedback } from '@/lib/game-utils';

interface SnakeGameProps {
  onGameEnd: () => void;
  updateGameState: (newState: Partial<GameState>) => void;
  gameState: GameState;
  user: UserProfile;
  otherUser?: UserProfile;
  roomId: string;
}

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SPEED = 140;
const MIN_SPEED = 50;
const SPEED_BOOST_DURATION = 3000;

// Типы еды
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
  const [rtState, setRtState] = useState<SnakeGameState | null>(null);
  const rtServiceRef = useRef<RealtimeSnakeService | null>(null);

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
    if (!rtState?.active) return;
    const interval = setInterval(() => {
      setGameTime(Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [rtState?.active]);

  // Input Handling
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

  // Spawn food with different types
  const spawnFood = useCallback(() => {
    let attempts = 0;
    let newFood: Food = {
      x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      type: 'normal',
      spawnTime: Date.now()
    };

    // Random food type
    const rand = Math.random();
    if (rand < 0.1) newFood.type = 'golden';      // 10% - 3 очка
    else if (rand < 0.2) newFood.type = 'speed';  // 10% - ускорение
    else if (rand < 0.25) newFood.type = 'shrink'; // 5% - уменьшение

    while (attempts < 10) {
      const onSnake = mySnake.body.some(p => p.x === newFood.x && p.y === newFood.y) ||
                      (aiSnake?.body.some(p => p.x === newFood.x && p.y === newFood.y));
      if (!onSnake) break;
      newFood.x = Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE));
      newFood.y = Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE));
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

  // Add particles effect
  const addParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x * GRID_SIZE + GRID_SIZE / 2,
        y: y * GRID_SIZE + GRID_SIZE / 2,
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
    setGameTime(0);
    setParticles([]);
    gameStartTimeRef.current = Date.now();

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

      // Update particles
      setParticles(prev => prev.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        p.size *= 0.95;
        return p.life > 0;
      }));

      // Update My Snake
      setMySnake(prev => {
        if (prev.isDead) return prev;

        const head = {
          x: prev.body[0].x + directionRef.current.x,
          y: prev.body[0].y + directionRef.current.y
        };

        // Wall wrapping - проход сквозь стены
        const gridWidth = CANVAS_SIZE / GRID_SIZE;
        const gridHeight = CANVAS_SIZE / GRID_SIZE;
        if (head.x < 0) head.x = gridWidth - 1;
        if (head.x >= gridWidth) head.x = 0;
        if (head.y < 0) head.y = gridHeight - 1;
        if (head.y >= gridHeight) head.y = 0;

        // Self collision
        if (prev.body.some(part => part.x === head.x && part.y === head.y)) {
          hapticFeedback('heavy');
          addParticles(head.x, head.y, '#ef4444', 15);
          return { ...prev, isDead: true };
        }

        // Other snake collision
        if (rtState.players) {
          const otherSnakes = Object.values(rtState.players).filter(p => p.userId !== user.id);
          for (const other of otherSnakes) {
            if (other.body.some(part => part.x === head.x && part.y === head.y)) {
              hapticFeedback('heavy');
              addParticles(head.x, head.y, '#ef4444', 15);
              return { ...prev, isDead: true };
            }
          }
        }

        const newBody = [head, ...prev.body];
        let newScore = prev.score;
        let ateFood = false;

        // Food collision
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
              // Shrink snake by 2 segments
              if (newBody.length > 5) {
                newBody.pop();
                newBody.pop();
              }
              break;
          }

          // Combo system
          setCombo(c => {
            const newCombo = c + 1;
            if (newCombo > 1) points += Math.floor(newCombo / 2);
            return newCombo;
          });

          if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
          comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000);

          newScore += points;
          addParticles(head.x, head.y, particleColor, 10);
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

          // Smarter AI: Move towards food with obstacle avoidance
          if (food) {
            const possibleDirs = [
              { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
            ].filter(d => !(d.x === -prev.direction.x && d.y === -prev.direction.y));

            let bestDir = nextDir;
            let bestScore = -Infinity;

            for (const d of possibleDirs) {
              const nextHead = { x: head.x + d.x, y: head.y + d.y };

              // Check if valid move
              if (nextHead.x < 0 || nextHead.x >= 20 || nextHead.y < 0 || nextHead.y >= 20) continue;
              if (prev.body.some(p => p.x === nextHead.x && p.y === nextHead.y)) continue;
              if (mySnake.body.some(p => p.x === nextHead.x && p.y === nextHead.y)) continue;

              // Score based on distance to food
              const dist = Math.abs(nextHead.x - food.x) + Math.abs(nextHead.y - food.y);
              const score = -dist + Math.random() * 2; // Add randomness

              if (score > bestScore) {
                bestScore = score;
                bestDir = d;
              }
            }
            nextDir = bestDir;
          }

          const newAiHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };

          // Wall wrapping for AI
          if (newAiHead.x < 0) newAiHead.x = 19;
          if (newAiHead.x >= 20) newAiHead.x = 0;
          if (newAiHead.y < 0) newAiHead.y = 19;
          if (newAiHead.y >= 20) newAiHead.y = 0;

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
  }, [rtState?.active, rtState?.players, mySnake.isDead, mySnake.score, aiSnake, food, speedBoost, user.id, gameState.hostId, otherUser, spawnFood, addParticles]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
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

      // Pulsing effect
      const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
      const size = (GRID_SIZE / 2 - 3) * pulse;

      ctx.fillStyle = foodColor;
      ctx.shadowBlur = 12;
      ctx.shadowColor = glowColor;
      ctx.beginPath();
      ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        size, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // Food type indicator
      if (food.type !== 'normal') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const symbol = food.type === 'golden' ? '★' : food.type === 'speed' ? '⚡' : '↓';
        ctx.fillText(symbol, food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2 + 4);
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
        const size = GRID_SIZE - padding * 2;
        const x = part.x * GRID_SIZE + padding;
        const y = part.y * GRID_SIZE + padding;

        // Glow for head
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

        // Eyes
        if (isHead && !player.isDead) {
          ctx.fillStyle = 'white';
          const eyeSize = 3;
          const eyeOffset = 5;
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
  }, [rtState, food, particles]);

  const isGameOver = rtState?.active && Object.values(rtState.players || {}).every(p => p.isDead);
  const winner = isGameOver ? Object.values(rtState.players || {}).sort((a, b) => b.score - a.score)[0] : null;
  const aiScore = Object.values(rtState?.players || {}).find(p => p.userId !== user.id)?.score || 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <PremiumCard className="w-full max-w-lg">
        <PremiumCardHeader>
          <div className="flex items-center justify-between">
            <PremiumButton variant="ghost" size="sm" onClick={onGameEnd}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </PremiumButton>
            <PremiumCardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              Snake Battle
            </PremiumCardTitle>
            <div className="w-20" />
          </div>
        </PremiumCardHeader>

        <PremiumCardContent className="flex flex-col items-center gap-4">
          {/* Score Display */}
          <div className="flex justify-between w-full px-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-bold">{mySnake.score}</span>
              {combo > 1 && (
                <span className="text-orange-400 text-sm flex items-center gap-1">
                  <Flame className="w-3 h-3" />x{combo}
                </span>
              )}
            </div>
            {speedBoost && (
              <span className="text-blue-400 text-sm flex items-center gap-1">
                <Zap className="w-3 h-3" />BOOST
              </span>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{gameTime}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-pink-400" />
              <span className="text-white font-bold">{aiScore}</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="rounded-lg border border-purple-500/30 shadow-lg shadow-purple-500/20"
              style={{ touchAction: 'none' }}
            />

            {/* Game Over Overlay */}
            <AnimatePresence>
              {isGameOver && winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg"
                >
                  <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {winner.userName} победил!
                  </h2>
                  <p className="text-gray-300 mb-4">Счёт: {winner.score}</p>
                  <PremiumButton onClick={handleStart}>
                    Играть снова
                  </PremiumButton>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start Overlay */}
            {!rtState?.active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
                <Gamepad2 className="w-16 h-16 text-purple-400 mb-4" />
                <h2 className="text-xl font-bold text-white mb-4">Snake Battle</h2>
                <PremiumButton onClick={handleStart}>
                  Начать игру
                </PremiumButton>
              </div>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
            <div />
            <PremiumButton
              variant="outline"
              size="sm"
              onTouchStart={() => { if (directionRef.current.y === 0) nextDirectionRef.current = { x: 0, y: -1 }; }}
            >
              ↑
            </PremiumButton>
            <div />
            <PremiumButton
              variant="outline"
              size="sm"
              onTouchStart={() => { if (directionRef.current.x === 0) nextDirectionRef.current = { x: -1, y: 0 }; }}
            >
              ←
            </PremiumButton>
            <PremiumButton
              variant="outline"
              size="sm"
              onTouchStart={() => { if (directionRef.current.y === 0) nextDirectionRef.current = { x: 0, y: 1 }; }}
            >
              ↓
            </PremiumButton>
            <PremiumButton
              variant="outline"
              size="sm"
              onTouchStart={() => { if (directionRef.current.x === 0) nextDirectionRef.current = { x: 1, y: 0 }; }}
            >
              →
            </PremiumButton>
          </div>

          <p className="text-gray-400 text-sm text-center">
            Используйте стрелки или WASD для управления
          </p>
        </PremiumCardContent>
      </PremiumCard>
    </div>
  );
}
