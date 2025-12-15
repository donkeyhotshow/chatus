/**
 * Утилиты для оптимизации real-time игр
 * - Оптимистичные обновления UI
 * - Throttle для частых действий
 * - Защита от race conditions
 */

import { useCallback, useRef } from 'react';

/**
 * Throttle функция - ограничивает частоту вызовов
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Debounce функция - задерживает выполнение до паузы
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Хук для оптимистичных обновлений состояния игры
 */
export function useOptimisticUpdate<T>(
  updateFn: (newState: Partial<T>) => Promise<void> | void,
  currentState: T
) {
  const optimisticStateRef = useRef<T>(currentState);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  // Синхронизируем с актуальным состоянием
  optimisticStateRef.current = currentState;

  const updateOptimistic = useCallback(
    (updateId: string, newState: Partial<T>, optimisticState: Partial<T>) => {
      // Применяем оптимистичное обновление
      optimisticStateRef.current = { ...optimisticStateRef.current, ...optimisticState };
      pendingUpdatesRef.current.add(updateId);

      // Отправляем на сервер
      try {
        updateFn(newState);
      } catch (error) {
        // Откатываем при ошибке
        optimisticStateRef.current = currentState;
        pendingUpdatesRef.current.delete(updateId);
        throw error;
      }
    },
    [updateFn, currentState]
  );

  const clearPending = useCallback((updateId: string) => {
    pendingUpdatesRef.current.delete(updateId);
  }, []);

  return {
    optimisticState: optimisticStateRef.current,
    updateOptimistic,
    clearPending,
    hasPendingUpdates: pendingUpdatesRef.current.size > 0,
  };
}

/**
 * Защита от двойных кликов/действий
 */
export function useActionGuard() {
  const isProcessingRef = useRef(false);

  const guard = useCallback(
    <T extends (...args: unknown[]) => unknown>(action: T): T => {
      return ((...args: Parameters<T>) => {
        if (isProcessingRef.current) {
          return;
        }
        isProcessingRef.current = true;
        try {
          const result = action(...args);
          if (result instanceof Promise) {
            result.finally(() => {
              isProcessingRef.current = false;
            });
          } else {
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 100);
          }
          return result;
        } catch (error) {
          isProcessingRef.current = false;
          throw error;
        }
      }) as T;
    },
    []
  );

  return { guard, isProcessing: () => isProcessingRef.current };
}

/**
 * Синхронизация таймера через Firebase
 */
export function calculateTimeLeft(
  startTime: number | null,
  duration: number,
  serverTime?: number
): number {
  if (!startTime) return 0;
  const now = serverTime || Date.now();
  const elapsed = (now - startTime) / 1000;
  return Math.max(0, duration - elapsed);
}

/**
 * Форматирование времени для отображения
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Визуальная обратная связь - вибрация (если поддерживается)
 */
export function hapticFeedback(pattern: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[pattern]);
  }
}

/**
 * Анимация пульсации для кнопок
 */
export function pulseAnimation(element: HTMLElement | null) {
  if (!element) return;
  element.classList.add('animate-pulse');
  setTimeout(() => {
    element.classList.remove('animate-pulse');
  }, 500);
}
