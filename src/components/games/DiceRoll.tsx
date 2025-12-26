"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Dices, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useActionGuard, hapticFeedback } from "@/lib/game-utils";
import { AnimationQueue, createAnimationQueue } from "@/lib/animation-queue";
import { logger } from "@/lib/logger";

type DiceRollProps = {
    onGameEnd: () => void;
    updateGameState: (newState: Partial<GameState>) => void;
    gameState: GameState;
    user: UserProfile;
    otherUser?: UserProfile;
};

const diceIcons = [
    <Dice1 key="d1" className="w-full h-full" />,
    <Dice2 key="d2" className="w-full h-full" />,
    <Dice3 key="d3" className="w-full h-full" />,
    <Dice4 key="d4" className="w-full h-full" />,
    <Dice5 key="d5" className="w-full h-full" />,
    <Dice6 key="d6" className="w-full h-full" />
];

export function DiceRoll({ onGameEnd, updateGameState, gameState, user, otherUser }: DiceRollProps) {
    const [isRolling, setIsRolling] = useState(false);
    const [rollingValue, setRollingValue] = useState<number | null>(null);
    const animationQueueRef = useRef<AnimationQueue | null>(null);
    const rollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const myRoll = gameState.diceRoll?.[user.id];
    const otherRoll = otherUser ? gameState.diceRoll?.[otherUser.id] : undefined;
    const { guard } = useActionGuard();

    // Initialize animation queue
    useEffect(() => {
        animationQueueRef.current = createAnimationQueue({ maxTimeout: 2000 });
        return () => {
            animationQueueRef.current?.clear();
            if (rollingIntervalRef.current) {
                clearInterval(rollingIntervalRef.current);
            }
        };
    }, []);

    // Animation effect for rolling dice visual
    useEffect(() => {
        if (!isRolling) {
            if (rollingIntervalRef.current) {
                clearInterval(rollingIntervalRef.current);
                rollingIntervalRef.current = null;
            }
            return;
        }

        rollingIntervalRef.current = setInterval(() => {
            setRollingValue(Math.floor(Math.random() * 6) + 1);
        }, 100);

        return () => {
            if (rollingIntervalRef.current) {
                clearInterval(rollingIntervalRef.current);
                rollingIntervalRef.current = null;
            }
        };
    }, [isRolling]);

    const handleRoll = guard(() => {
        if (!otherUser || myRoll || isRolling) return;

        const animationQueue = animationQueueRef.current;
        if (!animationQueue) {
            logger.error('Animation queue not initialized');
            return;
        }

        setIsRolling(true);
        hapticFeedback('medium');

        // Generate result upfront for graceful degradation
        const result = Math.floor(Math.random() * 6) + 1;

        const completeRoll = () => {
            const newRolls = {
                ...gameState.diceRoll,
                [user.id]: result
            };
            updateGameState({ diceRoll: newRolls });
            setIsRolling(false);
            setRollingValue(null);
            hapticFeedback('heavy');
        };

        // Use AnimationQueue with timeout guarantee (max 2000ms)
        const enqueued = animationQueue.enqueue({
            id: `dice-roll-${user.id}`,
            duration: 800,
            onComplete: completeRoll,
            onError: (error) => {
                // Graceful degradation: show result directly on error
                logger.warn('Dice animation failed, showing result directly', { error: error.message });
                completeRoll();
            }
        });

        // Fallback if enqueue fails
        if (!enqueued) {
            logger.warn('Failed to enqueue dice animation, completing immediately');
            completeRoll();
        }
    });

    const handleReset = guard(() => {
        // Cancel any pending animations
        animationQueueRef.current?.cancel(`dice-roll-${user.id}`);
        updateGameState({ diceRoll: {} });
        setIsRolling(false);
        setRollingValue(null);
        hapticFeedback('light');
    });

    const bothHaveRolled = myRoll && otherRoll;
    let resultText = "Бросьте кости!";

    if (!otherUser) {
        resultText = "Ожидание соперника...";
    } else if (bothHaveRolled) {
        if (myRoll! > otherRoll!) {
            resultText = `${user.name} выиграл с ${myRoll}!`;
        } else if (otherRoll! > myRoll!) {
            resultText = `${otherUser?.name} выиграл с ${otherRoll}!`;
        } else {
            resultText = `Ничья: ${myRoll}!`;
        }
    } else if (myRoll) {
        resultText = `Вы выбросили ${myRoll}. Ожидание соперника...`;
    } else if (otherRoll) {
        resultText = `${otherUser?.name} сделал ход. Ваша очередь!`;
    }

    const displayValue = isRolling && rollingValue ? rollingValue : myRoll;

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
            <Card className="bg-black/90 border-white/[0.06] backdrop-blur-xl w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2 text-white"><Dices />Кости</CardTitle>
                    <CardDescription className="text-white/50">{resultText}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex justify-around w-full items-center">
                        <div className="flex flex-col items-center gap-2">
                            <Avatar>
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`
                            h-24 w-24 text-8xl flex items-center justify-center text-white p-2
                            transition-all duration-300
                            ${isRolling ? 'animate-spin scale-110' : ''}
                            ${myRoll ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-black' : ''}
                        `}>
                                {isRolling && rollingValue ? (
                                    diceIcons[rollingValue - 1]
                                ) : displayValue ? (
                                    diceIcons[displayValue - 1]
                                ) : (
                                    <Dices className={isRolling ? 'animate-spin' : ''} />
                                )}
                            </div>
                            <span className="font-bold text-white">{user.name}</span>
                        </div>
                        <span className="font-bold text-2xl text-white/30">VS</span>
                        <div className="flex flex-col items-center gap-2">
                            <Avatar>
                                <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                                <AvatarFallback>{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className={`
                            h-24 w-24 text-8xl flex items-center justify-center text-white/40 p-2
                            transition-all duration-300
                            ${otherRoll ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}
                        `}>
                                {otherRoll ? diceIcons[otherRoll - 1] : <Dices />}
                            </div>
                            <span className="font-bold text-white/40">{otherUser?.name || "Opponent"}</span>
                        </div>
                    </div>

                    {!bothHaveRolled && (
                        <Button
                            onClick={handleRoll}
                            disabled={isRolling || !!myRoll || !otherUser}
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 min-h-[48px]"
                        >
                            {isRolling ? 'Rolling...' : (myRoll ? 'Waiting...' : 'Roll Dice')}
                        </Button>
                    )}

                    {bothHaveRolled && (
                        <Button
                            onClick={handleReset}
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all min-h-[48px]"
                        >
                            Играть снова
                        </Button>
                    )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Button onClick={onGameEnd} variant="ghost" size="sm" className="w-full text-white/40 hover:text-white min-h-[44px]">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Вернуться в лобби
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
