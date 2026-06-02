import { apiGet, apiPost, apiDelete } from './client';
import type { GradingInsights } from './types/grading-insights';

export interface FreeSpeakingGrading {
  score: number;
  criteriaScores: {
    aufgabe: number;
    aussprache: number;
    grammatik: number;
    wortschatz: number;
  };
  feedbackVi: string;
  feedbackDe: string;
  corrections: string[];
  strengths: string[];
  insights?: GradingInsights | null;
}

export interface FreeSpeakingSession {
  id: string;
  cefrLevel: string;
  topicType: string;
  prompt: string;
  promptVi: string;
  keyPoints: string[];
  transcript?: string;
  grading?: FreeSpeakingGrading;
  totalScore?: number;
  /** Absolute URL of the user's recorded answer (served from the API /uploads). */
  audioUrl?: string;
  status: 'DRAFT' | 'GRADING' | 'GRADED' | 'ERROR';
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
}

export interface FreeSpeakingHistoryItem {
  id: string;
  cefrLevel: string;
  topicType: string;
  prompt: string;
  totalScore?: number;
  status: string;
  createdAt: string;
}

export interface FreeSpeakingHistoryResponse {
  items: FreeSpeakingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FreeSpeakingStats {
  total: number;
  graded: number;
  avgScore: number;
  bestScore: number;
}

export const freeSpeakingApi = {
  generateSession: (data: { cefrLevel: string; topicType: string }) =>
    apiPost<FreeSpeakingSession>('/free-speaking/generate', data),

  submitAndGrade: (id: string, data: { audioBase64: string; transcript: string; mimeType: string }) =>
    apiPost<FreeSpeakingSession>(`/free-speaking/${id}/submit`, data),

  getSession: (id: string) =>
    apiGet<FreeSpeakingSession>(`/free-speaking/${id}`),

  getHistory: (params?: { page?: number; limit?: number; status?: string; cefrLevel?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)     q.set('page',      String(params.page));
    if (params?.limit)    q.set('limit',     String(params.limit));
    if (params?.status)   q.set('status',    params.status);
    if (params?.cefrLevel) q.set('cefrLevel', params.cefrLevel);
    const qs = q.toString();
    return apiGet<FreeSpeakingHistoryResponse>(`/free-speaking/history${qs ? `?${qs}` : ''}`);
  },

  getStats: () =>
    apiGet<FreeSpeakingStats>('/free-speaking/stats'),

  deleteSession: (id: string) =>
    apiDelete<{ success: boolean }>(`/free-speaking/${id}`),
};
