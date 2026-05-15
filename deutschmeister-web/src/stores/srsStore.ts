'use client';

import { create } from 'zustand';
import { progressApi } from '@/lib/api/progress';
import { getAccessToken } from '@/lib/api/client';
import { Progress, ReviewRating } from '@/types';

interface SRSStats {
  total: number;
  due: number;
  new: number;
  learning: number;
  mature: number;
  reviewedToday: number;
}

interface SRSState {
  cards: Record<string, Progress>; // wordId -> Progress
  isLoaded: boolean;
  isLoading: boolean;

  // Actions
  loadCards: () => Promise<void>;
  reviewCard: (wordId: string, rating: ReviewRating) => Promise<void>;
  addWords: (wordIds: string[]) => Promise<void>;

  // Getters
  getCard: (wordId: string) => Progress | null;
  getDueCards: () => Progress[];
  getStats: () => SRSStats;
}

export const useSRSStore = create<SRSState>((set, get) => ({
  cards: {},
  isLoaded: false,
  isLoading: false,

  loadCards: async () => {
    if (get().isLoading) return;

    // Skip API call if not authenticated
    if (!getAccessToken()) {
      set({ cards: {}, isLoaded: true, isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      const allProgress = await progressApi.getAll();
      const cards: Record<string, Progress> = {};
      allProgress.forEach((p) => {
        cards[p.wordId] = p;
      });
      set({ cards, isLoaded: true, isLoading: false });
    } catch (e) {
      if ((e as { status?: number } | undefined)?.status === 401) {
        set({ cards: {}, isLoaded: false, isLoading: false });
        return;
      }
      if (process.env.NODE_ENV === 'development') console.error('Failed to load SRS cards:', e);
      set({ cards: {}, isLoaded: true, isLoading: false });
    }
  },

  reviewCard: async (wordId: string, rating: ReviewRating) => {
    if (!getAccessToken()) return;
    try {
      const updated = await progressApi.review(wordId, rating);
      const { cards } = get();
      set({ cards: { ...cards, [wordId]: updated } });
    } catch (e) {
      if ((e as { status?: number } | undefined)?.status === 401) return;
      if (process.env.NODE_ENV === 'development') console.error('Failed to review card:', e);
    }
  },

  addWords: async (wordIds: string[]) => {
    if (!getAccessToken()) return;
    try {
      await progressApi.addWords(wordIds);
      // Reload all cards to get the new ones with word data
      await get().loadCards();
    } catch (e) {
      // Silently handle auth errors (redirect handled by API client)
      if ((e as { status?: number } | undefined)?.status === 401) return;
      if (process.env.NODE_ENV === 'development') console.error('Failed to add words:', e);
    }
  },

  getCard: (wordId: string) => {
    return get().cards[wordId] || null;
  },

  getDueCards: () => {
    const { cards } = get();
    const now = new Date();
    return Object.values(cards).filter(
      (p) => new Date(p.nextReviewAt) <= now,
    );
  },

  getStats: () => {
    const { cards } = get();
    const cardList = Object.values(cards);
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return {
      total: cardList.length,
      due: cardList.filter((p) => new Date(p.nextReviewAt) <= now).length,
      new: cardList.filter((p) => p.repetitions === 0).length,
      learning: cardList.filter(
        (p) => p.repetitions > 0 && p.interval < 21,
      ).length,
      mature: cardList.filter((p) => p.interval >= 21).length,
      reviewedToday: cardList.filter(
        (p) => p.lastReviewAt && new Date(p.lastReviewAt) >= todayStart,
      ).length,
    };
  },
}));

// ─── Granular selectors — prefer these over destructuring the whole store ───
export const useSRSCards = () => useSRSStore((s) => s.cards);
export const useSRSIsLoaded = () => useSRSStore((s) => s.isLoaded);
export const useSRSIsLoading = () => useSRSStore((s) => s.isLoading);