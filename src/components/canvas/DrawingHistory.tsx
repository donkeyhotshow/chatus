/**
 * Drawing History Thumbnails Component
 *
 * Визуальная история рисования с миниатюрами для быстрого undo/redo.
 */

'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, History, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryState {
  id: string;
  imageData: ImageData;
  timestamp: number;
  thumbnail?: string; // base64 thumbnail
}

interface DrawingHistoryProps {
  /** Текущий canvas ref */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Максимальное количество состояний в истории */
  maxHistory?: number;
  /** Callback при восстановлении состояния */
  onRestore?: (imageData: ImageData) => void;
}

// Размер миниатюры
const THUMBNAIL_SIZE = 60;

/**
 * Хук для управления историей рисования
 */
export function useDrawingHistory(maxHistory: number = 30) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isRestoringRef = useRef(false);

  // Добавление состояния в историю
  const pushState = useCallback((canvas: HTMLCanvasElement) => {
    if (isRestoringRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Создаём миниатюру
    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.width = THUMBNAIL_SIZE;
    thumbnailCanvas.height = THUMBNAIL_SIZE;
    const thumbCtx = thumbnailCanvas.getContext('2d');
    if (thumbCtx) {
      // Масштабируем canvas в миниатюру
      thumbCtx.fillStyle = '#0d0d0d';
      thumbCtx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
      thumbCtx.drawImage(
        canvas,
        0, 0, canvas.width, canvas.height,
        0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE
      );
    }

    const newState: HistoryState = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageData,
      timestamp: Date.now(),
      thumbnail: thumbnailCanvas.toDataURL('image/png', 0.5),
    };

    setHistory(prev => {
      // Удаляем все состояния после текущего индекса (при новом действии после undo)
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);

      // Ограничиваем размер истории
      if (newHistory.length > maxHistory) {
        return newHistory.slice(-maxHistory);
      }
      return newHistory;
    });

    setCurrentIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  // Undo
  const undo = useCallback((canvas: HTMLCanvasElement): boolean => {
    if (currentIndex <= 0) return false;

    const prevState = history[currentIndex - 1];
    if (!prevState) return false;

    isRestoringRef.current = true;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(prevState.imageData, 0, 0);
    }
    setCurrentIndex(prev => prev - 1);

    setTimeout(() => {
      isRestoringRef.current = false;
    }, 50);

    return true;
  }, [history, currentIndex]);

  // Redo
  const redo = useCallback((canvas: HTMLCanvasElement): boolean => {
    if (currentIndex >= history.length - 1) return false;

    const nextState = history[currentIndex + 1];
    if (!nextState) return false;

    isRestoringRef.current = true;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(nextState.imageData, 0, 0);
    }
    setCurrentIndex(prev => prev + 1);

    setTimeout(() => {
      isRestoringRef.current = false;
    }, 50);

    return true;
  }, [history, currentIndex]);

  // Переход к конкретному состоянию
  const goToState = useCallback((canvas: HTMLCanvasElement, index: number): boolean => {
    if (index < 0 || index >= history.length) return false;

    const state = history[index];
    if (!state) return false;

    isRestoringRef.current = true;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(state.imageData, 0, 0);
    }
    setCurrentIndex(index);

    setTimeout(() => {
      isRestoringRef.current = false;
    }, 50);

    return true;
  }, [history]);

  // Очистка истории
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    history,
    currentIndex,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    pushState,
    undo,
    redo,
    goToState,
    clearHistory,
  };
}

/**
 * Компонент миниатюры истории
 */
const HistoryThumbnail = memo(function HistoryThumbnail({
  state,
  index,
  isActive,
  isCurrent,
  onClick,
}: {
  state: HistoryState;
  index: number;
  isActive: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const timeAgo = Math.round((Date.now() - state.timestamp) / 1000);
  const timeLabel = timeAgo < 60 ? `${timeAgo}с` : `${Math.round(timeAgo / 60)}м`;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
        isCurrent
          ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30"
          : isActive
            ? "border-white/20 hover:border-white/40"
            : "border-transparent opacity-50 hover:opacity-80"
      )}
      style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
    >
      {state.thumbnail ? (
        <img
          src={state.thumbnail}
          alt={`State ${index + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[var(--bg-tertiary)] flex items-center justify-center">
          <span className="text-xs text-[var(--text-muted)]">{index + 1}</span>
        </div>
      )}

      {/* Time label */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white text-center py-0.5">
        {timeLabel}
      </div>

      {/* Current indicator */}
      {isCurrent && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-primary)] rounded-full" />
      )}
    </motion.button>
  );
});

/**
 * Панель истории рисования
 */
export const DrawingHistoryPanel = memo(function DrawingHistoryPanel({
  history,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onGoToState,
  isOpen,
  onToggle,
}: {
  history: HistoryState[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onGoToState: (index: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Автоскролл к текущему состоянию
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      const container = scrollRef.current;
      const scrollTo = currentIndex * (THUMBNAIL_SIZE + 8) - container.clientWidth / 2 + THUMBNAIL_SIZE / 2;
      container.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }, [currentIndex, isOpen]);

  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
      {/* Undo/Redo buttons */}
      <div className="flex gap-1.5 p-1.5 bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl border border-[var(--glass-border)] shadow-[var(--shadow-lg)]">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            canUndo
              ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              : "bg-[var(--bg-tertiary)]/50 text-[var(--text-disabled)] cursor-not-allowed"
          )}
          title="Отменить (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            canRedo
              ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              : "bg-[var(--bg-tertiary)]/50 text-[var(--text-disabled)] cursor-not-allowed"
          )}
          title="Повторить (Ctrl+Y)"
        >
          <Redo2 className="w-5 h-5" />
        </button>
        <button
          onClick={onToggle}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            isOpen
              ? "bg-[var(--accent-primary)] text-white"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          )}
          title="История"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {/* History panel */}
      <AnimatePresence>
        {isOpen && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl border border-[var(--glass-border)] shadow-[var(--shadow-lg)] p-2 max-w-[280px]"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                История ({currentIndex + 1}/{history.length})
              </span>
              <button
                onClick={onToggle}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.05] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
              style={{ maxWidth: 260 }}
            >
              {history.map((state, index) => (
                <HistoryThumbnail
                  key={state.id}
                  state={state}
                  index={index}
                  isActive={index <= currentIndex}
                  isCurrent={index === currentIndex}
                  onClick={() => onGoToState(index)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default DrawingHistoryPanel;
