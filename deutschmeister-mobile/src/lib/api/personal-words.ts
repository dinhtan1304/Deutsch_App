/**
 * Personal Words API Client (Mobile)
 * Matches NestJS PersonalWordsController endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete, api } from './client';

// ============================================
// Types
// ============================================
export type WordType =
  | 'nomen' | 'verb' | 'adjektiv' | 'adverb'
  | 'praposition' | 'konjunktion' | 'pronomen' | 'partikel' | 'andere';

export type Gender = 'masculine' | 'feminine' | 'neuter';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type SRSStatus = 'new' | 'learning' | 'review' | 'mature';

export const WordTypeInfo: Record<WordType, { label: string; labelDe: string; color: string }> = {
  nomen:       { label: 'Danh tu',    labelDe: 'Nomen',        color: '#3b82f6' },
  verb:        { label: 'Dong tu',    labelDe: 'Verb',         color: '#ef4444' },
  adjektiv:    { label: 'Tinh tu',    labelDe: 'Adjektiv',     color: '#f59e0b' },
  adverb:      { label: 'Trang tu',   labelDe: 'Adverb',       color: '#8b5cf6' },
  praposition: { label: 'Gioi tu',    labelDe: 'Praposition',  color: '#ec4899' },
  konjunktion: { label: 'Lien tu',    labelDe: 'Konjunktion',  color: '#14b8a6' },
  pronomen:    { label: 'Dai tu',     labelDe: 'Pronomen',     color: '#6366f1' },
  partikel:    { label: 'Tieu tu',    labelDe: 'Partikel',     color: '#78716c' },
  andere:      { label: 'Khac',       labelDe: 'Andere',       color: '#64748b' },
};

export interface NomenData { article: 'der' | 'die' | 'das'; gender: Gender; plural?: string; }
export interface VerbData {
  partizipII?: string; hilfsverb?: 'haben' | 'sein'; trennbar?: boolean; prateritum?: string;
  konjugation?: { ich?: string; du?: string; erSieEs?: string; wir?: string; ihr?: string; sieSie?: string; };
}
export interface AdjektivData { komparativ?: string; superlativ?: string; }
export interface PrapositionData { kasus?: ('akkusativ' | 'dativ' | 'genitiv' | 'wechsel')[]; }

export interface PersonalWord {
  id: string;
  word: string;
  wordType: WordType;
  nomenData?: NomenData;
  verbData?: VerbData;
  adjektivData?: AdjektivData;
  prapositionData?: PrapositionData;
  translationEn: string;
  translationVi: string;
  examples: string[];
  level: Level;
  category?: string;
  tags?: string[];
  notes?: string;
  pronunciation?: string;
  isFavorite: boolean;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewAt?: string;
  totalReviews: number;
  correctCount: number;
  createdAt: string;
  updatedAt: string;
}

export function getSRSStatus(word: PersonalWord): SRSStatus {
  if (word.repetitions === 0 && word.totalReviews === 0) return 'new';
  if (word.interval < 7) return 'learning';
  if (word.interval < 21) return 'review';
  return 'mature';
}

export const SRSStatusInfo: Record<SRSStatus, { label: string; color: string }> = {
  new:      { label: 'Moi',        color: '#3b82f6' },
  learning: { label: 'Dang hoc',   color: '#f59e0b' },
  review:   { label: 'On tap',     color: '#8b5cf6' },
  mature:   { label: 'Thuoc long', color: '#22c55e' },
};

// Request/Response Types
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
    level?: string;
    category?: string;
  }>;
}

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

export interface IntervalPreview {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export interface WordCollection {
  id: string;
  name: string;
  color: string;
  icon: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WordCollectionRef {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ============================================
// API Client
// ============================================
export const personalWordsApi = {
  create: async (data: CreatePersonalWordDto): Promise<PersonalWord> => {
    return apiPost<PersonalWord>('/personal-words', data);
  },

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

  getStats: async (): Promise<PersonalWordStats> => {
    return apiGet<PersonalWordStats>('/personal-words/stats');
  },

  getCategories: async (): Promise<string[]> => {
    return apiGet<string[]>('/personal-words/categories');
  },

  getById: async (id: string): Promise<PersonalWord> => {
    return apiGet<PersonalWord>(`/personal-words/${id}`);
  },

  update: async (id: string, data: UpdatePersonalWordDto): Promise<PersonalWord> => {
    return apiPut<PersonalWord>(`/personal-words/${id}`, data);
  },

  remove: async (id: string): Promise<void> => {
    return apiDelete<void>(`/personal-words/${id}`);
  },

  toggleFavorite: async (id: string): Promise<PersonalWord> => {
    return apiPut<PersonalWord>(`/personal-words/${id}/favorite`);
  },

  importWords: async (data: ImportWordsDto): Promise<{ added: number; skipped: number; failed: number }> => {
    return apiPost('/personal-words/import', data);
  },

  batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
    return apiPost<{ deleted: number }>('/personal-words/batch-delete', { ids });
  },

  // SRS
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

  getSRSStats: async (): Promise<SRSStats> => {
    return apiGet<SRSStats>('/personal-words/srs/stats');
  },

  reviewWord: async (data: ReviewWordDto): Promise<PersonalWord> => {
    return apiPost<PersonalWord>('/personal-words/srs/review', data);
  },

  batchReview: async (reviews: ReviewWordDto[]): Promise<{ reviewed: number; failed: number }> => {
    return apiPost('/personal-words/srs/batch-review', { reviews });
  },

  getIntervalPreview: async (id: string): Promise<IntervalPreview> => {
    return apiGet<IntervalPreview>(`/personal-words/srs/preview/${id}`);
  },

  resetSRS: async (id: string): Promise<PersonalWord> => {
    return apiPost<PersonalWord>(`/personal-words/srs/reset/${id}`);
  },

  resetAllSRS: async (): Promise<{ reset: number }> => {
    return apiPost<{ reset: number }>('/personal-words/srs/reset-all');
  },
};

// Collections
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
