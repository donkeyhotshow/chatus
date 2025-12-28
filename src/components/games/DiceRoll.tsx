"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Dices, Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useActionGuard, hapticFeedback } from "@/lib/game-utils";
import { AnimationQueue, createAnimationQueue } from "@/lib/animation-queue";
import { logger } from "@/lib/logger";
import { ExitButton } from "../ui/ExitButton";

type DiceRollProps = {
    onGameEnd: () => void;
    updateGameState: (newState: Partial<GameState>) => void;
    gameState: GameState;
    user: UserProfile;
    otherUser?: UserProfile;
};

const AI_BOT_ID = '__AI_DICE_BOT__';
const AI_BOT: UserProfile = {
    id: AI_BOT_ID,
    name: 'AI Bot 🎲',
    avatar: '',
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
    const [isAiRolling, setIsAiRolling] = useState(false);
    const [rollingValue, setRollingValue] = useState<number | null>(null);
    const [aiRollingValue, setAiRollingValue] = useState<number | null>(null);
    const animationQueueRef = useRef<AnimationQueue | null>(null);
    const rollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const aiRollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Use AI if no other user
    const isVsAI = !otherUser;
    const opponent = otherUser || AI_BOT;

    const myRoll = gameState.diceRoll?.[user.id];
    const otherRoll = gameState.diceRoll?.[opponent.id];
    const { guard } = useActionGuard();

    // Initialize animation queue
    useEffect(() => {
        animationQueueRef.current = createAnimationQueue({ maxTimeout: 2000 });
        return () => {
            animationQueueRef.current?.clear();
            if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);
            if (aiRollingIntervalRef.current) clearInterval(aiRollingIntervalRef.current);
        };
    }, []);

    // Animation effect for player rolling dice
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

    // Animation effect for AI rolling dice
    useEffect(() => {
        if (!isAiRolling) {
            if (aiRollingIntervalRef.current) {
                clearInterval(aiRollingIntervalRef.current);
                aiRollingIntervalRef.current = null;
            }
            return;
        }
        aiRollingIntervalRef.current = setInterval(() => {
            setAiRollingValue(Math.floor(Math.random() * 6) + 1);
        }, 100);
        return () => {
            if (aiRollingIntervalRef.current) {
                clearInterval(aiRollingIntervalRef.current);
                aiRollingIntervalRef.current = null;
            }
        };
    }, [isAiRolling]);

    const handleRoll = guard(() => {
        if (myRoll || isRolling || isAiRolling) return;

        const animationQueue = animationQueueRef.current;
        if (!animationQueue) {
            logger.error('Animation queue not initialized');
            return;
        }

        setIsRolling(true);
        hapticFeedback('medium');

        const playerResult = Math.floor(Math.random() * 6) + 1;

        const completePlayerRoll = () => {
            const newRolls = { ...gameState.diceRoll, [user.id]: playerResult };
            updateGameState({ diceRoll: newRolls });
            setIsRolling(false);
            setRollingValue(null);
            hapticFeedback('heavy');

            // If vs AI, trigger AI roll after player
            if (isVsAI) {
                setTimeout(() => triggerAiRoll(newRolls), 500);
            }
        };

        const enqueued = animationQueue.enqueue({
            id: `dice-roll-${user.id}`,
            duration: 800,
            onComplete: completePlayerRoll,
            onError: () => completePlayerRoll()
        });

        if (!enqueued) completePlayerRoll();
    });

    const triggerAiRoll = (currentRolls: Record<string, number>) => {
        if (currentRolls[AI_BOT_ID]) return; // AI already rolled

        setIsAiRolling(true);
        hapticFeedback('light');

        const aiResult = Math.floor(Math.random() * 6) + 1;

        // Faster AI response: 400-600ms instead of 800-1200ms
        setTimeout(() => {
            updateGameState({ diceRoll: { ...currentRolls, [AI_BOT_ID]: aiResult } });
            setIsAiRolling(false);
            setAiRollingValue(null);
            hapticFeedback('heavy');
        }, 400 + Math.random() * 200);
    };

    const handleReset = guard(() => {
        animationQueueRef.current?.cancel(`dice-roll-${user.id}`);
        updateGameState({ diceRoll: {} });
        setIsRolling(false);
        setIsAiRolling(false);
        setRollingValue(null);
        setAiRollingValue(null);
        hapticFeedback('light');
    });

    const bothHaveRolled = myRoll && otherRoll;
    let resultText = "Бросьте кости!";

    if (bothHaveRolled) {
        if (myRoll > otherRoll) {
            resultText = `${user.name} выиграл с ${myRoll}!`;
        } else if (otherRoll > myRoll) {
            resultText = `${opponent.name} выиграл с ${otherRoll}!`;
        } else {
            resultText = `Ничья: ${myRoll}!`;
        }
    } else if (myRoll && isVsAI) {
        resultText = isAiRolling ? "AI бросает кости..." : `Вы выбросили ${myRoll}. AI думает...`;
    } else if (myRoll) {
        resultText = `Вы выбросили ${myRoll}. Ожидание соперника...`;
    } else if (otherRoll) {
        resultText = `${opponent.name} сделал ход. Ваша очередь!`;
    }

    const displayMyValue = isRolling && rollingValue ? rollingValue : myRoll;
    const displayAiValue = isAiRolling && aiRollingValue ? aiRollingValue : otherRoll;

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
            <Card className="bg-black/90 border-white/[0.06] backdrop-blur-xl w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2 text-white">
                        <Dices />Кости
                    </CardTitle>
                    <CardDescription className="text-white/50">{resultText}</CardDescription>
                    {isVsAI && (
                        <div className="flex items-center justify-center gap-2 text-sm text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20 mt-2">
                            <Bot className="w-4 h-4" />
                            <span>Игра против AI</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex justify-around w-full items-center">
                        {/* Player */}
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
                                {displayMyValue ? diceIcons[displayMyValue - 1] : <Dices />}
                            </div>
                            <span className="font-bold text-white">{user.name}</span>
                        </div>

                        <span className="font-bold text-2xl text-white/30">VS</span>

                        {/* Opponent / AI */}
                        <div className="flex flex-col items-center gap-2">
                            {isVsAI ? (
                                <div className="w-10 h-10 bg-violet-500/20 flex items-center justify-center rounded-full">
                                    <Bot className="w-5 h-5 text-violet-400" />
                                </div>
                            ) : (
                                <Avatar>
                                    <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                                    <AvatarFallback>{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={`
                                h-24 w-24 text-8xl flex items-center justify-center p-2
                                transition-all duration-300
                                ${isAiRolling ? 'animate-spin scale-110 text-violet-400' : 'text-white/40'}
                                ${otherRoll ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black text-white' : ''}
                            `}>
                                {displayAiValue ? diceIcons[displayAiValue - 1] : <Dices />}
                            </div>
                            <span className="font-bold text-white/40">{opponent.name}</span>
                        </div>
                    </div>

                    {!bothHaveRolled && (
                        <Button
                            onClick={handleRoll}
                            disabled={isRolling || isAiRolling || !!myRoll}
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 min-h-[48px]"
                        >
                            {isRolling ? 'Бросаем...' : isAiRolling ? 'AI бросает...' : myRoll ? 'Ожидание...' : 'Бросить кости'}
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
                    <ExitButton
                        view="game"
                        hasUnsavedChanges={isRolling || isAiRolling}
                        onExit={onGameEnd}
                        variant="text"
                        buttonText="Вернуться в лобби"
                        className="w-full text-white/40 hover:text-white"
                    />
                </CardFooter>
            </Card>
        </div>
    );
}
