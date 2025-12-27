"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/game-utils';
import { Button } from '../ui/button';
import { ArrowLeft, Gamepad2, Trophy, Zap, Heart, Star, Pause } from 'lucide-react';

// --- Game Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 180;
const GRAVITY = 0.35;
const JUMP_FORCE = -7.5;
const GAME_SPEED_INITIAL = 3.5;
const GAME_SPEED_INCREMENT = 0.0008;
const MAX_VELOCITY = 12;

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

type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover';

export default function VibeJet({ onGameEnd }: {
    onGameEnd: () => void,
    user: UserProfile,
    roomId: string
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    // Game state
    const [gameState, setGameState] = useState<GameState>('loading');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [canvasScale, setCanvasScale] = useState(1);

    // Refs for game loop
    const playerYRef = useRef(CANVAS_HEIGHT / 2);
    const velocityRef = useRef(0);
    const obstaclesRef = useRef<Obstacle[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const gameSpeedRef = useRef(GAME_SPEED_INITIAL);
    const scoreRef = useRef(0);
    const frameRef = useRef(0);
    const gameLoopRef = useRef<number | null>(null);
    const lastJumpTimeRef = useRef(0);
    const isPausedRef = useRef(false);
    const starsRef = useRef<{x: number, y: number}[]>([]);

    // Generate stars once
    useEffect(() => {
        const stars = [];
        for (let i = 0; i < 50; i++) {
            stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT
            });
        }
        starsRef.current = stars;
    }, []);

    // Loading state
    useEffect(() => {
        const timer = setTimeout(() => {
            setGameState('menu');
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    // Load high score
    useEffect(() => {
        try {
            const saved = localStorage.getItem('vibejet-highscore');
            if (saved) setHighScore(parseInt(saved, 10) || 0);
        } catch {
            // localStorage not available
        }
    }, []);

    // Responsive canvas
    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth - 32;
            const containerHeight = containerRef.current.clientHeight - 32;
            const scaleX = containerWidth / CANVAS_WIDTH;
            const scaleY = containerHeight / CANVAS_HEIGHT;
            setCanvasScale(Math.min(scaleX, scaleY, 1));
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Pause on visibility change
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && gameState === 'playing') {
                isPausedRef.current = true;
                setGameState('paused');
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [gameState]);

    // Jump handler with debounce
    const handleJump = useCallback(() => {
        if (gameState !== 'playing' || isPausedRef.current) return;

        const now = Date.now();
        if (now - lastJumpTimeRef.current < 80) return;
        lastJumpTimeRef.current = now;

        velocityRef.current = JUMP_FORCE;
        hapticFeedback('light');

        // Thrust particles
        for (let i = 0; i < 4; i++) {
            particlesRef.current.push({
                x: 80,
                y: playerYRef.current + PLAYER_SIZE / 2,
                vx: -Math.random() * 3 - 1,
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                color: `hsl(${280 + Math.random() * 40}, 100%, 60%)`
            });
        }
    }, [gameState]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (gameState === 'menu' || gameState === 'gameover') {
                    startGame();
                } else if (gameState === 'paused') {
                    resumeGame();
                } else if (gameState === 'playing') {
                    handleJump();
                }
            }
            if (e.code === 'Escape' && gameState === 'playing') {
                pauseGame();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, handleJump]);

    const startGame = useCallback(() => {
        playerYRef.current = CANVAS_HEIGHT / 2;
        velocityRef.current = 0;
        obstaclesRef.current = [];
        particlesRef.current = [];
        gameSpeedRef.current = GAME_SPEED_INITIAL;
        scoreRef.current = 0;
        frameRef.current = 0;
        lastJumpTimeRef.current = 0;
        isPausedRef.current = false;

        setScore(0);
        setGameState('playing');
        hapticFeedback('medium');

        setTimeout(() => canvasRef.current?.focus(), 50);
    }, []);

    const pauseGame = () => {
        isPausedRef.current = true;
        setGameState('paused');
    };

    const resumeGame = () => {
        isPausedRef.current = false;
        setGameState('playing');
        hapticFeedback('light');
        setTimeout(() => canvasRef.current?.focus(), 50);
    };

    const endGame = useCallback(() => {
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }

        setGameState('gameover');
        hapticFeedback('heavy');

        if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            try {
                localStorage.setItem('vibejet-highscore', scoreRef.current.toString());
            } catch {
                // localStorage not available
            }
        }
    }, [highScore]);

    // Game loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isRunning = true;

        const gameLoop = () => {
            if (!isRunning || isPausedRef.current) {
                gameLoopRef.current = requestAnimationFrame(gameLoop);
                return;
            }

            frameRef.current++;

            // Physics
            velocityRef.current += GRAVITY;
            if (velocityRef.current > MAX_VELOCITY) velocityRef.current = MAX_VELOCITY;
            if (velocityRef.current < -MAX_VELOCITY) velocityRef.current = -MAX_VELOCITY;
            playerYRef.current += velocityRef.current;

            // Top boundary
            if (playerYRef.current < 0) {
                playerYRef.current = 0;
                velocityRef.current = 0;
            }

            // Bottom boundary - game over
            if (playerYRef.current > CANVAS_HEIGHT - PLAYER_SIZE) {
                endGame();
                return;
            }

            // Spawn obstacles
            if (frameRef.current % 100 === 0) {
                const gapY = 80 + Math.random() * (CANVAS_HEIGHT - 160 - OBSTACLE_GAP);
                obstaclesRef.current.push({ x: CANVAS_WIDTH, gapY, passed: false });
            }

            // Update obstacles
            let collided = false;
            obstaclesRef.current = obstaclesRef.current.filter(obs => {
                obs.x -= gameSpeedRef.current;

                // Score
                if (!obs.passed && obs.x + OBSTACLE_WIDTH < 60) {
                    obs.passed = true;
                    scoreRef.current++;
                    setScore(scoreRef.current);
                    hapticFeedback('light');
                }

                // Collision
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
                p.life -= 0.04;
                return p.life > 0;
            });

            if (particlesRef.current.length > 50) {
                particlesRef.current = particlesRef.current.slice(-30);
            }

            // Speed increase
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
        // Background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        starsRef.current.forEach((star, i) => {
            const x = (star.x - frameRef.current * 0.3 * ((i % 3) + 1) * 0.3) % CANVAS_WIDTH;
            ctx.fillRect(x < 0 ? x + CANVAS_WIDTH : x, star.y, 2, 2);
        });

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Obstacles
        obstaclesRef.current.forEach(obs => {
            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(obs.x, 0, OBSTACLE_WIDTH, obs.gapY);
            ctx.fillRect(obs.x, obs.gapY + OBSTACLE_GAP, OBSTACLE_WIDTH, CANVAS_HEIGHT - obs.gapY - OBSTACLE_GAP);

            // Border
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.strokeRect(obs.x, 0, OBSTACLE_WIDTH, obs.gapY);
            ctx.strokeRect(obs.x, obs.gapY + OBSTACLE_GAP, OBSTACLE_WIDTH, CANVAS_HEIGHT - obs.gapY - OBSTACLE_GAP);
        });

        // Player jet
        const playerX = 60;
        const playerY = playerYRef.current;

        // Body
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.moveTo(playerX + PLAYER_SIZE, playerY + PLAYER_SIZE / 2);
        ctx.lineTo(playerX, playerY);
        ctx.lineTo(playerX + 10, playerY + PLAYER_SIZE / 2);
        ctx.lineTo(playerX, playerY + PLAYER_SIZE);
        ctx.closePath();
        ctx.fill();

        // Engine flame
        const flameSize = 8 + Math.sin(frameRef.current * 0.5) * 4;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(playerX, playerY + PLAYER_SIZE / 2 - 4);
        ctx.lineTo(playerX - flameSize, playerY + PLAYER_SIZE / 2);
        ctx.lineTo(playerX, playerY + PLAYER_SIZE / 2 + 4);
        ctx.closePath();
        ctx.fill();

        // Score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${scoreRef.current}`, 20, 35);
    };

    // Loading screen
    if (gameState === 'loading') {
        return (
            <div className="relative w-full h-full bg-[#0a0a1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-white/50 text-sm">Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-[#0a0a1a] flex flex-col">
            {/* Header */}
            <div className="absolute top-3 left-3 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onGameEnd}
                    className="bg-black/50 hover:bg-white/10 text-white rounded-xl border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="rounded-xl border border-white/10 outline-none"
                        style={{
                            width: CANVAS_WIDTH * canvasScale,
                            height: CANVAS_HEIGHT * canvasScale,
                            touchAction: 'none'
                        }}
                        tabIndex={0}
                        onClick={() => {
                            if (gameState === 'playing') handleJump();
                            canvasRef.current?.focus();
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            if (gameState === 'playing') handleJump();
                        }}
                    />

                    {/* Menu Overlay */}
                    {gameState === 'menu' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-10">
                            <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
                                <Gamepad2 className="w-8 h-8 text-violet-400" />
                            </div>
                            <h1 className="text-3xl font-black text-white mb-1">VIBE JET</h1>
                            <p className="text-white/50 text-sm mb-6">
                                {isMobile ? 'Тапните для полёта' : 'Пробел для полёта'}
                            </p>
                            <Button
                                onClick={startGame}
                                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-5 text-base"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                ИГРАТЬ
                            </Button>
                            {highScore > 0 && (
                                <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm">
                                    <Trophy className="w-4 h-4" />
                                    <span>Рекорд: {highScore}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pause Overlay */}
                    {gameState === 'paused' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-10">
                            <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
                                <Pause className="w-8 h-8 text-violet-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-4">ПАУЗА</h2>
                            <Button
                                onClick={resumeGame}
                                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-5"
                            >
                                ПРОДОЛЖИТЬ
                            </Button>
                        </div>
                    )}

                    {/* Game Over Overlay */}
                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-10">
                            {score >= highScore && score > 0 ? (
                                <>
                                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                                        <Star className="w-8 h-8 text-yellow-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-1">НОВЫЙ РЕКОРД!</h2>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                        <Heart className="w-8 h-8 text-red-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-1">GAME OVER</h2>
                                </>
                            )}
                            <p className="text-xl text-violet-400 font-bold mb-4">Счёт: {score}</p>
                            <Button
                                onClick={startGame}
                                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-5"
                            >
                                ИГРАТЬ СНОВА
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Jump Button */}
            {isMobile && gameState === 'playing' && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                    <button
                        onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleJump();
                        }}
                        className="w-20 h-20 rounded-full bg-violet-500/40 border-2 border-white/30 flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <Zap className="w-10 h-10 text-white" />
                    </button>
                </div>
            )}

            {/* Desktop hint */}
            {gameState === 'playing' && !isMobile && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/30 text-xs">
                    ПРОБЕЛ для полёта • ESC пауза
                </div>
            )}
        </div>
    );
}
