"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import Confetti from 'react-confetti';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, Circle, X, Bot } from "lucide-react";
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

// AI Logic - Minimax algorithm for unbeatable AI
function getAIMove(board: (string | null)[], aiSymbol: 'X' | 'O'): number {
    const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';

    // Check for winning move
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            const testBoard = [...board];
            testBoard[i] = aiSymbol;
            if (calculateWinner(testBoard) === aiSymbol) {
                return i;
            }
        }
    }

    // Block player's winning move
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            const testBoard = [...board];
            testBoard[i] = playerSymbol;
            if (calculateWinner(testBoard) === playerSymbol) {
                return i;
            }
        }
    }

    // Take center if available
    if (board[4] === null) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === null);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available edge
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(i => board[i] === null);
    if (availableEdges.length > 0) {
        return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }

    return -1;
}

const XIcon = () => <X className="w-10 h-10 text-white animate-in fade-in zoom-in-50 duration-300" />;
const OIcon = () => <Circle className="w-10 h-10 text-violet-400 animate-in fade-in zoom-in-50 duration-300" />;

// AI player constant
const AI_PLAYER_ID = '__AI__';
const AI_PLAYER: UserProfile = {
    id: AI_PLAYER_ID,
    name: 'AI Bot',
    avatar: '',
};

