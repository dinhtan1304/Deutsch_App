'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examListeningApi, ExamListeningSession, ExamListeningHistoryResponse, ExamListeningStats } from '@/lib/api/examListening';

export const examListeningKeys = {
  all: ['exam-listening'] as const,
  history: (params?: Record<string, unknown>) => [...examListeningKeys.all, 'history', params] as const,
  stats: () => [...examListeningKeys.all, 'stats'] as const,
  session: (id: string) => [...examListeningKeys.all, 'session', id] as const,
};

export function useExamListeningHistory(params?: { page?: number; limit?: number; status?: string; examType?: string; cefrLevel?: string }) {
  return useQuery<ExamListeningHistoryResponse>({
    queryKey: examListeningKeys.history(params),
    queryFn: () => examListeningApi.getHistory(params),
  });
}

export function useExamListeningStats(enabled = true) {
  return useQuery<ExamListeningStats>({
    queryKey: examListeningKeys.stats(),
    queryFn: () => examListeningApi.getStats(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useExamListeningSession(id: string) {
  return useQuery<ExamListeningSession>({
    queryKey: examListeningKeys.session(id),
    queryFn: () => examListeningApi.getSession(id),
    enabled: !!id,
  });
}

export function useGenerateExamListening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { examType: string; cefrLevel: string }) =>
      examListeningApi.generateSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examListeningKeys.history() });
    },
  });
}

export function useSubmitExamListening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userAnswers }: { id: string; userAnswers: Record<string, Record<string, string>> }) =>
      examListeningApi.submitAnswers(id, userAnswers),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: examListeningKeys.session(id) });
      queryClient.invalidateQueries({ queryKey: examListeningKeys.history() });
      queryClient.invalidateQueries({ queryKey: examListeningKeys.stats() });
    },
  });
}

export function useDeleteExamListening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examListeningApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examListeningKeys.history() });
      queryClient.invalidateQueries({ queryKey: examListeningKeys.stats() });
    },
  });
}
