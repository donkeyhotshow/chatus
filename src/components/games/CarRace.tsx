import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GameState, UserProfile } from '@/lib/types';
import { Trophy, Zap, Gamepad2, Star, Clock, Car } from 'lucide-react';
import { hapticFeedback } from '@/lib/game-utils';
import GameLayout from './GameLayout';
import MobileGameControls from './MobileGameControls';
import { PremiumButton } from '../ui/premium-button';
import { AnimatePresence, motion } from 'framer-motion';

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
const DESKTOP_WIDTH = 900;
const DESKTOP_HEIGHT = 600;
const CAR_WIDTH = 56;
const CAR_HEIGHT = 28;

const MAX_SPEED = 320;
const ACCELERATION = 350;
const BRAKE_FORCE = 500;
const REVERSE_SPEED = 100;
const TURN_SPEED = 2.8;
const FRICTION = 0.985;
const GRASS_FRICTION = 0.94;
const DRIFT_FACTOR = 0.92;
const TURBO_MULTIPLIER = 1.4;
const TURBO_DRAIN = 25;
const TURBO_GAIN_DRIFT = 12;
const MAX_TURBO = 100;
const TOTAL_LAPS = 3;
const COLLISION_DAMAGE = 12;
const WALL_DAMAGE = 6;
const VELOCITY_DAMPING = 0.99;

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

