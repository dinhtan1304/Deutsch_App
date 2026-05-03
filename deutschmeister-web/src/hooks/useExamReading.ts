'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  examReadingApi,
  ExamReadingSession,
  ExamReadingHistoryResponse,
  ExamReadingStats,
} from '@/lib/api/examReading';

export const examReadingKeys = {
  all: ['exam-reading'] as const,
  history: (params?: Record<string, unknown>) => [...examReadingKeys.all, 'history', params] as const,
  stats: () => [...examReadingKeys.all, 'stats'] as const,
  session: (id: string) => [...examReadingKeys.all, 'session', id] as const,
};

export function useExamReadingHistory(params?: {
  page?: number; limit?: number; status?: string; examType?: string; cefrLevel?: string;
}) {
  return useQuery<ExamReadingHistoryResponse>({
    queryKey: examReadingKeys.history(params),
    queryFn: () => examReadingApi.getHistory(params),
  });
}

export function useExamReadingStats() {
  return useQuery<ExamReadingStats>({
    queryKey: examReadingKeys.stats(),
    queryFn: () => examReadingApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExamReadingSession(id: string) {
  return useQuery<ExamReadingSession>({
    queryKey: examReadingKeys.session(id),
    queryFn: () => examReadingApi.getSession(id),
    enabled: !!id,
  });
}

export function useGenerateExamReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { examType: string; cefrLevel: string }) =>
      examReadingApi.generateSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examReadingKeys.history() });
    },
  });
}

export function useSubmitExamReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userAnswers }: { id: string; userAnswers: Record<string, Record<string, string>> }) =>
      examReadingApi.submitAnswers(id, userAnswers),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: examReadingKeys.session(id) });
      queryClient.invalidateQueries({ queryKey: examReadingKeys.history() });
      queryClient.invalidateQueries({ queryKey: examReadingKeys.stats() });
    },
  });
}

export function useDeleteExamReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examReadingApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examReadingKeys.history() });
      queryClient.invalidateQueries({ queryKey: examReadingKeys.stats() });
    },
  });
}
