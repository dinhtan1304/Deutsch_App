import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getGrammarSrsStats,
  getGrammarSrsSession,
  reviewGrammarSrs,
} from '@/lib/api/grammarSrs';
import type { TrainerMode } from '@/lib/api/grammarTrainer';
import { smartReviewKeys } from './useSmartReview';

export const grammarSrsKeys = {
  all: ['grammar-srs'] as const,
  stats: () => [...grammarSrsKeys.all, 'stats'] as const,
  session: (mode: string) => [...grammarSrsKeys.all, 'session', mode] as const,
};

export function useGrammarSrsStats(enabled = true) {
  return useQuery({
    queryKey: grammarSrsKeys.stats(),
    queryFn: getGrammarSrsStats,
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Fetched on demand when a track is started (enabled = a mode is selected). */
export function useGrammarSrsSession(mode: TrainerMode | null) {
  return useQuery({
    queryKey: grammarSrsKeys.session(mode ?? 'none'),
    queryFn: () => getGrammarSrsSession(mode as TrainerMode),
    enabled: !!mode,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useReviewGrammarSrs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewGrammarSrs,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: grammarSrsKeys.stats() });
      qc.invalidateQueries({ queryKey: smartReviewKeys.all });
    },
  });
}
