import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, ArrowLeft, Trophy, Zap, Bot } from "lucide-react";
import { GameState, UserProfile } from "@/lib/types";
import { useActionGuard, calculateTimeLeft, hapticFeedback } from "@/lib/game-utils";
import { cn } from "@/lib/utils";
import { PremiumButton } from "../ui/premium-button";
import { PremiumCard, PremiumCardContent, PremiumCardDescription, PremiumCardHeader, PremiumCardTitle, PremiumCardFooter } from "../ui/premium-card";
import { Progress } from "../ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

type ClickWarProps = {
  onGameEnd: () => void;
  updateGameState: (newState: Partial<GameState>) => void;
  gameState: GameState;
  user: UserProfile;
  otherUser?: UserProfile;
};

const GAME_DURATION = 10; // seconds
const AI_PLAYER_ID = '__AI_BOT__';

export function ClickWar({ onGameEnd, updateGameState, gameState, user, otherUser }: ClickWarProps) {
  const myScore = gameState.scores?.[user.id] || 0;
  const isVsAI = !otherUser;
  const opponentId = isVsAI ? AI_PLAYER_ID : otherUser?.id;
  const otherScore = opponentId ? gameState.scores?.[opponentId] || 0 : 0;
  const isActive = !!gameState.active;

  const hasBeenPlayed = (
    gameState.startTime !== null &&
    gameState.startTime !== undefined &&
    gameState.scores !== null &&
    gameState.scores !== undefined &&
    (myScore > 0 || otherScore > 0)
  );
  const isGameOver = !isActive && hasBeenPlayed;
  const startTime = gameState.startTime || null;

  const [optimisticScore, setOptimisticScore] = useState(myScore);
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(startTime, GAME_DURATION)
  );

  const clickBufferRef = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { guard } = useActionGuard();
  const animationFrameRef = useRef<number | undefined>(undefined);

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

  useEffect(() => {
    setOptimisticScore(myScore);
  }, [myScore]);

  // Sync player score
  useEffect(() => {
    if (!isActive) {
      if (clickBufferRef.current > 0) {
        const finalScore = myScore + clickBufferRef.current;
        const newScores = { ...gameState.scores, [user.id]: finalScore };
        updateGameState({ scores: newScores });
        clickBufferRef.current = 0;
      }
      return;
    }

    syncIntervalRef.current = setInterval(() => {
      if (clickBufferRef.current > 0) {
        const bufferedClicks = clickBufferRef.current;
        clickBufferRef.current = 0;

        const newScore = (gameState.scores?.[user.id] || 0) + bufferedClicks;
        const newScores = { ...gameState.scores, [user.id]: newScore };
        updateGameState({ scores: newScores });
      }
    }, 100);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isActive, gameState.scores, myScore, updateGameState, user.id]);

  // AI Logic
  useEffect(() => {
    if (!isActive || !isVsAI || user.id !== gameState.hostId) {
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
        return;
    }

    // AI clicks 6-10 times per second
    aiIntervalRef.current = setInterval(() => {
        if (Math.random() > 0.3) { // Randomize a bit
            const currentScores = gameState.scores || {};
            const currentAIScore = currentScores[AI_PLAYER_ID] || 0;
            updateGameState({
                scores: {
                    ...currentScores,
                    [AI_PLAYER_ID]: currentAIScore + 1
                }
            });
        }
    }, 100);

    return () => {
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, [isActive, isVsAI, gameState.scores, user.id, gameState.hostId, updateGameState]);

  const handleStart = guard(() => {
    if (user.id !== gameState.hostId && gameState.hostId) return;

    const scores: {[key: string]: number} = {[user.id]: 0};
    if (otherUser) {
        scores[otherUser.id] = 0;
    } else {
        scores[AI_PLAYER_ID] = 0;
    }

    const now = Date.now();
    updateGameState({
      scores,
      active: true,
      startTime: now,
      hostId: user.id
    });

    hapticFeedback('medium');
  });

  // Direct click handler without guard for maximum responsiveness
  const handleClickDirect = useCallback((e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isActive || timeLeft <= 0) return;

    // Immediate optimistic update
    setOptimisticScore(prev => prev + 1);
    clickBufferRef.current += 1;
    hapticFeedback('light');
  }, [isActive, timeLeft]);

  const displayScore = isActive ? optimisticScore : myScore;
  const totalScore = displayScore + otherScore;
  // Fix: show 50/50 when no clicks yet, otherwise calculate actual progress
  const myProgress = totalScore > 0 ? (displayScore / totalScore) * 100 : 50;

  const getWinnerId = () => {
    const finalMyScore = gameState.scores?.[user.id] || 0;
    const finalOtherScore = opponentId ? (gameState.scores?.[opponentId] || 0) : 0;
    if (finalMyScore > finalOtherScore) return user.id;
    if (finalOtherScore > finalMyScore) return opponentId;
    return 'draw';
  }

  const winnerId = getWinnerId();
  const isDraw = winnerId === 'draw';
  const isWinner = winnerId === user.id;

  let description = `Кликайте как можно быстрее ${GAME_DURATION} секунд!`;
  if(isActive) description = `Осталось: ${Math.ceil(timeLeft)} сек`;
  if(!otherUser && !isVsAI) description = "Ожидание соперника...";

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
      <PremiumCard variant="glass" glow className="w-full max-w-sm overflow-visible">
        <PremiumCardHeader>
          <PremiumCardTitle className="flex items-center justify-center gap-2">
            <Swords className="text-violet-500" />
            Кликер
          </PremiumCardTitle>
          <PremiumCardDescription>{description}</PremiumCardDescription>
        </PremiumCardHeader>

        <PremiumCardContent className="flex flex-col items-center gap-6">
          {/* Score Board */}
          <div className="w-full flex justify-between items-center gap-4 px-2">
            <motion.div
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-2"
            >
              <Avatar className={cn("w-12 h-12 border-2", isWinner && isGameOver ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "border-white/10")}>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-bold text-white text-2xl">{displayScore}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">ВЫ</span>
            </motion.div>

            <div className="flex flex-col items-center">
              <div className="text-white/20 font-black text-xl italic">VS</div>
              {isVsAI && (
                <div className="mt-1 flex items-center gap-1 text-[8px] text-violet-400 uppercase tracking-tighter font-bold">
                    <Bot className="w-2 h-2" /> AI
                </div>
              )}
            </div>

            <motion.div
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              className="flex flex-col items-center gap-2"
            >
              <Avatar className={cn("w-12 h-12 border-2", !isWinner && !isDraw && isGameOver ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "border-white/10")}>
                {isVsAI ? (
                    <div className="w-full h-full bg-violet-500/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-violet-400" />
                    </div>
                ) : (
                    <>
                        <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                        <AvatarFallback>{otherUser ? otherUser.name.charAt(0) : '?'}</AvatarFallback>
                    </>
                )}
              </Avatar>
              <span className="font-bold text-white/60 text-2xl">{otherScore}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">ОППОНЕНТ</span>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <Progress
              value={myProgress}
              className="h-3 w-full bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-violet-600 [&>div]:to-purple-600 transition-all duration-300"
            />
            <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-tighter">
              <span>{Math.round(myProgress)}%</span>
              <span>{Math.round(100 - myProgress)}%</span>
            </div>
          </div>

          {/* Game Over Overlay */}
          <AnimatePresence>
            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl p-6"
              >
                {isDraw ? (
                  <>
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                      <Swords className="w-8 h-8 text-white/60" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1">НИЧЬЯ!</h2>
                    <p className="text-white/50 mb-6">Отличная битва, воины!</p>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4"
                    >
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-white mb-1">
                      {isWinner ? "ПОБЕДА!" : "ПОРАЖЕНИЕ"}
                    </h2>
                    <p className="text-white/50 mb-6">
                      {isWinner ? "Вы были быстрее молнии!" : (isVsAI ? "Бот оказался быстрее!" : "В следующий раз повезет!")}
                    </p>
                  </>
                )}

                <PremiumButton
                  onClick={handleStart}
                  className="w-full"
                  glow
                  disabled={user.id !== gameState.hostId && !!gameState.hostId}
                >
                  {user.id === gameState.hostId ? "ИГРАТЬ СНОВА" : "ЖДЕМ ХОСТА..."}
                </PremiumButton>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          {!isActive ? (
            <PremiumButton
              onClick={handleStart}
              className="w-full"
              disabled={user.id !== gameState.hostId && !!gameState.hostId}
              glow
            >
              {user.id === gameState.hostId ? "НАЧАТЬ ИГРУ" : "ЖДЕМ ХОСТА..."}
            </PremiumButton>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClickDirect}
              onTouchStart={handleClickDirect}
              onTouchEnd={(e) => e.preventDefault()}
              onPointerDown={handleClickDirect}
              className="w-full h-32 rounded-2xl text-3xl font-black transition-all bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-[0_10px_30px_rgba(225,29,72,0.4)] flex flex-col items-center justify-center gap-2 select-none touch-none"
              style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <Zap className="w-8 h-8 fill-current" />
              ЖМИ!
            </motion.button>
          )}
        </PremiumCardContent>

        <PremiumCardFooter>
          <PremiumButton onClick={onGameEnd} variant="ghost" size="sm" className="w-full opacity-50 hover:opacity-100">
            <ArrowLeft className="w-4 h-4" />
            Вернуться в лобби
          </PremiumButton>
        </PremiumCardFooter>
      </PremiumCard>
    </div>
  );
}
