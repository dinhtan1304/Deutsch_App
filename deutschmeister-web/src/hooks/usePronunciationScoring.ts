'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  pronunciationApi,
  PronunciationTarget,
  PronunciationLevel,
  PronunciationResult,
  PronunciationHistoryResponse,
  PronunciationStats,
  PronunciationCategory,
} from '@/lib/api/pronunciation';

export const pronunciationKeys = {
  all: ['pronunciationScoring'] as const,
  targets: (level?: PronunciationLevel) =>
    [...pronunciationKeys.all, 'targets', level ?? 'all'] as const,
  categories: (level?: PronunciationLevel) =>
    [...pronunciationKeys.all, 'categories', level ?? 'all'] as const,
  history: (params?: any) =>
    [...pronunciationKeys.all, 'history', params ?? {}] as const,
  stats: () => [...pronunciationKeys.all, 'stats'] as const,
};

export function usePronunciationTargets(level?: PronunciationLevel) {
  return useQuery<PronunciationTarget[]>({
    queryKey: pronunciationKeys.targets(level),
    queryFn: () => pronunciationApi.getTargets(level),
    staleTime: 60 * 60 * 1000,
  });
}

export function usePronunciationCategories(level?: PronunciationLevel) {
  return useQuery<PronunciationCategory[]>({
    queryKey: pronunciationKeys.categories(level),
    queryFn: () => pronunciationApi.getCategories(level),
    staleTime: 60 * 60 * 1000,
  });
}

export function usePronunciationHistory(params?: {
  page?: number;
  limit?: number;
  level?: PronunciationLevel;
}) {
  return useQuery<PronunciationHistoryResponse>({
    queryKey: pronunciationKeys.history(params),
    queryFn: () => pronunciationApi.getHistory(params),
    staleTime: 30 * 1000,
  });
}

export function usePronunciationStats() {
  return useQuery<PronunciationStats>({
    queryKey: pronunciationKeys.stats(),
    queryFn: () => pronunciationApi.getStats(),
    staleTime: 60 * 1000,
  });
}

export function useScorePronunciation() {
  const qc = useQueryClient();
  return useMutation<
    PronunciationResult,
    Error,
    {
      targetText: string;
      level: PronunciationLevel;
      audioBase64: string;
      mimeType?: string;
      targetId?: string;
    }
  >({
    mutationFn: (data) => pronunciationApi.score(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...pronunciationKeys.all, 'history'] });
      qc.invalidateQueries({ queryKey: pronunciationKeys.stats() });
    },
  });
}
