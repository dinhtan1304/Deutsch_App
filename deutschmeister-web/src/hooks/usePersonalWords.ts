'use client';

/**
 * Personal Words React Query Hooks
 *
 * Queries: list, stats, categories, single word, SRS
 * Mutations: create, update, delete, import, toggle favorite, batch delete, review
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PersonalWord } from '@/types/personalWord';
import {
  personalWordsApi,
  collectionsApi,
  aiVocabApi,
  PersonalWordsListParams,
  CreatePersonalWordDto,
  UpdatePersonalWordDto,
  ImportWordsDto,
  SRSQueryParams,
  ReviewWordDto,
  SRSRating,
  PaginatedPersonalWords,
  AiGenerateVocabularyDto,
} from '@/lib/api/personal-words';

// ============================================
// Query Keys
// ============================================
export const personalWordsKeys = {
  all: ['personal-words'] as const,
  lists: () => [...personalWordsKeys.all, 'list'] as const,
  list: (params?: PersonalWordsListParams) => [...personalWordsKeys.lists(), params] as const,
  stats: () => [...personalWordsKeys.all, 'stats'] as const,
  categories: () => [...personalWordsKeys.all, 'categories'] as const,
  detail: (id: string) => [...personalWordsKeys.all, 'detail', id] as const,
};

// ============================================
// Queries
// ============================================

/** Danh sách từ vựng (có filter + pagination) */
export function usePersonalWords(params?: PersonalWordsListParams) {
  return useQuery({
    queryKey: personalWordsKeys.list(params),
    queryFn: () => personalWordsApi.list(params),
    staleTime: 2 * 60 * 1000, // 2 phút
    placeholderData: (prev) => prev, // giữ data cũ khi đổi filter
  });
}

/** Thống kê tổng quan */
export function usePersonalWordStats() {
  return useQuery({
    queryKey: personalWordsKeys.stats(),
    queryFn: () => personalWordsApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Danh sách categories */
export function usePersonalWordCategories() {
  return useQuery({
    queryKey: personalWordsKeys.categories(),
    queryFn: () => personalWordsApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

/** Chi tiết 1 từ */
export function usePersonalWord(id: string) {
  return useQuery({
    queryKey: personalWordsKeys.detail(id),
    queryFn: () => personalWordsApi.getById(id),
    staleTime: 30 * 60 * 1000,
    enabled: !!id,
  });
}

// ============================================
// Mutations
// ============================================

/** Thêm từ mới */
export function useCreatePersonalWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonalWordDto) => personalWordsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.stats() });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.categories() });
    },
  });
}

/** Cập nhật từ */
export function useUpdatePersonalWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonalWordDto }) =>
      personalWordsApi.update(id, data),
    onSuccess: (updatedWord) => {
      // Update cache trực tiếp
      queryClient.setQueryData(personalWordsKeys.detail(updatedWord.id), updatedWord);
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.stats() });
    },
  });
}

/** Xoá từ */
export function useDeletePersonalWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personalWordsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.stats() });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.categories() });
    },
  });
}

/** Xoá nhiều từ */
export function useBatchDeletePersonalWords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => personalWordsApi.batchDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.stats() });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.categories() });
    },
  });
}

/** Toggle yêu thích */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personalWordsApi.toggleFavorite(id),
    onSuccess: (updatedWord) => {
      // Optimistic update trong list cache
      queryClient.setQueriesData(
        { queryKey: personalWordsKeys.lists() },
        (old: PaginatedPersonalWords | undefined) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((w: PersonalWord) =>
              w.id === updatedWord.id ? { ...w, isFavorite: updatedWord.isFavorite } : w
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.stats() });
    },
  });
}

/** Import từ hàng loạt */
export function useImportPersonalWords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImportWordsDto) => personalWordsApi.importWords(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.all });
    },
  });
}

