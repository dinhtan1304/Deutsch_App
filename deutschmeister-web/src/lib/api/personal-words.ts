/**
 * Personal Words API Client
 * Matches NestJS PersonalWordsController endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete, api } from './client';
import {
  PersonalWord, WordType, Level, Gender,
  ImportResult, WordBankFilters,
} from '@/types/personalWord';

// ============================================
// Request/Response Types
// ============================================
export interface CreatePersonalWordDto {
  word: string;
  wordType: WordType;
  translationEn: string;
  translationVi: string;
  nomenData?: { article: string; gender: string; plural?: string };
  verbData?: { partizipII?: string; hilfsverb?: string; trennbar?: boolean; prateritum?: string; konjugation?: Record<string, string> };
  adjektivData?: { komparativ?: string; superlativ?: string };
  prapositionData?: { kasus?: string[] };
  examples?: string[];
  level?: Level;
  category?: string;
  tags?: string[];
  notes?: string;
  pronunciation?: string;
}

export interface UpdatePersonalWordDto extends Partial<CreatePersonalWordDto> {
  isFavorite?: boolean;
}

export interface PersonalWordsListParams {
  search?: string;
  wordType?: WordType | 'all';
  level?: Level | 'all';
  gender?: Gender | 'all';
  category?: string;
  favoritesOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedPersonalWords {
  data: PersonalWord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PersonalWordStats {
  total: number;
  byType: Record<WordType, number>;
  byLevel: Record<Level, number>;
  favorites: number;
}

export interface ImportWordsDto {
  words: Array<{
    word: string;
    wordType: WordType;
    translationEn: string;
    translationVi: string;
    article?: string;
    plural?: string;
    partizipII?: string;
    hilfsverb?: string;
    komparativ?: string;
    superlativ?: string;
    kasus?: string;
    examples?: string;
    level?: string;
    category?: string;
    tags?: string;
    notes?: string;
  }>;
}

// ============================================
// API Client
// ============================================
export const personalWordsApi = {
  // POST /api/personal-words — Create word
  create: async (data: CreatePersonalWordDto): Promise<PersonalWord> => {
    return apiPost<PersonalWord>('/personal-words', data);
  },

  // GET /api/personal-words — List with filters + pagination
  list: async (params?: PersonalWordsListParams): Promise<PaginatedPersonalWords> => {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.set('search', params.search);
    if (params?.wordType && params.wordType !== 'all') searchParams.set('wordType', params.wordType);
    if (params?.level && params.level !== 'all') searchParams.set('level', params.level);
    if (params?.gender && params.gender !== 'all') searchParams.set('gender', params.gender);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.favoritesOnly) searchParams.set('favoritesOnly', 'true');
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return apiGet<PaginatedPersonalWords>(`/personal-words${query ? `?${query}` : ''}`);
  },

  // GET /api/personal-words/stats
  getStats: async (): Promise<PersonalWordStats> => {
    return apiGet<PersonalWordStats>('/personal-words/stats');
  },

  // GET /api/personal-words/categories
  getCategories: async (): Promise<string[]> => {
    return apiGet<string[]>('/personal-words/categories');
  },

  // GET /api/personal-words/export
  exportTsv: async (): Promise<Blob> => {
    return api<Blob>('/personal-words/export', {
      method: 'GET',
      headers: { Accept: 'text/tab-separated-values' },
    });
  },

  // GET /api/personal-words/:id
  getById: async (id: string): Promise<PersonalWord> => {
    return apiGet<PersonalWord>(`/personal-words/${id}`);
  },

  // PUT /api/personal-words/:id — Update word
  update: async (id: string, data: UpdatePersonalWordDto): Promise<PersonalWord> => {
    return apiPut<PersonalWord>(`/personal-words/${id}`, data);
  },

  // DELETE /api/personal-words/:id
  remove: async (id: string): Promise<void> => {
    return apiDelete<void>(`/personal-words/${id}`);
  },

  // PUT /api/personal-words/:id/favorite — Toggle favorite
  toggleFavorite: async (id: string): Promise<PersonalWord> => {
    return apiPut<PersonalWord>(`/personal-words/${id}/favorite`);
  },

  // POST /api/personal-words/import — Bulk import
  importWords: async (data: ImportWordsDto): Promise<ImportResult> => {
    return apiPost<ImportResult>('/personal-words/import', data);
  },

  // POST /api/personal-words/batch-delete
  batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
    return apiPost<{ deleted: number }>('/personal-words/batch-delete', { ids });
  },
};