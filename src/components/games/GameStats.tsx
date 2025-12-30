/**
 * Game Stats & Leaderboards Component
 *
 * Показывает статистику игр и таблицу лидеров.
 * Увеличивает вовлечённость через геймификацию.
 */

'use client';

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Star,
  Clock,
  Target,
  TrendingUp,
  Crown,
  Flame,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedAvatar } from '../ui/OptimizedImage';

// Типы для статистики
interface GameStatistics {
  gameId: string;
  gameName: string;
  timesPlayed: number;
  highScore: number;
  averageScore: number;
  bestTime?: number; // в секундах
  totalPlayTime: number; // в секундах
  wins: number;
  losses: number;
  lastPlayed?: Date;
}

interface LeaderboardEntry {
  rank: number;
  oderId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  isCurrentUser?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number; // 0-100
}

interface GameStatsProps {
  gameId: string;
  gameName: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Хук для получения статистики (заглушка - можно подключить к Firebase)
function useGameStats(gameId: string, userId: string) {
  const [stats, setStats] = useState<GameStatistics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загрузка из localStorage (можно заменить на Firebase)
    const loadStats = () => {
      try {
        const savedStats = localStorage.getItem(`game_stats_${gameId}_${userId}`);
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        } else {
          // Дефолтная статистика
          setStats({
            gameId,
            gameName: '',
            timesPlayed: 0,
            highScore: 0,
            averageScore: 0,
            totalPlayTime: 0,
            wins: 0,
            losses: 0,
          });
        }

        // Загрузка leaderboard из localStorage
        const savedLeaderboard = localStorage.getItem(`game_leaderboard_${gameId}`);
        if (savedLeaderboard) {
          setLeaderboard(JSON.parse(savedLeaderboard));
        } else {
          // Демо данные
          setLeaderboard([
            { rank: 1, oderId: '1', userName: 'ProGamer', score: 15000, isCurrentUser: false },
            { rank: 2, oderId: '2', userName: 'Champion', score: 12500, isCurrentUser: false },
            { rank: 3, oderId: '3', userName: 'Master', score: 10000, isCurrentUser: false },
            { rank: 4, oderId: userId, userName: 'Вы', score: 5000, isCurrentUser: true },
            { rank: 5, oderId: '5', userName: 'Player5', score: 4500, isCurrentUser: false },
          ]);
        }

        // Достижения
        setAchievements([
          { id: '1', name: 'Первая игра', description: 'Сыграйте первую игру', icon: '🎮', unlockedAt: new Date() },
          { id: '2', name: 'Победитель', description: 'Выиграйте 10 игр', icon: '🏆', progress: 30 },
          { id: '3', name: 'Мастер', description: 'Наберите 10000 очков', icon: '⭐', progress: 50 },
          { id: '4', name: 'Марафонец', description: 'Играйте 1 час', icon: '⏱️', progress: 75 },
        ]);
      } catch (err) {
        console.error('Failed to load game stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [gameId, userId]);

  return { stats, leaderboard, achievements, loading };
}

// Сохранение статистики
export function saveGameStats(
  gameId: string,
  oderId: string,
  score: number,
  won: boolean,
  playTime: number
) {
  try {
    const key = `game_stats_${gameId}_${oderId}`;
    const existing = localStorage.getItem(key);
    const stats: GameStatistics = existing ? JSON.parse(existing) : {
      gameId,
      gameName: '',
      timesPlayed: 0,
      highScore: 0,
      averageScore: 0,
      totalPlayTime: 0,
      wins: 0,
      losses: 0,
    };

    // Обновляем статистику
    stats.timesPlayed += 1;
    stats.highScore = Math.max(stats.highScore, score);
    stats.averageScore = Math.round(
      (stats.averageScore * (stats.timesPlayed - 1) + score) / stats.timesPlayed
    );
    stats.totalPlayTime += playTime;
    if (won) stats.wins += 1;
    else stats.losses += 1;
    stats.lastPlayed = new Date();

    localStorage.setItem(key, JSON.stringify(stats));

    // Обновляем leaderboard
    updateLeaderboard(gameId, oderId, 'Player', score);

    return stats;
  } catch (err) {
    console.error('Failed to save game stats:', err);
    return null;
  }
}

function updateLeaderboard(gameId: string, oderId: string, userName: string, score: number) {
  try {
    const key = `game_leaderboard_${gameId}`;
    const existing = localStorage.getItem(key);
    let leaderboard: LeaderboardEntry[] = existing ? JSON.parse(existing) : [];

    // Находим или добавляем пользователя
    const existingIndex = leaderboard.findIndex(e => e.oderId === oderId);
    if (existingIndex >= 0) {
      if (score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex].score = score;
      }
    } else {
      leaderboard.push({
        rank: 0,
        oderId,
        userName,
        score,
        isCurrentUser: true,
      });
    }

    // Сортируем и обновляем ранги
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100).map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

    localStorage.setItem(key, JSON.stringify(leaderboard));
  } catch (err) {
    console.error('Failed to update leaderboard:', err);
  }
}

// Форматирование времени
function formatPlayTime(seconds: number): string {
  if (seconds < 60) return `${seconds}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м`;
  return `${Math.floor(seconds / 3600)}ч ${Math.floor((seconds % 3600) / 60)}м`;
}

// Компонент статистики
const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'var(--accent-primary)',
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border-primary)]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
      {subValue && (
        <div className="text-xs text-[var(--text-muted)]">{subValue}</div>
      )}
    </div>
  );
});

