'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  shadowingApi,
  ShadowingSession,
  ShadowingHistoryResponse,
  ShadowingStats,
  GradeAttemptResponse,
} from '@/lib/api/shadowing';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const shadowingKeys = {
  all: ['shadowing'] as const,
  session: (id: string) => [...shadowingKeys.all, 'session', id] as const,
  history: (params?: Record<string, unknown>) => [...shadowingKeys.all, 'history', params] as const,
  stats: () => [...shadowingKeys.all, 'stats'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useShadowingSession(id: string) {
  return useQuery<ShadowingSession>({
    queryKey: shadowingKeys.session(id),
    queryFn: () => shadowingApi.getSession(id),
    enabled: !!id,
  });
}

export function useShadowingHistory(params?: {
  page?: number; limit?: number; status?: string; cefrLevel?: string;
}) {
  return useQuery<ShadowingHistoryResponse>({
    queryKey: shadowingKeys.history(params),
    queryFn: () => shadowingApi.getHistory(params),
  });
}

export function useShadowingStats() {
  return useQuery<ShadowingStats>({
    queryKey: shadowingKeys.stats(),
    queryFn: () => shadowingApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useStartShadowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { videoId: string; difficulty?: string }) =>
      shadowingApi.startSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shadowingKeys.history() });
    },
  });
}

export function useStartShadowingFromUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { youtubeUrl: string; cefrLevel?: string }) =>
      shadowingApi.startFromUrl(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shadowingKeys.history() });
    },
  });
}

export function useGradeShadowingAttempt() {
  const queryClient = useQueryClient();
  return useMutation<
    GradeAttemptResponse,
    Error,
    { sessionId: string; segmentId: string; audioBase64: string; mimeType?: string }
  >({
    mutationFn: ({ sessionId, segmentId, audioBase64, mimeType }) =>
      shadowingApi.gradeAttempt(sessionId, { segmentId, audioBase64, mimeType }),
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: shadowingKeys.session(sessionId) });
      // AI review counter must reflect the just-burned attempt.
      queryClient.invalidateQueries({ queryKey: ['subscription', 'quota', 'shadowing'] });
    },
  });
}

export function useSubmitShadowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shadowingApi.submitSession(id),
    onSuccess: (data, id) => {
      // Set cache directly so result page sees SUBMITTED status without race
      queryClient.setQueryData(shadowingKeys.session(id), data);
      queryClient.invalidateQueries({ queryKey: shadowingKeys.history() });
      queryClient.invalidateQueries({ queryKey: shadowingKeys.stats() });
    },
  });
}

export function useDeleteShadowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shadowingApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shadowingKeys.history() });
      queryClient.invalidateQueries({ queryKey: shadowingKeys.stats() });
    },
  });
}
