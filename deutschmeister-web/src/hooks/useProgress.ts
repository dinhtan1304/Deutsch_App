'use client';

/**
 * Progress (Built-in Word SRS) React Query Hooks
 *
 * Replaces the old Zustand srsStore with React Query for:
 * - Better caching & automatic invalidation
 * - Consistent pattern with usePersonalWords hooks
 * - No manual loadCards() needed
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '@/lib/api/progress';
import { Progress, ReviewRating } from '@/types';

// ============================================
// Query Keys
// ============================================
export const progressKeys = {
  all: ['progress'] as const,
  due: (limit?: number) => [...progressKeys.all, 'due', limit] as const,
  list: () => [...progressKeys.all, 'list'] as const,
  stats: () => [...progressKeys.all, 'stats'] as const,
  preview: (wordId?: string) => [...progressKeys.all, 'preview', wordId] as const,
};

// ============================================
// Queries
// ============================================

/** Get all progress entries */
export function useAllProgress() {
  return useQuery({
    queryKey: progressKeys.list(),
    queryFn: () => progressApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });
}

/** Get due cards for review */
export function useDueCards(limit = 20) {
  return useQuery({
    queryKey: progressKeys.due(limit),
    queryFn: () => progressApi.getDue(limit),
    staleTime: 30 * 1000, // 30s — fresh for reviews
  });
}

/** Get SRS stats */
export function useProgressStats() {
  return useQuery({
    queryKey: progressKeys.stats(),
    queryFn: () => progressApi.getStats(),
    staleTime: 60 * 1000,
  });
}

/** Preview backend-owned SRS intervals for one built-in card */
export function useProgressIntervalPreview(wordId?: string) {
  return useQuery({
    queryKey: progressKeys.preview(wordId),
    queryFn: () => progressApi.getIntervalPreview(wordId as string),
    enabled: !!wordId,
    staleTime: 30 * 1000,
  });
}

// ============================================
// Mutations
// ============================================

/** Review a card */
export function useReviewCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wordId, rating }: { wordId: string; rating: ReviewRating }) =>
      progressApi.review(wordId, rating),
    onSuccess: (updatedCard) => {
      // Optimistically update only the reviewed card in the due-cards cache
      // to avoid a full refetch during an active review session.
      // Stats and dashboard are marked stale but not immediately refetched.
      queryClient.setQueryData(
        progressKeys.due(100),
        (old: Progress[] | undefined) =>
          old?.map(c => c.wordId === updatedCard.wordId ? updatedCard : c) ?? old,
      );
      queryClient.invalidateQueries({ queryKey: progressKeys.stats(), refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
    },
  });
}

/** Add words to SRS deck */
export function useAddWordsToSRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wordIds: string[]) => progressApi.addWords(wordIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}

// ============================================
// Derived helpers (computed from query data)
// ============================================

/** Compute SRS stats from progress list (client-side) */
export function computeStats(cards: Progress[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    total: cards.length,
    due: cards.filter(p => new Date(p.nextReviewAt) <= now).length,
    new: cards.filter(p => p.repetitions === 0).length,
    learning: cards.filter(p => p.repetitions > 0 && p.interval < 21).length,
    mature: cards.filter(p => p.interval >= 21).length,
    reviewedToday: cards.filter(
      p => p.lastReviewAt && new Date(p.lastReviewAt) >= todayStart,
    ).length,
  };
}
