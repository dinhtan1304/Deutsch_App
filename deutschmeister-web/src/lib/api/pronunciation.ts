import { apiGet, apiPost } from './client';

export type PronunciationLevel = 'A1' | 'A2' | 'B1';

export interface PronunciationTarget {
  id: string;
  level: PronunciationLevel;
  text: string;
  translationVi: string;
  category: string;
}

export interface WordScore {
  word: string;
  score: number;
  issue?: string | null;
}

export interface PronunciationResult {
  id: string;
  overallScore: number;
  wordScores: WordScore[];
  suggestions: string[];
  transcribedText: string;
  targetText: string;
}

export interface PronunciationHistoryItem {
  id: string;
  targetText: string;
  level: PronunciationLevel;
  overallScore: number;
  createdAt: string;
}

export interface PronunciationHistoryResponse {
  data: PronunciationHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PronunciationStats {
  totalAttempts: number;
  averageScore: number;
  byLevel: Record<string, { count: number; avgScore: number }>;
}

export interface PronunciationCategory {
  name: string;
  count: number;
}

export const pronunciationApi = {
  getTargets: (level?: PronunciationLevel) =>
    apiGet<PronunciationTarget[]>(
      level ? `/pronunciation/targets?level=${level}` : '/pronunciation/targets',
    ),

  getCategories: (level?: PronunciationLevel) =>
    apiGet<PronunciationCategory[]>(
      level ? `/pronunciation/categories?level=${level}` : '/pronunciation/categories',
    ),

  score: (data: {
    targetText: string;
    level: PronunciationLevel;
    audioBase64: string;
    mimeType?: string;
    targetId?: string;
    phonemeTag?: string;
  }) => apiPost<PronunciationResult>('/pronunciation/score', data),

  getHistory: (params?: { page?: number; limit?: number; level?: PronunciationLevel }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.level) qs.set('level', params.level);
    const q = qs.toString();
    return apiGet<PronunciationHistoryResponse>(`/pronunciation/history${q ? `?${q}` : ''}`);
  },

  getStats: () => apiGet<PronunciationStats>('/pronunciation/stats'),

  getAttempt: (id: string) => apiGet<PronunciationResult>(`/pronunciation/${id}`),

  getPhonemeDrills: () => apiGet<PhonemeDrillSummary[]>('/pronunciation/phoneme-drills'),

  getPhonemeDrill: (slug: string) => apiGet<PhonemeDrill>(`/pronunciation/phoneme-drills/${slug}`),

  getPhonemeDrillStats: () => apiGet<PhonemeDrillStat[]>('/pronunciation/phoneme-drills/stats'),
};

export interface PhonemeDrillSummary {
  phoneme: string;
  label: string;
  labelVi: string;
  description: string;
  ipa: string;
  difficultyForVi: 'high' | 'medium' | 'low';
}

export interface PhonemeDrill extends PhonemeDrillSummary {
  minimalPairs: { wordA: string; wordB: string; noteVi: string }[];
  practiceWords: string[];
  practiceSentences: string[];
}

export interface PhonemeDrillStat {
  phoneme: string;
  count: number;
  avgScore: number;
  bestScore: number;
}
