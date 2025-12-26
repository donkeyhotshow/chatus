"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Hand, HandMetal, Scissors, ArrowLeft, Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useActionGuard, hapticFeedback } from "@/lib/game-utils";

type RockPaperScissorsProps = {
    onGameEnd: () => void;
    updateGameState: (newState: Partial<GameState>) => void;
    gameState: GameState;
    user: UserProfile;
    otherUser?: UserProfile;
};

const choices = [
    { id: 'rock' as const, icon: <HandMetal className="w-8 h-8" />, color: 'text-white/60' },
    { id: 'paper' as const, icon: <Hand className="w-8 h-8" />, color: 'text-white' },
    { id: 'scissors' as const, icon: <Scissors className="w-8 h-8" />, color: 'text-violet-400' }
];

const outcomes: { [key: string]: { [key: string]: string } } = {
    rock: { rock: 'draw', paper: 'lose', scissors: 'win' },
    paper: { rock: 'win', paper: 'draw', scissors: 'lose' },
    scissors: { rock: 'lose', paper: 'win', scissors: 'draw' }
};

const AI_BOT_ID = '__AI_BOT__';

export function RockPaperScissors({ onGameEnd, updateGameState, gameState, user, otherUser }: RockPaperScissorsProps) {
    const [selectedChoice, setSelectedChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const isVsAI = !otherUser;
    const opponent = otherUser || { id: AI_BOT_ID, name: 'AI Bot', avatar: '' };

    const myMove = gameState.moves?.[user.id];
    const otherMove = gameState.moves?.[opponent.id];
    const { guard } = useActionGuard();

    // Сброс выбора при сбросе игры
    useEffect(() => {
        if (!gameState.moves || Object.keys(gameState.moves).length === 0) {
            setSelectedChoice(null);
            setIsAnimating(false);
        }
    }, [gameState.moves]);

    // AI Move Logic - Fixed to prevent infinite loop, faster response
    useEffect(() => {
        // Only run if: playing vs AI, player made move, AI hasn't moved, no result yet
        if (!isVsAI || !myMove || otherMove || gameState.result) return;

        // Faster AI: 500-800ms instead of 1000-2000ms
        const timer = setTimeout(() => {
            const aiMove = choices[Math.floor(Math.random() * choices.length)].id;
            const outcome = outcomes[myMove][aiMove];

            let resultText = "";
            if (outcome === 'win') resultText = `${user.name} Wins!`;
            else if (outcome === 'lose') resultText = `AI Bot Wins!`;
            else resultText = "It's a Draw!";

            updateGameState({
                moves: { ...gameState.moves, [AI_BOT_ID]: aiMove },
                result: resultText
            });
            hapticFeedback('medium');
        }, 500 + Math.random() * 300);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVsAI, myMove, otherMove, gameState.result]);

    const handlePlay = guard((...args: unknown[]) => {
        const move = args[0] as 'rock' | 'paper' | 'scissors';
        if (myMove || isAnimating) return;

        setSelectedChoice(move);
        setIsAnimating(true);

        // Анимация перед отправкой
        setTimeout(() => {
            const newMoves = { ...gameState.moves, [user.id]: move };

            if (otherMove) {
                const outcome = outcomes[move][otherMove];
                let resultText = "";
                if (outcome === 'win') resultText = `${user.name} Wins!`;
                else if (outcome === 'lose') resultText = `${opponent.name} Wins!`;
                else resultText = "It's a Draw!";
                updateGameState({ moves: newMoves, result: resultText });
            } else {
                updateGameState({ moves: newMoves });
            }

            setIsAnimating(false);
            hapticFeedback('medium');
        }, 300);
    });

    const handleReset = guard(() => {
        updateGameState({ moves: {}, result: null });
        setSelectedChoice(null);
        setIsAnimating(false);
        hapticFeedback('light');
    });

    let description = 'Выберите оружие!';
    if (!otherUser && !isVsAI) {
        description = "Ожидание соперника...";
    } else if (gameState.result) {
        description = `Результат: ${gameState.result}`;
    } else if (myMove && !otherMove) {
        description = isVsAI ? 'AI Bot думает...' : 'Ожидание хода соперника...';
    } else if (!myMove && otherMove) {
        description = `${opponent.name} сделал ход!`;
    }

    const displayMyMove = selectedChoice || myMove;

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
            <Card className="bg-black/90 border-white/[0.06] backdrop-blur-xl w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-white">Камень, ножницы, бумага</CardTitle>
                    <CardDescription className="text-white/50">{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex justify-around w-full items-center">
                        <div className="flex flex-col items-center gap-2">
                            <Avatar>
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`
                            h-24 w-24 text-6xl flex items-center justify-center bg-white/[0.02] rounded-xl
                            border border-white/[0.06] transition-all duration-300
                            ${isAnimating && selectedChoice ? 'scale-110 ring-2 ring-violet-500' : ''}
                            ${displayMyMove ? 'bg-violet-500/10 border-violet-500/30' : ''}
                        `}>
                                {displayMyMove ? (
                                    <span className={choices.find(c => c.id === displayMyMove)?.color}>
                                        {choices.find(c => c.id === displayMyMove)?.icon}
                                    </span>
                                ) : '?'}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">ВЫ</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-2xl text-white/30 italic">VS</span>
                            {isVsAI && (
                                <div className="mt-1 flex items-center gap-1 text-[8px] text-violet-400 uppercase tracking-tighter font-bold">
                                    <Bot className="w-2 h-2" /> AI
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Avatar>
                                {isVsAI ? (
                                    <div className="w-10 h-10 bg-violet-500/20 flex items-center justify-center rounded-full">
                                        <Bot className="w-5 h-5 text-violet-400" />
                                    </div>
                                ) : (
                                    <>
                                        <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                                        <AvatarFallback>{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                            <div className={`
                            h-24 w-24 text-6xl flex items-center justify-center bg-white/[0.02] rounded-xl
                            border border-white/[0.06] transition-all duration-300
                            ${gameState.result && otherMove ? 'bg-purple-500/10 border-purple-500/30' : ''}
                        `}>
                                {gameState.result || (myMove && opponent.id === AI_BOT_ID) ? (
                                    otherMove ? (
                                        <span className={choices.find(c => c.id === otherMove)?.color}>
                                            {choices.find(c => c.id === otherMove)?.icon}
                                        </span>
                                    ) : '?'
                                ) : '?'}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">ОППОНЕНТ</span>
                        </div>
                    </div>
                    {!myMove && (otherUser || isVsAI) && !isAnimating && (
                        <div className="flex gap-3 sm:gap-4">
                            {choices.map(choice => (
                                <Button
                                    key={choice.id}
                                    size="icon"
                                    className="h-16 w-16 sm:h-20 sm:w-20 min-w-[60px] min-h-[60px] transition-all hover:scale-110 active:scale-95 bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/10 touch-target"
                                    onClick={() => handlePlay(choice.id)}
                                    aria-label={choice.id === 'rock' ? 'Камень' : choice.id === 'paper' ? 'Бумага' : 'Ножницы'}
                                >
                                    {choice.icon}
                                </Button>
                            ))}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 p-4">
                    {gameState.result && (
                        <Button
                            onClick={handleReset}
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all min-h-[48px]"
                        >
                            Играть снова
                        </Button>
                    )}
                    <Button onClick={onGameEnd} variant="ghost" size="sm" className="w-full text-white/40 hover:text-white min-h-[44px]">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Вернуться в лобби
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
