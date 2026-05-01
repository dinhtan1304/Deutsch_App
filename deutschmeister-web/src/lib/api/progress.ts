import { apiGet, apiPost } from './client';
import { Progress, ReviewRating } from '@/types';
import type { SRSPreviewResponse } from '@/lib/srs';

export const progressApi = {
  getDue: async (limit = 20): Promise<Progress[]> => {
    return apiGet<Progress[]>(`/progress/due?limit=${limit}`);
  },

  getAll: async (): Promise<Progress[]> => {
    return apiGet<Progress[]>('/progress');
  },

  review: async (wordId: string, rating: ReviewRating): Promise<Progress> => {
    return apiPost<Progress>('/progress/review', { wordId, rating });
  },

  addWords: async (wordIds: string[]): Promise<{ added: number }> => {
    return apiPost<{ added: number }>('/progress/add', { wordIds });
  },

  getIntervalPreview: async (wordId: string): Promise<SRSPreviewResponse> => {
    return apiGet<SRSPreviewResponse>(`/progress/preview/${wordId}`);
  },

  getStats: async (): Promise<{
    total: number;
    mastered: number;
    learning: number;
    due: number;
    new: number;
  }> => {
    return apiGet('/progress/stats');
  },
};
