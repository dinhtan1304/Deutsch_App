import { useQuery } from '@tanstack/react-query';
import { getSmartReviewPlan } from '@/lib/api/smartReview';

export const smartReviewKeys = {
  all: ['smart-review'] as const,
  plan: () => [...smartReviewKeys.all, 'plan'] as const,
};

/**
 * Hook lấy lộ trình ôn tập thông minh cho user hiện tại.
 */
export function useSmartReviewPlan(enabled = true) {
  return useQuery({
    queryKey: smartReviewKeys.plan(),
    queryFn: getSmartReviewPlan,
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
