'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyApi } from '@/lib/api/history';
import { useAuthStore } from '@/stores/authStore';

export function useHistory(limit = 50) {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['history', limit],
    queryFn: () => historyApi.getAll(limit),
    enabled: isAuthenticated,
    retry: false,
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