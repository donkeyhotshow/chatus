"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/game-utils';
import { sanitizeNumber, createVisibilityHandler } from '@/lib/game-stability';
import { Button } from '../ui/button';
import { ArrowLeft, Gamepad2, Trophy, Zap, Heart, Star, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 180;
const GRAVITY = 0.4;
const JUMP_FORCE = -8;
const GAME_SPEED_INITIAL = 4;
const GAME_SPEED_INCREMENT = 0.001;
const MAX_VELOCITY = 15; // Prevent physics explosion

interface Obstacle {
    x: number;
    gapY: number;
    passed: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

export default function VibeJet({ onGameEnd }: {
    onGameEnd: () => void,
    user: UserProfile,
    roomId: string
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isMobile = useIsMobile();

    // Game state
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Refs for game loop
    const playerYRef = useRef(CANVAS_HEIGHT / 2);
    const velocityRef = useRef(0);
    const obstaclesRef = useRef<Obstacle[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const gameSpeedRef = useRef(GAME_SPEED_INITIAL);
    const scoreRef = useRef(0);
    const frameRef = useRef(0);
    const gameLoopRef = useRef<number | null>(null);
    const isJumpingRef = useRef(false); // Prevent double-tap jump
    const lastJumpTimeRef = useRef(0); // Debounce jumps
    const isPausedRef = useRef(false);

    // Load high score
    useEffect(() => {
        const saved = localStorage.getItem('vibejet-highscore');
        if (saved) setHighScore(parseInt(saved, 10));
    }, []);

    // Pause game when tab is hidden
    useEffect(() => {
        const visibilityHandler = createVisibilityHandler(
            () => {
                if (gameState === 'playing') {
                    isPausedRef.current = true;
                    setGameState('paused');
                }
            },
            () => {
                // Don't auto-resume, let user click to resume
            }
        );
        visibilityHandler.attach();
        return () => visibilityHandler.detach();
    }, [gameState]);

    // Input handling with debounce to prevent double-tap issues
    const handleJump = useCallback(() => {
        if (gameState !== 'playing') return;

        // Debounce: prevent jumps within 50ms of each other
        const now = Date.now();
        if (now - lastJumpTimeRef.current < 50) return;
        if (isJumpingRef.current) return;

        isJumpingRef.current = true;
        lastJumpTimeRef.current = now;

        velocityRef.current = JUMP_FORCE;
        hapticFeedback('light');

        // Add thrust particles
        for (let i = 0; i < 5; i++) {
            particlesRef.current.push({
                x: 80,
                y: playerYRef.current + PLAYER_SIZE / 2,
                vx: -Math.random() * 3 - 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                color: `hsl(${280 + Math.random() * 40}, 100%, 60%)`
            });
        }

        // Reset jumping flag after short delay
        setTimeout(() => {
            isJumpingRef.current = false;
        }, 50);
    }, [gameState]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (gameState === 'menu') startGame();
                else if (gameState === 'gameover') startGame();
                else if (gameState === 'paused') resumeGame();
                else handleJump();
            }
            if (e.code === 'Escape' && gameState === 'playing') {
                pauseGame();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, handleJump]);

    const startGame = () => {
        // Reset all refs to initial state
        playerYRef.current = CANVAS_HEIGHT / 2;
        velocityRef.current = 0;
        obstaclesRef.current = [];
        particlesRef.current = [];
        gameSpeedRef.current = GAME_SPEED_INITIAL;
        scoreRef.current = 0;
        frameRef.current = 0;
        isJumpingRef.current = false;
        lastJumpTimeRef.current = 0;
        isPausedRef.current = false;

        setScore(0);
        setGameState('playing');
        hapticFeedback('medium');

        // Auto-focus canvas for keyboard input
        setTimeout(() => {
            canvasRef.current?.focus();
        }, 100);
    };

    const pauseGame = () => {
        isPausedRef.current = true;
        setGameState('paused');
    };

    const resumeGame = () => {
        isPausedRef.current = false;
        setGameState('playing');
        hapticFeedback('light');
    };

    const endGame = useCallback(() => {
        // Cancel any pending animation frame
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }

        setGameState('gameover');
        hapticFeedback('heavy');

        if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('vibejet-highscore', scoreRef.current.toString());
        }
    }, [highScore]);

    // Game loop with improved stability
    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isRunning = true;

        const gameLoop = () => {
            if (!isRunning || isPausedRef.current) return;

            frameRef.current++;

            // Physics with velocity clamping
            velocityRef.current += GRAVITY;
            velocityRef.current = sanitizeNumber(velocityRef.current, 0, -MAX_VELOCITY, MAX_VELOCITY);
            playerYRef.current += velocityRef.current;

            // Boundaries - top
            if (playerYRef.current < 0) {
                playerYRef.current = 0;
                velocityRef.current = 0;
            }

            // Boundaries - bottom (game over)
            if (playerYRef.current > CANVAS_HEIGHT - PLAYER_SIZE) {
                endGame();
                return;
            }

            // Spawn obstacles
            if (frameRef.current % 120 === 0) {
                const gapY = 100 + Math.random() * (CANVAS_HEIGHT - 200 - OBSTACLE_GAP);
                obstaclesRef.current.push({ x: CANVAS_WIDTH, gapY, passed: false });
            }

            // Update obstacles with collision detection
            let collided = false;
            obstaclesRef.current = obstaclesRef.current.filter(obs => {
                obs.x -= gameSpeedRef.current;

                // Score
                if (!obs.passed && obs.x + OBSTACLE_WIDTH < 80) {
                    obs.passed = true;
                    scoreRef.current++;
                    setScore(scoreRef.current);
                    hapticFeedback('light');
                }

                // Collision detection
                const playerLeft = 60;
                const playerRight = 60 + PLAYER_SIZE;
                const playerTop = playerYRef.current;
                const playerBottom = playerYRef.current + PLAYER_SIZE;

                if (playerRight > obs.x && playerLeft < obs.x + OBSTACLE_WIDTH) {
                    if (playerTop < obs.gapY || playerBottom > obs.gapY + OBSTACLE_GAP) {
                        collided = true;
                    }
                }

                return obs.x > -OBSTACLE_WIDTH;
            });

            if (collided) {
                endGame();
                return;
            }

            // Update particles
            particlesRef.current = particlesRef.current.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.03;
                return p.life > 0;
            });

            // Limit particles to prevent memory issues
            if (particlesRef.current.length > 100) {
                particlesRef.current = particlesRef.current.slice(-50);
            }

            // Increase speed gradually
            gameSpeedRef.current += GAME_SPEED_INCREMENT;

            // Render
            render(ctx);

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            isRunning = false;
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
                gameLoopRef.current = null;
            }
        };
    }, [gameState, endGame]);

    const render = (ctx: CanvasRenderingContext2D) => {
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a0a2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Stars background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + frameRef.current * 0.5) % CANVAS_WIDTH;
            const y = (i * 97) % CANVAS_HEIGHT;
            ctx.fillRect(x, y, 2, 2);
        }

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Obstacles
        obstaclesRef.current.forEach(obs => {
            // Top obstacle
            const topGradient = ctx.createLinearGradient(obs.x, 0, obs.x + OBSTACLE_WIDTH, 0);
            topGradient.addColorStop(0, '#7c3aed');
            topGradient.addColorStop(1, '#a855f7');
            ctx.fillStyle = topGradient;
            ctx.fillRect(obs.x, 0, OBSTACLE_WIDTH, obs.gapY);

            // Bottom obstacle
            ctx.fillRect(obs.x, obs.gapY + OBSTACLE_GAP, OBSTACLE_WIDTH, CANVAS_HEIGHT - obs.gapY - OBSTACLE_GAP);

            // Glow effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#7c3aed';
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.strokeRect(obs.x, 0, OBSTACLE_WIDTH, obs.gapY);
            ctx.strokeRect(obs.x, obs.gapY + OBSTACLE_GAP, OBSTACLE_WIDTH, CANVAS_HEIGHT - obs.gapY - OBSTACLE_GAP);
            ctx.shadowBlur = 0;
        });

        // Player (jet)
        const playerX = 60;
        const playerY = playerYRef.current;

        // Jet body
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.moveTo(playerX + PLAYER_SIZE, playerY + PLAYER_SIZE / 2);
        ctx.lineTo(playerX, playerY);
        ctx.lineTo(playerX + 10, playerY + PLAYER_SIZE / 2);
        ctx.lineTo(playerX, playerY + PLAYER_SIZE);
        ctx.closePath();
        ctx.fill();

        // Jet glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#a855f7';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Engine flame
        const flameSize = 10 + Math.sin(frameRef.current * 0.5) * 5;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(playerX, playerY + PLAYER_SIZE / 2 - 5);
        ctx.lineTo(playerX - flameSize, playerY + PLAYER_SIZE / 2);
        ctx.lineTo(playerX, playerY + PLAYER_SIZE / 2 + 5);
        ctx.closePath();
        ctx.fill();

        // Score display
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);
    };

    // Menu/GameOver overlay
    const renderOverlay = () => {
        if (gameState === 'menu') {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                    <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-6">
                        <Gamepad2 className="w-10 h-10 text-violet-400" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">VIBE JET</h1>
                    <p className="text-white/60 mb-2">Легкая 2D версия</p>
                    <p className="text-white/40 text-sm mb-8">
                        {isMobile ? 'Тапните для полёта' : 'Пробел или ↑ для полёта'}
                    </p>
                    <Button
                        onClick={startGame}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-6 text-lg min-h-[48px]"
                    >
                        <Zap className="w-5 h-5 mr-2" />
                        ИГРАТЬ
                    </Button>
                    {highScore > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-yellow-400">
                            <Trophy className="w-4 h-4" />
                            <span>Рекорд: {highScore}</span>
                        </div>
                    )}
                </div>
            );
        }

        if (gameState === 'paused') {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                    <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-6">
                        <Pause className="w-10 h-10 text-violet-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">ПАУЗА</h2>
                    <p className="text-white/40 text-sm mb-8">
                        {isMobile ? 'Тапните для продолжения' : 'Пробел для продолжения'}
                    </p>
                    <Button
                        onClick={resumeGame}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-6 text-lg min-h-[48px]"
                    >
                        <Zap className="w-5 h-5 mr-2" />
                        ПРОДОЛЖИТЬ
                    </Button>
                </div>
            );
        }

        if (gameState === 'gameover') {
            const isNewRecord = score > 0 && score >= highScore;
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                    <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mb-6",
                        isNewRecord ? "bg-yellow-500/20" : "bg-red-500/20"
                    )}>
                        {isNewRecord ? (
                            <Star className="w-10 h-10 text-yellow-400" />
                        ) : (
                            <Heart className="w-10 h-10 text-red-400" />
                        )}
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">
                        {isNewRecord ? 'НОВЫЙ РЕКОРД!' : 'GAME OVER'}
                    </h2>
                    <p className="text-2xl text-violet-400 font-bold mb-2">Счёт: {score}</p>
                    {isNewRecord && (
                        <p className="text-yellow-400 text-sm mb-4">🎉 Поздравляем!</p>
                    )}
                    <Button
                        onClick={startGame}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-6 text-lg mb-4 min-h-[48px]"
                    >
                        ИГРАТЬ СНОВА
                    </Button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="relative w-full h-full bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onGameEnd}
                    className="bg-black/60 backdrop-blur-md hover:bg-white/10 text-white rounded-xl border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                {gameState === 'playing' && (
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white font-bold">
                        {score}
                    </div>
                )}
            </div>

            {/* Game Canvas */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="max-w-full h-auto rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-violet-500/50"
                        style={{ maxHeight: '70vh', touchAction: 'none' }}
                        tabIndex={0}
                        onClick={() => {
                            if (gameState === 'playing') {
                                handleJump();
                            }
                            canvasRef.current?.focus();
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            if (gameState === 'playing') {
                                handleJump();
                            }
                            canvasRef.current?.focus();
                        }}
                    />
                    {renderOverlay()}
                </div>
            </div>

            {/* Mobile Jump Button */}
            {isMobile && gameState === 'playing' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                    <button
                        onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
                        className="w-24 h-24 rounded-full bg-violet-500/30 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center active:scale-90 transition-transform shadow-2xl"
                    >
                        <Zap className="w-12 h-12 text-white" />
                    </button>
                </div>
            )}

            {/* Controls hint */}
            {gameState === 'playing' && !isMobile && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs uppercase tracking-widest">
                    ПРОБЕЛ или ↑ для полёта
                </div>
            )}
        </div>
    );
}
