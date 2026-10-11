'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningApi, LearningSession } from '@/lib/api/learning';
import { useAuthStore } from '@/stores/authStore';

export const learningKeys = {
  all: ['learning'] as const,
  today: ['learning', 'today'] as const,
  session: (id: string) => ['learning', 'session', id] as const,
  errors: (all: boolean) => ['learning', 'errors', all] as const,
};
export function useLearningSession(id?: string) {
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: id ? learningKeys.session(id) : learningKeys.today,
    queryFn: () => (id ? learningApi.session(id) : learningApi.today()),
    enabled: authenticated,
    staleTime: 30000,
  });
}
export function useCompleteLearningStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stepId }: { id: string; stepId: string }) =>
      learningApi.complete(id, stepId),
    onSuccess: (session: LearningSession) => {
      queryClient.setQueryData(learningKeys.session(session.id), session);
      if (session.sessionKey.startsWith('daily:'))
        queryClient.setQueryData(learningKeys.today, session);
    },
  });
}
export function useErrorNotebook(all = false) {
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: learningKeys.errors(all),
    queryFn: () => learningApi.errors(all),
    enabled: authenticated,
    staleTime: 30000,
  });
}
export function useReviewError() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      answer,
      requestId,
    }: {
      id: string;
      answer: string;
      requestId: string;
    }) => learningApi.review(id, answer, requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['learning', 'errors'] });
    },
  });
}
