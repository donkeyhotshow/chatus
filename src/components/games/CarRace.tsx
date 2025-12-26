"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, UserProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ArrowLeft, Car, Users, Gamepad2, Trophy, Timer, Gauge, Heart } from 'lucide-react';
import { useActionGuard, hapticFeedback } from '@/lib/game-utils';
import { cn } from '@/lib/utils';

type CarRaceProps = {
    onGameEnd: () => void;
    updateGameState: (newState: Partial<GameState>) => void;
    gameState: GameState;
    user: UserProfile;
    otherUser?: UserProfile;
    roomId: string;
};

type PlayerState = {
    id: string;
    name: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    color: number;
    hp: number;
    lap: number;
    checkpoint: number;
    bestLapTime: number;
    currentLapStart: number;
    finished: boolean;
    finishTime: number;
    turbo: number;
    isTurboActive: boolean;
};

type TireTrack = { x: number; y: number; rotation: number; alpha: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number };

// Game constants
const GAME_WIDTH = 900;
const GAME_HEIGHT = 600;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 20;
const MAX_SPEED = 350;
const ACCELERATION = 400;
const BRAKE_FORCE = 600;
const REVERSE_SPEED = 120;
const TURN_SPEED = 3.5;
const FRICTION = 0.98;
const GRASS_FRICTION = 0.92;
const DRIFT_FACTOR = 0.94;
const TURBO_MULTIPLIER = 1.5;
const TURBO_DRAIN = 30;
const TURBO_GAIN_DRIFT = 15;
const MAX_TURBO = 100;
const TOTAL_LAPS = 3;
const COLLISION_DAMAGE = 15;
const WALL_DAMAGE = 8;

// Track definition - oval racing track
const TRACK = {
    outerPath: [
        { x: 150, y: 100 }, { x: 750, y: 100 },
        { x: 850, y: 200 }, { x: 850, y: 400 },
        { x: 750, y: 500 }, { x: 150, y: 500 },
        { x: 50, y: 400 }, { x: 50, y: 200 },
    ],
    innerPath: [
        { x: 200, y: 180 }, { x: 700, y: 180 },
        { x: 770, y: 230 }, { x: 770, y: 370 },
        { x: 700, y: 420 }, { x: 200, y: 420 },
        { x: 130, y: 370 }, { x: 130, y: 230 },
    ],
    checkpoints: [
        { x1: 450, y1: 100, x2: 450, y2: 180 },  // Start/Finish
        { x1: 850, y1: 300, x2: 770, y2: 300 },  // Right
        { x1: 450, y1: 500, x2: 450, y2: 420 },  // Bottom
        { x1: 50, y1: 300, x2: 130, y2: 300 },   // Left
    ],
    startPositions: [
        { x: 400, y: 140, rotation: 0 },
        { x: 400, y: 160, rotation: 0 },
        { x: 370, y: 140, rotation: 0 },
        { x: 370, y: 160, rotation: 0 },
    ],
};

const COLORS = [0x7C3AED, 0x10B981, 0xF59E0B, 0xEF4444, 0x3B82F6, 0xEC4899];

// Utility functions
function pointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

function isOnTrack(x: number, y: number): boolean {
    return pointInPolygon(x, y, TRACK.outerPath) && !pointInPolygon(x, y, TRACK.innerPath);
}

