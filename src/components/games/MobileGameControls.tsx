"use client";

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, ChevronLeftRight,
  Zap, RotateCcw, Pause, Play, X,
  Maximize2, Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/game-utils';

// ═══════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════

export type ControlScheme = 'dpad' | 'joystick' | 'tap' | 'swipe' | 'buttons';

export interface Direction {
  x: number;
  y: number;
}

export interface MobileGameControlsProps {
  /** Тип управления */
  scheme: ControlScheme;
  /** Callback при изменении направления (для dpad/joystick) */
  onDirectionChange?: (direction: Direction) => void;
  /** Callback при нажатии основной кнопки (для tap/buttons) */
  onAction?: () => void;
  /** Callback при паузе */
  onPause?: () => void;
  /** Callback при рестарте */
  onRestart?: () => void;
  /** Показывать ли кнопку паузы */
  showPause?: boolean;
  /** Показывать ли кнопку рестарта */
  showRestart?: boolean;
  /** Кастомные кнопки действий */
  actionButtons?: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    color?: string;
  }>;
  /** Отключить управление */
  disabled?: boolean;
  /** Прозрачность контролов */
  opacity?: number;
  /** Размер контролов: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** Позиция D-pad: 'left' | 'right' | 'center' */
  dpadPosition?: 'left' | 'right' | 'center';
  /** Показывать подсказки */
  showHints?: boolean;
  /** Полноэкранный режим */
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// РАЗМЕРЫ
// ═══════════════════════════════════════════════════════════════

const SIZES = {
  sm: {
    button: 'w-12 h-12',
    icon: 'w-5 h-5',
    dpad: 'w-36',
    joystick: 'w-28 h-28',
    actionButton: 'w-16 h-16',
    actionIcon: 'w-8 h-8',
  },
  md: {
    button: 'w-14 h-14',
    icon: 'w-6 h-6',
    dpad: 'w-44',
    joystick: 'w-32 h-32',
    actionButton: 'w-20 h-20',
    actionIcon: 'w-10 h-10',
  },
  lg: {
    button: 'w-16 h-16',
    icon: 'w-7 h-7',
    dpad: 'w-52',
    joystick: 'w-36 h-36',
    actionButton: 'w-24 h-24',
    actionIcon: 'w-12 h-12',
  },
};

// ═══════════════════════════════════════════════════════════════
// D-PAD КОМПОНЕНТ
// ═══════════════════════════════════════════════════════════════

