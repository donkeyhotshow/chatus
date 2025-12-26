"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, UserProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ArrowLeft, Car, Users, Gamepad2 } from 'lucide-react';
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
    rotation: number;
    color: number;
};

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const CAR_WIDTH = 80;
const CAR_HEIGHT = 56;
const VELOCITY = 200;
const REVERSE_VELOCITY = 100;
const ANGULAR_VELOCITY = 100;
const DRAG = 0.95;

function getRandomColor(): number {
    const colors = [
        0x7C3AED, // violet
        0x10B981, // emerald
        0xF59E0B, // amber
        0xEF4444, // red
        0x3B82F6, // blue
        0xEC4899, // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

export function CarRace({ onGameEnd, updateGameState, gameState, user, otherUser, roomId }: CarRaceProps) {
    const canvasRefRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const keysRef = useRef<Set<string>>(new Set());
    const playerRef = useRef<PlayerState | null>(null);
    const otherPlayersRef = useRef<Map<string, PlayerState>>(new Map());
    const carImageRef = useRef<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const lastUpdateRef = useRef<number>(0);
    const { guard } = useActionGuard();

    // Initialize player state
    useEffect(() => {
        if (!isGameStarted) return;

        const startX = 100 + Math.random() * 200;
        const startY = 100 + Math.random() * 300;

        playerRef.current = {
            id: user.id,
            name: user.name,
            x: startX,
            y: startY,
            rotation: 0,
            color: getRandomColor(),
        };

        // Broadcast initial position
        updateGameState({
            carRacePlayers: {
                ...gameState.carRacePlayers,
                [user.id]: playerRef.current,
            },
        });
    }, [isGameStarted, user.id, user.name]);

    // Sync other players from game state
    useEffect(() => {
        if (!gameState.carRacePlayers) return;

        Object.entries(gameState.carRacePlayers).forEach(([id, player]) => {
            if (id !== user.id) {
                otherPlayersRef.current.set(id, player as PlayerState);
            }
        });

        // Remove disconnected players
        otherPlayersRef.current.forEach((_, id) => {
            if (!gameState.carRacePlayers?.[id]) {
                otherPlayersRef.current.delete(id);
            }
        });
    }, [gameState.carRacePlayers, user.id]);

    // Load car image
    useEffect(() => {
        const img = new Image();
        img.src = '/games/car-race/car.png';
        img.onload = () => {
            carImageRef.current = img;
            setIsLoading(false);
        };
        img.onerror = () => {
            console.error('Failed to load car image');
            setIsLoading(false);
        };
    }, []);

    // Keyboard handlers
    useEffect(() => {
        if (!isGameStarted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
                e.preventDefault();
                keysRef.current.add(e.key.toLowerCase());
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysRef.current.delete(e.key.toLowerCase());
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isGameStarted]);

    // Game loop
    useEffect(() => {
        if (!isGameStarted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();

        const gameLoop = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Update player
            if (playerRef.current) {
                const keys = keysRef.current;
                const player = playerRef.current;

                // Rotation (only when moving)
                const isMoving = keys.has('arrowup') || keys.has('arrowdown') || keys.has('w') || keys.has('s');
                if (isMoving) {
                    if (keys.has('arrowleft') || keys.has('a')) {
                        player.rotation -= ANGULAR_VELOCITY * deltaTime * (Math.PI / 180);
                    }
                    if (keys.has('arrowright') || keys.has('d')) {
                        player.rotation += ANGULAR_VELOCITY * deltaTime * (Math.PI / 180);
                    }
                }

                // Movement
                const velX = Math.cos(player.rotation);
                const velY = Math.sin(player.rotation);

                if (keys.has('arrowup') || keys.has('w')) {
                    player.x += VELOCITY * velX * deltaTime;
                    player.y += VELOCITY * velY * deltaTime;
                }
                if (keys.has('arrowdown') || keys.has('s')) {
                    player.x -= REVERSE_VELOCITY * velX * deltaTime;
                    player.y -= REVERSE_VELOCITY * velY * deltaTime;
                }

                // Bounds
                player.x = Math.max(CAR_WIDTH / 2, Math.min(GAME_WIDTH - CAR_WIDTH / 2, player.x));
                player.y = Math.max(CAR_HEIGHT / 2, Math.min(GAME_HEIGHT - CAR_HEIGHT / 2, player.y));

                // Broadcast position (throttled)
                if (currentTime - lastUpdateRef.current > 50) {
                    lastUpdateRef.current = currentTime;
                    updateGameState({
                        carRacePlayers: {
                            ...gameState.carRacePlayers,
                            [user.id]: { ...player },
                        },
                    });
                }
            }

            // Render
            render(ctx);

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [isGameStarted, gameState.carRacePlayers, updateGameState, user.id]);

    const render = useCallback((ctx: CanvasRenderingContext2D) => {
        // Clear
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < GAME_WIDTH; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < GAME_HEIGHT; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }

        // Draw border
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4);

        // Draw other players
        otherPlayersRef.current.forEach((player) => {
            drawCar(ctx, player, false);
        });

        // Draw current player
        if (playerRef.current) {
            drawCar(ctx, playerRef.current, true);
        }
    }, []);

    const drawCar = (ctx: CanvasRenderingContext2D, player: PlayerState, isCurrentPlayer: boolean) => {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);

        if (carImageRef.current) {
            // Apply tint
            ctx.drawImage(
                carImageRef.current,
                -CAR_WIDTH / 2,
                -CAR_HEIGHT / 2,
                CAR_WIDTH,
                CAR_HEIGHT
            );

            // Tint overlay
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `#${player.color.toString(16).padStart(6, '0')}`;
            ctx.fillRect(-CAR_WIDTH / 2, -CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';
        } else {
            // Fallback rectangle
            ctx.fillStyle = `#${player.color.toString(16).padStart(6, '0')}`;
            ctx.fillRect(-CAR_WIDTH / 2, -CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT);
        }

        // Highlight current player
        if (isCurrentPlayer) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-CAR_WIDTH / 2 - 2, -CAR_HEIGHT / 2 - 2, CAR_WIDTH + 4, CAR_HEIGHT + 4);
        }

        ctx.restore();

        // Draw name
        ctx.fillStyle = isCurrentPlayer ? '#7C3AED' : '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y - CAR_HEIGHT / 2 - 8);
    };

    const handleStart = guard(() => {
        setIsGameStarted(true);
        hapticFeedback('medium');
    });

    const handleBack = guard(() => {
        // Clean up player from game state
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
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Car className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-white">Car Race</CardTitle>
                        <CardDescription className="text-white/50">
                            Многопользовательская гонка в реальном времени
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4" />
                                Управление
                            </h4>
                            <ul className="text-sm text-white/60 space-y-1">
                                <li>↑ / W — Вперёд</li>
                                <li>↓ / S — Назад</li>
                                <li>← / A — Поворот влево</li>
                                <li>→ / D — Поворот вправо</li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                            <Users className="w-4 h-4" />
                            <span>{playerCount} игрок(ов) в комнате</span>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="w-8 h-8 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <Button
                                onClick={handleStart}
                                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all min-h-[48px]"
                            >
                                Начать игру
                            </Button>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={handleBack}
                            variant="ghost"
                            className="w-full text-white/40 hover:text-white min-h-[44px]"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Вернуться в лобби
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black">
            {/* Header */}
            <div className="p-3 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Выход</span>
                </button>

                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 shadow-lg">
                    <Car className="w-4 h-4 text-white" />
                    <span className="font-semibold text-white text-sm">Car Race</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-white/50">
                    <Users className="w-4 h-4" />
                    <span>{playerCount}</span>
                </div>
            </div>

            {/* Game Canvas */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className={cn(
                        "rounded-2xl border-2 border-white/10 shadow-2xl",
                        "max-w-full max-h-full object-contain"
                    )}
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden p-4 border-t border-white/10 bg-black/80">
                <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                    <div />
                    <MobileButton
                        onPress={() => keysRef.current.add('arrowup')}
                        onRelease={() => keysRef.current.delete('arrowup')}
                    >
                        ↑
                    </MobileButton>
                    <div />
                    <MobileButton
                        onPress={() => keysRef.current.add('arrowleft')}
                        onRelease={() => keysRef.current.delete('arrowleft')}
                    >
                        ←
                    </MobileButton>
                    <MobileButton
                        onPress={() => keysRef.current.add('arrowdown')}
                        onRelease={() => keysRef.current.delete('arrowdown')}
                    >
                        ↓
                    </MobileButton>
                    <MobileButton
                        onPress={() => keysRef.current.add('arrowright')}
                        onRelease={() => keysRef.current.delete('arrowright')}
                    >
                        →
                    </MobileButton>
                </div>
            </div>
        </div>
    );
}

// Mobile control button
function MobileButton({
    children,
    onPress,
    onRelease,
}: {
    children: React.ReactNode;
    onPress: () => void;
    onRelease: () => void;
}) {
    return (
        <button
            onTouchStart={(e) => {
                e.preventDefault();
                onPress();
                hapticFeedback('light');
            }}
            onTouchEnd={(e) => {
                e.preventDefault();
                onRelease();
            }}
            onMouseDown={onPress}
            onMouseUp={onRelease}
            onMouseLeave={onRelease}
            className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 text-white text-xl font-bold flex items-center justify-center active:bg-violet-600 active:border-violet-500 transition-colors touch-manipulation select-none"
        >
            {children}
        </button>
    );
}
