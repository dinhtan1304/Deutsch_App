'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listeningApi, ListeningSession, ListeningHistoryResponse, ListeningStats } from '@/lib/api/listening';

export const listeningKeys = {
  all: ['listening'] as const,
  history: (params?: Record<string, any>) => [...listeningKeys.all, 'history', params] as const,
  stats: () => [...listeningKeys.all, 'stats'] as const,
  session: (id: string) => [...listeningKeys.all, 'session', id] as const,
};

export function useListeningHistory(params?: { page?: number; limit?: number; cefrLevel?: string; status?: string }) {
  return useQuery<ListeningHistoryResponse>({
    queryKey: listeningKeys.history(params),
    queryFn: () => listeningApi.getHistory(params),
  });
}

export function useListeningStats() {
  return useQuery<ListeningStats>({
    queryKey: listeningKeys.stats(),
    queryFn: () => listeningApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useListeningSession(id: string) {
  return useQuery<ListeningSession>({
    queryKey: listeningKeys.session(id),
    queryFn: () => listeningApi.getSession(id),
    enabled: !!id,
  });
}

export function useGenerateListening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { cefrLevel: string; scriptType: string }) =>
      listeningApi.generateSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listeningKeys.history() });
    },
  });
}

export function useSubmitListening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userAnswers }: { id: string; userAnswers: Record<string, string> }) =>
      listeningApi.submitAnswers(id, userAnswers),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: listeningKeys.session(id) });
      queryClient.invalidateQueries({ queryKey: listeningKeys.history() });
      queryClient.invalidateQueries({ queryKey: listeningKeys.stats() });
    },
  });
}

export function useDeleteListening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listeningApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listeningKeys.history() });
      queryClient.invalidateQueries({ queryKey: listeningKeys.stats() });
    },
  });
}
