/**
 * React Query hooks для игровой статистики и лидербордов
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

export interface GameStats {
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  lastPlayed: Date;
  achievements: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  date: Date;
}

// Локальное хранилище для игровой статистики
const STORAGE_KEY = 'chatus_game_stats';

function getLocalGameStats(gameId: string): GameStats | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(`${STORAGE_KEY}_${gameId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setLocalGameStats(gameId: string, stats: GameStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${gameId}`, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

// Получение статистики игры
export function useGameStatsQuery(gameId: string) {
  return useQuery({
    queryKey: queryKeys.gameStats(gameId),
    queryFn: async () => {
      // Сначала пробуем локальное хранилище
      const localStats = getLocalGameStats(gameId);
      if (localStats) return localStats;

      // Дефолтная статистика
      return {
        highScore: 0,
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        lastPlayed: new Date(),
        achievements: [],
      } as GameStats;
    },
    enabled: !!gameId,
    staleTime: Infinity, // Локальные данные не устаревают
  });
}

// Получение лидерборда
export function useLeaderboardQuery(gameId: string, limitCount = 10) {
  return useQuery({
    queryKey: [...queryKeys.leaderboard(gameId), limitCount],
    queryFn: async () => {
      // TODO: Реализовать получение из Firebase
      // Пока возвращаем пустой массив
      return [] as LeaderboardEntry[];
    },
    enabled: !!gameId,
    staleTime: 60 * 1000, // 1 минута
  });
}

// Мутация для сохранения результата игры
export function useSaveGameResultMutation(gameId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ score }: { score: number; userId?: string }) => {
      const currentStats = getLocalGameStats(gameId) || {
        highScore: 0,
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        lastPlayed: new Date(),
        achievements: [],
      };

      const newStats: GameStats = {
        highScore: Math.max(currentStats.highScore, score),
        gamesPlayed: currentStats.gamesPlayed + 1,
        totalScore: currentStats.totalScore + score,
        averageScore: Math.round((currentStats.totalScore + score) / (currentStats.gamesPlayed + 1)),
        lastPlayed: new Date(),
        achievements: currentStats.achievements,
      };

      // Проверяем достижения
      if (score >= 100 && !newStats.achievements.includes('century')) {
        newStats.achievements.push('century');
      }
      if (newStats.gamesPlayed >= 10 && !newStats.achievements.includes('dedicated')) {
        newStats.achievements.push('dedicated');
      }
      if (score === newStats.highScore && score > 0 && !newStats.achievements.includes('personal_best')) {
        newStats.achievements.push('personal_best');
      }

      setLocalGameStats(gameId, newStats);

      return newStats;
    },
    onSuccess: (newStats) => {
      queryClient.setQueryData(queryKeys.gameStats(gameId), newStats);
    },
  });
}
