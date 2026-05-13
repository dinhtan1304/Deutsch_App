import { useQuery } from '@tanstack/react-query';
import { getXpInfo } from '@/lib/api/xp';

export function useXp(enabled = true) {
  return useQuery({
    queryKey: ['xp'],
    queryFn: getXpInfo,
    enabled,
    staleTime: 30_000,
  });
}
