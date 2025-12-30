import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Trophy, Zap, Gamepad2, Star } from 'lucide-react';
import { hapticFeedback } from '@/lib/game-utils';
import GameLayout from './GameLayout';
import MobileGameControls from './MobileGameControls';
import { PremiumButton } from '../ui/premium-button';
import { AnimatePresence, motion } from 'framer-motion';

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
const HORIZON_Y = CANVAS_HEIGHT * 0.35;
const GROUND_Y = CANVAS_HEIGHT * 0.85;
const PERSPECTIVE_SCALE = 0.7;

interface Obstacle { x: number; gapY: number; passed: boolean; z: number; }
interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; color: string; size: number; }
interface Cloud { x: number; y: number; z: number; size: number; speed: number; }
interface Building { x: number; width: number; height: number; color: string; z: number; }
type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

interface VibeJetProps { onGameEnd: () => void; }

export default function VibeJet({ onGameEnd }: VibeJetProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('menu');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

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

    useEffect(() => {
        const clouds: Cloud[] = [];
        for (let i = 0; i < 8; i++) clouds.push({ x: Math.random() * CANVAS_WIDTH * 1.5, y: HORIZON_Y * 0.3 + Math.random() * HORIZON_Y * 0.5, z: 0.3 + Math.random() * 0.5, size: 30 + Math.random() * 50, speed: 0.3 + Math.random() * 0.5 });
        cloudsRef.current = clouds;
        const buildings: Building[] = [];
        const colors = ['#1a1a2e', '#16213e', '#0f3460', '#1a1a3e'];
        for (let i = 0; i < 15; i++) buildings.push({ x: i * 120 - 200, width: 60 + Math.random() * 80, height: 80 + Math.random() * 150, color: colors[Math.floor(Math.random() * colors.length)], z: 0.5 + Math.random() * 0.3 });
        buildingsRef.current = buildings;
        try { const saved = localStorage.getItem('vibejet-highscore'); if (saved) setHighScore(parseInt(saved, 10) || 0); } catch { }
    }, []);

    const renderCanvas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);
        const ox = (width - CANVAS_WIDTH * scale) / 2;
        const oy = (height - CANVAS_HEIGHT * scale) / 2;
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);
        const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        sky.addColorStop(0, '#0a0a1a'); sky.addColorStop(0.4, '#1a1a3a'); sky.addColorStop(1, '#2a1a4a');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 30; i++) ctx.fillRect((i * 137 + frameRef.current * 0.1) % CANVAS_WIDTH, (i * 97) % (HORIZON_Y * 0.8), 1.5, 1.5);
        cloudsRef.current.forEach(c => { ctx.globalAlpha = 0.3 * c.z; ctx.fillStyle = '#4a4a6a'; ctx.beginPath(); ctx.arc(c.x, c.y, c.size * 0.5, 0, Math.PI * 2); ctx.arc(c.x + c.size * 0.4, c.y - c.size * 0.2, c.size * 0.4, 0, Math.PI * 2); ctx.arc(c.x + c.size * 0.8, c.y, c.size * 0.45, 0, Math.PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
        buildingsRef.current.forEach(b => { const s = b.z * PERSPECTIVE_SCALE; const h = b.height * s, w = b.width * s; ctx.fillStyle = b.color; ctx.fillRect(b.x, GROUND_Y - h, w, h); });
        const ground = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
        ground.addColorStop(0, '#1a1a2e'); ground.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = ground; ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
        particlesRef.current.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
        obstaclesRef.current.forEach(obs => {
            const grad = ctx.createLinearGradient(obs.x, 0, obs.x + OBSTACLE_WIDTH, 0);
            grad.addColorStop(0, '#5b21b6'); grad.addColorStop(0.5, '#7c3aed'); grad.addColorStop(1, '#4c1d95');
            ctx.fillStyle = grad; ctx.fillRect(obs.x, 0, OBSTACLE_WIDTH, obs.gapY); ctx.fillRect(obs.x, obs.gapY + OBSTACLE_GAP, OBSTACLE_WIDTH, CANVAS_HEIGHT - obs.gapY - OBSTACLE_GAP);
        });
        ctx.save();
        ctx.translate(100, playerYRef.current + PLAYER_HEIGHT / 2); ctx.rotate(playerTiltRef.current * Math.PI / 180);
        ctx.fillStyle = '#8b5cf6'; ctx.beginPath(); ctx.moveTo(PLAYER_WIDTH / 2, 0); ctx.lineTo(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 3); ctx.lineTo(-PLAYER_WIDTH / 3, 0); ctx.lineTo(-PLAYER_WIDTH / 2, PLAYER_HEIGHT / 3); ctx.closePath(); ctx.fill();
        ctx.restore(); ctx.restore();
    }, []);

    const handleJump = useCallback(() => {
        if (gameState !== 'playing') return;
        const now = Date.now(); if (now - lastJumpTimeRef.current < 80) return;
        lastJumpTimeRef.current = now; velocityRef.current = JUMP_FORCE; playerTiltRef.current = -15; hapticFeedback('light');
        for (let i = 0; i < 6; i++) particlesRef.current.push({ x: 100, y: playerYRef.current + PLAYER_HEIGHT / 2, z: 1, vx: -Math.random() * 4 - 2, vy: (Math.random() - 0.5) * 3, vz: (Math.random() - 0.5) * 0.5, life: 1, color: `hsl(${20 + Math.random() * 30}, 100%, 60%)`, size: 4 + Math.random() * 4 });
    }, [gameState]);

    const startGame = useCallback(() => {
        playerYRef.current = CANVAS_HEIGHT * 0.4; velocityRef.current = -2; obstaclesRef.current = []; particlesRef.current = []; gameSpeedRef.current = GAME_SPEED_INITIAL; scoreRef.current = 0; frameRef.current = 0;
        setScore(0); setGameState('playing'); hapticFeedback('medium');
    }, []);

    const endGame = useCallback(() => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        setGameState('gameover'); hapticFeedback('heavy');
        if (scoreRef.current > highScore) { setHighScore(scoreRef.current); try { localStorage.setItem('vibejet-highscore', scoreRef.current.toString()); } catch { } }
    }, [highScore]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const loop = () => {
            frameRef.current++;
            velocityRef.current += GRAVITY; velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocityRef.current));
            playerYRef.current += velocityRef.current;
            playerTiltRef.current += (velocityRef.current * 2 - playerTiltRef.current) * 0.1;
            if (playerYRef.current < 50) { playerYRef.current = 50; velocityRef.current = 0; }
            if (playerYRef.current > GROUND_Y - PLAYER_HEIGHT) { endGame(); return; }
            if (frameRef.current > 120 && frameRef.current % 90 === 0) obstaclesRef.current.push({ x: CANVAS_WIDTH + 100, gapY: 100 + Math.random() * (CANVAS_HEIGHT - 250 - OBSTACLE_GAP), passed: false, z: 1 });
            let collided = false;
            obstaclesRef.current = obstaclesRef.current.filter(obs => {
                obs.x -= gameSpeedRef.current;
                if (!obs.passed && obs.x + OBSTACLE_WIDTH < 100) { obs.passed = true; scoreRef.current++; setScore(scoreRef.current); hapticFeedback('light'); }
                const px = 100, py = playerYRef.current, pw = PLAYER_WIDTH * 0.6, ph = PLAYER_HEIGHT * 0.5;
                if (px + pw / 2 > obs.x && px - pw / 2 < obs.x + OBSTACLE_WIDTH) { if (py < obs.gapY || py + ph > obs.gapY + OBSTACLE_GAP) collided = true; }
                return obs.x > -OBSTACLE_WIDTH;
            });
            if (collided) { endGame(); return; }
            cloudsRef.current.forEach(c => { c.x -= c.speed * gameSpeedRef.current * 0.3; if (c.x < -c.size * 2) c.x = CANVAS_WIDTH + c.size; });
            buildingsRef.current.forEach(b => { b.x -= gameSpeedRef.current * b.z * 0.5; if (b.x < -b.width) b.x = CANVAS_WIDTH + 50; });
            particlesRef.current = particlesRef.current.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.04; p.size *= 0.96; return p.life > 0; });
            gameSpeedRef.current += GAME_SPEED_INCREMENT;
            if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if (ctx) renderCanvas(ctx, canvasRef.current.width, canvasRef.current.height); }
            gameLoopRef.current = requestAnimationFrame(loop);
        };
        gameLoopRef.current = requestAnimationFrame(loop);
        return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
    }, [gameState, endGame, renderCanvas]);

    return (
        <GameLayout
            title="Vibe Jet" icon={<Zap className="w-5 h-5 text-violet-400" />} onExit={onGameEnd} score={score} gameTime={Math.floor(frameRef.current / 60)} playerCount={1}
            responsiveOptions={{ gridCols: 30, gridRows: 20, maxCellSize: 30, padding: 16, accountForNav: true }} preferredOrientation="landscape"
            mobileControls={<MobileGameControls scheme="tap" onActionStart={handleJump} />}
        >
            {({ dimensions }) => (
                <div className="relative w-full h-full flex items-center justify-center">
                    <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="rounded-xl shadow-2xl" />
                    <AnimatePresence>
                        {gameState === 'menu' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-20">
                                <Gamepad2 className="w-16 h-16 text-violet-500 mb-4" />
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tighter">Vibe Jet</h2>
                                <PremiumButton onClick={startGame} size="lg" glow><Zap className="w-5 h-5 mr-2" /> Начать полет</PremiumButton>
                            </motion.div>
                        )}
                        {gameState === 'gameover' && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-xl z-30">
                                <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
                                <h2 className="text-3xl font-bold text-white mb-2">Крушение!</h2>
                                <p className="text-xl text-violet-400 font-bold mb-6">Счёт: {score}</p>
                                <div className="flex gap-3">
                                    <PremiumButton onClick={startGame} glow><Star className="w-4 h-4 mr-2" /> Сначала</PremiumButton>
                                    <PremiumButton onClick={onGameEnd} variant="secondary">Выйти</PremiumButton>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </GameLayout>
    );
}
