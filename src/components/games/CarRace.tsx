"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, UserProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ArrowLeft, Car, Users, Gamepad2, Trophy, Heart, MapIcon } from 'lucide-react';
import { useActionGuard, hapticFeedback } from '@/lib/game-utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

// Game constants - УВЕЛИЧЕННЫЕ МАШИНЫ
const DESKTOP_WIDTH = 900;
const DESKTOP_HEIGHT = 600;
const CAR_WIDTH = 56;  // Увеличено с 40
const CAR_HEIGHT = 28; // Увеличено с 20

// УЛУЧШЕННАЯ ФИЗИКА - более стабильное управление
const MAX_SPEED = 320;
const ACCELERATION = 350;
const BRAKE_FORCE = 500;
const REVERSE_SPEED = 100;
const TURN_SPEED = 2.8;        // Уменьшено для стабильности
const FRICTION = 0.985;        // Увеличено для плавности
const GRASS_FRICTION = 0.94;
const DRIFT_FACTOR = 0.92;
const TURBO_MULTIPLIER = 1.4;
const TURBO_DRAIN = 25;
const TURBO_GAIN_DRIFT = 12;
const MAX_TURBO = 100;
const TOTAL_LAPS = 3;
const COLLISION_DAMAGE = 12;
const WALL_DAMAGE = 6;

// Стабилизация управления
const INPUT_SMOOTHING = 0.35;  // Сглаживание ввода (увеличено для отзывчивости)
const VELOCITY_DAMPING = 0.99; // Демпфирование скорости
const MIN_TURN_SPEED = 20;     // Минимальная скорость для поворота (уменьшено)

// 5 КАРТ
type TrackData = {
    name: string;
    outerPath: { x: number; y: number }[];
    innerPath: { x: number; y: number }[];
    checkpoints: { x1: number; y1: number; x2: number; y2: number }[];
    startPositions: { x: number; y: number; rotation: number }[];
    bgColor: string;
    trackColor: string;
};

