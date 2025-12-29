"use client";

import { memo, ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Trophy, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameResponsive, UseGameResponsiveOptions } from '@/hooks/useGameResponsive';
import { ExitButton } from '../ui/ExitButton';

// ═══════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════

export interface GameLayoutProps {
  /** Название игры */
  title: string;
  /** Иконка игры */
  icon?: ReactNode;
  /** Callback при выходе */
  onExit: () => void;
  /** Текущий счёт */
  score?: number;
  /** Рекорд */
  highScore?: number;
  /** Время игры (секунды) */
  gameTime?: number;
  /** Количество игроков */
  playerCount?: number;
  /** Дополнительные элементы в header */
  headerExtra?: ReactNode;
  /** Контент игры */
  children: ReactNode;
  /** Мобильные контролы (рендерятся внизу) */
  mobileControls?: ReactNode;
  /** Опции адаптивности */
  responsiveOptions?: UseGameResponsiveOptions;
  /** Показывать подсказку о повороте */
  showRotateHint?: boolean;
  /** Предпочтительная ориентация */
  preferredOrientation?: 'portrait' | 'landscape';
  /** Фоновый цвет/градиент */
  background?: string;
  /** Класс для контейнера */
  className?: string;
  /** Полноэкранный режим */
  fullscreen?: boolean;
  /** Показывать header */
  showHeader?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ROTATE HINT COMPONENT
// ═══════════════════════════════════════════════════════════════

const RotateHint = memo(function RotateHint({
  preferredOrientation
}: {
  preferredOrientation: 'portrait' | 'landscape'
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6"
    >
      <motion.div
        animate={{
          rotate: preferredOrientation === 'landscape' ? [0, 90] : [90, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }}
        className="mb-6"
      >
        <Smartphone className="w-16 h-16 text-violet-400" />
      </motion.div>
      <h2 className="text-xl font-bold text-white mb-2">
        Поверните устройство
      </h2>
      <p className="text-white/60 text-center text-sm">
        {preferredOrientation === 'landscape'
          ? 'Для лучшего игрового опыта поверните телефон горизонтально'
          : 'Для лучшего игрового опыта поверните телефон вертикально'
        }
      </p>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════
// GAME HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════

interface GameHeaderProps {
  title: string;
  icon?: ReactNode;
  onExit: () => void;
  score?: number;
  highScore?: number;
  gameTime?: number;
  playerCount?: number;
  headerExtra?: ReactNode;
  compact?: boolean;
}

const GameHeader = memo(function GameHeader({
  title,
  icon,
  onExit,
  score,
  highScore,
  gameTime,
  playerCount,
  headerExtra,
  compact = false,
}: GameHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className={cn(
      "flex items-center justify-between w-full",
      compact ? "px-3 py-2" : "px-4 py-3",
      "bg-black/30 backdrop-blur-sm border-b border-white/10"
    )}>
      {/* Left: Exit + Title */}
      <div className="flex items-center gap-2">
        <ExitButton onExit={onExit} view="game" variant="icon" size="sm" />
        {!compact && (
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-white text-sm">{title}</span>
          </div>
        )}
      </div>

      {/* Center: Stats */}
      <div className="flex items-center gap-3 text-xs">
        {score !== undefined && (
          <div className="flex items-center gap-1 text-violet-400">
            <span className="font-bold text-lg">{score}</span>
          </div>
        )}
        {highScore !== undefined && highScore > 0 && (
          <div className="flex items-center gap-1 text-yellow-400/70">
            <Trophy className="w-3 h-3" />
            <span>{highScore}</span>
          </div>
        )}
        {gameTime !== undefined && (
          <div className="flex items-center gap-1 text-white/50">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{formatTime(gameTime)}</span>
          </div>
        )}
        {playerCount !== undefined && playerCount > 1 && (
          <div className="flex items-center gap-1 text-white/50">
            <Users className="w-3 h-3" />
            <span>{playerCount}</span>
          </div>
        )}
      </div>

      {/* Right: Extra */}
      <div className="flex items-center gap-2">
        {headerExtra}
      </div>
    </header>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const GameLayout = memo(function GameLayout({
  title,
  icon,
  onExit,
  score,
  highScore,
  gameTime,
  playerCount,
  headerExtra,
  children,
  mobileControls,
  responsiveOptions,
  showRotateHint: showRotateHintProp = true,
  preferredOrientation = 'landscape',
  background = 'bg-[#0a0a1a]',
  className,
  fullscreen = false,
  showHeader = true,
}: GameLayoutProps) {
  const {
    isMobile,
    isTablet,
    showMobileControls,
    showRotateHint,
    dimensions,
  } = useGameResponsive({
    ...responsiveOptions,
    preferredOrientation,
  });

  const [isFullscreen, setIsFullscreen] = useState(fullscreen);

  // Fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Показываем подсказку о повороте только на мобильных
  const shouldShowRotateHint = showRotateHintProp && showRotateHint && isMobile;

  return (
    <div className={cn(
      "relative w-full h-full min-h-screen flex flex-col",
      background,
      className
    )}>
      {/* Rotate Hint Overlay */}
      <AnimatePresence>
        {shouldShowRotateHint && (
          <RotateHint preferredOrientation={preferredOrientation} />
        )}
      </AnimatePresence>

      {/* Header */}
      {showHeader && !isFullscreen && (
        <GameHeader
          title={title}
          icon={icon}
          onExit={onExit}
          score={score}
          highScore={highScore}
          gameTime={gameTime}
          playerCount={playerCount}
          headerExtra={headerExtra}
          compact={isMobile}
        />
      )}

      {/* Game Content */}
      <main className={cn(
        "flex-1 flex items-center justify-center",
        "overflow-hidden",
        showMobileControls && mobileControls && "pb-32" // Space for controls
      )}>
        <div
          className="relative"
          style={{
            maxWidth: dimensions.width,
            maxHeight: dimensions.height,
          }}
        >
          {children}
        </div>
      </main>

      {/* Mobile Controls */}
      {showMobileControls && mobileControls && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          {mobileControls}
        </div>
      )}

      {/* Desktop keyboard hints */}
      {!showMobileControls && !isMobile && !isTablet && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs">
          <kbd className="px-2 py-1 bg-white/10 rounded mr-1">WASD</kbd>
          или
          <kbd className="px-2 py-1 bg-white/10 rounded ml-1 mr-1">↑↓←→</kbd>
          для управления
        </div>
      )}
    </div>
  );
});

GameLayout.displayName = 'GameLayout';

export default GameLayout;
