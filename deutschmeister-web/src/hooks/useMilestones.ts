import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { milestonesApi } from '@/lib/api/milestones';
import { useCelebrationStore } from '@/stores/celebrationStore';
import { useAuthStore } from '@/stores/authStore';

export function useMilestoneCheck() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addAll = useCelebrationStore((s) => s.addAll);
  const hasAdded = useRef(false);

  const query = useQuery({
    queryKey: ['milestones'],
    queryFn: milestonesApi.check,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data && query.data.length > 0 && !hasAdded.current) {
      hasAdded.current = true;
      addAll(query.data);
    }
  }, [query.data, addAll]);

  return query;
}
