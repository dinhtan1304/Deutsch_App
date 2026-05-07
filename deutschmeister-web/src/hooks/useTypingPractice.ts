'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  typingPracticeApi,
  type SubmitTypingPayload,
  type TypingCategory,
  type TypingLevel,
  type TypingSentence,
  type TypingSessionResult,
  type TypingStats,
} from '@/lib/api/typingPractice';

export const typingPracticeKeys = {
  all: ['typing-practice'] as const,
  history: (limit?: number) => [...typingPracticeKeys.all, 'history', limit] as const,
  stats: () => [...typingPracticeKeys.all, 'stats'] as const,
};

export function useTypingSentences(
  level: TypingLevel | null,
  category: TypingCategory | null,
  limit = 40,
) {
  return useQuery<TypingSentence[]>({
    queryKey: ['typing-practice', 'sentences', level, category, limit],
    queryFn: () => typingPracticeApi.getSentences(level!, category!, limit),
    enabled: !!level && !!category,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSubmitTypingSession() {
  const qc = useQueryClient();
  return useMutation<TypingSessionResult, Error, SubmitTypingPayload>({
    mutationFn: (payload) => typingPracticeApi.submitSession(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: typingPracticeKeys.history() });
      qc.invalidateQueries({ queryKey: typingPracticeKeys.stats() });
    },
  });
}

export function useTypingHistory(limit = 20) {
  return useQuery<TypingSessionResult[]>({
    queryKey: typingPracticeKeys.history(limit),
    queryFn: () => typingPracticeApi.getHistory(limit),
  });
}

export function useTypingStats() {
  return useQuery<TypingStats>({
    queryKey: typingPracticeKeys.stats(),
    queryFn: () => typingPracticeApi.getStats(),
    staleTime: 60_000,
  });
}
