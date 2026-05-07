'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dictationApi,
  DictationSession,
  DictationHistoryResponse,
  DictationLibraryResponse,
  DictationStats,
  DictationVideo,
  MyDictationRequestsResponse,
} from '@/lib/api/dictation';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const dictationKeys = {
  all: ['dictation'] as const,
  library: (params?: Record<string, unknown>) => [...dictationKeys.all, 'library', params] as const,
  random: (params?: Record<string, unknown>) => [...dictationKeys.all, 'random', params] as const,
  session: (id: string) => [...dictationKeys.all, 'session', id] as const,
  history: (params?: Record<string, unknown>) => [...dictationKeys.all, 'history', params] as const,
  stats: () => [...dictationKeys.all, 'stats'] as const,
  myRequests: () => [...dictationKeys.all, 'my-requests'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useDictationLibrary(params?: {
  page?: number; limit?: number; cefrLevel?: string; topic?: string;
}) {
  return useQuery<DictationLibraryResponse>({
    queryKey: dictationKeys.library(params),
    queryFn: () => dictationApi.getLibrary(params),
  });
}

export function useDictationRandom(params?: { cefrLevel?: string; topic?: string }) {
  return useQuery<DictationVideo>({
    queryKey: dictationKeys.random(params),
    queryFn: () => dictationApi.getRandom(params),
    enabled: false, // only fetch on demand via refetch()
  });
}

export function useDictationSession(id: string) {
  return useQuery<DictationSession>({
    queryKey: dictationKeys.session(id),
    queryFn: () => dictationApi.getSession(id),
    enabled: !!id,
  });
}

export function useDictationHistory(params?: {
  page?: number; limit?: number; status?: string; cefrLevel?: string;
}) {
  return useQuery<DictationHistoryResponse>({
    queryKey: dictationKeys.history(params),
    queryFn: () => dictationApi.getHistory(params),
  });
}

export function useDictationStats() {
  return useQuery<DictationStats>({
    queryKey: dictationKeys.stats(),
    queryFn: () => dictationApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useStartDictation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { videoId: string }) => dictationApi.startSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictationKeys.history() });
    },
  });
}

export function useStartDictationFromUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { youtubeUrl: string; cefrLevel?: string }) =>
      dictationApi.startFromUrl(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictationKeys.history() });
      queryClient.invalidateQueries({ queryKey: dictationKeys.myRequests() });
    },
  });
}

export function useMyDictationRequests() {
  return useQuery<MyDictationRequestsResponse>({
    queryKey: dictationKeys.myRequests(),
    queryFn: () => dictationApi.getMyRequests(),
    staleTime: 30_000,
  });
}

export function useAutosaveDictation() {
  return useMutation({
    mutationFn: ({ id, userAnswers }: { id: string; userAnswers: Record<string, string> }) =>
      dictationApi.saveDraft(id, userAnswers),
  });
}

export function useSubmitDictation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userAnswers }: { id: string; userAnswers: Record<string, string> }) =>
      dictationApi.submitSession(id, userAnswers),
    onSuccess: (data, { id }) => {
      // Set cache directly with the GRADED result so the result page
      // never sees a stale DRAFT and incorrectly redirects back to play
      queryClient.setQueryData(dictationKeys.session(id), data);
      queryClient.invalidateQueries({ queryKey: dictationKeys.history() });
      queryClient.invalidateQueries({ queryKey: dictationKeys.stats() });
    },
  });
}

export function useDeleteDictation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dictationApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictationKeys.history() });
      queryClient.invalidateQueries({ queryKey: dictationKeys.stats() });
    },
  });
}
