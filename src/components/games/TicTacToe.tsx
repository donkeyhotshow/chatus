"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import Confetti from 'react-confetti';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, Circle, X } from "lucide-react";
import { useActionGuard, hapticFeedback } from "@/lib/game-utils";

type TicTacToeProps = {
    onGameEnd: () => void;
    updateGameState: (newState: Partial<GameState>) => void;
    gameState: GameState;
    user: UserProfile;
    otherUser?: UserProfile;
};

const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function calculateWinner(board: (string | null)[]) {
    for (let i = 0; i < winningCombos.length; i++) {
        const [a, b, c] = winningCombos[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

const XIcon = () => <X className="w-10 h-10 text-white animate-in fade-in zoom-in-50 duration-300" />;
const OIcon = () => <Circle className="w-10 h-10 text-cyan-400 animate-in fade-in zoom-in-50 duration-300" />;

export function TicTacToe({ onGameEnd, updateGameState, gameState, user, otherUser }: TicTacToeProps) {
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [optimisticBoard, setOptimisticBoard] = useState<(string | null)[] | null>(null);
    const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);

    const { board, currentPlayer, winner, hostId } = gameState;
    const isDraw = !winner && board?.every(cell => cell !== null);
    
    const mySymbol = hostId === user.id ? 'X' : 'O';
    const otherSymbol = hostId === user.id ? 'O' : 'X';
    
    const playerSymbols: { [key: string]: 'X' | 'O' } = hostId ? {
        [hostId]: 'X',
        ...(otherUser && otherUser.id !== hostId && { [otherUser.id]: 'O' }),
        ...(user.id !== hostId && { [user.id]: 'O' })
    } : {};
    
    const myTurn = currentPlayer === user.id;
    const displayBoard = optimisticBoard || board;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // Синхронизация оптимистичного состояния с реальным
    useEffect(() => {
        if (board) {
            setOptimisticBoard(null);
            setLastMoveIndex(null);
        }
    }, [board]);

    const { guard } = useActionGuard();

    const handleClick = guard((i: number) => {
        if (winner || displayBoard?.[i] || !myTurn || !otherUser) return;
        
        // Оптимистичное обновление
        const newOptimisticBoard = displayBoard!.slice();
        newOptimisticBoard[i] = playerSymbols[user.id];
        setOptimisticBoard(newOptimisticBoard);
        setLastMoveIndex(i);
        
        const newBoard = board!.slice();
        newBoard[i] = playerSymbols[user.id];
        
        const newWinner = calculateWinner(newBoard);
        
        updateGameState({
            board: newBoard,
            currentPlayer: otherUser.id,
            winner: newWinner ? user.id : null,
        });

        hapticFeedback('light');
    });

    const handleReset = guard(() => {
        let newStarterId = hostId;
        if (otherUser) {
           const playerIds = [user.id, otherUser.id];
           newStarterId = playerIds.find(id => id !== gameState.currentPlayer) ?? hostId;
        }

        setOptimisticBoard(null);
        setLastMoveIndex(null);

        updateGameState({
            board: Array(9).fill(null),
            currentPlayer: newStarterId,
            winner: null
        });

        hapticFeedback('medium');
    });
    
    const getPlayerName = (playerId: string) => {
      if (playerId === user.id) return user.name;
      if (playerId === otherUser?.id) return otherUser.name;
      return "Player";
    }

    const getStatus = () => {
        if (winner) return `Winner: ${getPlayerName(winner)}`;
        if (isDraw) return "It's a Draw!";
        if (!otherUser) return "Waiting for opponent...";
        if (!currentPlayer) return "Game is ready, host can start.";
        return `Turn: ${getPlayerName(currentPlayer)} (${playerSymbols[currentPlayer]}) - ${myTurn ? "Your turn" : "Waiting"}`;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
            {winner === user.id && windowSize.width > 0 && (
                <Confetti 
                    width={windowSize.width} 
                    height={windowSize.height} 
                    recycle={false} 
                    numberOfPieces={200}
                    gravity={0.3}
                />
            )}
             <Card className="bg-neutral-950/80 border-white/10 backdrop-blur-sm w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">Tic-Tac-Toe</CardTitle>
                     <CardTitle className="text-sm font-medium text-neutral-400 pt-2">{getStatus()}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="grid grid-cols-3 gap-2 p-2 bg-black/30 rounded-lg">
                        {displayBoard?.map((cell, i) => (
                            <button
                                key={i}
                                onClick={() => handleClick(i)}
                                className={`
                                    h-20 w-20 bg-neutral-900 rounded-lg flex items-center justify-center text-4xl font-bold 
                                    transition-all duration-200 hover:bg-neutral-800 disabled:cursor-not-allowed
                                    ${lastMoveIndex === i ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-neutral-950' : ''}
                                    ${!cell && myTurn && !winner ? 'hover:scale-105' : ''}
                                `}
                                disabled={!!winner || !!displayBoard[i] || !myTurn || !otherUser}
                            >
                                {cell === 'X' ? <XIcon /> : cell === 'O' ? <OIcon /> : null}
                            </button>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 p-4">
                     {(winner || isDraw) && (
                        <Button 
                            onClick={handleReset} 
                            className="w-full bg-white text-black hover:bg-neutral-200 transition-all"
                        >
                            Play Again
                        </Button>
                     )}
                    <Button onClick={onGameEnd} variant="ghost" size="sm" className="w-full text-neutral-400 hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Lobby
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
