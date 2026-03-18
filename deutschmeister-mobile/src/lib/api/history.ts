import { apiGet, apiPost, apiDelete } from './client';
import { Word } from '@/types';

export interface HistoryItem {
  id: string;
  wordId: string;
  word: Word;
  viewedAt: string;
}

export const historyApi = {
  getAll: async (limit = 50): Promise<HistoryItem[]> => {
    return apiGet<HistoryItem[]>(`/history?limit=${limit}`);
  },

  add: async (wordId: string): Promise<HistoryItem> => {
    return apiPost<HistoryItem>(`/history/${wordId}`);
  },

  clear: async (): Promise<void> => {
    await apiDelete('/history');
  },
};
