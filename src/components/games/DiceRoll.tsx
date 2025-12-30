"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useState, useEffect, useRef } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Dices, Bot } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useActionGuard, hapticFeedback } from "@/lib/game-utils";
import { createAnimationQueue } from "@/lib/animation-queue";
import GameLayout from "./GameLayout";
import { PremiumCard, PremiumCardContent, PremiumCardDescription, PremiumCardHeader, PremiumCardTitle } from "../ui/premium-card";
import { PremiumButton } from "../ui/premium-button";

type DiceRollProps = {
    onGameEnd: () => void;
    updateGameState: (newState: Partial<GameState>) => void;
    gameState: GameState;
    user: UserProfile;
    otherUser?: UserProfile;
};

const AI_BOT_ID = '__AI_DICE_BOT__';
const AI_BOT: UserProfile = { id: AI_BOT_ID, name: 'AI Bot 🎲', avatar: '' };

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
    const animationQueueRef = useRef<ReturnType<typeof createAnimationQueue> | null>(null);
    const rollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const aiRollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const isVsAI = !otherUser;
    const opponent = otherUser || AI_BOT;
    const myRoll = gameState.diceRoll?.[user.id];
    const otherRoll = gameState.diceRoll?.[opponent.id];
    const { guard } = useActionGuard();

    useEffect(() => {
        animationQueueRef.current = createAnimationQueue({ maxTimeout: 2000 });
        return () => {
            animationQueueRef.current?.clear();
            if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);
            if (aiRollingIntervalRef.current) clearInterval(aiRollingIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isRolling) { if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current); return; }
        rollingIntervalRef.current = setInterval(() => setRollingValue(Math.floor(Math.random() * 6) + 1), 100);
        return () => { if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current); };
    }, [isRolling]);

    useEffect(() => {
        if (!isAiRolling) { if (aiRollingIntervalRef.current) clearInterval(aiRollingIntervalRef.current); return; }
        aiRollingIntervalRef.current = setInterval(() => setAiRollingValue(Math.floor(Math.random() * 6) + 1), 100);
        return () => { if (aiRollingIntervalRef.current) clearInterval(aiRollingIntervalRef.current); };
    }, [isAiRolling]);

    const handleRoll = guard(() => {
        if (myRoll || isRolling || isAiRolling) return;
        setIsRolling(true);
        hapticFeedback('medium');
        const res = Math.floor(Math.random() * 6) + 1;
        const complete = () => {
            const newRolls = { ...gameState.diceRoll, [user.id]: res };
            updateGameState({ diceRoll: newRolls });
            setIsRolling(false);
            setRollingValue(null);
            hapticFeedback('heavy');
            if (isVsAI) setTimeout(() => triggerAiRoll(newRolls), 500);
        };
        animationQueueRef.current?.enqueue({ id: `dice-roll-${user.id}`, duration: 800, onComplete: complete, onError: complete });
    });

    const triggerAiRoll = (rolls: Record<string, number>) => {
        if (rolls[AI_BOT_ID]) return;
        setIsAiRolling(true);
        hapticFeedback('light');
        const res = Math.floor(Math.random() * 6) + 1;
        setTimeout(() => {
            updateGameState({ diceRoll: { ...rolls, [AI_BOT_ID]: res } });
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

    const bothRolled = myRoll && otherRoll;
    let resultText = "Бросьте кости!";
    if (bothRolled) {
        if (myRoll > otherRoll) resultText = `${user.name} выиграл с ${myRoll}!`;
        else if (otherRoll > myRoll) resultText = `${opponent.name} выиграл с ${otherRoll}!`;
        else resultText = `Ничья: ${myRoll}!`;
    } else if (myRoll) resultText = isAiRolling ? "AI бросает кости..." : `Вы выбросили ${myRoll}. Ожидание...`;

    const displayMyVal = isRolling && rollingValue ? rollingValue : myRoll;
    const displayAiVal = isAiRolling && aiRollingValue ? aiRollingValue : otherRoll;

    return (
        <GameLayout
            title="Dice Roll"
            icon={<Dices className="w-5 h-5 text-violet-400" />}
            onExit={onGameEnd}
            score={myRoll || 0}
            gameTime={0}
            playerCount={isVsAI ? 1 : 2}
        >
            <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto p-4">
                <PremiumCard variant="glass" glow className="w-full">
                    <PremiumCardHeader className="text-center">
                        <PremiumCardTitle className="font-headline text-2xl flex items-center justify-center gap-2 text-white"><Dices />Кости</PremiumCardTitle>
                        <PremiumCardDescription className="text-white/50">{resultText}</PremiumCardDescription>
                    </PremiumCardHeader>
                    <PremiumCardContent className="flex flex-col items-center gap-6">
                        <div className="flex justify-around w-full items-center">
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="w-10 h-10 border border-white/10">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className={`h-20 w-20 text-6xl flex items-center justify-center text-white p-2 transition-all duration-300 ${isRolling ? 'animate-spin scale-110' : ''} ${myRoll ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-black' : ''}`}>
                                    {displayMyVal ? diceIcons[displayMyVal - 1] : <Dices />}
                                </div>
                                <span className="font-bold text-white text-xs">{user.name}</span>
                            </div>
                            <span className="font-bold text-xl text-white/30">VS</span>
                            <div className="flex flex-col items-center gap-2">
                                {isVsAI ? (
                                    <div className="w-10 h-10 bg-violet-500/20 flex items-center justify-center rounded-full"><Bot className="w-5 h-5 text-violet-400" /></div>
                                ) : (
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                                        <AvatarFallback>{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`h-20 w-20 text-6xl flex items-center justify-center p-2 transition-all duration-300 ${isAiRolling ? 'animate-spin scale-110 text-violet-400' : 'text-white/40'} ${otherRoll ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black text-white' : ''}`}>
                                    {displayAiVal ? diceIcons[displayAiVal - 1] : <Dices />}
                                </div>
                                <span className="font-bold text-white/40 text-xs">{opponent.name}</span>
                            </div>
                        </div>

                        {!bothRolled && (
                            <PremiumButton onClick={handleRoll} disabled={isRolling || isAiRolling || !!myRoll} className="w-full" glow>
                                {isRolling ? 'Бросаем...' : isAiRolling ? 'AI бросает...' : myRoll ? 'Ожидание...' : 'Бросить кости'}
                            </PremiumButton>
                        )}

                        {bothRolled && (
                            <PremiumButton onClick={handleReset} className="w-full" glow>Играть снова</PremiumButton>
                        )}
                    </PremiumCardContent>
                </PremiumCard>
            </div>
        </GameLayout>
    );
}