export function TicTacToe({ onGameEnd, updateGameState, gameState, user, otherUser }: TicTacToeProps) {
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [optimisticBoard, setOptimisticBoard] = useState<(string | null)[] | null>(null);
    const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);
    const [isAIThinking, setIsAIThinking] = useState(false);
    const aiMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { board, currentPlayer, winner, hostId } = gameState;
    const isDraw = !winner && board?.every(cell => cell !== null);

    // Use AI if no other user
    const isVsAI = !otherUser;
    const opponent = otherUser || AI_PLAYER;

    const playerSymbols: { [key: string]: 'X' | 'O' } = hostId ? {
        [hostId]: 'X',
        [opponent.id]: 'O',
        ...(user.id !== hostId && { [user.id]: 'O' })
    } : {};

    const myTurn = currentPlayer === user.id;
    const isAITurn = isVsAI && currentPlayer === AI_PLAYER_ID;
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

    // AI Move Logic - BUG-001 FIX: Use ref to avoid stale closure
    const boardRef = useRef(board);
    boardRef.current = board;

    const makeAIMove = useCallback(() => {
        const currentBoard = boardRef.current;
        if (!currentBoard || winner || !isVsAI || isAIThinking) return;

        const aiSymbol = playerSymbols[AI_PLAYER_ID];
        if (!aiSymbol) return;

        const moveIndex = getAIMove(currentBoard, aiSymbol);
        if (moveIndex === -1) return;

        setIsAIThinking(true);

        // Add delay for better UX
        aiMoveTimeoutRef.current = setTimeout(() => {
            // Re-check current board state to avoid race conditions
            const latestBoard = boardRef.current;
            if (!latestBoard || latestBoard[moveIndex] !== null) {
                setIsAIThinking(false);
                return;
            }

            const newBoard = latestBoard.slice();
            newBoard[moveIndex] = aiSymbol;

            const newWinner = calculateWinner(newBoard);

            updateGameState({
                board: newBoard,
                currentPlayer: user.id,
                winner: newWinner ? AI_PLAYER_ID : null,
            });

            setLastMoveIndex(moveIndex);
            setIsAIThinking(false);
            hapticFeedback('light');
        }, 500 + Math.random() * 500); // 500-1000ms delay
    }, [winner, isVsAI, isAIThinking, playerSymbols, updateGameState, user.id]);

    // Trigger AI move when it's AI's turn
    useEffect(() => {
        // Only trigger if it's AI's turn and game is active
        if (isAITurn && !winner && !isDraw && board && !isAIThinking) {
            const timeoutId = setTimeout(() => {
                makeAIMove();
            }, 100); // Small delay to ensure state is settled

            return () => clearTimeout(timeoutId);
        }

        return () => {
            if (aiMoveTimeoutRef.current) {
                clearTimeout(aiMoveTimeoutRef.current);
            }
        };
    }, [isAITurn, winner, isDraw, board, isAIThinking, makeAIMove]);

    const { guard } = useActionGuard();

    const handleClick = guard((...args: unknown[]) => {
        const i = args[0] as number;
        if (winner || displayBoard?.[i] || !myTurn || isAIThinking) return;

        // Оптимистичное обновление
        const newOptimisticBoard = displayBoard!.slice();
        newOptimisticBoard[i] = playerSymbols[user.id];
        setOptimisticBoard(newOptimisticBoard);
        setLastMoveIndex(i);

        const newBoard = board!.slice();
        newBoard[i] = playerSymbols[user.id];

        const newWinner = calculateWinner(newBoard);

        // Set next player - AI or other user
        const nextPlayer = isVsAI ? AI_PLAYER_ID : opponent.id;

        updateGameState({
            board: newBoard,
            currentPlayer: nextPlayer,
            winner: newWinner ? user.id : null,
        });

        hapticFeedback('light');
    });

    const handleReset = guard(() => {
        let newStarterId = hostId;
        if (opponent) {
            const playerIds = [user.id, opponent.id];
            newStarterId = playerIds.find(id => id !== gameState.currentPlayer) ?? hostId;
        }

        setOptimisticBoard(null);
        setLastMoveIndex(null);
        setIsAIThinking(false);

        if (aiMoveTimeoutRef.current) {
            clearTimeout(aiMoveTimeoutRef.current);
        }

        updateGameState({
            board: Array(9).fill(null),
            currentPlayer: newStarterId,
            winner: null
        });

        hapticFeedback('medium');
    });

    const getPlayerName = (playerId: string) => {
        if (playerId === user.id) return user.name;
        if (playerId === AI_PLAYER_ID) return 'AI Bot';
        if (playerId === otherUser?.id) return otherUser.name;
        return "Player";
    }

    const getStatus = () => {
        if (winner) return `Победитель: ${getPlayerName(winner)}`;
        if (isDraw) return "Ничья!";
        if (!otherUser && !isVsAI) return "Ожидание соперника...";
        if (isAIThinking) return "AI думает...";
        if (!currentPlayer) return "Игра готова, хост может начать.";
        return `Ход: ${getPlayerName(currentPlayer)} (${playerSymbols[currentPlayer]}) - ${myTurn ? "Ваш ход" : "Ожидание"}`;
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
            <Card className="bg-black/90 border-white/[0.06] backdrop-blur-xl w-full max-w-sm">
                <CardHeader className="text-center relative">
                    <Button
                        onClick={onGameEnd}
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 left-4 text-white/40 hover:text-white z-10 min-w-[44px] min-h-[44px]"
                        title="Вернуться в лобби"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="font-headline text-2xl text-white">Крестики-нолики</CardTitle>
                    <CardTitle className="text-sm font-medium text-white/50 pt-2">{getStatus()}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {/* VS AI indicator */}
                    {isVsAI && (
                        <div className="flex items-center gap-2 text-sm text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
                            <Bot className="w-4 h-4" />
                            <span>Игра против AI</span>
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                        {displayBoard?.map((cell, i) => (
                            <button
                                key={i}
                                onClick={() => handleClick(i)}
                                className={`
                                    h-20 w-20 bg-black rounded-xl flex items-center justify-center text-4xl font-bold
                                    transition-all duration-200 hover:bg-white/5 disabled:cursor-not-allowed
                                    border border-white/[0.06]
                                    ${lastMoveIndex === i ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-black' : ''}
                                    ${!cell && myTurn && !winner && !isAIThinking ? 'hover:scale-105 hover:border-violet-500/30' : ''}
                                `}
                                disabled={!!winner || !!displayBoard[i] || !myTurn || isAIThinking}
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
