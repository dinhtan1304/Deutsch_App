import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { freeSpeakingApi } from '@/lib/api/freeSpeaking';

const keys = {
  history: (p?: object) => ['free-speaking', 'history', p] as const,
  stats:   ()           => ['free-speaking', 'stats'] as const,
  session: (id: string) => ['free-speaking', 'session', id] as const,
};

export function useFreeSpeakingHistory(params?: { page?: number; limit?: number; status?: string; cefrLevel?: string }) {
  return useQuery({
    queryKey: keys.history(params),
    queryFn: () => freeSpeakingApi.getHistory(params),
  });
}

export function useFreeSpeakingStats() {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () => freeSpeakingApi.getStats(),
    staleTime: 5 * 60_000,
  });
}

export function useFreeSpeakingSession(id: string, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: keys.session(id),
    queryFn: () => freeSpeakingApi.getSession(id),
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
  });
}

export function useGenerateFreeSpeaking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { cefrLevel: string; topicType: string }) =>
      freeSpeakingApi.generateSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['free-speaking', 'history'] }),
  });
}

export function useSubmitFreeSpeaking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; audioBase64: string; transcript: string; mimeType: string }) =>
      freeSpeakingApi.submitAndGrade(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: keys.session(id) });
      qc.invalidateQueries({ queryKey: ['free-speaking', 'history'] });
      qc.invalidateQueries({ queryKey: keys.stats() });
    },
  });
}

export function useDeleteFreeSpeaking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freeSpeakingApi.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['free-speaking', 'history'] });
      qc.invalidateQueries({ queryKey: keys.stats() });
    },
  });
}