const TRACKS: TrackData[] = [
    // Карта 1: Овал (классика)
    {
        name: "Овальный Спидвей",
        outerPath: [
            { x: 150, y: 100 }, { x: 750, y: 100 },
            { x: 850, y: 200 }, { x: 850, y: 400 },
            { x: 750, y: 500 }, { x: 150, y: 500 },
            { x: 50, y: 400 }, { x: 50, y: 200 },
        ],
        innerPath: [
            { x: 220, y: 180 }, { x: 680, y: 180 },
            { x: 760, y: 240 }, { x: 760, y: 360 },
            { x: 680, y: 420 }, { x: 220, y: 420 },
            { x: 140, y: 360 }, { x: 140, y: 240 },
        ],
        checkpoints: [
            { x1: 450, y1: 100, x2: 450, y2: 180 },
            { x1: 850, y1: 300, x2: 760, y2: 300 },
            { x1: 450, y1: 500, x2: 450, y2: 420 },
            { x1: 50, y1: 300, x2: 140, y2: 300 },
        ],
        startPositions: [
            { x: 400, y: 140, rotation: 0 },
            { x: 400, y: 165, rotation: 0 },
            { x: 360, y: 140, rotation: 0 },
            { x: 360, y: 165, rotation: 0 },
        ],
        bgColor: '#2d5a27',
        trackColor: '#3a3a4a',
    },
    // Карта 2: Восьмёрка
    {
        name: "Восьмёрка",
        outerPath: [
            { x: 100, y: 150 }, { x: 350, y: 100 },
            { x: 550, y: 100 }, { x: 800, y: 150 },
            { x: 850, y: 300 }, { x: 800, y: 450 },
            { x: 550, y: 500 }, { x: 350, y: 500 },
            { x: 100, y: 450 }, { x: 50, y: 300 },
        ],
        innerPath: [
            { x: 180, y: 200 }, { x: 350, y: 170 },
            { x: 450, y: 250 }, { x: 550, y: 170 },
            { x: 720, y: 200 }, { x: 770, y: 300 },
            { x: 720, y: 400 }, { x: 550, y: 430 },
            { x: 450, y: 350 }, { x: 350, y: 430 },
            { x: 180, y: 400 }, { x: 130, y: 300 },
        ],
        checkpoints: [
            { x1: 250, y1: 100, x2: 250, y2: 185 },
            { x1: 450, y1: 250, x2: 450, y2: 350 },
            { x1: 650, y1: 100, x2: 650, y2: 185 },
            { x1: 850, y1: 300, x2: 770, y2: 300 },
        ],
        startPositions: [
            { x: 200, y: 140, rotation: 0.3 },
            { x: 200, y: 165, rotation: 0.3 },
            { x: 160, y: 155, rotation: 0.3 },
            { x: 160, y: 180, rotation: 0.3 },
        ],
        bgColor: '#1a4a3a',
        trackColor: '#4a4a5a',
    },
    // Карта 3: Треугольник
    {
        name: "Треугольный Трек",
        outerPath: [
            { x: 450, y: 80 },
            { x: 850, y: 500 },
            { x: 50, y: 500 },
        ],
        innerPath: [
            { x: 450, y: 200 },
            { x: 700, y: 450 },
            { x: 200, y: 450 },
        ],
        checkpoints: [
            { x1: 450, y1: 80, x2: 450, y2: 200 },
            { x1: 650, y1: 290, x2: 575, y2: 325 },
            { x1: 250, y1: 290, x2: 325, y2: 325 },
        ],
        startPositions: [
            { x: 300, y: 475, rotation: -Math.PI / 3 },
            { x: 340, y: 475, rotation: -Math.PI / 3 },
            { x: 280, y: 455, rotation: -Math.PI / 3 },
            { x: 320, y: 455, rotation: -Math.PI / 3 },
        ],
        bgColor: '#3a2a1a',
        trackColor: '#5a5a6a',
    },
    // Карта 4: Змейка
    {
        name: "Змейка",
        outerPath: [
            { x: 50, y: 100 }, { x: 300, y: 100 },
            { x: 400, y: 200 }, { x: 500, y: 100 },
            { x: 750, y: 100 }, { x: 850, y: 200 },
            { x: 850, y: 400 }, { x: 750, y: 500 },
            { x: 500, y: 500 }, { x: 400, y: 400 },
            { x: 300, y: 500 }, { x: 50, y: 500 },
            { x: 50, y: 400 }, { x: 50, y: 200 },
        ],
        innerPath: [
            { x: 120, y: 180 }, { x: 280, y: 180 },
            { x: 400, y: 300 }, { x: 520, y: 180 },
            { x: 680, y: 180 }, { x: 780, y: 250 },
            { x: 780, y: 350 }, { x: 680, y: 420 },
            { x: 520, y: 420 }, { x: 400, y: 300 },
            { x: 280, y: 420 }, { x: 120, y: 420 },
            { x: 120, y: 350 }, { x: 120, y: 250 },
        ],
        checkpoints: [
            { x1: 200, y1: 100, x2: 200, y2: 180 },
            { x1: 400, y1: 200, x2: 400, y2: 400 },
            { x1: 600, y1: 100, x2: 600, y2: 180 },
            { x1: 200, y1: 500, x2: 200, y2: 420 },
        ],
        startPositions: [
            { x: 100, y: 140, rotation: 0 },
            { x: 100, y: 165, rotation: 0 },
            { x: 70, y: 140, rotation: 0 },
            { x: 70, y: 165, rotation: 0 },
        ],
        bgColor: '#2a3a4a',
        trackColor: '#4a5a6a',
    },
    // Карта 5: Стадион
    {
        name: "Стадион",
        outerPath: [
            { x: 200, y: 80 }, { x: 700, y: 80 },
            { x: 850, y: 180 }, { x: 850, y: 420 },
            { x: 700, y: 520 }, { x: 200, y: 520 },
            { x: 50, y: 420 }, { x: 50, y: 180 },
        ],
        innerPath: [
            { x: 280, y: 160 }, { x: 620, y: 160 },
            { x: 750, y: 230 }, { x: 750, y: 370 },
            { x: 620, y: 440 }, { x: 280, y: 440 },
            { x: 150, y: 370 }, { x: 150, y: 230 },
        ],
        checkpoints: [
            { x1: 450, y1: 80, x2: 450, y2: 160 },
            { x1: 850, y1: 300, x2: 750, y2: 300 },
            { x1: 450, y1: 520, x2: 450, y2: 440 },
            { x1: 50, y1: 300, x2: 150, y2: 300 },
        ],
        startPositions: [
            { x: 380, y: 120, rotation: 0 },
            { x: 380, y: 145, rotation: 0 },
            { x: 340, y: 120, rotation: 0 },
            { x: 340, y: 145, rotation: 0 },
        ],
        bgColor: '#1a2a1a',
        trackColor: '#3a4a3a',
    },
];

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
    prevX: number, prevY: number, x: number, y: number,
    checkpoint: { x1: number; y1: number; x2: number; y2: number }
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

// Линейная интерполяция (оставлено для возможного использования)
// function lerp(a: number, b: number, t: number): number {
//     return a + (b - a) * t;
// }

