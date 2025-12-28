/**
 * React Query Client Configuration
 * Централизоварация для кэширования данных
 * Этап 8: Оптимизированные настройки кэширования
 */

import { QueryClient } from '@tanstack/react-query';
import { CACHE_CONFIG, isSlowConnection, isLowEndDevice } from './performance-config';

// Адаптивные настройки на основе устройства/соединения
function getAdaptiveSettings() {
  const slow = isSlowConnection();
  const lowEnd = isLowEndDevice();

  return {
    // Увеличиваем staleTime для медленных соединений
    staleTime: slow ? 10 * 60 * 1000 : CACHE_CONFIG.queries.staleTime,
    // Увеличиваем gcTime для слабых устройств (меньше рефетчей)
    gcTime: lowEnd ? 60 * 60 * 1000 : CACHE_CONFIG.queries.gcTime,
    // Меньше ретраев на медленном соединении
    retry: slow ? 1 : 2,
  };
}

const adaptiveSettings = typeof window !== 'undefined' ? getAdaptiveSettings() : {
  staleTime: CACHE_CONFIG.queries.staleTime,
  gcTime: CACHE_CONFIG.queries.gcTime,
  retry: 2,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаются свежими (адаптивно)
      staleTime: adaptiveSettings.staleTime,
      // Кэш хранится (адаптивно)
      gcTime: adaptiveSettings.gcTime,
      // Повторные попытки при ошибке
      retry: adaptiveSettings.retry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Не рефетчить при фокусе окна для мобильных
      refetchOnWindowFocus: false,
      // Рефетчить при восстановлении соединения
      refetchOnReconnect: true,
      // Не рефетчить при монтировании если данные свежие
      refetchOnMount: false,
      // Этап 8: Структурное сравнение для предотвращения лишних ререндеров
      structuralSharing: true,
      // Этап 8: Placeholder data для мгновенного отображения
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      retry: 1,
      // Этап 8: Оптимистичные обновления по умолчанию
      onError: (error, variables, context) => {
        console.error('[Mutation Error]', error);
      },
    },
  },
});

// Query Keys для типизации и консистентности
export const queryKeys = {
  // Чаты
  rooms: ['rooms'] as const,
  room: (roomId: string) => ['room', roomId] as const,
  roomMessages: (roomId: string) => ['room', roomId, 'messages'] as const,
  roomMembers: (roomId: string) => ['room', roomId, 'members'] as const,

  // Пользователи
  user: (userId: string) => ['user', userId] as const,
  currentUser: ['currentUser'] as const,
  userPresence: (userId: string) => ['user', userId, 'presence'] as const,

  // Игры
  gameStats: (gameId: string) => ['game', gameId, 'stats'] as const,
  leaderboard: (gameId: string) => ['game', gameId, 'leaderboard'] as const,

  // Canvas
  canvasState: (roomId: string) => ['canvas', roomId] as const,

  // Общие
  notifications: ['notifications'] as const,
  recentRooms: ['recentRooms'] as const,
} as const;

// Утилиты для инвалидации кэша
export const invalidateQueries = {
  room: (roomId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.room(roomId) }),
  roomMessages: (roomId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.roomMessages(roomId) }),
  rooms: () => queryClient.invalidateQueries({ queryKey: queryKeys.rooms }),
  user: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) }),
  currentUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
};

// Prefetch утилиты для предзагрузки данных
export const prefetchQueries = {
  room: async (roomId: string, fetchFn: () => Promise<unknown>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.room(roomId),
      queryFn: fetchFn,
      staleTime: adaptiveSettings.staleTime,
    });
  },
};

// Этап 8: Утилита для оптимистичных обновлений
export function optimisticUpdate<T>(
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T
) {
  const previousData = queryClient.getQueryData<T>(queryKey);
  queryClient.setQueryData<T>(queryKey, updater);
  return previousData;
}

// Этап 8: Утилита для отката оптимистичных обновлений
export function rollbackUpdate<T>(
  queryKey: readonly unknown[],
  previousData: T | undefined
) {
  if (previousData !== undefined) {
    queryClient.setQueryData(queryKey, previousData);
  }
}
