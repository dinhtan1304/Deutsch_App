import { apiGet } from './client';
import { Word, PaginatedResponse, SearchWordsParams } from '@/types';

export const wordsApi = {
  search: async (params?: SearchWordsParams): Promise<PaginatedResponse<Word>> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.gender) searchParams.set('gender', params.gender);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.level) searchParams.set('level', params.level);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return apiGet<PaginatedResponse<Word>>(`/words${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Word> => {
    return apiGet<Word>(`/words/${id}`);
  },

  getRandom: async (count = 10, params?: { gender?: string; category?: string; levels?: string[]; nounsOnly?: boolean }): Promise<Word[]> => {
    const searchParams = new URLSearchParams();
    searchParams.set('count', count.toString());
    if (params?.gender) searchParams.set('gender', params.gender);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.levels) params.levels.forEach(l => searchParams.append('levels', l));
    if (params?.nounsOnly) searchParams.set('nounsOnly', 'true');

    return apiGet<Word[]>(`/words/random?${searchParams.toString()}`);
  },

  getStats: async (): Promise<{
    total: number;
    byGender: { gender: string; count: number }[];
    byCategory: { category: string; count: number }[];
    byLevel: { level: string; count: number }[];
  }> => {
    return apiGet('/words/stats');
  },
};
