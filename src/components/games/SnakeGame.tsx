"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, UserProfile } from '@/lib/types';
import { RealtimeSnakeService, SnakeGameState, SnakeData } from '@/services/RealtimeSnakeService';
import { db as realtimeDb } from '@/lib/firebase';
// useToast removed - not currently used
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle, PremiumCardFooter } from '../ui/premium-card';
import { PremiumButton } from '../ui/premium-button';
import { Trophy, Zap, ArrowLeft, Gamepad2 } from 'lucide-react';
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
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;

export function SnakeGame({ onGameEnd, gameState, user, otherUser, roomId }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rtState, setRtState] = useState<SnakeGameState | null>(null);
  const rtServiceRef = useRef<RealtimeSnakeService | null>(null);
  // toast removed - not currently used

  // Local snake state
  const [mySnake, setMySnake] = useState<Omit<SnakeData, 'userId'>>({
    userName: user.name,
    body: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
    direction: { x: 1, y: 0 },
    score: 0,
    color: '#8B5CF6', // Violet
    isDead: false
  });

  // AI snake state (only managed by host)
  const [aiSnake, setAiSnake] = useState<Omit<SnakeData, 'userId'> | null>(null);

  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const isInitializedRef = useRef(false);
  const gameActiveRef = useRef(false);

  // Initialize RTDB Service with error handling
  useEffect(() => {
    if (!realtimeDb || !roomId || !user) return;
    if (isInitializedRef.current) return; // Prevent double initialization

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

  // Sync local snake to RTDB with error handling
  useEffect(() => {
    if (rtServiceRef.current && rtState?.active && !mySnake.isDead) {
      try {
        rtServiceRef.current.updateMySnake(mySnake);
      } catch (error) {
        console.error('[SnakeGame] Failed to sync snake:', error);
      }
    }
  }, [mySnake, rtState?.active]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp': if (y === 0) nextDirectionRef.current = { x: 0, y: -1 }; break;
        case 'ArrowDown': if (y === 0) nextDirectionRef.current = { x: 0, y: 1 }; break;
        case 'ArrowLeft': if (x === 0) nextDirectionRef.current = { x: -1, y: 0 }; break;
        case 'ArrowRight': if (x === 0) nextDirectionRef.current = { x: 1, y: 0 }; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const spawnFood = useCallback(() => {
    if (!rtServiceRef.current) return;

    // Generate food position avoiding snake bodies
    let attempts = 0;
    let newFood = {
      x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
    };

    // Try to avoid spawning on snakes (max 10 attempts)
    while (attempts < 10) {
      const onSnake = mySnake.body.some(p => p.x === newFood.x && p.y === newFood.y) ||
                      (aiSnake?.body.some(p => p.x === newFood.x && p.y === newFood.y));
      if (!onSnake) break;

      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
      };
      attempts++;
    }

    try {
      rtServiceRef.current.updateFood(newFood);
    } catch (error) {
      console.error('[SnakeGame] Failed to spawn food:', error);
    }
  }, [mySnake.body, aiSnake?.body]);

  const handleStart = useCallback(() => {
    // BUG #9 FIX: Check if service is ready before starting
    if (!rtServiceRef.current) {
      console.warn('[SnakeGame] Service not ready, cannot start');
      return;
    }

    const isHost = user.id === gameState.hostId || !gameState.hostId;
    const startX = isHost ? 5 : 15;
    const startY = isHost ? 10 : 10;
    const startDir = isHost ? { x: 1, y: 0 } : { x: -1, y: 0 };

    const initialSnake = {
      userName: user.name,
      body: [{ x: startX, y: startY }, { x: startX - startDir.x, y: startY }, { x: startX - startDir.x * 2, y: startY }],
      direction: startDir,
      score: 0,
      color: isHost ? '#8B5CF6' : '#EC4899',
      isDead: false
    };

    directionRef.current = startDir;
    nextDirectionRef.current = startDir;
    setMySnake(initialSnake);

    // Always set game state if we're starting (either as host or if no host exists)
    rtServiceRef.current.setGameState(true, Date.now());
    spawnFood();

    // Spawn AI if no other user
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
      rtServiceRef.current.updateOtherSnake('ai-bot', initialAiSnake);
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
      const speed = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(mySnake.score / 5) * 10);

      if (now - lastMoveTimeRef.current < speed) {
        rafId = requestAnimationFrame(move);
        return;
      }

      lastMoveTimeRef.current = now;
      directionRef.current = nextDirectionRef.current;

      // Update My Snake
      setMySnake(prev => {
        if (prev.isDead) return prev;

        const head = {
          x: prev.body[0].x + directionRef.current.x,
          y: prev.body[0].y + directionRef.current.y
        };

        // Wall collision
        if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE || head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
          hapticFeedback('heavy');
          return { ...prev, isDead: true };
        }

        // Self collision
        if (prev.body.some(part => part.x === head.x && part.y === head.y)) {
          hapticFeedback('heavy');
          return { ...prev, isDead: true };
        }

        // Other snake collision
        if (rtState.players) {
          const otherSnakes = Object.values(rtState.players).filter(p => p.userId !== user.id);
          for (const other of otherSnakes) {
            if (other.body.some(part => part.x === head.x && part.y === head.y)) {
              hapticFeedback('heavy');
              return { ...prev, isDead: true };
            }
          }
        }

        const newBody = [head, ...prev.body];
        let newScore = prev.score;

        // Food collision
        if (rtState.food && head.x === rtState.food.x && head.y === rtState.food.y) {
          newScore += 1;
          spawnFood();
          hapticFeedback('light');
        } else {
          newBody.pop();
        }

        return { ...prev, body: newBody, score: newScore, direction: directionRef.current };
      });

      // Update AI Snake (only by host)
      if (isHost && !otherUser && aiSnake && !aiSnake.isDead) {
        setAiSnake(prev => {
            if (!prev || prev.isDead) return prev;

            const head = prev.body[0];
            const food = rtState.food;
            let nextDir = prev.direction;

            // Simple AI: Move towards food
            if (food) {
                if (food.x < head.x && prev.direction.x === 0) nextDir = { x: -1, y: 0 };
                else if (food.x > head.x && prev.direction.x === 0) nextDir = { x: 1, y: 0 };
                else if (food.y < head.y && prev.direction.y === 0) nextDir = { x: 0, y: -1 };
                else if (food.y > head.y && prev.direction.y === 0) nextDir = { x: 0, y: 1 };
            }

            // Avoid walls
            const nextHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };
            if (nextHead.x < 0 || nextHead.x >= 20 || nextHead.y < 0 || nextHead.y >= 20) {
                const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                for (const d of dirs) {
                    const h = { x: head.x + d.x, y: head.y + d.y };
                    if (h.x >= 0 && h.x < 20 && h.y >= 0 && h.y < 20) {
                        nextDir = d;
                        break;
                    }
                }
            }

            const newAiHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };

            // AI Self collision check
            if (prev.body.some(part => part.x === newAiHead.x && part.y === newAiHead.y)) {
                return { ...prev, isDead: true };
            }

            const newAiBody = [newAiHead, ...prev.body];
            let newAiScore = prev.score;
            let isAiDead = false;

            if (newAiHead.x < 0 || newAiHead.x >= 20 || newAiHead.y < 0 || newAiHead.y >= 20) isAiDead = true;

            if (food && newAiHead.x === food.x && newAiHead.y === food.y) {
                newAiScore++;
                spawnFood();
            } else {
                newAiBody.pop();
            }

            const updatedAi = { ...prev, body: newAiBody, score: newAiScore, direction: nextDir, isDead: isAiDead };
            rtServiceRef.current?.updateOtherSnake('ai-bot', updatedAi);
            return updatedAi;
        });
      }

      rafId = requestAnimationFrame(move);
    };

    rafId = requestAnimationFrame(move);
    return () => cancelAnimationFrame(rafId);
  }, [rtState?.active, rtState?.food, rtState?.players, mySnake.isDead, aiSnake, user.id, gameState.hostId, otherUser, spawnFood, mySnake.score]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
    }

    // Draw Food
    if (rtState?.food) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';
      ctx.beginPath();
      ctx.arc(
        rtState.food.x * GRID_SIZE + GRID_SIZE / 2,
        rtState.food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 4,
        0, Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Snakes
    if (rtState?.players) {
      Object.values(rtState.players).forEach(player => {
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = player.color;

        player.body.forEach((part, index) => {
          const isHead = index === 0;
          const opacity = isHead ? 1 : 1 - (index / player.body.length) * 0.6;
          ctx.globalAlpha = player.isDead ? opacity * 0.3 : opacity;

          const padding = isHead ? 1 : 2;
          const size = GRID_SIZE - padding * 2;

          const x = part.x * GRID_SIZE + padding;
          const y = part.y * GRID_SIZE + padding;

          ctx.beginPath();
          // Fallback for roundRect
          if (ctx.roundRect) {
            ctx.roundRect(x, y, size, size, isHead ? 6 : 4);
          } else {
            ctx.rect(x, y, size, size);
          }
          ctx.fill();

          // Draw eyes for head
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
        ctx.shadowBlur = 0;
      });
    }
  }, [rtState]);

  const isGameOver = rtState?.active && Object.values(rtState.players || {}).every(p => p.isDead);
  const winner = isGameOver ? Object.values(rtState.players || {}).sort((a, b) => b.score - a.score)[0] : null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
      <PremiumCard variant="glass" glow className="w-full max-w-lg overflow-visible">
        <PremiumCardHeader>
          <PremiumCardTitle className="flex items-center justify-center gap-2">
            <Gamepad2 className="text-emerald-500" />
            Змейка 2.0
          </PremiumCardTitle>
          <div className="flex justify-between items-center mt-2 px-4">
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Вы</span>
              <span className="text-xl font-black text-violet-400">{mySnake.score}</span>
            </div>
            <div className="text-white/20 font-black text-xl italic">VS</div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                {otherUser ? 'Оппонент' : 'AI Bot 🤖'}
              </span>
              <span className="text-xl font-black text-pink-400">
                {Object.values(rtState?.players || {}).find(p => p.userId !== user.id)?.score || 0}
              </span>
            </div>
          </div>
        </PremiumCardHeader>

        <PremiumCardContent className="flex flex-col items-center gap-4 relative">
          <div className="relative border border-white/10 rounded-xl overflow-hidden bg-black/40 backdrop-blur-sm">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="max-w-full h-auto"
            />

            <AnimatePresence>
              {(!rtState?.active || isGameOver) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6"
                >
                  {isGameOver ? (
                    <>
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4"
                      >
                        <Trophy className="w-8 h-8 text-yellow-500" />
                      </motion.div>
                      <h2 className="text-3xl font-black text-white mb-1">
                        {winner?.userId === user.id ? "ПОБЕДА!" : (winner?.userId === 'ai-bot' ? "БОТ ВЫИГРАЛ!" : "ПОРАЖЕНИЕ")}
                      </h2>
                      <p className="text-white/50 mb-6">
                        Счет: {winner?.score}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Готовы?</h2>
                      <p className="text-white/40 text-sm mb-6 max-w-[200px]">
                        Используйте стрелки для управления змейкой
                      </p>
                    </>
                  )}

                  <PremiumButton
                    onClick={handleStart}
                    className="w-full max-w-[200px]"
                    glow
                  >
                    {isGameOver ? "ИГРАТЬ СНОВА" : "НАЧАТЬ"}
                  </PremiumButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Controls - P1 Fix: 48px touch targets for accessibility */}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            <div />
            <button
              onClick={() => { if (directionRef.current.y === 0) nextDirectionRef.current = { x: 0, y: -1 }; hapticFeedback('light'); }}
              className="w-14 h-14 min-w-[48px] min-h-[48px] bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10 active:scale-95 transition-transform touch-target"
              aria-label="Вверх"
            >
              <Zap className="w-6 h-6 rotate-0" />
            </button>
            <div />
            <button
              onClick={() => { if (directionRef.current.x === 0) nextDirectionRef.current = { x: -1, y: 0 }; hapticFeedback('light'); }}
              className="w-14 h-14 min-w-[48px] min-h-[48px] bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10 active:scale-95 transition-transform touch-target"
              aria-label="Влево"
            >
              <Zap className="w-6 h-6 -rotate-90" />
            </button>
            <button
              onClick={() => { if (directionRef.current.y === 0) nextDirectionRef.current = { x: 0, y: 1 }; hapticFeedback('light'); }}
              className="w-14 h-14 min-w-[48px] min-h-[48px] bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10 active:scale-95 transition-transform touch-target"
              aria-label="Вниз"
            >
              <Zap className="w-6 h-6 rotate-180" />
            </button>
            <button
              onClick={() => { if (directionRef.current.x === 0) nextDirectionRef.current = { x: 1, y: 0 }; hapticFeedback('light'); }}
              className="w-14 h-14 min-w-[48px] min-h-[48px] bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10 active:scale-95 transition-transform touch-target"
              aria-label="Вправо"
            >
              <Zap className="w-6 h-6 rotate-90" />
            </button>
          </div>
        </PremiumCardContent>

        <PremiumCardFooter>
          <PremiumButton
            onClick={() => {
              // BUG #10 FIX: Cleanup service before exiting to prevent timeout
              if (rtServiceRef.current) {
                rtServiceRef.current.destroy();
                rtServiceRef.current = null;
              }
              onGameEnd();
            }}
            variant="ghost"
            size="sm"
            className="w-full opacity-50 hover:opacity-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться в лобби
          </PremiumButton>
        </PremiumCardFooter>
      </PremiumCard>
    </div>
  );
}
