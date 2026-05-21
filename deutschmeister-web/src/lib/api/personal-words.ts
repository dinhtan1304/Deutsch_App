/**
 * Personal Words API Client
 * Matches NestJS PersonalWordsController endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete, api } from './client';
import {
  PersonalWord, WordType, Level, Gender,
  ImportResult, WordCollection, WordCollectionRef,
} from '@/types/personalWord';
import type { SRSPreviewResponse } from '@/lib/srs';

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
  collectionId?: string;
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
  rows: Array<{
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
    if (params?.collectionId) searchParams.set('collectionId', params.collectionId);
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

  // ============================================
  // SRS (Spaced Repetition System)
  // ============================================

  // GET /api/personal-words/srs/due — Get words due for review
  getDueForReview: async (params?: SRSQueryParams): Promise<SRSDueResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.wordType) searchParams.set('wordType', params.wordType);
    if (params?.level) searchParams.set('level', params.level);
    if (params?.includeNew !== undefined) searchParams.set('includeNew', params.includeNew.toString());
    if (params?.newLimit) searchParams.set('newLimit', params.newLimit.toString());

    const query = searchParams.toString();
    return apiGet<SRSDueResponse>(`/personal-words/srs/due${query ? `?${query}` : ''}`);
  },

  // GET /api/personal-words/srs/stats — Get SRS statistics
  getSRSStats: async (): Promise<SRSStats> => {
    return apiGet<SRSStats>('/personal-words/srs/stats');
  },

  // GET /api/personal-words/srs/weak — Get weakest words for focused review
  getWeakWords: async (limit = 20): Promise<WeakWordsResponse> => {
    return apiGet<WeakWordsResponse>(`/personal-words/srs/weak?limit=${limit}`);
  },

  // POST /api/personal-words/srs/review — Review a word
  reviewWord: async (data: ReviewWordDto): Promise<PersonalWord> => {
    return apiPost<PersonalWord>('/personal-words/srs/review', data);
  },

  // POST /api/personal-words/srs/batch-review — Batch review
  batchReview: async (reviews: ReviewWordDto[]): Promise<BatchReviewResult> => {
    return apiPost<BatchReviewResult>('/personal-words/srs/batch-review', { reviews });
  },

  // GET /api/personal-words/srs/preview/:id — Preview intervals
  getIntervalPreview: async (id: string): Promise<SRSPreviewResponse> => {
    return apiGet<SRSPreviewResponse>(`/personal-words/srs/preview/${id}`);
  },

  // POST /api/personal-words/srs/reset/:id — Reset SRS for a word
  resetSRS: async (id: string): Promise<PersonalWord> => {
    return apiPost<PersonalWord>(`/personal-words/srs/reset/${id}`);
  },

  // POST /api/personal-words/srs/reset-all — Reset all SRS
  resetAllSRS: async (): Promise<{ reset: number }> => {
    return apiPost<{ reset: number }>('/personal-words/srs/reset-all');
  },
};

// ============================================
// SRS Types
// ============================================
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSQueryParams {
  limit?: number;
  wordType?: WordType;
  level?: Level;
  includeNew?: boolean;
  newLimit?: number;
}

export interface SRSDueResponse {
  due: PersonalWord[];
  new: PersonalWord[];
  total: number;
}

export interface WeakWord extends PersonalWord {
  accuracy: number;
}

export interface WeakWordsResponse {
  words: WeakWord[];
  total: number;
}

export interface SRSStats {
  due: number;
  new: number;
  learning: number;
  review: number;
  mature: number;
  total: number;
  retentionRate: number;
  reviewedToday: number;
  forecast: { date: string; count: number }[];
}

export interface ReviewWordDto {
  wordId: string;
  rating: SRSRating;
}

export interface BatchReviewResult {
  reviewed: number;
  failed: number;
  results: Array<{
    wordId: string;
    success: boolean;
    data?: PersonalWord;
    error?: string;
  }>;
}

export type IntervalPreview = SRSPreviewResponse;

// ── Collections ──────────────────────────────────────────────────────────────

export const collectionsApi = {
  list: (): Promise<WordCollection[]> =>
    apiGet('/personal-words/collections'),

  create: (data: { name: string; color?: string; icon?: string }): Promise<WordCollection> =>
    apiPost('/personal-words/collections', data),

  update: (id: string, data: { name?: string; color?: string; icon?: string }): Promise<WordCollection> =>
    api(`/personal-words/collections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string): Promise<void> =>
    api(`/personal-words/collections/${id}`, { method: 'DELETE' }),

  addWord: (collectionId: string, personalWordId: string): Promise<WordCollection> =>
    apiPost(`/personal-words/collections/${collectionId}/words`, { personalWordId }),

  removeWord: (collectionId: string, personalWordId: string): Promise<void> =>
    api(`/personal-words/collections/${collectionId}/words/${personalWordId}`, { method: 'DELETE' }),

  getWordCollections: (personalWordId: string): Promise<WordCollectionRef[]> =>
    apiGet(`/personal-words/${personalWordId}/collections`),
};

// ============================================
// AI Vocabulary Generation
// ============================================

export interface AIGeneratedVocabWord {
  word: string;
  wordType: WordType;
  nomenData?: { article: 'der' | 'die' | 'das'; gender: string; plural?: string } | null;
  verbData?: { partizipII?: string; hilfsverb?: 'haben' | 'sein' } | null;
  adjektivData?: { komparativ?: string; superlativ?: string } | null;
  translationEn: string;
  translationVi: string;
  examples: string[];
  level: string;
  category: string;
}

export interface AiGenerateVocabularyDto {
  topic: string;
  count: number;
  description?: string;
  level?: string;
  collectionId?: string;
  excludeWords?: string[];
}

export interface AIGenerateResponse {
  words: AIGeneratedVocabWord[];
  wordsAdded: number;
  wordsSkipped: number;
  quotaUsed: number;
  quotaRemaining: number;
  weeklyLimit: number;
}

export interface AIVocabQuota {
  used: number;
  remaining: number;
  weeklyLimit: number;
  isPremium: boolean;
}

/**
 * Free-tier word-bank capacity. limit/remaining are -1 for paid users
 * (paid users are unlimited).
 */
export interface WordBankCapacity {
  used: number;
  limit: number;
  remaining: number;
  isPaid: boolean;
}

export const aiVocabApi = {
  generate: (dto: AiGenerateVocabularyDto): Promise<AIGenerateResponse> =>
    apiPost('/personal-words/ai-generate', dto),

  getQuota: (): Promise<AIVocabQuota> =>
    apiGet('/personal-words/ai-generate/quota'),

  getCapacity: (): Promise<WordBankCapacity> =>
    apiGet('/personal-words/capacity'),
};
