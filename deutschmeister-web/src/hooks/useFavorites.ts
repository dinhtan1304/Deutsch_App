'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/lib/api/favorites';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api/client';

export function useFavorites() {
  const { isAuthenticated, logout } = useAuthStore();
  
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getAll(),
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
    staleTime: 30_000, // Cache 30s to reduce refetches
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (wordId: string) => favoritesApi.add(wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (wordId: string) => favoritesApi.remove(wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useCheckFavorite(wordId: string) {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['favorites', 'check', wordId],
    queryFn: () => favoritesApi.check(wordId),
    enabled: !!wordId && isAuthenticated,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
  });
}

// Combined hook for toggle functionality
export function useToggleFavorite() {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const toggle = async (wordId: string, isFavorite: boolean) => {
    if (isFavorite) {
      await removeFavorite.mutateAsync(wordId);
    } else {
      await addFavorite.mutateAsync(wordId);
    }
  };

  return {
    toggle,
    isLoading: addFavorite.isPending || removeFavorite.isPending,
  };
}