export function CarRace({ onGameEnd, updateGameState, gameState, user, otherUser }: CarRaceProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const keysRef = useRef<Set<string>>(new Set());
    const playerRef = useRef<PlayerState | null>(null);
    const otherPlayersRef = useRef<Map<string, PlayerState>>(new Map());
    const aiPlayersRef = useRef<Map<string, PlayerState>>(new Map());
    const tireTracksRef = useRef<TireTrack[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const sparksRef = useRef<Spark[]>([]);

    // Refs для эффектов (сглаживание убрано для отзывчивости)

    const [isLoading, setIsLoading] = useState(true);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [raceStartTime, setRaceStartTime] = useState<number>(0);
    const [canvasSize, setCanvasSize] = useState({ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT });
    const [, setScale] = useState(1);
    const [showLandscapeHint, setShowLandscapeHint] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState(0);

    const lastUpdateRef = useRef<number>(0);
    const prevPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const { guard } = useActionGuard();
    const isMobile = useIsMobile();

    // Текущая карта
    const currentTrack = TRACKS[selectedTrack];

    // Функции проверки трека для текущей карты
    const isOnTrack = useCallback((x: number, y: number): boolean => {
        return pointInPolygon(x, y, currentTrack.outerPath) &&
               !pointInPolygon(x, y, currentTrack.innerPath);
    }, [currentTrack]);

    // Responsive canvas sizing
    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const maxWidth = container.clientWidth - 16;
            const maxHeight = container.clientHeight - 16;
            const scaleX = maxWidth / DESKTOP_WIDTH;
            const scaleY = maxHeight / DESKTOP_HEIGHT;
            const newScale = Math.min(scaleX, scaleY, 1);
            setScale(newScale);
            setCanvasSize({
                width: Math.floor(DESKTOP_WIDTH * newScale),
                height: Math.floor(DESKTOP_HEIGHT * newScale)
            });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [isGameStarted]);

    // Landscape hint for mobile
    useEffect(() => {
        if (!isMobile) return;
        const checkOrientation = () => {
            const portrait = window.innerHeight > window.innerWidth;
            setIsPortrait(portrait);
            if (portrait && !sessionStorage.getItem('carrace-landscape-hint-shown')) {
                setShowLandscapeHint(true);
            }
        };
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, [isMobile]);

    // Initialize player - СРАЗУ при старте игры (до countdown)
    useEffect(() => {
        if (!isGameStarted) return;
        // Инициализируем игрока сразу при старте, не ждём окончания countdown
        if (playerRef.current) return; // Уже инициализирован

        const playerIndex = Object.keys(gameState.carRacePlayers || {}).length;
        const startPos = currentTrack.startPositions[playerIndex % currentTrack.startPositions.length];

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

        // Initialize AI if no other user
        if (!otherUser) {
            const aiId = 'ai-bot-1';
            const aiStartPos = currentTrack.startPositions[1];
            aiPlayersRef.current.set(aiId, {
                id: aiId,
                name: 'AI Bot 🤖',
                x: aiStartPos.x,
                y: aiStartPos.y,
                vx: 0,
                vy: 0,
                rotation: aiStartPos.rotation,
                color: COLORS[1],
                hp: 100,
                lap: 0,
                checkpoint: 0,
                bestLapTime: Infinity,
                currentLapStart: performance.now(),
                finished: false,
                finishTime: 0,
                turbo: 50,
                isTurboActive: false,
            });
        }
    }, [isGameStarted, user.id, user.name, otherUser, currentTrack, gameState.carRacePlayers, updateGameState]);

    // Sync other players
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
                    setTimeout(() => canvasRef.current?.focus(), 100);
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

    // Keyboard controls - ПОЛНОСТЬЮ ПЕРЕРАБОТАННЫЕ
    useEffect(() => {
        console.log('[CarRace] Keyboard effect:', { isGameStarted, countdown });
        if (!isGameStarted || countdown !== null) return;
        console.log('[CarRace] Registering keyboard handlers');

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const validKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'shift'];
            console.log('[CarRace] keydown:', key, 'valid:', validKeys.includes(key));
            if (validKeys.includes(key)) {
                e.preventDefault();
                e.stopPropagation();
                keysRef.current.add(key);
                console.log('[CarRace] keys:', Array.from(keysRef.current));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            keysRef.current.delete(key);
        };

        const handleBlur = () => keysRef.current.clear();
        const handleVisibilityChange = () => {
            if (document.hidden) keysRef.current.clear();
        };

        // Attach to window with capture for guaranteed event handling
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        window.addEventListener('keyup', handleKeyUp, { capture: true });
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Auto-focus canvas
        const focusCanvas = () => canvasRef.current?.focus();
        focusCanvas();
        const focusTimer = setTimeout(focusCanvas, 100);
        const focusTimer2 = setTimeout(focusCanvas, 500);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            window.removeEventListener('keyup', handleKeyUp, { capture: true });
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearTimeout(focusTimer);
            clearTimeout(focusTimer2);
            keysRef.current.clear();
        };
    }, [isGameStarted, countdown]);

    // ФИЗИКА ИГРОКА - УПРОЩЁННАЯ И РАБОЧАЯ
    const updatePlayer = useCallback((dt: number, now: number) => {
        const player = playerRef.current;
        if (!player) return;

        const keys = keysRef.current;
        const prevX = player.x, prevY = player.y;

        // Прямое чтение ввода
        const accelerating = keys.has('arrowup') || keys.has('w');
        const braking = keys.has('arrowdown') || keys.has('s');
        const turnLeft = keys.has('arrowleft') || keys.has('a');
        const turnRight = keys.has('arrowright') || keys.has('d');

        // Turbo
        const turboActive = keys.has('shift') && player.turbo > 0;
        player.isTurboActive = turboActive;
        if (turboActive) player.turbo = Math.max(0, player.turbo - TURBO_DRAIN * dt);

        // Расчёт скорости
        const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        const maxSpeed = turboActive ? MAX_SPEED * TURBO_MULTIPLIER : MAX_SPEED;
        const damageMultiplier = player.hp > 50 ? 1 : 0.5 + (player.hp / 100);

        // УСКОРЕНИЕ - прямое без сглаживания
        if (accelerating) {
            const accelForce = ACCELERATION * dt * damageMultiplier;
            player.vx += Math.cos(player.rotation) * accelForce;
            player.vy += Math.sin(player.rotation) * accelForce;
        } else if (braking) {
            if (speed > 20) {
                // Торможение
                const brakeForce = BRAKE_FORCE * dt;
                const velAngle = Math.atan2(player.vy, player.vx);
                player.vx -= Math.cos(velAngle) * brakeForce;
                player.vy -= Math.sin(velAngle) * brakeForce;
            } else {
                // Задний ход
                const reverseForce = REVERSE_SPEED * dt;
                player.vx -= Math.cos(player.rotation) * reverseForce;
                player.vy -= Math.sin(player.rotation) * reverseForce;
            }
        }

        // ПОВОРОТ - работает даже на малой скорости
        const minSpeedForTurn = 5; // Очень низкий порог
        if (speed > minSpeedForTurn || accelerating || braking) {
            const turnAmount = TURN_SPEED * dt;
            if (turnLeft) player.rotation -= turnAmount;
            if (turnRight) player.rotation += turnAmount;

            // Дрифт при повороте на скорости
            if ((turnLeft || turnRight) && speed > 100) {
                const driftAmount = (speed / MAX_SPEED) * 0.25;
                player.turbo = Math.min(MAX_TURBO, player.turbo + TURBO_GAIN_DRIFT * driftAmount * dt);

                if (Math.random() < 0.25) {
                    tireTracksRef.current.push({
                        x: player.x - Math.cos(player.rotation) * 20,
                        y: player.y - Math.sin(player.rotation) * 20,
                        rotation: player.rotation,
                        alpha: 0.5,
                    });
                }
            }
        }

        // Трение
        const onTrack = isOnTrack(player.x, player.y);
        const friction = onTrack ? FRICTION : GRASS_FRICTION;
        player.vx *= friction;
        player.vy *= friction;

        // Дрифт-фактор - машина скользит в направлении движения
        const velAngle = Math.atan2(player.vy, player.vx);
        const angleDiff = normalizeAngle(player.rotation - velAngle);
        const driftFactor = DRIFT_FACTOR + (1 - DRIFT_FACTOR) * Math.abs(Math.cos(angleDiff));
        const newSpeed = speed * driftFactor;
        const blendedAngle = velAngle + angleDiff * (1 - DRIFT_FACTOR);
        player.vx = Math.cos(blendedAngle) * newSpeed * VELOCITY_DAMPING;
        player.vy = Math.sin(blendedAngle) * newSpeed * VELOCITY_DAMPING;

        // Ограничение скорости
        const currentSpeed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        if (currentSpeed > maxSpeed) {
            player.vx = (player.vx / currentSpeed) * maxSpeed;
            player.vy = (player.vy / currentSpeed) * maxSpeed;
        }

        // Движение
        player.x += player.vx * dt;
        player.y += player.vy * dt;

        // Частицы травы
        if (!onTrack && currentSpeed > 50) {
            particlesRef.current.push({
                x: player.x, y: player.y,
                vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 50,
                life: 0.5, color: '#4a7c23', size: 3,
            });
        }

        // Частицы турбо
        if (turboActive) {
            particlesRef.current.push({
                x: player.x - Math.cos(player.rotation) * 28,
                y: player.y - Math.sin(player.rotation) * 28,
                vx: -Math.cos(player.rotation) * 100 + (Math.random() - 0.5) * 30,
                vy: -Math.sin(player.rotation) * 100 + (Math.random() - 0.5) * 30,
                life: 0.3, color: '#f97316', size: 6,
            });
        }

        // Дым при повреждении
        if (player.hp < 50 && Math.random() < 0.1) {
            particlesRef.current.push({
                x: player.x, y: player.y,
                vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 20,
                life: 1, color: player.hp < 20 ? '#ef4444' : '#6b7280', size: 8,
            });
        }

        // Столкновение со стеной
        if (!onTrack) {
            player.hp -= WALL_DAMAGE * dt * 10;
            player.vx *= 0.85;
            player.vy *= 0.85;

            const pushAngle = Math.atan2(player.y - DESKTOP_HEIGHT / 2, player.x - DESKTOP_WIDTH / 2);
            const inInner = pointInPolygon(player.x, player.y, currentTrack.innerPath);
            const pushForce = 4;
            if (inInner) {
                player.x += Math.cos(pushAngle) * pushForce;
                player.y += Math.sin(pushAngle) * pushForce;
            } else {
                player.x -= Math.cos(pushAngle) * pushForce;
                player.y -= Math.sin(pushAngle) * pushForce;
            }

            for (let i = 0; i < 3; i++) {
                sparksRef.current.push({
                    x: player.x, y: player.y,
                    vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                    life: 0.3,
                });
            }
            hapticFeedback('light');
        }

        // Столкновение с другими машинами
        const allOthers = [...otherPlayersRef.current.values(), ...aiPlayersRef.current.values()];
        allOthers.forEach((other) => {
            const dist = distance(player.x, player.y, other.x, other.y);
            if (dist < CAR_WIDTH * 0.9) {
                const angle = Math.atan2(player.y - other.y, player.x - other.x);
                const overlap = CAR_WIDTH * 0.9 - dist;
                player.x += Math.cos(angle) * overlap * 0.5;
                player.y += Math.sin(angle) * overlap * 0.5;
                player.vx += Math.cos(angle) * 40;
                player.vy += Math.sin(angle) * 40;
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

        player.hp = Math.max(0, Math.min(100, player.hp));

        // Респавн при уничтожении
        if (player.hp <= 0) {
            const startPos = currentTrack.startPositions[0];
            player.x = startPos.x;
            player.y = startPos.y;
            player.vx = 0;
            player.vy = 0;
            player.rotation = startPos.rotation;
            player.hp = 100;
            player.checkpoint = 0;
            hapticFeedback('heavy');
        }

        // Чекпоинты
        const nextCheckpoint = player.checkpoint % currentTrack.checkpoints.length;
        if (checkCheckpoint(prevX, prevY, player.x, player.y, currentTrack.checkpoints[nextCheckpoint])) {
            player.checkpoint++;
            if (nextCheckpoint === 0 && player.checkpoint > currentTrack.checkpoints.length) {
                player.lap++;
                const lapTime = (now - player.currentLapStart) / 1000;
                if (lapTime < player.bestLapTime && player.lap > 1) {
                    player.bestLapTime = lapTime;
                }
                player.currentLapStart = now;
                hapticFeedback('medium');

                if (player.lap >= TOTAL_LAPS) {
                    player.finished = true;
                    player.finishTime = now - raceStartTime;
                    hapticFeedback('heavy');
                }
            }
        }

        prevPosRef.current = { x: player.x, y: player.y };

        // Обновляем состояние игры периодически (не каждый кадр)
        if (now - lastUpdateRef.current > 50) {
            lastUpdateRef.current = now;
            updateGameState({
                carRacePlayers: { [user.id]: { ...player } },
            });
        }
    }, [updateGameState, user.id, raceStartTime, isOnTrack, currentTrack]);

    // AI Physics
    const updateAI = useCallback((dt: number, now: number) => {
        aiPlayersRef.current.forEach(ai => {
            if (ai.finished) return;
      const prevX = ai.x, prevY = ai.y;
            const nextCheckpoint = ai.checkpoint % currentTrack.checkpoints.length;
            const cp = currentTrack.checkpoints[nextCheckpoint];
            const targetX = (cp.x1 + cp.x2) / 2;
            const targetY = (cp.y1 + cp.y2) / 2;

            const angleToTarget = Math.atan2(targetY - ai.y, targetX - ai.x);
            const angleDiff = normalizeAngle(angleToTarget - ai.rotation);

            const turnDir = angleDiff > 0.1 ? 1 : angleDiff < -0.1 ? -1 : 0;
            ai.rotation += turnDir * TURN_SPEED * 0.7 * dt;

            if (Math.abs(angleDiff) < 0.5) {
                ai.vx += Math.cos(ai.rotation) * ACCELERATION * 0.65 * dt;
                ai.vy += Math.sin(ai.rotation) * ACCELERATION * 0.65 * dt;
            }

            const onTrack = isOnTrack(ai.x, ai.y);
            const friction = onTrack ? FRICTION : GRASS_FRICTION;
            ai.vx *= friction;
            ai.vy *= friction;

            ai.x += ai.vx * dt;
            ai.y += ai.vy * dt;

            if (checkCheckpoint(prevX, prevY, ai.x, ai.y, cp)) {
                ai.checkpoint++;
                if (nextCheckpoint === 0 && ai.checkpoint > currentTrack.checkpoints.length) {
                    ai.lap++;
                    ai.currentLapStart = now;
                    if (ai.lap >= TOTAL_LAPS) {
                        ai.finished = true;
                        ai.finishTime = now - raceStartTime;
                    }
                }
            }
        });
    }, [raceStartTime, isOnTrack, currentTrack]);

    const updateParticles = (dt: number) => {
        particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= dt; p.size *= 0.98;
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
            s.x += s.vx * dt; s.y += s.vy * dt;
            s.vy += 200 * dt; s.life -= dt;
            return s.life > 0;
        });
    };

    // Render
    const render = (ctx: CanvasRenderingContext2D, now: number) => {
        // Background
        ctx.fillStyle = currentTrack.bgColor;
        ctx.fillRect(0, 0, DESKTOP_WIDTH, DESKTOP_HEIGHT);

        // Track
        ctx.fillStyle = currentTrack.trackColor;
        ctx.beginPath();
        ctx.moveTo(currentTrack.outerPath[0].x, currentTrack.outerPath[0].y);
        currentTrack.outerPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();

        // Inner grass
        ctx.fillStyle = currentTrack.bgColor;
        ctx.beginPath();
        ctx.moveTo(currentTrack.innerPath[0].x, currentTrack.innerPath[0].y);
        currentTrack.innerPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();

        // Track borders
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(currentTrack.outerPath[0].x, currentTrack.outerPath[0].y);
        currentTrack.outerPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(currentTrack.innerPath[0].x, currentTrack.innerPath[0].y);
        currentTrack.innerPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.stroke();

        // Start/Finish line
        const sp = currentTrack.startPositions[0];
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#000' : '#fff';
            ctx.fillRect(sp.x - 5, sp.y - 40 + i * 12, 10, 12);
        }

        // Tire tracks
        ctx.fillStyle = '#2a2a3a';
        tireTracksRef.current.forEach(t => {
            ctx.globalAlpha = t.alpha;
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.rotation);
            ctx.fillRect(-10, -3, 20, 6);
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

        // Draw cars
        otherPlayersRef.current.forEach(p => drawCar(ctx, p, false));
        aiPlayersRef.current.forEach(p => drawCar(ctx, p, false));
        if (playerRef.current) drawCar(ctx, playerRef.current, true);

        // Mini-map
        if (!isMobile) drawMiniMap(ctx);

        // HUD
        if (playerRef.current) drawHUD(ctx, playerRef.current, now);
    };

    // Draw car - УВЕЛИЧЕННЫЙ РАЗМЕР
    const drawCar = (ctx: CanvasRenderingContext2D, player: PlayerState, isCurrent: boolean) => {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-CAR_WIDTH/2 + 4, -CAR_HEIGHT/2 + 4, CAR_WIDTH, CAR_HEIGHT);

        // Car body
        const color = `#${player.color.toString(16).padStart(6, '0')}`;
        ctx.fillStyle = color;
        ctx.beginPath();
        // roundRect fallback for older browsers
        if (ctx.roundRect) {
            ctx.roundRect(-CAR_WIDTH/2, -CAR_HEIGHT/2, CAR_WIDTH, CAR_HEIGHT, 6);
        } else {
            ctx.rect(-CAR_WIDTH/2, -CAR_HEIGHT/2, CAR_WIDTH, CAR_HEIGHT);
        }
        ctx.fill();

        // Damage overlay
        if (player.hp < 100) {
            const damageAlpha = (100 - player.hp) / 200;
            ctx.fillStyle = `rgba(0,0,0,${damageAlpha})`;
            ctx.fillRect(-CAR_WIDTH/2, -CAR_HEIGHT/2, CAR_WIDTH, CAR_HEIGHT);
        }

        // Windshield
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(CAR_WIDTH/4 - 2, -CAR_HEIGHT/3, CAR_WIDTH/3, CAR_HEIGHT/1.5);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(CAR_WIDTH/2 - 4, -CAR_HEIGHT/3, 4, 5);
        ctx.fillRect(CAR_WIDTH/2 - 4, CAR_HEIGHT/3 - 5, 4, 5);

        // Wheels
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-CAR_WIDTH/2 - 3, -CAR_HEIGHT/2 - 4, 12, 8);
        ctx.fillRect(-CAR_WIDTH/2 - 3, CAR_HEIGHT/2 - 4, 12, 8);
        ctx.fillRect(CAR_WIDTH/2 - 9, -CAR_HEIGHT/2 - 4, 12, 8);
        ctx.fillRect(CAR_WIDTH/2 - 9, CAR_HEIGHT/2 - 4, 12, 8);

        // Turbo flame
        if (player.isTurboActive) {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-CAR_WIDTH/2, -6);
            ctx.lineTo(-CAR_WIDTH/2 - 20 - Math.random() * 12, 0);
            ctx.lineTo(-CAR_WIDTH/2, 6);
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(-CAR_WIDTH/2, -3);
            ctx.lineTo(-CAR_WIDTH/2 - 12 - Math.random() * 8, 0);
            ctx.lineTo(-CAR_WIDTH/2, 3);
            ctx.fill();
        }

        ctx.restore();

        // Name tag
        ctx.fillStyle = isCurrent ? '#7C3AED' : '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y - CAR_HEIGHT - 8);

        // HP bar
        const hpWidth = 36;
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x - hpWidth/2, player.y - CAR_HEIGHT - 22, hpWidth, 5);
        ctx.fillStyle = player.hp > 50 ? '#22c55e' : player.hp > 20 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(player.x - hpWidth/2, player.y - CAR_HEIGHT - 22, hpWidth * (player.hp / 100), 5);
    };

    const drawMiniMap = (ctx: CanvasRenderingContext2D) => {
        const mapScale = 0.11;
        const offsetX = DESKTOP_WIDTH - 115;
        const offsetY = 10;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(offsetX - 5, offsetY - 5, 110, 75);

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(offsetX + currentTrack.outerPath[0].x * mapScale, offsetY + currentTrack.outerPath[0].y * mapScale);
        currentTrack.outerPath.forEach(p => ctx.lineTo(offsetX + p.x * mapScale, offsetY + p.y * mapScale));
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offsetX + currentTrack.innerPath[0].x * mapScale, offsetY + currentTrack.innerPath[0].y * mapScale);
        currentTrack.innerPath.forEach(p => ctx.lineTo(offsetX + p.x * mapScale, offsetY + p.y * mapScale));
        ctx.closePath();
        ctx.stroke();

        // Players on minimap
        [...otherPlayersRef.current.values(), ...aiPlayersRef.current.values()].forEach(p => {
            ctx.fillStyle = `#${p.color.toString(16).padStart(6, '0')}`;
            ctx.beginPath();
            ctx.arc(offsetX + p.x * mapScale, offsetY + p.y * mapScale, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        if (playerRef.current) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(offsetX + playerRef.current.x * mapScale, offsetY + playerRef.current.y * mapScale, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawHUD = (ctx: CanvasRenderingContext2D, player: PlayerState, now: number) => {
        const hudScale = isMobile ? 0.85 : 1;

        // Lap counter
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 110 * hudScale, 55 * hudScale);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${15 * hudScale}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`Круг ${Math.min(player.lap + 1, TOTAL_LAPS)}/${TOTAL_LAPS}`, 15, 30 * hudScale);

        const raceTime = raceStartTime > 0 ? (now - raceStartTime) / 1000 : 0;
        ctx.font = `${13 * hudScale}px sans-serif`;
        ctx.fillText(`${raceTime.toFixed(1)}s`, 15, 50 * hudScale);

        // Turbo bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 60 * hudScale, 110 * hudScale, 20 * hudScale);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(12, 62 * hudScale, 106 * hudScale * (player.turbo / MAX_TURBO), 16 * hudScale);
        ctx.fillStyle = '#fff';
        ctx.font = `${10 * hudScale}px sans-serif`;
        ctx.fillText('TURBO', 40, 74 * hudScale);

        // Speed
        const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 85 * hudScale, 110 * hudScale, 24 * hudScale);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${15 * hudScale}px sans-serif`;
        ctx.fillText(`${Math.round(speed)} km/h`, 15, 102 * hudScale);

        // Track name
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(DESKTOP_WIDTH/2 - 80, 10, 160, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentTrack.name, DESKTOP_WIDTH/2, 26);
        ctx.textAlign = 'left';

        // Finish overlay
        if (player.finished) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, DESKTOP_WIDTH, DESKTOP_HEIGHT);
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏁 ФИНИШ!', DESKTOP_WIDTH/2, DESKTOP_HEIGHT/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            ctx.fillText(`Время: ${(player.finishTime / 1000).toFixed(2)}s`, DESKTOP_WIDTH/2, DESKTOP_HEIGHT/2 + 20);
        }
    };

    // Game loop
    useEffect(() => {
        if (!isGameStarted || countdown !== null || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();
        let isRunning = true;

        const gameLoop = (now: number) => {
            if (!isRunning) return;

            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            if (playerRef.current && !playerRef.current.finished) {
                updatePlayer(dt, now);
            }

            if (!otherUser) {
                updateAI(dt, now);
            }

            updateParticles(dt);
            updateTireTracks(dt);
            updateSparks(dt);
            render(ctx, now);

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
    }, [isGameStarted, countdown, updatePlayer, updateAI, otherUser, currentTrack, isMobile, raceStartTime]);

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

    const playerCount = Object.keys(gameState.carRacePlayers || {}).length + aiPlayersRef.current.size;

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
                            Гонка с физикой, дрифтом и 5 картами!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Track Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-white/60">
                                <MapIcon className="w-4 h-4" />
                                <span>Выберите трассу:</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {TRACKS.map((track, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedTrack(idx)}
                                        className={`p-3 rounded-xl text-left transition-all ${
                                            selectedTrack === idx
                                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                                                : 'bg-white/[0.02] border border-white/[0.06] text-white/70 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="text-xs font-bold">{track.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

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
                            {isMobile ? (
                                <ul className="text-xs text-white/60 space-y-1">
                                    <li>🕹️ Кнопки — Газ/Тормоз/Поворот</li>
                                    <li>🔥 Кнопка справа — Турбо</li>
                                    <li>💨 Дрифт копит турбо!</li>
                                </ul>
                            ) : (
                                <ul className="text-xs text-white/60 space-y-1">
                                    <li>↑/W — Газ • ↓/S — Тормоз/Назад</li>
                                    <li>←/A →/D — Поворот</li>
                                    <li>SHIFT — Турбо (копится при дрифте)</li>
                                </ul>
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                            <Users className="w-4 h-4" />
                            <span>{playerCount} игрок(ов) {!otherUser && '(включая AI)'}</span>
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

    // Main game render
    return (
        <div ref={containerRef} className="game-container flex flex-col items-center justify-center h-full w-full bg-black/95 relative overflow-hidden" data-game="car-race">
            {/* Landscape hint overlay */}
            {showLandscapeHint && isPortrait && (
                <div
                    className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6"
                    onClick={() => {
                        setShowLandscapeHint(false);
                        sessionStorage.setItem('carrace-landscape-hint-shown', 'true');
                    }}
                >
                    <div className="text-6xl mb-4">📱↔️</div>
                    <p className="text-white text-center text-lg mb-2">Поверните устройство</p>
                    <p className="text-white/60 text-center text-sm">Для лучшего опыта играйте в альбомной ориентации</p>
                    <p className="text-white/40 text-center text-xs mt-4">Нажмите, чтобы продолжить</p>
                </div>
            )}

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={DESKTOP_WIDTH}
                height={DESKTOP_HEIGHT}
                className="rounded-lg shadow-2xl"
                style={{
                    touchAction: 'none',
                    width: canvasSize.width,
                    height: canvasSize.height
                }}
                tabIndex={0}
                data-game="car-race"
                onClick={() => canvasRef.current?.focus()}
            />

            {/* Countdown overlay */}
            {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
                    <div className="text-8xl font-bold text-white animate-pulse">
                        {countdown === 0 ? '🏁 GO!' : countdown}
                    </div>
                </div>
            )}

            {/* Mobile controls */}
            {isMobile && countdown === null && (
                <MobileControls keysRef={keysRef} />
            )}

            {/* Back button */}
            <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="absolute top-2 left-2 text-white/60 hover:text-white z-30"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Выход
            </Button>
        </div>
    );
}

// Mobile Controls Component
function MobileControls({ keysRef }: { keysRef: React.MutableRefObject<Set<string>> }) {
    const handleTouchStart = (key: string) => (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        keysRef.current.add(key);
        hapticFeedback('light');
    };

    const handleTouchEnd = (key: string) => (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        keysRef.current.delete(key);
    };

    const buttonClass = "w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold select-none active:scale-90 transition-transform touch-none";
    const primaryBtn = "bg-white/25 text-white border-2 border-white/40 backdrop-blur-sm shadow-lg";
    const accentBtn = "bg-orange-500/90 text-white border-2 border-orange-400/60 shadow-lg shadow-orange-500/30";

    return (
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 z-30 pointer-events-none">
            {/* Left side - Direction controls */}
            <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="flex gap-2">
                    <button
                        className={`${buttonClass} ${primaryBtn}`}
                        onTouchStart={handleTouchStart('arrowleft')}
                        onTouchEnd={handleTouchEnd('arrowleft')}
                        onTouchCancel={handleTouchEnd('arrowleft')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        ◀
                    </button>
                    <button
                        className={`${buttonClass} ${primaryBtn}`}
                        onTouchStart={handleTouchStart('arrowright')}
                        onTouchEnd={handleTouchEnd('arrowright')}
                        onTouchCancel={handleTouchEnd('arrowright')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        ▶
                    </button>
                </div>
            </div>

            {/* Right side - Gas/Brake/Turbo */}
            <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="flex gap-2">
                    <button
                        className={`${buttonClass} ${primaryBtn}`}
                        onTouchStart={handleTouchStart('arrowdown')}
                        onTouchEnd={handleTouchEnd('arrowdown')}
                        onTouchCancel={handleTouchEnd('arrowdown')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        🛑
                    </button>
                    <button
                        className={`${buttonClass} ${primaryBtn}`}
                        onTouchStart={handleTouchStart('arrowup')}
                        onTouchEnd={handleTouchEnd('arrowup')}
                        onTouchCancel={handleTouchEnd('arrowup')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        ⬆
                    </button>
                    <button
                        className={`${buttonClass} ${accentBtn}`}
                        onTouchStart={handleTouchStart('shift')}
                        onTouchEnd={handleTouchEnd('shift')}
                        onTouchCancel={handleTouchEnd('shift')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        🔥
                    </button>
                </div>
            </div>
        </div>
    );
}
