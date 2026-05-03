'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  examWritingApi,
  ExamWritingSession,
  ExamWritingHistoryResponse,
  ExamWritingStats,
} from '@/lib/api/examWriting';

export const examWritingKeys = {
  all: ['exam-writing'] as const,
  history: (params?: Record<string, unknown>) => [...examWritingKeys.all, 'history', params] as const,
  stats: () => [...examWritingKeys.all, 'stats'] as const,
  session: (id: string) => [...examWritingKeys.all, 'session', id] as const,
};

export function useExamWritingHistory(params?: {
  page?: number; limit?: number; status?: string; examType?: string; cefrLevel?: string;
}) {
  return useQuery<ExamWritingHistoryResponse>({
    queryKey: examWritingKeys.history(params),
    queryFn: () => examWritingApi.getHistory(params),
  });
}

export function useExamWritingStats() {
  return useQuery<ExamWritingStats>({
    queryKey: examWritingKeys.stats(),
    queryFn: () => examWritingApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExamWritingSession(id: string) {
  return useQuery<ExamWritingSession>({
    queryKey: examWritingKeys.session(id),
    queryFn: () => examWritingApi.getSession(id),
    enabled: !!id,
    // Poll while grading
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'GRADING' ? 3000 : false;
    },
  });
}

export function useGenerateExamWriting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { examType: string; cefrLevel: string }) =>
      examWritingApi.generateSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examWritingKeys.history() });
    },
  });
}

export function useSaveExamWritingDraft() {
  return useMutation({
    mutationFn: ({ id, userTexts }: { id: string; userTexts: Record<string, string> }) =>
      examWritingApi.saveDraft(id, userTexts),
  });
}

export function useSubmitExamWriting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userTexts }: { id: string; userTexts: Record<string, string> }) =>
      examWritingApi.submitAndGrade(id, userTexts),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: examWritingKeys.session(id) });
      queryClient.invalidateQueries({ queryKey: examWritingKeys.history() });
      queryClient.invalidateQueries({ queryKey: examWritingKeys.stats() });
    },
  });
}

export function useDeleteExamWriting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examWritingApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examWritingKeys.history() });
      queryClient.invalidateQueries({ queryKey: examWritingKeys.stats() });
    },
  });
}