function lineIntersection(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 0.0001) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function checkCheckpoint(
    prevX: number, prevY: number, x: number, y: number, checkpoint: typeof TRACK.checkpoints[0]
): boolean {
    return lineIntersection(prevX, prevY, x, y, checkpoint.x1, checkpoint.y1, checkpoint.x2, checkpoint.y2);
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

export function CarRace({ onGameEnd, updateGameState, gameState, user, otherUser, roomId }: CarRaceProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const keysRef = useRef<Set<string>>(new Set());
    const playerRef = useRef<PlayerState | null>(null);
    const otherPlayersRef = useRef<Map<string, PlayerState>>(new Map());
    const tireTracksRef = useRef<TireTrack[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const sparksRef = useRef<Spark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [raceStartTime, setRaceStartTime] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const lastUpdateRef = useRef<number>(0);
    const prevPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const { guard } = useActionGuard();

    // Initialize player
    useEffect(() => {
        if (!isGameStarted || countdown !== null) return;
        const playerIndex = Object.keys(gameState.carRacePlayers || {}).length;
        const startPos = TRACK.startPositions[playerIndex % TRACK.startPositions.length];

        playerRef.current = {
            id: user.id,
            name: user.name,
            x: startPos.x,
            y: startPos.y,
            vx: 0,
            vy: 0,
            rotation: startPos.rotation,
            color: COLORS[playerIndex % COLORS.length],
            hp: 100,
            lap: 0,
            checkpoint: 0,
            bestLapTime: Infinity,
            currentLapStart: 0,
            finished: false,
            finishTime: 0,
            turbo: 50,
            isTurboActive: false,
        };
        prevPosRef.current = { x: startPos.x, y: startPos.y };

        updateGameState({
            carRacePlayers: { ...gameState.carRacePlayers, [user.id]: playerRef.current },
        });
    }, [isGameStarted, countdown, user.id, user.name, gameState.carRacePlayers, updateGameState]);

    //r players
    useEffect(() => {
        if (!gameState.carRacePlayers) return;
        Object.entries(gameState.carRacePlayers).forEach(([id, player]) => {
            if (id !== user.id) otherPlayersRef.current.set(id, player as PlayerState);
        });
        otherPlayersRef.current.forEach((_, id) => {
            if (!gameState.carRacePlayers?.[id]) otherPlayersRef.current.delete(id);
        });
    }, [gameState.carRacePlayers, user.id]);

    // Countdown
    useEffect(() => {
        if (!isGameStarted) return;
        setCountdown(3);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    setRaceStartTime(performance.now());
                    return null;
                }
                hapticFeedback('light');
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isGameStarted]);

    // Loading
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // Keyboard
    useEffect(() => {
        if (!isGameStarted || countdown !== null) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'shift'].includes(key)) {
                e.preventDefault();
                keysRef.current.add(key);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isGameStarted, countdown]);

    // Game loop
    useEffect(() => {
        if (!isGameStarted || countdown !== null || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();

        const gameLoop = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            setCurrentTime(now);

            if (playerRef.current && !playerRef.current.finished) {
                updatePlayer(dt, now);
            }
            updateParticles(dt);
            updateTireTracks(dt);
            updateSparks(dt);
            render(ctx, now);

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
    }, [isGameStarted, countdown]);

    const updatePlayer = useCallback((dt: number, now: number) => {
        const player = playerRef.current;
        if (!player) return;

        const keys = keysRef.current;
        const prevX = player.x, prevY = player.y;

        // Turbo
        const turboActive = keys.has('shift') && player.turbo > 0;
        player.isTurboActive = turboActive;
        if (turboActive) player.turbo = Math.max(0, player.turbo - TURBO_DRAIN * dt);

        // Speed calculation
        const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        const maxSpeed = turboActive ? MAX_SPEED * TURBO_MULTIPLIER : MAX_SPEED;
        const damageMultiplier = player.hp > 50 ? 1 : 0.5 + (player.hp / 100);

        // Acceleration
        if (keys.has('arrowup') || keys.has('w')) {
            player.vx += Math.cos(player.rotation) * ACCELERATION * dt * damageMultiplier;
            player.vy += Math.sin(player.rotation) * ACCELERATION * dt * damageMultiplier;
        }
        if (keys.has('arrowdown') || keys.has('s')) {
            if (speed > 20) {
                player.vx -= Math.cos(player.rotation) * BRAKE_FORCE * dt;
                player.vy -= Math.sin(player.rotation) * BRAKE_FORCE * dt;
            } else {
                player.vx -= Math.cos(player.rotation) * REVERSE_SPEED * dt;
                player.vy -= Math.sin(player.rotation) * REVERSE_SPEED * dt;
            }
        }

        // Turning with drift
        if (speed > 10) {
            const turnDir = (keys.has('arrowleft') || keys.has('a')) ? -1 : (keys.has('arrowright') || keys.has('d')) ? 1 : 0;
            player.rotation += turnDir * TURN_SPEED * dt * Math.min(speed / 150, 1);

            // Drift mechanics
            if (turnDir !== 0 && speed > 100) {
                const driftAmount = Math.abs(turnDir) * (speed / MAX_SPEED) * 0.3;
                player.turbo = Math.min(MAX_TURBO, player.turbo + TURBO_GAIN_DRIFT * driftAmount * dt);

                // Tire tracks
                if (Math.random() < 0.3) {
                    tireTracksRef.current.push({
                        x: player.x - Math.cos(player.rotation) * 15,
                        y: player.y - Math.sin(player.rotation) * 15,
                        rotation: player.rotation,
                        alpha: 0.6,
                    });
                }
            }
        }

        // Friction
        const onTrack = isOnTrack(player.x, player.y);
        const friction = onTrack ? FRICTION : GRASS_FRICTION;
        player.vx *= friction;
        player.vy *= friction;

        // Drift factor - velocity aligns with rotation
        const velAngle = Math.atan2(player.vy, player.vx);
        const angleDiff = normalizeAngle(player.rotation - velAngle);
        const driftFactor = DRIFT_FACTOR + (1 - DRIFT_FACTOR) * Math.abs(Math.cos(angleDiff));
        const newSpeed = speed * driftFactor;
        const blendedAngle = velAngle + angleDiff * (1 - DRIFT_FACTOR);
        player.vx = Math.cos(blendedAngle) * newSpeed;
        player.vy = Math.sin(blendedAngle) * newSpeed;

        // Clamp speed
        const currentSpeed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        if (currentSpeed > maxSpeed) {
            player.vx = (player.vx / currentSpeed) * maxSpeed;
            player.vy = (player.vy / currentSpeed) * maxSpeed;
        }

        // Move
        player.x += player.vx * dt;
        player.y += player.vy * dt;

        // Grass particles
        if (!onTrack && currentSpeed > 50) {
            particlesRef.current.push({
                x: player.x, y: player.y,
                vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 50,
                life: 0.5, color: '#4a7c23', size: 3,
            });
        }

        // Turbo particles
        if (turboActive) {
            particlesRef.current.push({
                x: player.x - Math.cos(player.rotation) * 20,
                y: player.y - Math.sin(player.rotation) * 20,
                vx: -Math.cos(player.rotation) * 100 + (Math.random() - 0.5) * 30,
                vy: -Math.sin(player.rotation) * 100 + (Math.random() - 0.5) * 30,
                life: 0.3, color: '#f97316', size: 5,
            });
        }

        // Smoke when damaged
        if (player.hp < 50 && Math.random() < 0.1) {
            particlesRef.current.push({
                x: player.x, y: player.y,
                vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 20,
                life: 1, color: player.hp < 20 ? '#ef4444' : '#6b7280', size: 8,
            });
        }

        // Wall collision
        if (!isOnTrack(player.x, player.y)) {
            player.hp -= WALL_DAMAGE * dt * 10;
            player.vx *= 0.8;
            player.vy *= 0.8;

            // Push back to track
            const pushAngle = Math.atan2(player.y - GAME_HEIGHT / 2, player.x - GAME_WIDTH / 2);
            const inInner = pointInPolygon(player.x, player.y, TRACK.innerPath);
            if (inInner) {
                player.x += Math.cos(pushAngle) * 5;
                player.y += Math.sin(pushAngle) * 5;
            } else {
                player.x -= Math.cos(pushAngle) * 5;
                player.y -= Math.sin(pushAngle) * 5;
            }

            // Sparks
            for (let i = 0; i < 3; i++) {
                sparksRef.current.push({
                    x: player.x, y: player.y,
                    vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                    life: 0.3,
                });
            }
            hapticFeedback('light');
        }

        // Car collision
        otherPlayersRef.current.forEach((other) => {
            const dist = distance(player.x, player.y, other.x, other.y);
            if (dist < CAR_WIDTH) {
                const angle = Math.atan2(player.y - other.y, player.x - other.x);
                const overlap = CAR_WIDTH - dist;
                player.x += Math.cos(angle) * overlap * 0.5;
                player.y += Math.sin(angle) * overlap * 0.5;
                player.vx += Math.cos(angle) * 50;
                player.vy += Math.sin(angle) * 50;
                player.hp -= COLLISION_DAMAGE * dt * 5;

                for (let i = 0; i < 5; i++) {
                    sparksRef.current.push({
                        x: (player.x + other.x) / 2, y: (player.y + other.y) / 2,
                        vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300,
                        life: 0.4,
                    });
                }
                hapticFeedback('medium');
            }
        });

        // Clamp HP
        player.hp = Math.max(0, Math.min(100, player.hp));

        // Respawn if destroyed
        if (player.hp <= 0) {
            const startPos = TRACK.startPositions[0];
            player.x = startPos.x;
            player.y = startPos.y;
            player.vx = 0;
            player.vy = 0;
            player.rotation = startPos.rotation;
            player.hp = 100;
            player.checkpoint = 0;
            hapticFeedback('heavy');
        }

        // Checkpoints
        const nextCheckpoint = player.checkpoint % TRACK.checkpoints.length;
        if (checkCheckpoint(prevX, prevY, player.x, player.y, TRACK.checkpoints[nextCheckpoint])) {
            player.checkpoint++;

            // Lap complete
            if (nextCheckpoint === 0 && player.checkpoint > TRACK.checkpoints.length) {
                player.lap++;
                const lapTime = (now - player.currentLapStart) / 1000;
                if (lapTime < player.bestLapTime && player.lap > 1) {
                    player.bestLapTime = lapTime;
                }
                player.currentLapStart = now;
                hapticFeedback('medium');

                // Race finished
                if (player.lap >= TOTAL_LAPS) {
                    player.finished = true;
                    player.finishTime = now - raceStartTime;
                    hapticFeedback('heavy');
                }
            }
        }

        prevPosRef.current = { x: player.x, y: player.y };

        // Broadcast
        if (now - lastUpdateRef.current > 33) {
            lastUpdateRef.current = now;
            updateGameState({
                carRacePlayers: { ...gameState.carRacePlayers, [user.id]: { ...player } },
            });
        }
    }, [gameState.carRacePlayers, updateGameState, user.id, raceStartTime]);

    const updateParticles = (dt: number) => {
        particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.size *= 0.98;
            return p.life > 0;
        });
        if (particlesRef.current.length > 200) particlesRef.current.splice(0, 50);
    };

    const updateTireTracks = (dt: number) => {
        tireTracksRef.current = tireTracksRef.current.filter(t => {
            t.alpha -= dt * 0.1;
            return t.alpha > 0;
        });
        if (tireTracksRef.current.length > 100) tireTracksRef.current.splice(0, 20);
    };

    const updateSparks = (dt: number) => {
        sparksRef.current = sparksRef.current.filter(s => {
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vy += 200 * dt;
            s.life -= dt;
            return s.life > 0;
        });
    };

    const render = useCallback((ctx: CanvasRenderingContext2D, now: number) => {
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Grass
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Track (asphalt)
        ctx.fillStyle = '#3a3a4a';
        ctx.beginPath();
        ctx.moveTo(TRACK.outerPath[0].x, TRACK.outerPath[0].y);
        TRACK.outerPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();

        // Inner grass
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath();
        ctx.moveTo(TRACK.innerPath[0].x, TRACK.innerPath[0].y);
        TRACK.innerPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();

        // Track borders
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(TRACK.outerPath[0].x, TRACK.outerPath[0].y);
        TRACK.outerPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(TRACK.innerPath[0].x, TRACK.innerPath[0].y);
        TRACK.innerPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.stroke();

        // Start/Finish line
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(445, 100, 10, 80);
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#000000' : '#ffffff';
            ctx.fillRect(445, 100 + i * 10, 10, 10);
        }

        // Tire tracks
        ctx.fillStyle = '#2a2a3a';
        tireTracksRef.current.forEach(t => {
            ctx.globalAlpha = t.alpha;
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.rotation);
            ctx.fillRect(-8, -2, 16, 4);
            ctx.restore();
        });
        ctx.globalAlpha = 1;

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Sparks
        sparksRef.current.forEach(s => {
            ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${s.life})`;
            ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
        });

        // Other players
        otherPlayersRef.current.forEach(p => drawCar(ctx, p, false));

        // Current player
        if (playerRef.current) drawCar(ctx, playerRef.current, true);

        // Mini-map
        drawMiniMap(ctx);

        // HUD
        if (playerRef.current) drawHUD(ctx, playerRef.current, now);
    }, []);

    const drawCar = (ctx: CanvasRenderingContext2D, player: PlayerState, isCurrent: boolean) => {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-CAR_WIDTH/2 + 3, -CAR_HEIGHT/2 + 3, CAR_WIDTH, CAR_HEIGHT);

        // Car body
        const color = `#${player.color.toString(16).padStart(6, '0')}`;
        ctx.fillStyle = color;
        ctx.fillRect(-CAR_WIDTH/2, -CAR_HEIGHT/2, CAR_WIDTH, CAR_HEIGHT);

        // Damage overlay
        if (player.hp < 100) {
            const damageAlpha = (100 - player.hp) / 200;
            ctx.fillStyle = `rgba(0,0,0,${damageAlpha})`;
            ctx.fillRect(-CAR_WIDTH/2, -CAR_HEIGHT/2, CAR_WIDTH, CAR_HEIGHT);

            // Scratches
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            for (let i = 0; i < Math.floor((100 - player.hp) / 20); i++) {
                ctx.beginPath();
                ctx.moveTo(-CAR_WIDTH/2 + Math.random() * CAR_WIDTH, -CAR_HEIGHT/2);
                ctx.lineTo(-CAR_WIDTH/2 + Math.random() * CAR_WIDTH, CAR_HEIGHT/2);
                ctx.stroke();
            }
        }

        // Windshield
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(CAR_WIDTH/4, -CAR_HEIGHT/3, CAR_WIDTH/4, CAR_HEIGHT/1.5);

        // Wheels
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-CAR_WIDTH/2 - 2, -CAR_HEIGHT/2 - 3, 10, 6);
        ctx.fillRect(-CAR_WIDTH/2 - 2, CAR_HEIGHT/2 - 3, 10, 6);
        ctx.fillRect(CAR_WIDTH/2 - 8, -CAR_HEIGHT/2 - 3, 10, 6);
        ctx.fillRect(CAR_WIDTH/2 - 8, CAR_HEIGHT/2 - 3, 10, 6);

        // Turbo flame
        if (player.isTurboActive) {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-CAR_WIDTH/2, -5);
            ctx.lineTo(-CAR_WIDTH/2 - 15 - Math.random() * 10, 0);
            ctx.lineTo(-CAR_WIDTH/2, 5);
            ctx.fill();
        }

        ctx.restore();

        // Name tag
        ctx.fillStyle = isCurrent ? '#7C3AED' : '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y - CAR_HEIGHT - 5);

        // HP bar
        const hpWidth = 30;
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x - hpWidth/2, player.y - CAR_HEIGHT - 18, hpWidth, 4);
        ctx.fillStyle = player.hp > 50 ? '#22c55e' : player.hp > 20 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(player.x - hpWidth/2, player.y - CAR_HEIGHT - 18, hpWidth * (player.hp / 100), 4);
    };

    const drawMiniMap = (ctx: CanvasRenderingContext2D) => {
        const scale = 0.12;
        const offsetX = GAME_WIDTH - 120;
        const offsetY = 10;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(offsettY - 5, 115, 80);

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(offsetX + TRACK.outerPath[0].x * scale, offsetY + TRACK.outerPath[0].y * scale);
        TRACK.outerPath.forEach(p => ctx.lineTo(offsetX + p.x * scale, offsetY + p.y * scale));
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offsetX + TRACK.innerPath[0].x * scale, offsetY + TRACK.innerPath[0].y * scale);
        TRACK.innerPath.forEach(p => ctx.lineTo(offsetX + p.x * scale, offsetY + p.y * scale));
        ctx.closePath();
        ctx.stroke();

        // Players on minimap
        otherPlayersRef.current.forEach(p => {
            ctx.fillStyle = `#${p.color.toString(16).padStart(6, '0')}`;
            ctx.beginPath();
            ctx.arc(offsetX + p.x * scale, offsetY + p.y * scale, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        if (playerRef.current) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(offsetX + playerRef.current.x * scale, offsetY + playerRef.current.y * scale, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawHUD = (ctx: CanvasRenderingContext2D, player: PlayerState, now: number) => {
        // Lap counter
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 100, 60);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Круг ${Math.min(player.lap + 1, TOTAL_LAPS)}/${TOTAL_LAPS}`, 20, 32);

        const raceTime = raceStartTime > 0 ? (now - raceStartTime) / 1000 : 0;
        ctx.font = '12px sans-serif';
        ctx.fillText(`Время: ${raceTime.toFixed(1)}s`, 20, 50);
        if (player.bestLapTime < Infinity) {
            ctx.fillText(`Лучший: ${player.bestLapTime.toFixed(1)}s`, 20, 65);
        }

        // Turbo bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 80, 100, 20);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(12, 82, 96 * (player.turbo / MAX_TURBO), 16);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.fillText('TURBO', 40, 94);

        // Speed
        const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 110, 100, 25);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`${Math.round(speed)} km/h`, 20, 128);

        // Finish overlay
        if (player.finished) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏁 ФИНИШ!', GAME_WIDTH/2, GAME_HEIGHT/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            ctx.fillText(`Время: ${(player.finishTime / 1000).toFixed(2)}s`, GAME_WIDTH/2, GAME_HEIGHT/2 + 20);
        }
    };

    const handleStart = guard(() => {
        setIsGameStarted(true);
        hapticFeedback('medium');
    });

    const handleBack = guard(() => {
        if (gameState.carRacePlayers) {
            const newPlayers = { ...gameState.carRacePlayers };
            delete newPlayers[user.id];
            updateGameState({ carRacePlayers: newPlayers });
        }
        onGameEnd();
    });

    const playerCount = Object.keys(gameState.carRacePlayers || {}).length;

    if (!isGameStarted) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
                <Card className="bg-black/90 border-white/[0.06] backdrop-blur-xl w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <Car className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-white">Car Race 2.0</CardTitle>
                        <CardDescription className="text-white/50">
                            Гонка с физикой, дрифтом и разрушаемостью!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <Trophy className="w-5 h-5 text-yellow-500 mb-1" />
                                <div className="text-xs text-white/60">{TOTAL_LAPS} круга</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <Heart className="w-5 h-5 text-red-500 mb-1" />
                                <div className="text-xs text-white/60">Разрушаемость</div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4" /> Управление
                            </h4>
                            <ul className="text-xs text-white/60 space-y-1">
                                <li>↑/W — Газ • ↓/S — Тормоз/Назад</li>
                                <li>←/A →/D — Поворот</li>
                                <li>SHIFT — Турбо (копится при дрифте)</li>
                            </ul>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                            <Users className="w-4 h-4" />
                            <span>{playerCount} игрок(ов)</span>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="w-8 h-8 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <Button onClick={handleStart} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/25 min-h-[48px]">
                                Начать гонку
                            </Button>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleBack} variant="ghost" className="w-full text-white/40 hover:text-white min-h-[44px]">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black">
            <div className="p-2 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between">
                <button onClick={handleBack} className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
                    <ArrowLeft className="w-4 h-4" /> Выход
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg">
                    <Car className="w-4 h-4 text-white" />
                    <span className="font-semibold text-white text-sm">Car Race</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                    <Users className="w-4 h-4" /> {playerCount}
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden relative">
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                        <div className="text-8xl font-bold text-white animate-pulse">
                            {countdown === 0 ? 'GO!' : countdown}
                        </div>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className={cn("rounded-xl border-2 border-white/10 shadow-2xl max-w-full max-h-full")}
                />
            </div>

            <div className="md:hidden p-3 border-t border-white/10 bg-black/80">
                <div className="flex justify-between items-center max-w-sm mx-auto">
                    <div className="flex gap-1">
                        <MobileBtn k="arrowleft" keysRef={keysRef}>←</MobileBtn>
                        <MobileBtn k="arrowright" keysRef={keysRef}>→</MobileBtn>
                    </div>
                    <MobileBtn k="shift" keysRef={keysRef} className="bg-orange-600">🔥</MobileBtn>
                    <div className="flex gap-1">
                        <MobileBtn k="arrowdown" keysRef={keysRef}>⬇</MobileBtn>
                        <MobileBtn k="arrowup" keysRef={keysRef} className="bg-green-600">⬆</MobileBtn>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MobileBtn({ children, k, keysRef, className }: { children: React.ReactNode; k: string; keysRef: React.RefObject<Set<string>>; className?: string }) {
    return (
        <button
            onTouchStart={(e) => { e.preventDefault(); keysRef.current?.add(k); hapticFeedback('light'); }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current?.delete(k); }}
            onMouseDown={() => keysRef.current?.add(k)}
            onMouseUp={() => keysRef.current?.delete(k)}
            onMouseLeave={() => keysRef.current?.delete(k)}
            className={cn("w-14 h-14 rounded-xl bg-white/10 border border-white/20 text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-transform touch-manipulation select-none", className)}
        >
            {children}
        </button>
    );
}
