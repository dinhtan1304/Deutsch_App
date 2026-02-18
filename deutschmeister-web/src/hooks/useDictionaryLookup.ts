import { useQuery } from '@tanstack/react-query';
import { dictionaryLookupApi, DictionaryLookupResult } from '@/lib/api/dictionary-lookup';

/**
 * Hook tra cứu từ trong dictionary
 */
export function useDictionaryLookup(word: string | null) {
  return useQuery<DictionaryLookupResult | null>({
    queryKey: ['dictionary-lookup', word],
    queryFn: () => {
      if (!word) return null;
      return dictionaryLookupApi.lookup(word);
    },
    enabled: !!word && word.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}

/**
 * Hook kiểm tra từ đã có trong Word Bank chưa
 */
export function useCheckWordBank(word: string | null) {
  return useQuery<boolean>({
    queryKey: ['word-bank-check', word],
    queryFn: () => {
      if (!word) return false;
      return dictionaryLookupApi.checkInWordBank(word);
    },
    enabled: !!word,
    staleTime: 30 * 1000,
    retry: false,
  });
}