interface DPadProps {
  onDirectionChange: (direction: Direction) => void;
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const DPad = memo(function DPad({ onDirectionChange, size, disabled }: DPadProps) {
  const sizes = SIZES[size];

  const handlePress = useCallback((dir: Direction) => {
    if (disabled) return;
    hapticFeedback('light');
    onDirectionChange(dir);
  }, [onDirectionChange, disabled]);

  const buttonClass = cn(
    sizes.button,
    "rounded-xl bg-white/10 backdrop-blur-sm border border-white/20",
    "flex items-center justify-center",
    "active:bg-white/25 active:scale-95 transition-all duration-100",
    "touch-none select-none",
    disabled && "opacity-50 pointer-events-none"
  );

  return (
    <div className={cn("grid grid-cols-3 gap-1", sizes.dpad)}>
      {/* Row 1 */}
      <div />
      <button
        className={buttonClass}
        onTouchStart={() => handlePress({ x: 0, y: -1 })}
        aria-label="Вверх"
      >
        <ChevronUp className={sizes.icon} />
      </button>
      <div />

      {/* Row 2 */}
      <button
        className={buttonClass}
        onTouchStart={() => handlePress({ x: -1, y: 0 })}
        aria-label="Влево"
      >
        <ChevronLeft className={sizes.icon} />
      </button>
      <div className={cn(sizes.button, "rounded-xl bg-white/5 border border-white/10")} />
      <button
        className={buttonClass}
        onTouchStart={() => handlePress({ x: 1, y: 0 })}
        aria-label="Вправо"
      >
        <ChevronRight className={sizes.icon} />
      </button>

      {/* Row 3 */}
      <div />
      <button
        className={buttonClass}
        onTouchStart={() => handlePress({ x: 0, y: 1 })}
        aria-label="Вниз"
      >
        <ChevronDown className={sizes.icon} />
      </button>
      <div />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// JOYSTICK КОМПОНЕНТ
// ═══════════════════════════════════════════════════════════════

interface JoystickProps {
  onDirectionChange: (direction: Direction) => void;
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const Joystick = memo(function Joystick({ onDirectionChange, size, disabled }: JoystickProps) {
  const sizes = SIZES[size];
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxRadius = rect.width / 2 - 20;

    const touch = e.touches[0];
    let x = touch.clientX - rect.left - centerX;
    let y = touch.clientY - rect.top - centerY;

    // Ограничиваем радиус
    const distance = Math.sqrt(x * x + y * y);
    if (distance > maxRadius) {
      x = (x / distance) * maxRadius;
      y = (y / distance) * maxRadius;
    }

    setPosition({ x, y });

    // Нормализуем направление
    const normalizedX = x / maxRadius;
    const normalizedY = y / maxRadius;

    // Определяем направление с порогом
    const threshold = 0.3;
    const direction: Direction = {
      x: Math.abs(normalizedX) > threshold ? Math.sign(normalizedX) : 0,
      y: Math.abs(normalizedY) > threshold ? Math.sign(normalizedY) : 0,
    };

    onDirectionChange(direction);
  }, [onDirectionChange, disabled]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    hapticFeedback('light');
    handleTouch(e);
  }, [handleTouch]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onDirectionChange({ x: 0, y: 0 });
  }, [onDirectionChange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        sizes.joystick,
        "rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20",
        "relative touch-none select-none",
        disabled && "opacity-50 pointer-events-none"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouchEnd}
    >
      {/* Stick */}
      <motion.div
        className={cn(
          "absolute w-12 h-12 rounded-full",
          "bg-gradient-to-br from-violet-500 to-purple-600",
          "border-2 border-white/30 shadow-lg",
          "left-1/2 top-1/2"
        )}
        animate={{
          x: position.x - 24,
          y: position.y - 24,
          scale: isDragging ? 1.1 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// ACTION BUTTON КОМПОНЕНТ
// ═══════════════════════════════════════════════════════════════

interface ActionButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
  label?: string;
  size: 'sm' | 'md' | 'lg';
  color?: string;
  disabled?: boolean;
}

const ActionButton = memo(function ActionButton({
  onPress, icon, label, size, color = 'violet', disabled
}: ActionButtonProps) {
  const sizes = SIZES[size];

  const handlePress = useCallback(() => {
    if (disabled) return;
    hapticFeedback('medium');
    onPress();
  }, [onPress, disabled]);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onTouchStart={handlePress}
      className={cn(
        sizes.actionButton,
        "rounded-full",
        `bg-${color}-500/40 border-2 border-${color}-400/50`,
        "flex flex-col items-center justify-center gap-1",
        "active:bg-opacity-60 transition-colors",
        "touch-none select-none backdrop-blur-sm",
        disabled && "opacity-50 pointer-events-none"
      )}
      style={{
        background: `rgba(139, 92, 246, 0.4)`,
        borderColor: `rgba(167, 139, 250, 0.5)`,
      }}
      aria-label={label}
    >
      {icon || <Zap className={sizes.actionIcon} />}
      {label && <span className="text-[10px] font-medium text-white/70">{label}</span>}
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MobileGameControls = memo(function MobileGameControls({
  scheme,
  onDirectionChange,
  onAction,
  onPause,
  onRestart,
  showPause = true,
  showRestart = false,
  actionButtons = [],
  disabled = false,
  opacity = 1,
  size = 'md',
  dpadPosition = 'left',
  showHints = false,
  fullscreen = false,
  onFullscreenToggle,
}: MobileGameControlsProps) {
  const sizes = SIZES[size];
  const [isPaused, setIsPaused] = useState(false);

  const handlePause = useCallback(() => {
    setIsPaused(p => !p);
    hapticFeedback('medium');
    onPause?.();
  }, [onPause]);

  const handleRestart = useCallback(() => {
    hapticFeedback('heavy');
    onRestart?.();
  }, [onRestart]);

  // Swipe detection
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    if (scheme !== 'swipe') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, [scheme]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (scheme !== 'swipe' || !touchStartRef.current || !onDirectionChange) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
      onDirectionChange({ x: dx > 0 ? 1 : -1, y: 0 });
      hapticFeedback('light');
    } else if (Math.abs(dy) > minSwipe) {
      onDirectionChange({ x: 0, y: dy > 0 ? 1 : -1 });
      hapticFeedback('light');
    }

    touchStartRef.current = null;
  }, [scheme, onDirectionChange]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 pointer-events-none"
      style={{ opacity }}
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
    >
      {/* Top bar - Pause, Fullscreen */}
      <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
        {onFullscreenToggle && (
          <button
            onClick={onFullscreenToggle}
            className={cn(
              "w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm",
              "border border-white/20 flex items-center justify-center",
              "active:bg-white/20 transition-colors"
            )}
          >
            {fullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}
        {showPause && onPause && (
          <button
            onClick={handlePause}
            className={cn(
              "w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm",
              "border border-white/20 flex items-center justify-center",
              "active:bg-white/20 transition-colors"
            )}
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-white" />
            ) : (
              <Pause className="w-5 h-5 text-white" />
            )}
          </button>
        )}
        {showRestart && onRestart && (
          <button
            onClick={handleRestart}
            className={cn(
              "w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm",
              "border border-white/20 flex items-center justify-center",
              "active:bg-white/20 transition-colors"
            )}
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="pb-safe px-4 pb-6">
        <div className={cn(
          "flex items-end justify-between",
          dpadPosition === 'center' && "justify-center",
          dpadPosition === 'right' && "flex-row-reverse"
        )}>
          {/* D-Pad / Joystick */}
          {(scheme === 'dpad' || scheme === 'joystick') && onDirectionChange && (
            <div className="pointer-events-auto">
              {scheme === 'dpad' ? (
                <DPad
                  onDirectionChange={onDirectionChange}
                  size={size}
                  disabled={disabled}
                />
              ) : (
                <Joystick
                  onDirectionChange={onDirectionChange}
                  size={size}
                  disabled={disabled}
                />
              )}
            </div>
          )}

          {/* Hints */}
          {showHints && scheme === 'swipe' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/40 text-xs">
              Свайпайте для управления
            </div>
          )}

          {/* Action buttons */}
          {(scheme === 'tap' || scheme === 'buttons' || actionButtons.length > 0) && (
            <div className="pointer-events-auto flex gap-3">
              {scheme === 'tap' && onAction && (
                <ActionButton
                  onPress={onAction}
                  size={size}
                  disabled={disabled}
                />
              )}
              {actionButtons.map(btn => (
                <ActionButton
                  key={btn.id}
                  onPress={btn.onPress}
                  icon={btn.icon}
                  label={btn.label}
                  size={size}
                  color={btn.color}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MobileGameControls.displayName = 'MobileGameControls';

export default MobileGameControls;
