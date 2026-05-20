'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wordsApi } from '@/lib/api/words';
import { useAuthStore } from '@/stores/authStore';
import { SearchWordsParams } from '@/types';

export function useWords(params?: SearchWordsParams) {
  return useQuery({
    queryKey: ['words', params],
    queryFn: () => wordsApi.search(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInfiniteWords(params?: Omit<SearchWordsParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['words', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => wordsApi.search({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWord(id: string) {
  return useQuery({
    queryKey: ['words', id],
    queryFn: () => wordsApi.getById(id),
    staleTime: 30 * 60 * 1000,
    enabled: !!id,
  });
}

export function useRandomWords(count = 10, params?: { gender?: string; category?: string; levels?: string[]; nounsOnly?: boolean }) {
  // When the user is authenticated, use the personalized game-words endpoint
  // which prioritizes words from their Progress table and their preferred
  // CEFR level. Anonymous users fall back to the public random endpoint.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['words', 'random', isAuthenticated ? 'personalized' : 'public', count, params],
    queryFn: () =>
      isAuthenticated
        ? wordsApi.getGameWords(count, { gender: params?.gender, category: params?.category, nounsOnly: params?.nounsOnly })
        : wordsApi.getRandom(count, params),
    staleTime: 0, // Always fetch fresh random words
    refetchOnWindowFocus: false,
  });
}

export function useWordStats() {
  return useQuery({
    queryKey: ['words', 'stats'],
    queryFn: () => wordsApi.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useImportWords() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => wordsApi.importFromJsonFiles(files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['words'] });
    },
  });
}