// Компонент записи в leaderboard
const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 text-center text-[var(--text-muted)]">#{rank}</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-colors",
        entry.isCurrentUser
          ? "bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30"
          : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
      )}
    >
      <div className="w-8 flex justify-center">
        {getRankIcon(entry.rank)}
      </div>

      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] flex items-center justify-center text-sm font-medium text-[var(--text-muted)]">
        {entry.userAvatar ? (
          <OptimizedAvatar src={entry.userAvatar} alt="" size={32} className="rounded-lg" />
        ) : (
          entry.userName.charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium truncate",
          entry.isCurrentUser ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
        )}>
          {entry.userName}
          {entry.isCurrentUser && <span className="text-xs ml-1">(вы)</span>}
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-[var(--text-primary)]">
          {entry.score.toLocaleString()}
        </div>
        <div className="text-xs text-[var(--text-muted)]">очков</div>
      </div>
    </motion.div>
  );
});

// Компонент достижения
const AchievementCard = memo(function AchievementCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  const isUnlocked = !!achievement.unlockedAt;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all",
      isUnlocked
        ? "bg-[var(--bg-tertiary)] border-[var(--success)]/30"
        : "bg-[var(--bg-tertiary)]/50 border-[var(--border-primary)] opacity-60"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
        isUnlocked ? "bg-[var(--success)]/20" : "bg-[var(--bg-hover)]"
      )}>
        {achievement.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--text-primary)] text-sm">
          {achievement.name}
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {achievement.description}
        </div>

        {!isUnlocked && achievement.progress !== undefined && (
          <div className="mt-1.5 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
        )}
      </div>

      {isUnlocked && (
        <Star className="w-5 h-5 text-[var(--success)]" />
      )}
    </div>
  );
});

// Основной компонент
export const GameStats = memo(function GameStats({
  gameId,
  gameName,
  currentUserId,
  isOpen,
  onClose,
}: GameStatsProps) {
  const { stats, leaderboard, achievements, loading } = useGameStats(gameId, currentUserId);
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard' | 'achievements'>('stats');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-lg max-h-[80vh] overflow-hidden"
      >
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {gameName}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">Статистика и достижения</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border-primary)] shrink-0">
            {[
              { id: 'stats', label: 'Статистика', icon: TrendingUp },
              { id: 'leaderboard', label: 'Лидеры', icon: Trophy },
              { id: 'achievements', label: 'Достижения', icon: Star },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeStatsTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'stats' && stats && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <StatCard
                      icon={Trophy}
                      label="Рекорд"
                      value={stats.highScore.toLocaleString()}
                      color="#F59E0B"
                    />
                    <StatCard
                      icon={Target}
                      label="Средний счёт"
                      value={stats.averageScore.toLocaleString()}
                      color="#3B82F6"
                    />
                    <StatCard
                      icon={Flame}
                      label="Игр сыграно"
                      value={stats.timesPlayed}
                      color="#EF4444"
                    />
                    <StatCard
                      icon={Clock}
                      label="Время в игре"
                      value={formatPlayTime(stats.totalPlayTime)}
                      color="#10B981"
                    />
                    <StatCard
                      icon={Crown}
                      label="Победы"
                      value={stats.wins}
                      subValue={`${stats.losses} поражений`}
                      color="#8B5CF6"
                    />
                    <StatCard
                      icon={TrendingUp}
                      label="Винрейт"
                      value={stats.timesPlayed > 0
                        ? `${Math.round((stats.wins / stats.timesPlayed) * 100)}%`
                        : '0%'}
                      color="#EC4899"
                    />
                  </motion.div>
                )}

                {activeTab === 'leaderboard' && (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    {leaderboard.map((entry, idx) => (
                      <LeaderboardRow key={entry.oderId} entry={entry} index={idx} />
                    ))}
                  </motion.div>
                )}

                {activeTab === 'achievements' && (
                  <motion.div
                    key="achievements"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    {achievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default GameStats;
