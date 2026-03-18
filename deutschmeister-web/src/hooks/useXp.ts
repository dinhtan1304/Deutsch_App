import { useQuery } from '@tanstack/react-query';
import { getXpInfo } from '@/lib/api/xp';

export function useXp() {
  return useQuery({
    queryKey: ['xp'],
    queryFn: getXpInfo,
    staleTime: 30_000,
  });
}
