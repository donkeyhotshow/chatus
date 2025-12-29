"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/game-utils';
import { Button } from '../ui/button';
import { Gamepad2, Trophy, Zap, Heart, Star, Pause } from 'lucide-react';

// --- Constants ---
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 40;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_GAP = 200;
const GRAVITY = 0.32;
const JUMP_FORCE = -7;
const GAME_SPEED_INITIAL = 4;
const GAME_SPEED_INCREMENT = 0.0006;
const MAX_VELOCITY = 10;

// 3D-like perspective constants
const HORIZON_Y = CANVAS_HEIGHT * 0.35;
const GROUND_Y = CANVAS_HEIGHT * 0.85;
const PERSPECTIVE_SCALE = 0.7;

interface Obstacle {
    x: number;
    gapY: number;
    passed: boolean;
    z: number; // depth for 3D effect
}

interface Particle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    color: string;
    size: number;
}

interface Cloud {
    x: number;
    y: number;
    z: number;
    size: number;
    speed: number;
}

interface Building {
    x: number;
    width: number;
    height: number;
    color: string;
    z: number;
}

type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover';

export default function VibeJet() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    const [gameState, setGameState] = useState<GameState>('loading');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [canvasScale, setCanvasScale] = useState(1);

    // Game refs
    const playerYRef = useRef(CANVAS_HEIGHT / 2);
    const playerTiltRef = useRef(0);
    const velocityRef = useRef(0);
    const obstaclesRef = useRef<Obstacle[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cloudsRef = useRef<Cloud[]>([]);
    const buildingsRef = useRef<Building[]>([]);
    const gameSpeedRef = useRef(GAME_SPEED_INITIAL);
    const scoreRef = useRef(0);
    const frameRef = useRef(0);
    const gameLoopRef = useRef<number | null>(null);
    const lastJumpTimeRef = useRef(0);
    const isPausedRef = useRef(false);

    // Initialize clouds and buildings
    useEffect(() => {
        const clouds: Cloud[] = [];
        for (let i = 0; i < 8; i++) {
            clouds.push({
                x: Math.random() * CANVAS_WIDTH * 1.5,
                y: HORIZON_Y * 0.3 + Math.random() * HORIZON_Y * 0.5,
                z: 0.3 + Math.random() * 0.5,
                size: 30 + Math.random() * 50,
                speed: 0.3 + Math.random() * 0.5
            });
        }
        cloudsRef.current = clouds;

        const buildings: Building[] = [];
        const colors = ['#1a1a2e', '#16213e', '#0f3460', '#1a1a3e'];
        for (let i = 0; i < 15; i++) {
            buildings.push({
                x: i * 120 - 200,
                width: 60 + Math.random() * 80,
                height: 80 + Math.random() * 150,
                color: colors[Math.floor(Math.random() * colors.length)],
                z: 0.5 + Math.random() * 0.3
            });
        }
        buildingsRef.current = buildings;
    }, []);

    // Loading
    useEffect(() => {
        const timer = setTimeout(() => setGameState('menu'), 400);
        return () => clearTimeout(timer);
    }, []);

    // Load high score
    useEffect(() => {
        try {
            const saved = localStorage.getItem('vibejet-highscore');
            if (saved) setHighScore(parseInt(saved, 10) || 0);
        } catch { /* ignore */ }
    }, []);

    // Responsive canvas - ИСПРАВЛЕННОЕ масштабирование для мобильных
    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            // На мобильных оставляем место для кнопки управления
            const bottomPadding = isMobile ? 100 : 32;
            const sidePadding = isMobile ? 8 : 32;
            const w = containerRef.current.clientWidth - sidePadding * 2;
            const h = containerRef.current.clientHeight - bottomPadding;

            // Вычисляем масштаб чтобы canvas полностью помещался
            const scaleX = w / CANVAS_WIDTH;
            const scaleY = h / CANVAS_HEIGHT;
            const scale = Math.min(scaleX, scaleY);

            // Не ограничиваем масштаб - пусть заполняет доступное пространство
            setCanvasScale(Math.max(0.3, scale)); // минимум 0.3 чтобы было видно
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        window.addEventListener('orientationchange', updateScale);
        return () => {
            window.removeEventListener('resize', updateScale);
            window.removeEventListener('orientationchange', updateScale);
        };
    }, [isMobile]);

    // Pause on visibility change
    useEffect(() => {
        const handler = () => {
            if (document.hidden && gameState === 'playing') {
                isPausedRef.current = true;
                setGameState('paused');
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [gameState]);

    const handleJump = useCallback(() => {
        if (gameState !== 'playing' || isPausedRef.current) return;
        const now = Date.now();
        if (now - lastJumpTimeRef.current < 80) return;
        lastJumpTimeRef.current = now;

        velocityRef.current = JUMP_FORCE;
        playerTiltRef.current = -15;
        hapticFeedback('light');

        // Thrust particles
        for (let i = 0; i < 6; i++) {
            particlesRef.current.push({
                x: 100, y: playerYRef.current + PLAYER_HEIGHT / 2, z: 1,
                vx: -Math.random() * 4 - 2,
                vy: (Math.random() - 0.5) * 3,
                vz: (Math.random() - 0.5) * 0.5,
                life: 1,
                color: `hsl(${20 + Math.random() * 30}, 100%, 60%)`,
                size: 4 + Math.random() * 4
            });
        }
    }, [gameState]);

    // Keyboard
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (gameState === 'menu' || gameState === 'gameover') startGame();
                else if (gameState === 'paused') resumeGame();
                else if (gameState === 'playing') handleJump();
            }
            if (e.code === 'Escape' && gameState === 'playing') pauseGame();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, handleJump]);

    const startGame = useCallback(() => {
        // P0 FIX: Start player in safe zone (middle of screen, slightly above center)
        playerYRef.current = CANVAS_HEIGHT * 0.4; // Start higher to avoid immediate ground collision
        playerTiltRef.current = 0;
        velocityRef.current = -2; // Small upward velocity to give player time to react
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
            try { localStorage.setItem('vibejet-highscore', scoreRef.current.toString()); } catch { /* ignore */ }
        }
    }, [highScore]);

    // Game loop
    useEffect(() => {
        if (gameState !== 'playing') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let running = true;

        const loop = () => {
            if (!running || isPausedRef.current) {
                gameLoopRef.current = requestAnimationFrame(loop);
                return;
            }

            frameRef.current++;

            // Physics
            velocityRef.current += GRAVITY;
            velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocityRef.current));
            playerYRef.current += velocityRef.current;

            // Tilt animation
            playerTiltRef.current += (velocityRef.current * 2 - playerTiltRef.current) * 0.1;
            playerTiltRef.current = Math.max(-25, Math.min(25, playerTiltRef.current));

            // Boundaries
            if (playerYRef.current < 50) {
                playerYRef.current = 50;
                velocityRef.current = 0;
            }
            if (playerYRef.current > GROUND_Y - PLAYER_HEIGHT) {
                endGame();
                return;
            }

            // Spawn obstacles - P0 FIX: Delay first obstacle spawn
            // Don't spawn obstacles in first 2 seconds (120 frames at 60fps)
            if (frameRef.current > 120 && frameRef.current % 90 === 0) {
                const gapY = 100 + Math.random() * (CANVAS_HEIGHT - 250 - OBSTACLE_GAP);
                obstaclesRef.current.push({ x: CANVAS_WIDTH + 100, gapY, passed: false, z: 1 });
            }

            // Update obstacles
            let collided = false;
            obstaclesRef.current = obstaclesRef.current.filter(obs => {
                obs.x -= gameSpeedRef.current;

                if (!obs.passed && obs.x + OBSTACLE_WIDTH < 100) {
                    obs.passed = true;
                    scoreRef.current++;
                    setScore(scoreRef.current);
                    hapticFeedback('light');
                }

                // P0 FIX: Improved collision detection with grace period and smaller hitbox
                // Give player a few frames of invincibility at start
                if (frameRef.current < 30) return obs.x > -OBSTACLE_WIDTH;

                const px = 100, py = playerYRef.current;
                // Reduced hitbox for more forgiving gameplay (60% of visual size)
                const pw = PLAYER_WIDTH * 0.6, ph = PLAYER_HEIGHT * 0.5;
                // Add horizontal offset to center the hitbox
                const hitboxOffsetX = (PLAYER_WIDTH - pw) / 2;
                const hitboxOffsetY = (PLAYER_HEIGHT - ph) / 2;

                const playerLeft = px - PLAYER_WIDTH / 2 + hitboxOffsetX;
                const playerRight = playerLeft + pw;
                const playerTop = py + hitboxOffsetY;
                const playerBottom = playerTop + ph;

                // Check if player overlaps with obstacle
                if (playerRight > obs.x && playerLeft < obs.x + OBSTACLE_WIDTH) {
                    // Player is horizontally within obstacle bounds
                    // Check if player is outside the gap (collision)
                    if (playerTop < obs.gapY || playerBottom > obs.gapY + OBSTACLE_GAP) {
                        collided = true;
                    }
                }

                return obs.x > -OBSTACLE_WIDTH;
            });

            if (collided) { endGame(); return; }

            // Update clouds
            cloudsRef.current.forEach(c => {
                c.x -= c.speed * gameSpeedRef.current * 0.3;
                if (c.x < -c.size * 2) c.x = CANVAS_WIDTH + c.size;
            });

            // Update buildings
            buildingsRef.current.forEach(b => {
                b.x -= gameSpeedRef.current * b.z * 0.5;
                if (b.x < -b.width) b.x = CANVAS_WIDTH + 50;
            });

            // Update particles
            particlesRef.current = particlesRef.current.filter(p => {
                p.x += p.vx; p.y += p.vy; p.z += p.vz;
                p.life -= 0.04; p.size *= 0.96;
                return p.life > 0;
            });
            if (particlesRef.current.length > 60) particlesRef.current = particlesRef.current.slice(-40);

            // Engine particles
            if (frameRef.current % 3 === 0) {
                particlesRef.current.push({
                    x: 100 - PLAYER_WIDTH / 2,
                    y: playerYRef.current + PLAYER_HEIGHT / 2 + (Math.random() - 0.5) * 10,
                    z: 1,
                    vx: -2 - Math.random() * 2,
                    vy: (Math.random() - 0.5) * 1,
                    vz: 0,
                    life: 0.6,
                    color: `hsl(${280 + Math.random() * 40}, 100%, 60%)`,
                    size: 3 + Math.random() * 3
                });
            }

            gameSpeedRef.current += GAME_SPEED_INCREMENT;
            render(ctx);
            gameLoopRef.current = requestAnimationFrame(loop);
        };

        gameLoopRef.current = requestAnimationFrame(loop);
        return () => { running = false; if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
    }, [gameState, endGame]);

    const render = (ctx: CanvasRenderingContext2D) => {
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        skyGrad.addColorStop(0, '#0a0a1a');
        skyGrad.addColorStop(0.4, '#1a1a3a');
        skyGrad.addColorStop(1, '#2a1a4a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137 + frameRef.current * 0.1) % CANVAS_WIDTH;
            const sy = (i * 97) % (HORIZON_Y * 0.8);
            ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // Clouds (background)
        cloudsRef.current.forEach(c => {
            ctx.globalAlpha = 0.3 * c.z;
            ctx.fillStyle = '#4a4a6a';
            drawCloud(ctx, c.x, c.y, c.size * c.z);
        });
        ctx.globalAlpha = 1;

        // Buildings (parallax background)
        buildingsRef.current.forEach(b => {
            const scale = b.z * PERSPECTIVE_SCALE;
            const h = b.height * scale;
            const w = b.width * scale;
            const y = GROUND_Y - h;

            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, y, w, h);

            // Windows
            ctx.fillStyle = 'rgba(255,200,100,0.3)';
            for (let wy = y + 10; wy < GROUND_Y - 10; wy += 20) {
                for (let wx = b.x + 8; wx < b.x + w - 8; wx += 15) {
                    if (Math.random() > 0.3) ctx.fillRect(wx, wy, 6, 8);
                }
            }
        });

        // Ground
        const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
        groundGrad.addColorStop(0, '#1a1a2e');
        groundGrad.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        // Ground line
        ctx.strokeStyle = '#3a3a5a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
        ctx.stroke();

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Obstacles (3D pillars)
        obstaclesRef.current.forEach(obs => {
            drawPillar(ctx, obs.x, 0, OBSTACLE_WIDTH, obs.gapY, true);
            drawPillar(ctx, obs.x, obs.gapY + OBSTACLE_GAP, OBSTACLE_WIDTH, CANVAS_HEIGHT - obs.gapY - OBSTACLE_GAP, false);
        });

        // Player jet
        drawJet(ctx, 100, playerYRef.current, playerTiltRef.current);

        // HUD
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${scoreRef.current}`, 25, 40);

        // Speed indicator
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${(gameSpeedRef.current * 50).toFixed(0)} km/h`, 25, 60);
    };

    const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawPillar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isTop: boolean) => {
        // Main pillar
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0, '#5b21b6');
        grad.addColorStop(0.5, '#7c3aed');
        grad.addColorStop(1, '#4c1d95');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // 3D edge
        ctx.fillStyle = '#3b0764';
        ctx.fillRect(x + w - 8, y, 8, h);

        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#7c3aed';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;

        // Cap
        const capH = 15;
        ctx.fillStyle = '#a855f7';
        if (isTop) {
            ctx.fillRect(x - 5, y + h - capH, w + 10, capH);
        } else {
            ctx.fillRect(x - 5, y, w + 10, capH);
        }
    };

    const drawJet = (ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number) => {
        ctx.save();
        ctx.translate(x, y + PLAYER_HEIGHT / 2);
        ctx.rotate(tilt * Math.PI / 180);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(5, PLAYER_HEIGHT / 2 + 5, PLAYER_WIDTH / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.moveTo(PLAYER_WIDTH / 2, 0);
        ctx.lineTo(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 3);
        ctx.lineTo(-PLAYER_WIDTH / 3, 0);
        ctx.lineTo(-PLAYER_WIDTH / 2, PLAYER_HEIGHT / 3);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#1e3a5f';
        ctx.beginPath();
        ctx.ellipse(PLAYER_WIDTH / 6, 0, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#6d28d9';
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(-20, -PLAYER_HEIGHT / 2 - 5);
        ctx.lineTo(-25, -5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(-20, PLAYER_HEIGHT / 2 + 5);
        ctx.lineTo(-25, 5);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        const flameSize = 15 + Math.sin(frameRef.current * 0.3) * 5;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-PLAYER_WIDTH / 2, -5);
        ctx.lineTo(-PLAYER_WIDTH / 2 - flameSize, 0);
        ctx.lineTo(-PLAYER_WIDTH / 2, 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-PLAYER_WIDTH / 2, -3);
        ctx.lineTo(-PLAYER_WIDTH / 2 - flameSize * 0.6, 0);
        ctx.lineTo(-PLAYER_WIDTH / 2, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    };

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
        <div ref={containerRef} className="relative w-full h-full bg-[#0a0a1a] flex flex-col overflow-hidden">
            {/* Exit button removed - using parent GameLobby back button */}

            <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
                <div className="relative game-container" data-game="vibe-jet" style={{
                    width: CANVAS_WIDTH * canvasScale,
                    height: CANVAS_HEIGHT * canvasScale
                }}>
                    <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
                        className="rounded-xl border border-white/10 outline-none block"
                        style={{
                            width: '100%',
                            height: '100%',
                            touchAction: 'none'
                        }}
                        tabIndex={0}
                        data-game="vibe-jet"
                        onClick={() => { if (gameState === 'playing') handleJump(); canvasRef.current?.focus(); }}
                        onTouchStart={(e) => { e.preventDefault(); if (gameState === 'playing') handleJump(); }}
                    />

                    {gameState === 'menu' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-10">
                            <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
                                <Gamepad2 className="w-8 h-8 text-violet-400" />
                            </div>
                            <h1 className="text-3xl font-black text-white mb-1">VIBE JET 3D</h1>
                            <p className="text-white/50 text-sm mb-6">{isMobile ? 'Тапните для полёта' : 'Пробел для полёта'}</p>
                            <Button onClick={startGame} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-5 text-base">
                                <Zap className="w-4 h-4 mr-2" /> ИГРАТЬ
                            </Button>
                            <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm">
                                <Trophy className="w-4 h-4" />
                                <span>Рекорд: {highScore > 0 ? highScore : 'Не установлен'}</span>
                            </div>
                        </div>
                    )}

                    {gameState === 'paused' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-10">
                            <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
                                <Pause className="w-8 h-8 text-violet-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-4">ПАУЗА</h2>
                            <Button onClick={resumeGame} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-5">ПРОДОЛЖИТЬ</Button>
                        </div>
                    )}

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
                            <Button onClick={startGame} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-5">ИГРАТЬ СНОВА</Button>
                        </div>
                    )}
                </div>
            </div>

            {isMobile && gameState === 'playing' && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
                    <button
                        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleJump(); }}
                        className="w-20 h-20 rounded-full bg-violet-600/90 border-4 border-violet-400/60 flex items-center justify-center shadow-lg shadow-violet-500/40 active:scale-90 transition-transform touch-none"
                        aria-label="Прыжок"
                    >
                        <Zap className="w-10 h-10 text-white" />
                    </button>
                </div>
            )}

            {gameState === 'playing' && !isMobile && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/30 text-xs">
                    ПРОБЕЛ для полёта • ESC пауза
                </div>
            )}
        </div>
    );
}
