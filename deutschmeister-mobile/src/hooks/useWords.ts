import { useQuery } from '@tanstack/react-query';
import { wordsApi } from '@/lib/api/words';
import { SearchWordsParams } from '@/types';

export function useWords(params?: SearchWordsParams) {
  return useQuery({
    queryKey: ['words', params],
    queryFn: () => wordsApi.search(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWord(id: string) {
  return useQuery({
    queryKey: ['words', id],
    queryFn: () => wordsApi.getById(id),
    enabled: !!id,
  });
}

export function useRandomWords(count = 10, params?: { gender?: string; category?: string; levels?: string[] }) {
  return useQuery({
    queryKey: ['words', 'random', count, params],
    queryFn: () => wordsApi.getRandom(count, params),
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
