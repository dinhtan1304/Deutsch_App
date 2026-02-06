'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyApi } from '@/lib/api/history';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api/client';

export function useHistory(limit = 50) {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['history', limit],
    queryFn: () => historyApi.getAll(limit),
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
    staleTime: 30_000,
  });
}

export function useAddToHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (wordId: string) => historyApi.add(wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => historyApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}