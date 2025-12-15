import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useFirebase } from '@/components/firebase/FirebaseProvider';

interface TicTacToeStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  winStreak: number;
  lastGameId: string;
  lastGameAt: any; // Firestore Timestamp
}

interface Achievement {
  id: string;
  name: string;
  icon: string;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}

interface TicTacToeStatsProps {
  userId: string;
}

export function TicTacToeStats({ userId }: TicTacToeStatsProps) {
  const { firestore } = useFirebase();
  const [stats, setStats] = useState<TicTacToeStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!firestore) return;
    const statsRef = doc(firestore, `users/${userId}/stats/ticTacToe`);
    const unsubscribe = onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TicTacToeStats;
        setStats(data);
        checkAchievements(data, achievements, setAchievements);
      } else {
        setStats({ totalGames: 0, wins: 0, losses: 0, draws: 0, rating: 1000, winStreak: 0, lastGameId: '', lastGameAt: null });
      }
    });

    return () => unsubscribe();
  }, [userId, firestore, achievements]);

  const checkAchievements = (currentStats: TicTacToeStats, currentAchievements: Achievement[], setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>) => {
    const newAchievements: Achievement[] = [];
    const hasAchievement = (id: string) => currentAchievements.some(a => a.id === id);

    if (currentStats.wins >= 1 && !hasAchievement('first_win')) {
      newAchievements.push({ id: 'first_win', name: 'First Victory', icon: '🏆' });
    }

    if (currentStats.wins >= 10 && !hasAchievement('veteran')) {
      newAchievements.push({ id: 'veteran', name: 'Veteran', icon: '🎖️' });
    }

    if (currentStats.rating >= 1500 && !hasAchievement('expert')) {
      newAchievements.push({ id: 'expert', name: 'Expert Player', icon: '⭐' });
    }

    if (currentStats.winStreak >= 5 && !hasAchievement('unstoppable')) {
      newAchievements.push({ id: 'unstoppable', name: 'Unstoppable', icon: '🔥' });
    }

    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      // TODO: Save achievements to Firestore (this would typically be a separate Cloud Function or update from client)
      // saveAchievements(userId, newAchievements);
    }
  };

  if (!stats) return <div>Loading stats...</div>;

  const winRate = stats.totalGames > 0
    ? ((stats.wins / stats.totalGames) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Your Tic-Tac-Toe Stats</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard icon="🎮" label="Games Played" value={stats.totalGames} />
        <StatCard icon="🏆" label="Wins" value={stats.wins} />
        <StatCard icon="😔" label="Losses" value={stats.losses} />
        <StatCard icon="🤝" label="Draws" value={stats.draws} />
        <StatCard icon="📊" label="Win Rate" value={`${winRate}%`} />
        <StatCard icon="⭐" label="Rating" value={stats.rating} />
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Current Streak</h3>
        <div className="flex items-center">
          {[...Array(stats.winStreak)].map((_, i) => (
            <span key={i} className="text-2xl">🔥</span>
          ))}
          <span className="ml-2 text-xl font-bold">{stats.winStreak} wins</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Achievements</h3>
        <div className="flex flex-wrap gap-2">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-2 rounded-full flex items-center gap-2"
            >
              <span className="text-xl">{achievement.icon}</span>
              <span className="font-medium">{achievement.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
