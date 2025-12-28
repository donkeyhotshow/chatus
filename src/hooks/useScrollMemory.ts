/**
 * Scroll Position Memory Hook
 *
 * Сохраняет и восстанавливает позицию скролла при переключении табов.
 * Использует sessionStorage для персистентности в рамках сессии.
 */
'use client';

import { useCallback, useRef, useEffect } from 'react';

interface ScrollPosition {
  scrollTop: number;
  scrollLeft: number;
  timestamp: number;
}

interface ScrollMemoryOptions {
  /** Уникальный ключ для хранения (например, roomId + tabId) */
  storageKey: string;
  /** Время жизни сохраненной позиции в мс (по умолчанию 30 минут) */
  ttl?: number;
  /** Задержка перед восстановлением позиции в мс */
  restoreDelay?: number;
}

const STORAGE_PREFIX = 'scroll_memory_';
const DEFAULT_TTL = 30 * 60 * 1000; // 30 минут
const DEFAULT_RESTORE_DELAY = 100;

/**
 * Хук для сохранения и восстановления позиции скролла
 */
export function useScrollMemory({
  storageKey,
  ttl = DEFAULT_TTL,
  restoreDelay = DEFAULT_RESTORE_DELAY,
}: ScrollMemoryOptions) {
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const isRestoringRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fullKey = `${STORAGE_PREFIX}${storageKey}`;

  // Сохранение позиции скролла (с дебаунсом)
  const saveScrollPosition = useCallback(() => {
    if (isRestoringRef.current || !scrollContainerRef.current) return;

    // Дебаунс для оптимизации
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const position: ScrollPosition = {
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
        timestamp: Date.now(),
      };

      try {
        sessionStorage.setItem(fullKey, JSON.stringify(position));
      } catch {
        // sessionStorage может быть недоступен
        console.warn('[useScrollMemory] Failed to save scroll position');
      }
    }, 100);
  }, [fullKey]);

  // Восстановление позиции скролла
  const restoreScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return false;

    try {
      const saved = sessionStorage.getItem(fullKey);
      if (!saved) return false;

      const position: ScrollPosition = JSON.parse(saved);

      // Проверяем TTL
      if (Date.now() - position.timestamp > ttl) {
        sessionStorage.removeItem(fullKey);
        return false;
      }

      // Восстанавливаем с задержкой для корректной работы после рендера
      isRestoringRef.current = true;

      setTimeout(() => {
        if (container) {
          container.scrollTop = position.scrollTop;
          container.scrollLeft = position.scrollLeft;
        }
        isRestoringRef.current = false;
      }, restoreDelay);

      return true;
    } catch {
      console.warn('[useScrollMemory] Failed to restore scroll position');
      return false;
    }
  }, [fullKey, ttl, restoreDelay]);

  // Очистка сохраненной позиции
  const clearScrollPosition = useCallback(() => {
    try {
      sessionStorage.removeItem(fullKey);
    } catch {
      // Игнорируем ошибки
    }
  }, [fullKey]);

  // Привязка к контейнеру скролла
  const bindScrollContainer = useCallback((element: HTMLElement | null) => {
    // Отписываемся от предыдущего контейнера
    if (scrollContainerRef.current) {
      scrollContainerRef.current.removeEventListener('scroll', saveScrollPosition);
    }

    scrollContainerRef.current = element;

    // Подписываемся на новый контейнер
    if (element) {
      element.addEventListener('scroll', saveScrollPosition, { passive: true });
      // Восстанавливаем позицию при привязке
      restoreScrollPosition();
    }
  }, [saveScrollPosition, restoreScrollPosition]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scroll', saveScrollPosition);
      }
    };
  }, [saveScrollPosition]);

  return {
    /** Ref callback для привязки к контейнеру скролла */
    bindScrollContainer,
    /** Принудительное сохранение позиции */
    saveScrollPosition,
    /** Принудительное восстановление позиции */
    restoreScrollPosition,
    /** Очистка сохраненной позиции */
    clearScrollPosition,
    /** Текущий контейнер скролла */
    scrollContainer: scrollContainerRef.current,
  };
}

/**
 * Хук для управления позициями скролла нескольких табов
 */
export function useTabScrollMemory(roomId: string) {
  const positionsRef = useRef<Map<string, ScrollPosition>>(new Map());

  const saveTabPosition = useCallback((tabId: string, scrollTop: number, scrollLeft: number = 0) => {
    positionsRef.current.set(tabId, {
      scrollTop,
      scrollLeft,
      timestamp: Date.now(),
    });

    // Также сохраняем в sessionStorage
    try {
      const key = `${STORAGE_PREFIX}${roomId}_${tabId}`;
      sessionStorage.setItem(key, JSON.stringify({
        scrollTop,
        scrollLeft,
        timestamp: Date.now(),
      }));
    } catch {
      // Игнорируем
    }
  }, [roomId]);

  const getTabPosition = useCallback((tabId: string): ScrollPosition | null => {
    // Сначала проверяем память
    const inMemory = positionsRef.current.get(tabId);
    if (inMemory && Date.now() - inMemory.timestamp < DEFAULT_TTL) {
      return inMemory;
    }

    // Затем sessionStorage
    try {
      const key = `${STORAGE_PREFIX}${roomId}_${tabId}`;
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const position: ScrollPosition = JSON.parse(saved);
        if (Date.now() - position.timestamp < DEFAULT_TTL) {
          positionsRef.current.set(tabId, position);
          return position;
        }
      }
    } catch {
      // Игнорируем
    }

    return null;
  }, [roomId]);

  const clearTabPosition = useCallback((tabId: string) => {
    positionsRef.current.delete(tabId);
    try {
      const key = `${STORAGE_PREFIX}${roomId}_${tabId}`;
      sessionStorage.removeItem(key);
    } catch {
      // Игнорируем
    }
  }, [roomId]);

  return {
    saveTabPosition,
    getTabPosition,
    clearTabPosition,
  };
}
