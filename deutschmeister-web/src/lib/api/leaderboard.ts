import { apiGet } from './client';

export interface LeaderboardEntry {
  rank: number;
  userId: string | null;
  name: string;
  avatar: string | null;
  xp: number;
  level: number;
  levelName: string;
}

export const getLeaderboard = (period: 'weekly' | 'monthly' | 'all-time' = 'weekly', limit = 20) =>
  apiGet<LeaderboardEntry[]>(`/leaderboard?period=${period}&limit=${limit}`);
