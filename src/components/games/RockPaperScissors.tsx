"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useState, useEffect } from "react";
import { Hand, HandMetal, Scissors, Bot } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useActionGuard, hapticFeedback } from "@/lib/game-utils";
import GameLayout from "./GameLayout";
import { PremiumCard, PremiumCardContent, PremiumCardDescription, PremiumCardHeader, PremiumCardTitle } from "../ui/premium-card";
import { PremiumButton } from "../ui/premium-button";

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

    useEffect(() => {
        if (!gameState.moves || Object.keys(gameState.moves).length === 0) {
            setSelectedChoice(null);
            setIsAnimating(false);
        }
    }, [gameState.moves]);

    useEffect(() => {
        if (!isVsAI || !myMove || otherMove || gameState.result) return;

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
    }, [isVsAI, myMove, otherMove, gameState.result, user.name, updateGameState, gameState.moves]);

    const handlePlay = guard((move: 'rock' | 'paper' | 'scissors') => {
        if (myMove || isAnimating) return;

        setSelectedChoice(move);
        setIsAnimating(true);

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
    if (!otherUser && !isVsAI) description = "Ожидание соперника...";
    else if (gameState.result) description = `Результат: ${gameState.result}`;
    else if (myMove && !otherMove) description = isVsAI ? 'AI Bot думает...' : 'Ожидание хода соперника...';
    else if (!myMove && otherMove) description = `${opponent.name} сделал ход!`;

    const displayMyMove = selectedChoice || myMove;

    return (
        <GameLayout
            title="Rock Paper Scissors"
            icon={<HandMetal className="w-5 h-5 text-violet-400" />}
            onExit={onGameEnd}
            score={0}
            gameTime={0}
            playerCount={isVsAI ? 1 : 2}
        >
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-4">
                <PremiumCard variant="glass" glow className="w-full">
                    <PremiumCardHeader>
                        <PremiumCardTitle className="font-headline text-2xl text-white text-center">Камень, ножницы, бумага</PremiumCardTitle>
                        <PremiumCardDescription className="text-white/50 text-center">{description}</PremiumCardDescription>
                    </PremiumCardHeader>
                    <PremiumCardContent className="flex flex-col items-center gap-6">
                        <div className="flex justify-around w-full items-center">
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="w-12 h-12 border border-white/10">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className={`
                                    h-20 w-20 text-4xl flex items-center justify-center bg-white/[0.02] rounded-xl
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
                                {isVsAI && <div className="mt-1 flex items-center gap-1 text-[8px] text-violet-400 uppercase tracking-tighter font-bold"><Bot className="w-2 h-2" /> AI</div>}
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="w-12 h-12 border border-white/10">
                                    {isVsAI ? (
                                        <div className="w-full h-full bg-violet-500/20 flex items-center justify-center rounded-full"><Bot className="w-5 h-5 text-violet-400" /></div>
                                    ) : (
                                        <>
                                            <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                                            <AvatarFallback>{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                                <div className={`
                                    h-20 w-20 text-4xl flex items-center justify-center bg-white/[0.02] rounded-xl
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
                            <div className="flex gap-3">
                                {choices.map(choice => (
                                    <PremiumButton
                                        key={choice.id}
                                        variant="secondary"
                                        className="h-16 w-16 min-w-[64px] transition-all hover:scale-110 active:scale-95 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/10"
                                        onClick={() => handlePlay(choice.id)}
                                    >
                                        {choice.icon}
                                    </PremiumButton>
                                ))}
                            </div>
                        )}

                        {gameState.result && (
                            <PremiumButton onClick={handleReset} className="w-full" glow>Играть снова</PremiumButton>
                        )}
                    </PremiumCardContent>
                </PremiumCard>
            </div>
        </GameLayout>
    );
}
