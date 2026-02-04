import { apiGet, apiPost, apiDelete } from './client';
import { Word } from '@/types';

export interface Favorite {
  id: string;
  wordId: string;
  word: Word;
  createdAt: string;
}

export const favoritesApi = {
  getAll: async (): Promise<Favorite[]> => {
    return apiGet<Favorite[]>('/favorites');
  },

  add: async (wordId: string): Promise<Favorite> => {
    return apiPost<Favorite>(`/favorites/${wordId}`);
  },

  remove: async (wordId: string): Promise<void> => {
    await apiDelete(`/favorites/${wordId}`);
  },

  check: async (wordId: string): Promise<{ isFavorite: boolean }> => {
    return apiGet<{ isFavorite: boolean }>(`/favorites/${wordId}/check`);
  },
};