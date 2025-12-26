"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Hand, HandMetal, Scissors, ArrowLeft } from 'lucide-react';
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

export function RockPaperScissors({ onGameEnd, updateGameState, gameState, user, otherUser }: RockPaperScissorsProps) {
    const [selectedChoice, setSelectedChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const myMove = gameState.moves?.[user.id];
    const otherMove = otherUser ? gameState.moves?.[otherUser.id] : undefined;
    const { guard } = useActionGuard();

    // Сброс выбора при сбросе игры
    useEffect(() => {
        if (!gameState.moves || Object.keys(gameState.moves).length === 0) {
            setSelectedChoice(null);
            setIsAnimating(false);
        }
    }, [gameState.moves]);

    const handlePlay = guard((...args: unknown[]) => {
        const move = args[0] as 'rock' | 'paper' | 'scissors';
        if (myMove || !otherUser || isAnimating) return;

        setSelectedChoice(move);
        setIsAnimating(true);

        // Анимация перед отправкой
        setTimeout(() => {
            const newMoves = { ...gameState.moves, [user.id]: move };

            // If the other player has already made a move, determine the result
            if (otherMove) {
                const outcome = outcomes[move][otherMove];
                let resultText = "";
                if (outcome === 'win') resultText = `${user.name} Wins!`;
                else if (outcome === 'lose') resultText = `${otherUser.name} Wins!`;
                else resultText = "It's a Draw!";
                updateGameState({ moves: newMoves, result: resultText });
            } else {
                // If other player hasn't moved, just update our move
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
    if (!otherUser) {
        description = "Ожидание соперника...";
    } else if (gameState.result) {
        description = `Результат: ${gameState.result}`;
    } else if (myMove && !otherMove) {
        description = 'Ожидание хода соперника...';
    } else if (!myMove && otherMove) {
        description = `${otherUser.name} сделал ход!`;
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
                        </div>
                        <span className="font-bold text-2xl text-white/30">VS</span>
                        <div className="flex flex-col items-center gap-2">
                            <Avatar>
                                <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                                <AvatarFallback>{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className={`
                            h-24 w-24 text-6xl flex items-center justify-center bg-white/[0.02] rounded-xl
                            border border-white/[0.06] transition-all duration-300
                            ${gameState.result && otherMove ? 'bg-purple-500/10 border-purple-500/30' : ''}
                        `}>
                                {gameState.result || (myMove && otherUser) ? (
                                    otherMove ? (
                                        <span className={choices.find(c => c.id === otherMove)?.color}>
                                            {choices.find(c => c.id === otherMove)?.icon}
                                        </span>
                                    ) : '?'
                                ) : '?'}
                            </div>
                        </div>
                    </div>
                    {!myMove && otherUser && !isAnimating && (
                        <div className="flex gap-4">
                            {choices.map(choice => (
                                <Button
                                    key={choice.id}
                                    size="icon"
                                    className="h-20 w-20 transition-all hover:scale-110 active:scale-95 bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/10"
                                    onClick={() => handlePlay(choice.id)}
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
