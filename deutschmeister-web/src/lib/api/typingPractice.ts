import { apiGet, apiPost } from './client';

export const TYPING_CATEGORIES = [
  'BILDUNG',
  'ARBEIT',
  'FAMILIE',
  'ESSEN',
  'REISEN',
  'WOHNEN',
  'FREIZEIT',
  'GESUNDHEIT',
] as const;

export type TypingCategory = (typeof TYPING_CATEGORIES)[number];
export type TypingLevel = 'A1' | 'A2' | 'B1';

export interface TypingSentence {
  id: string;
  textDe: string;
  translationVi: string;
  cefrLevel: TypingLevel;
  category: TypingCategory;
  wordCount: number;
  charCount: number;
}

export interface TypingSessionResult {
  id: string;
  cefrLevel: string;
  category: string;
  durationSec: number;
  sentencesCompleted: number;
  wordsTyped: number;
  correctChars: number;
  incorrectChars: number;
  wpm: number;
  accuracy: number;
  createdAt: string;
}

export interface TypingStats {
  totalSessions: number;
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
  bestPerCategory: Array<{
    category: string;
    cefrLevel: string;
    bestWpm: number;
  }>;
}

export interface SubmitTypingPayload {
  cefrLevel: TypingLevel;
  category: TypingCategory;
  durationSec: number;
  sentencesCompleted: number;
  wordsTyped: number;
  correctChars: number;
  incorrectChars: number;
  wpm: number;
  accuracy: number;
}

export const typingPracticeApi = {
  getSentences(level: TypingLevel, category: TypingCategory, limit = 40) {
    return apiGet<TypingSentence[]>(
      `/typing-practice/sentences?level=${level}&category=${category}&limit=${limit}`,
    );
  },

  submitSession(payload: SubmitTypingPayload) {
    return apiPost<TypingSessionResult>('/typing-practice/sessions', payload);
  },

  getHistory(limit = 20) {
    return apiGet<TypingSessionResult[]>(`/typing-practice/history?limit=${limit}`);
  },

  getStats() {
    return apiGet<TypingStats>('/typing-practice/stats');
  },
};

export const TYPING_CATEGORY_LABELS: Record<TypingCategory, { de: string; vi: string; icon: string }> = {
  BILDUNG: { de: 'Bildung', vi: 'Giáo dục', icon: '🎓' },
  ARBEIT: { de: 'Arbeit', vi: 'Công việc', icon: '💼' },
  FAMILIE: { de: 'Familie', vi: 'Gia đình', icon: '👨‍👩‍👧' },
  ESSEN: { de: 'Essen', vi: 'Ẩm thực', icon: '🍽️' },
  REISEN: { de: 'Reisen', vi: 'Du lịch', icon: '✈️' },
  WOHNEN: { de: 'Wohnen', vi: 'Nhà ở', icon: '🏠' },
  FREIZEIT: { de: 'Freizeit', vi: 'Giải trí', icon: '🎨' },
  GESUNDHEIT: { de: 'Gesundheit', vi: 'Sức khoẻ', icon: '💊' },
};