/** Export TSV */
export function useExportPersonalWords() {
  return useMutation({
    mutationFn: async () => {
      const blob = await personalWordsApi.exportTsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `word-bank-${new Date().toISOString().slice(0, 10)}.tsv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

// ============================================
// SRS (Spaced Repetition System) Hooks
// ============================================

/** SRS Query Keys */
export const srsKeys = {
  all: ['personal-words-srs'] as const,
  due: (params?: SRSQueryParams) => [...srsKeys.all, 'due', params] as const,
  stats: () => [...srsKeys.all, 'stats'] as const,
  weak: (limit?: number) => [...srsKeys.all, 'weak', limit] as const,
  preview: (id: string) => [...srsKeys.all, 'preview', id] as const,
};

/** Lấy từ cần ôn tập */
export function useSRSDue(params?: SRSQueryParams) {
  return useQuery({
    queryKey: srsKeys.due(params),
    queryFn: () => personalWordsApi.getDueForReview(params),
    staleTime: 30 * 1000, // 30 seconds - fresh data for reviews
  });
}

/** Thống kê SRS */
export function useSRSStats() {
  return useQuery({
    queryKey: srsKeys.stats(),
    queryFn: () => personalWordsApi.getSRSStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/** Lấy từ yếu nhất (accuracy thấp) */
export function useWeakWords(limit = 20) {
  return useQuery({
    queryKey: srsKeys.weak(limit),
    queryFn: () => personalWordsApi.getWeakWords(limit),
    staleTime: 60 * 1000,
  });
}

/** Preview intervals */
export function useIntervalPreview(id: string) {
  return useQuery({
    queryKey: srsKeys.preview(id),
    queryFn: () => personalWordsApi.getIntervalPreview(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Review một từ */
export function useReviewWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewWordDto) => personalWordsApi.reviewWord(data),
    onSuccess: (updatedWord) => {
      // Update word in cache
      queryClient.setQueryData(personalWordsKeys.detail(updatedWord.id), updatedWord);
      // Mark stale but do NOT refetch immediately — avoids 3-4 background API
      // calls per review that push fast sessions over the 200 req/min throttle.
      // Queries will auto-refetch when the user next visits the word bank page.
      queryClient.invalidateQueries({ queryKey: srsKeys.all, refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.stats(), refetchType: 'none' });
    },
  });
}

/** Batch review */
export function useBatchReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviews: ReviewWordDto[]) => personalWordsApi.batchReview(reviews),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: srsKeys.all });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.all });
    },
  });
}

/** Reset SRS cho một từ */
export function useResetSRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personalWordsApi.resetSRS(id),
    onSuccess: (updatedWord) => {
      queryClient.setQueryData(personalWordsKeys.detail(updatedWord.id), updatedWord);
      queryClient.invalidateQueries({ queryKey: srsKeys.all });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.stats() });
    },
  });
}

/** Reset tất cả SRS */
export function useResetAllSRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => personalWordsApi.resetAllSRS(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: srsKeys.all });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.all });
    },
  });
}

// Re-export types for convenience
export type { SRSRating, SRSQueryParams, ReviewWordDto };

// ── Collection Hooks ──────────────────────────────────────────────────────────

const collectionKeys = {
  all: ['collections'] as const,
  wordCollections: (wordId: string) => ['word-collections', wordId] as const,
};

export function useCollections() {
  return useQuery({
    queryKey: collectionKeys.all,
    queryFn: () => collectionsApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string; icon?: string }) =>
      collectionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string; icon?: string } }) =>
      collectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

export function useWordCollections(personalWordId: string) {
  return useQuery({
    queryKey: collectionKeys.wordCollections(personalWordId),
    queryFn: () => collectionsApi.getWordCollections(personalWordId),
    enabled: !!personalWordId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, personalWordId }: { collectionId: string; personalWordId: string }) =>
      collectionsApi.addWord(collectionId, personalWordId),
    onSuccess: (_data, { personalWordId }) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      queryClient.invalidateQueries({ queryKey: collectionKeys.wordCollections(personalWordId) });
    },
  });
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, personalWordId }: { collectionId: string; personalWordId: string }) =>
      collectionsApi.removeWord(collectionId, personalWordId),
    onSuccess: (_data, { personalWordId }) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      queryClient.invalidateQueries({ queryKey: collectionKeys.wordCollections(personalWordId) });
    },
  });
}

// ── Word Bank Game Words ─────────────────────────────────────────────────────

export function useWordBankGameWords(params: {
  collectionId?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['wordbank-game-words', params.collectionId ?? 'all'],
    queryFn: () =>
      personalWordsApi.list({ collectionId: params.collectionId, limit: 200, page: 1 }).then(r => r.data),
    staleTime: 60 * 1000,
    enabled: params.enabled !== false,
  });
}

// ── AI Vocabulary Generation ─────────────────────────────────────────────────

const aiVocabKeys = {
  quota: () => ['ai-vocab-quota'] as const,
};

export function useAIVocabQuota() {
  return useQuery({
    queryKey: aiVocabKeys.quota(),
    queryFn: () => aiVocabApi.getQuota(),
    staleTime: 30 * 1000,
  });
}

export function useAIGenerateVocabulary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AiGenerateVocabularyDto) => aiVocabApi.generate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.all });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      queryClient.invalidateQueries({ queryKey: aiVocabKeys.quota() });
    },
  });
}