import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examSpeakingApi } from '@/lib/api/examSpeaking';

const keys = {
  history: (p?: object) => ['exam-speaking', 'history', p] as const,
  stats:   ()           => ['exam-speaking', 'stats'] as const,
  session: (id: string) => ['exam-speaking', 'session', id] as const,
};

export function useExamSpeakingHistory(params?: { page?: number; limit?: number; status?: string; cefrLevel?: string }) {
  return useQuery({
    queryKey: keys.history(params),
    queryFn: () => examSpeakingApi.getHistory(params),
  });
}

export function useExamSpeakingStats() {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () => examSpeakingApi.getStats(),
    staleTime: 5 * 60_000,
  });
}

export function useExamSpeakingSession(id: string) {
  return useQuery({
    queryKey: keys.session(id),
    queryFn: () => examSpeakingApi.getSession(id),
    enabled: !!id,
  });
}

export function useGenerateExamSpeaking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { examType: string; cefrLevel: string }) =>
      examSpeakingApi.generateSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-speaking', 'history'] }),
  });
}

export function useSubmitExamSpeaking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teileData }: { id: string; teileData: Record<string, { audioBase64: string; transcript: string; mimeType: string }> }) =>
      examSpeakingApi.submitAndGrade(id, teileData),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: keys.session(id) });
      qc.invalidateQueries({ queryKey: ['exam-speaking', 'history'] });
      qc.invalidateQueries({ queryKey: keys.stats() });
    },
  });
}

export function useDeleteExamSpeaking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examSpeakingApi.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-speaking', 'history'] });
      qc.invalidateQueries({ queryKey: keys.stats() });
    },
  });
}
