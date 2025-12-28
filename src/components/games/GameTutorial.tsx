"use client";

import { useState, useEffect } from 'react';
import { X, Gamepad2, Keyboard, MousePointer, Smartphone } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface TutorialControl {
  key: string;
  description: string;
  icon?: 'keyboard' | 'mouse' | 'touch';
}

interface GameTutorialProps {
  gameName: string;
  gameIcon?: React.ReactNode;
  controls: TutorialControl[];
  tips?: string[];
  storageKey: string;
  onClose: () => void;
  className?: string;
}

/**
 * P2 FIX: Tutorial overlay component for games
 * Shows controls and tips, with "don't show again" option
 */
export function GameTutorial({
  gameName,
  gameIcon,
  controls,
  tips,
  storageKey,
  onClose,
  className
}: GameTutorialProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // Ignore storage errors
      }
    }
    onClose();
  };

  const getControlIcon = (icon?: 'keyboard' | 'mouse' | 'touch') => {
    switch (icon) {
      case 'keyboard':
        return <Keyboard className="w-4 h-4 text-violet-400" />;
      case 'mouse':
        return <MousePointer className="w-4 h-4 text-violet-400" />;
      case 'touch':
        return <Smartphone className="w-4 h-4 text-violet-400" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200",
      className
    )}>
      <div className="bg-[#1A1A1C] rounded-2xl p-6 sm:p-8 max-w-md w-[calc(100%-32px)] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
              {gameIcon || <Gamepad2 className="w-6 h-6 text-violet-400" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{gameName}</h3>
              <p className="text-sm text-white/50">Управление</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="space-y-3 mb-6">
          {controls.map((control, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
            >
              {getControlIcon(control.icon)}
              <kbd className="px-3 py-1.5 bg-white/10 rounded-lg text-sm font-mono text-white min-w-[60px] text-center">
                {control.key}
              </kbd>
              <span className="text-white/80 text-sm">{control.description}</span>
            </div>
          ))}
        </div>

        {/* Tips */}
        {tips && tips.length > 0 && (
          <div className="mb-6 p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <p className="text-xs font-medium text-violet-400 mb-2">💡 Советы</p>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-sm text-white/70 flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleClose}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-5"
          >
            Понятно
          </Button>

          <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer justify-center">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
            />
            Не показывать снова
          </label>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if tutorial should be shown
 */
export function useTutorialVisibility(storageKey: string): [boolean, () => void] {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      const hidden = localStorage.getItem(storageKey);
      if (!hidden) {
        setShowTutorial(true);
      }
    } catch {
      setShowTutorial(true);
    }
  }, [storageKey]);

  const closeTutorial = () => setShowTutorial(false);

  return [showTutorial, closeTutorial];
}

export default GameTutorial;
