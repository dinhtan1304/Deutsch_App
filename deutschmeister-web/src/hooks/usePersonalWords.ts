'use client';

/**
 * Personal Words React Query Hooks
 *
 * Queries: list, stats, categories, single word
 * Mutations: create, update, delete, import, toggle favorite, batch delete
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  personalWordsApi,
  PersonalWordsListParams,
  CreatePersonalWordDto,
  UpdatePersonalWordDto,
  ImportWordsDto,
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
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((w: any) =>
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