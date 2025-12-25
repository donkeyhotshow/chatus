"use client";

import { GameState, UserProfile } from "@/lib/types";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Swords, ArrowLeft } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useActionGuard, calculateTimeLeft, hapticFeedback } from "@/lib/game-utils";

type ClickWarProps = {
  onGameEnd: () => void;
  updateGameState: (newState: Partial<GameState>) => void;
  gameState: GameState;
  user: UserProfile;
  otherUser?: UserProfile;
};

const GAME_DURATION = 10; // seconds

export function ClickWar({ onGameEnd, updateGameState, gameState, user, otherUser }: ClickWarProps) {
  const myScore = gameState.scores?.[user.id] || 0;
  const otherScore = otherUser ? gameState.scores?.[otherUser.id] || 0 : 0;
  const isActive = !!gameState.active;
  // Fix BUG-004: Game is over only if it was started (has scores with values > 0 or startTime was set)
  const hasBeenPlayed = gameState.startTime !== null && gameState.startTime !== undefined;
  const isGameOver = !isActive && hasBeenPlayed;
  const startTime = gameState.startTime || null;

  // Оптимистичное состояние для UI
  const [optimisticScore, setOptimisticScore] = useState(myScore);
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(startTime, GAME_DURATION)
  );

  // Буфер для быстрых кликов
  const clickBufferRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(Date.now());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { guard } = useActionGuard();
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Синхронизация таймера с сервером
  useEffect(() => {
    if (!isActive || !startTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = calculateTimeLeft(startTime, GAME_DURATION);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (user.id === gameState.hostId) {
          updateGameState({ active: false });
        }
        return;
      }

      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animationFrameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, startTime, user.id, gameState.hostId, updateGameState]);

  // Синхронизация оптимистичного счета с реальным
  useEffect(() => {
    setOptimisticScore(myScore);
  }, [myScore]);

  // Периодическая синхронизация буфера кликов с сервером
  useEffect(() => {
    if (!isActive) {
      // Очищаем буфер при завершении игры
      if (clickBufferRef.current > 0) {
        const finalScore = myScore + clickBufferRef.current;
        const newScores = { ...gameState.scores, [user.id]: finalScore };
        updateGameState({ scores: newScores });
        clickBufferRef.current = 0;
      }
      return;
    }

    // Синхронизируем буфер каждые 100ms для поддержки быстрых кликов
    syncIntervalRef.current = setInterval(() => {
      if (clickBufferRef.current > 0) {
        const bufferedClicks = clickBufferRef.current;
        clickBufferRef.current = 0;

        const newScore = (gameState.scores?.[user.id] || 0) + bufferedClicks;
        const newScores = { ...gameState.scores, [user.id]: newScore };
        updateGameState({ scores: newScores });
        lastSyncRef.current = Date.now();
      }
    }, 100);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isActive, gameState.scores, myScore, updateGameState, user.id]);

  const handleStart = guard(() => {
    // Only the host can start the game
    if (user.id !== gameState.hostId && gameState.hostId) return;

    const scores: {[key: string]: number} = {[user.id]: 0};
    if (otherUser) {
        scores[otherUser.id] = 0;
    }

    const now = Date.now();
    updateGameState({
      scores,
      active: true,
      startTime: now, // Синхронизируем время начала
      hostId: user.id
    });

    hapticFeedback('medium');
  });

  // Обработчик клика без throttle - все клики учитываются
  const handleClick = useCallback(() => {
    if (!isActive || timeLeft <= 0) return;

    // Оптимистичное обновление UI - мгновенно
    setOptimisticScore(prev => prev + 1);

    // Добавляем в буфер вместо немедленной отправки
    clickBufferRef.current += 1;

    hapticFeedback('light');
  }, [isActive, timeLeft]);

  // Убираем throttle для поддержки быстрых кликов
  const handleClickGuarded = guard(() => {
    handleClick();
  });

  const displayScore = isActive ? optimisticScore : myScore;
  const totalScore = displayScore + otherScore;
  const myProgress = totalScore > 0 ? (displayScore / totalScore) * 100 : 50;

  const getWinnerName = () => {
    const finalMyScore = gameState.scores?.[user.id] || 0;
    const finalOtherScore = otherUser ? (gameState.scores?.[otherUser.id] || 0) : 0;
    if (finalMyScore > finalOtherScore) return user.name;
    if (finalOtherScore > finalMyScore) return otherUser?.name || 'Opponent';
    return null;
  }

  const winnerName = getWinnerName();
  const resultText = isGameOver ? (winnerName ? `${winnerName} победил!` : "Ничья!") : null;

  let description = `Кликайте как можно быстрее ${GAME_DURATION} секунд!`;
  if(isActive) description = `Осталось: ${Math.ceil(timeLeft)} сек`;
  if(resultText) description = `Результат: ${resultText}`;
  if(!otherUser) description = "Ожидание соперника...";

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
        <Card className="bg-neutral-950/80 border-white/10 backdrop-blur-sm w-full max-w-sm">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2"><Swords />Кликер</CardTitle>
                <CardDescription className="text-neutral-400">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                 <div className="w-full flex justify-between items-center gap-4 px-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-white text-lg">{displayScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-400 text-lg">{otherScore}</span>
                         <Avatar className="w-8 h-8">
                            <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                            <AvatarFallback>{otherUser ? otherUser.name.charAt(0) : '?'}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <Progress
                  value={myProgress}
                  className="h-3 w-full bg-neutral-800 [&>div]:bg-gradient-to-r [&>div]:from-white [&>div]:to-cyan-400 transition-all duration-150"
                />

                {!isActive ? (
                    <Button
                      onClick={handleStart}
                      className="w-full bg-white text-black hover:bg-neutral-200 transition-all"
                      disabled={!otherUser}
                    >
                        {isGameOver ? "Play Again" : "Start Game"}
                    </Button>
                ) : (
                    <Button
                      onClick={handleClickGuarded}
                      className="w-full h-24 text-2xl font-bold transition-transform active:scale-95"
                      variant="destructive"
                    >
                        CLICK!
                    </Button>
                )}
            </CardContent>
            <CardFooter className="p-4">
                 <Button onClick={onGameEnd} variant="ghost" size="sm" className="w-full text-neutral-400 hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Вернуться в лобби
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
