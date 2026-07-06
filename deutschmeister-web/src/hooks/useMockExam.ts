'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockExamApi,
  MockExamState,
  MockExamHistoryResponse,
} from '@/lib/api/mockExam';

export const mockExamKeys = {
  all: ['mock-exam'] as const,
  history: (params?: Record<string, unknown>) => [...mockExamKeys.all, 'history', params] as const,
  state: (id: string) => [...mockExamKeys.all, 'state', id] as const,
};

/**
 * Live sitting state. Polls while a module is being AI-graded (writing/
 * speaking stay in GRADING for a while after submit) so the cockpit unlocks
 * the next step without a manual refresh — same pattern as useExamWriting.
 */
export function useMockExamState(id: string) {
  return useQuery<MockExamState>({
    queryKey: mockExamKeys.state(id),
    queryFn: () => mockExamApi.getState(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.modules.some((m) => m.status === 'GRADING') ? 6000 : false;
    },
  });
}

export function useMockExamHistory(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery<MockExamHistoryResponse>({
    queryKey: mockExamKeys.history(params),
    queryFn: () => mockExamApi.getHistory(params),
  });
}

export function useStartMockExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { examType: string; cefrLevel: string; includeSpeaking?: boolean }) =>
      mockExamApi.start(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mockExamKeys.history() });
    },
  });
}

export function useAdvanceMockExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockExamApi.advance(id),
    onSuccess: (state) => {
      queryClient.setQueryData(mockExamKeys.state(state.id), state);
    },
  });
}

export function useFinishMockExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockExamApi.finish(id),
    onSuccess: (state) => {
      queryClient.setQueryData(mockExamKeys.state(state.id), state);
      queryClient.invalidateQueries({ queryKey: mockExamKeys.history() });
    },
  });
}

export function useAbandonMockExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockExamApi.abandon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mockExamKeys.all });
    },
  });
}
