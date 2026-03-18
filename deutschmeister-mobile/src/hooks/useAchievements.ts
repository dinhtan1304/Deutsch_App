import { useQuery } from '@tanstack/react-query';
import { getAchievements } from '@/lib/api/achievements';

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: getAchievements,
    staleTime: 60_000,
  });
}