export function CarRace({ onGameEnd, updateGameState, gameState, user, otherUser }: CarRaceProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const keysRef = useRef<Set<string>>(new Set());
    const playerRef = useRef<PlayerState | null>(null);
    const otherPlayersRef = useRef<Map<string, PlayerState>>(new Map());
    const aiPlayersRef = useRef<Map<string, PlayerState>>(new Map());
    const tireTracksRef = useRef<TireTrack[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const sparksRef = useRef<Spark[]>([]);

    const [isGameStarted, setIsGameStarted] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [raceStartTime, setRaceStartTime] = useState<number>(0);
    const [selectedTrack, setSelectedTrack] = useState(0);

    const lastUpdateRef = useRef<number>(0);
    const prevPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const currentTrack = TRACKS[selectedTrack];

    const isOnTrack = useCallback((x: number, y: number): boolean => {
        return pointInPolygon(x, y, currentTrack.outerPath) &&
               !pointInPolygon(x, y, currentTrack.innerPath);
    }, [currentTrack]);

    // Initialize player
    useEffect(() => {
        if (!isGameStarted) return;
        if (playerRef.current) return;

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

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            keysRef.current.add(key);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            keysRef.current.delete(key);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const updatePlayer = useCallback((dt: number, now: number) => {
        const player = playerRef.current;
        if (!player || player.finished) return;

        const keys = keysRef.current;
        const prevX = player.x, prevY = player.y;

        const accelerating = keys.has('arrowup') || keys.has('w');
        const braking = keys.has('arrowdown') || keys.has('s');
        const turnLeft = keys.has('arrowleft') || keys.has('a');
        const turnRight = keys.has('arrowright') || keys.has('d');
        const turboActive = (keys.has('shift') || keys.has(' ')) && player.turbo > 0;

        player.isTurboActive = turboActive;
        if (turboActive) player.turbo = Math.max(0, player.turbo - TURBO_DRAIN * dt);

        const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        const maxSpeed = turboActive ? MAX_SPEED * TURBO_MULTIPLIER : MAX_SPEED;

        if (accelerating) {
            player.vx += Math.cos(player.rotation) * ACCELERATION * dt;
            player.vy += Math.sin(player.rotation) * ACCELERATION * dt;
        } else if (braking) {
            if (speed > 20) {
                const brakeForce = BRAKE_FORCE * dt;
                const velAngle = Math.atan2(player.vy, player.vx);
                player.vx -= Math.cos(velAngle) * brakeForce;
                player.vy -= Math.sin(velAngle) * brakeForce;
            } else {
                player.vx -= Math.cos(player.rotation) * REVERSE_SPEED * dt;
                player.vy -= Math.sin(player.rotation) * REVERSE_SPEED * dt;
            }
        }

        if (speed > 5 || accelerating || braking) {
            const turnAmount = TURN_SPEED * dt;
            if (turnLeft) player.rotation -= turnAmount;
            if (turnRight) player.rotation += turnAmount;
        }

        const onTrack = isOnTrack(player.x, player.y);
        const friction = onTrack ? FRICTION : GRASS_FRICTION;
        player.vx *= friction;
        player.vy *= friction;

        const currentSpeed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        if (currentSpeed > maxSpeed) {
            player.vx = (player.vx / currentSpeed) * maxSpeed;
            player.vy = (player.vy / currentSpeed) * maxSpeed;
        }

        player.x += player.vx * dt;
        player.y += player.vy * dt;

        // Collision with walls
        if (!onTrack) {
            player.hp -= WALL_DAMAGE * dt * 5;
            player.vx *= 0.9;
            player.vy *= 0.9;
        }

        // Checkpoints
        const nextCheckpoint = player.checkpoint % currentTrack.checkpoints.length;
        if (checkCheckpoint(prevX, prevY, player.x, player.y, currentTrack.checkpoints[nextCheckpoint])) {
            player.checkpoint++;
            if (nextCheckpoint === 0 && player.checkpoint > currentTrack.checkpoints.length) {
                player.lap++;
                player.currentLapStart = now;
                if (player.lap >= TOTAL_LAPS) {
                    player.finished = true;
                    player.finishTime = now - raceStartTime;
                }
            }
        }

        if (now - lastUpdateRef.current > 50) {
            lastUpdateRef.current = now;
            updateGameState({ carRacePlayers: { [user.id]: { ...player } } });
        }
    }, [updateGameState, user.id, raceStartTime, isOnTrack, currentTrack]);

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

            ai.rotation += (angleDiff > 0.1 ? 1 : angleDiff < -0.1 ? -1 : 0) * TURN_SPEED * 0.7 * dt;
            ai.vx += Math.cos(ai.rotation) * ACCELERATION * 0.6 * dt;
            ai.vy += Math.sin(ai.rotation) * ACCELERATION * 0.6 * dt;

            const friction = isOnTrack(ai.x, ai.y) ? FRICTION : GRASS_FRICTION;
            ai.vx *= friction;
            ai.vy *= friction;
            ai.x += ai.vx * dt;
            ai.y += ai.vy * dt;

            if (checkCheckpoint(prevX, prevY, ai.x, ai.y, cp)) {
                ai.checkpoint++;
                if (nextCheckpoint === 0 && ai.checkpoint > currentTrack.checkpoints.length) {
                    ai.lap++;
                    if (ai.lap >= TOTAL_LAPS) {
                        ai.finished = true;
                        ai.finishTime = now - raceStartTime;
                    }
                }
            }
        });
    }, [raceStartTime, isOnTrack, currentTrack]);

    useEffect(() => {
        if (!isGameStarted || countdown !== null) return;
        let lastTime = performance.now();
        const loop = (now: number) => {
            const dt = Math.min(0.1, (now - lastTime) / 1000);
            lastTime = now;
            updatePlayer(dt, now);
            updateAI(dt, now);
            gameLoopRef.current = requestAnimationFrame(loop);
        };
        gameLoopRef.current = requestAnimationFrame(loop);
        return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
    }, [isGameStarted, countdown, updatePlayer, updateAI]);

    const renderCanvas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const scaleX = width / DESKTOP_WIDTH;
        const scaleY = height / DESKTOP_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        const offsetX = (width - DESKTOP_WIDTH * scale) / 2;
        const offsetY = (height - DESKTOP_HEIGHT * scale) / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // Background
        ctx.fillStyle = currentTrack.bgColor;
        ctx.fillRect(0, 0, DESKTOP_WIDTH, DESKTOP_HEIGHT);

        // Track
        ctx.fillStyle = currentTrack.trackColor;
        ctx.beginPath();
        currentTrack.outerPath.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        currentTrack.innerPath.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Finish line
        const cp = currentTrack.checkpoints[0];
        ctx.strokeStyle = 'white';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cp.x1, cp.y1);
        ctx.lineTo(cp.x2, cp.y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw players
        const drawCar = (p: PlayerState) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = '#' + p.color.toString(16).padStart(6, '0');
            ctx.fillRect(-CAR_WIDTH / 2, -CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT);
            // Cabin
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(-CAR_WIDTH / 4, -CAR_HEIGHT / 3, CAR_WIDTH / 2, CAR_HEIGHT / 1.5);
            ctx.restore();
        };

        if (playerRef.current) drawCar(playerRef.current);
        otherPlayersRef.current.forEach(drawCar);
        aiPlayersRef.current.forEach(drawCar);

        ctx.restore();
    }, [currentTrack]);

    const handleDirectionChange = useCallback((dir: { x: number; y: number }) => {
        if (dir.y < 0) keysRef.current.add('w'); else keysRef.current.delete('w');
        if (dir.y > 0) keysRef.current.add('s'); else keysRef.current.delete('s');
        if (dir.x < 0) keysRef.current.add('a'); else keysRef.current.delete('a');
        if (dir.x > 0) keysRef.current.add('d'); else keysRef.current.delete('d');
    }, []);

    const handleAction = useCallback((action: string) => {
        if (action === 'turbo') keysRef.current.add('shift');
    }, []);

    const handleActionEnd = useCallback((action: string) => {
        if (action === 'turbo') keysRef.current.delete('shift');
    }, []);

    const isGameOver = playerRef.current?.finished || Array.from(aiPlayersRef.current.values()).some(p => p.finished);

    return (
        <GameLayout
            title="Car Race"
            icon={<Car className="w-5 h-5 text-blue-400" />}
            onExit={onGameEnd}
            score={playerRef.current?.lap || 0}
            gameTime={Math.floor((performance.now() - raceStartTime) / 1000)}
            playerCount={1 + otherPlayersRef.current.size + aiPlayersRef.current.size}
            responsiveOptions={{
                gridCols: 30,
                gridRows: 20,
                maxCellSize: 30,
                padding: 16,
                accountForNav: true
            }}
            preferredOrientation="landscape"
            mobileControls={
                <MobileGameControls
                    scheme="joystick"
                    onDirectionChange={handleDirectionChange}
                    onActionStart={handleAction}
                    onActionEnd={handleActionEnd}
                    actions={[{ id: 'turbo', label: 'TURBO', icon: <Zap className="w-6 h-6" /> }]}
                />
            }
        >
            {({ dimensions }) => {
                useEffect(() => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    renderCanvas(ctx, dimensions.width, dimensions.height);
                }, [dimensions, renderCanvas]);

                return (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <canvas
                            ref={canvasRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            className="rounded-xl shadow-2xl"
                        />

                        <AnimatePresence>
                            {!isGameStarted && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-20"
                                >
                                    <Car className="w-16 h-16 text-blue-500 mb-4" />
                                    <h2 className="text-3xl font-bold text-white mb-2">Car Race</h2>
                                    <div className="flex gap-4 mb-6">
                                        {TRACKS.map((t, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedTrack(i)}
                                                className={`px-4 py-2 rounded-lg border ${selectedTrack === i ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'}`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                    <PremiumButton onClick={() => setIsGameStarted(true)} size="lg">
                                        <Zap className="w-5 h-5 mr-2" /> Начать гонку
                                    </PremiumButton>
                                </motion.div>
                            )}

                            {countdown !== null && (
                                <motion.div
                                    initial={{ scale: 2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                                >
                                    <span className="text-8xl font-black text-white drop-shadow-2xl">{countdown}</span>
                                </motion.div>
                            )}

                            {isGameOver && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-xl z-40"
                                >
                                    <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
                                    <h2 className="text-3xl font-bold text-white mb-2">Финиш!</h2>
                                    <p className="text-xl text-white/60 mb-6">
                                        Ваше время: {((playerRef.current?.finishTime || 0) / 1000).toFixed(2)}с
                                    </p>
                                    <div className="flex gap-3">
                                        <PremiumButton onClick={() => {
                                            playerRef.current = null;
                                            setIsGameStarted(false);
                                        }}>
                                            <Star className="w-4 h-4 mr-2" /> Сначала
                                        </PremiumButton>
                                        <PremiumButton onClick={onGameEnd} variant="secondary">Выйти</PremiumButton>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* HUD Overlay */}
                        {isGameStarted && countdown === null && !isGameOver && (
                            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
                                <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white font-bold text-sm">
                                    КРУГ {playerRef.current?.lap || 0}/{TOTAL_LAPS}
                                </div>
                                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        className="h-full bg-orange-500"
                                        animate={{ width: `${(playerRef.current?.turbo || 0) / MAX_TURBO * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            }}
        </GameLayout>
    );
}
