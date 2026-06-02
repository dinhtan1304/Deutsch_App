'use client';

/**
 * Progress (Built-in Word SRS) React Query Hooks
 *
 * React Query owns SRS card state for:
 * - Better caching & automatic invalidation
 * - Consistent pattern with usePersonalWords hooks
 * - No manual loadCards() needed
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '@/lib/api/progress';
import { ApiError } from '@/lib/api/client';
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
export function useProgressStats(enabled = true) {
  return useQuery({
    queryKey: progressKeys.stats(),
    queryFn: () => progressApi.getStats(),
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Preview backend-owned SRS intervals for one built-in card */
export function useProgressIntervalPreview(wordId?: string) {
  return useQuery({
    queryKey: progressKeys.preview(wordId),
    queryFn: () => progressApi.getIntervalPreview(wordId as string),
    enabled: !!wordId,
    // A due card's SRS state is immutable until it's reviewed — and once reviewed
    // it leaves the session — so the preview never goes stale mid-session. Caching
    // it permanently fetches each card at most once and stops refetch storms from
    // remounts (Fast Refresh / StrictMode) that can trip the global rate limiter.
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    retry: false,
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
      // Optimistically update the reviewed card in EVERY due-cards cache
      // (the review page uses due(100), QuickReviewWidget uses due(5), etc.)
      // to avoid a full refetch during an active review session.
      // Stats and dashboard are marked stale but not immediately refetched.
      queryClient.setQueriesData<Progress[]>(
        { queryKey: [...progressKeys.all, 'due'] },
        (old) =>
          old?.map(c => c.wordId === updatedCard.wordId ? updatedCard : c) ?? old,
      );
      queryClient.invalidateQueries({ queryKey: progressKeys.stats(), refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
    },
    onError: (error, variables) => {
      if (error instanceof ApiError && error.status === 409) {
        queryClient.invalidateQueries({ queryKey: [...progressKeys.all, 'due'] });
        queryClient.invalidateQueries({ queryKey: progressKeys.preview(variables.wordId) });
        queryClient.invalidateQueries({ queryKey: progressKeys.stats() });
      }
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
