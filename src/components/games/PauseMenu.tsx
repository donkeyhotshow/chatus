"use client";

import { useState, useEffect, useCallback } from 'react';
import { Pause, Play, RotateCcw, LogOut, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  gameName?: string;
  score?: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  className?: string;
}

/**
 * P3 FIX: Pause menu component for games
 * Triggered by ESC key, provides resume/restart/exit options
 */
export function PauseMenu({
  isOpen,
  onResume,
  onRestart,
  onExit,
  gameName = 'Игра',
  score,
  soundEnabled = true,
  onToggleSound,
  className
}: PauseMenuProps) {
  // Handle ESC key to resume
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      onResume();
    }
  }, [isOpen, onResume]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200",
      className
    )}>
      <div className="bg-[#1A1A1C] rounded-2xl p-6 sm:p-8 max-w-sm w-[calc(100%-32px)] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pause className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Пауза</h2>
          <p className="text-sm text-white/50">{gameName}</p>

          {score !== undefined && (
            <div className="mt-3 px-4 py-2 bg-white/5 rounded-lg inline-block">
              <span className="text-sm text-white/70">Счёт: </span>
              <span className="text-lg font-bold text-violet-400">{score}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onResume}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-5 gap-2"
          >
            <Play className="w-5 h-5" />
            Продолжить
          </Button>

          <Button
            onClick={onRestart}
            variant="outline"
            className="w-full border-white/10 text-white hover:bg-white/5 py-5 gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Начать заново
          </Button>

          {onToggleSound && (
            <Button
              onClick={onToggleSound}
              variant="ghost"
              className="w-full text-white/70 hover:text-white hover:bg-white/5 py-5 gap-2"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-5 h-5" />
                  Звук: Вкл
                </>
              ) : (
                <>
                  <VolumeX className="w-5 h-5" />
                  Звук: Выкл
                </>
              )}
            </Button>
          )}

          <Button
            onClick={onExit}
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 py-5 gap-2"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </Button>
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-white/30 mt-4">
          Нажмите ESC для продолжения
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to manage pause state with ESC key
 */
export function usePauseMenu(initialPaused = false) {
  const [isPaused, setIsPaused] = useState(initialPaused);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const toggle = useCallback(() => setIsPaused(p => !p), []);

  return { isPaused, pause, resume, toggle, setIsPaused };
}

export default PauseMenu;
