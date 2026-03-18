import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '@/lib/api/leaderboard';

export function useLeaderboard(period: 'weekly' | 'monthly' | 'all-time' = 'weekly', limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', period, limit],
    queryFn: () => getLeaderboard(period, limit),
    staleTime: 2 * 60_000,
  });
}
