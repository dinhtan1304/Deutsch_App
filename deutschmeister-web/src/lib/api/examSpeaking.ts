import { apiGet, apiPost, api } from './client';
import type { GradingInsights } from './types/grading-insights';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExamSpeakingTeil {
  number: number;
  taskType: string;
  instruction: string;
  instructionVi: string;
  partnerLines?: string[];
  wordCards?: string[];
  keyPoints: string[];
  prepTimeSeconds: number;
  speakTimeSeconds: number;
  maxPoints: number;
}

export interface TeilGrading {
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

export interface ExamSpeakingSession {
  id: string;
  examType: string;
  cefrLevel: string;
  teile: ExamSpeakingTeil[];
  userTranscripts?: Record<string, string>;
  grading?: Record<string, TeilGrading>;
  totalScore?: number;
  status: 'DRAFT' | 'GRADING' | 'GRADED' | 'ERROR';
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSpeakingHistoryItem {
  id: string;
  examType: string;
  cefrLevel: string;
  totalScore?: number;
  status: string;
  submittedAt?: string;
  createdAt: string;
}

export interface ExamSpeakingHistoryResponse {
  items: ExamSpeakingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExamSpeakingStats {
  total: number;
  graded: number;
  avgScore: number;
  bestScore: number;
}

function toQS(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const examSpeakingApi = {
  generateSession: (data: { examType: string; cefrLevel: string; teilNumber?: number }) =>
    apiPost<ExamSpeakingSession>('/exam-speaking/generate', data),

  submitAndGrade: (id: string, teileData: Record<string, { audioBase64: string; transcript: string; mimeType: string }>) =>
    apiPost<ExamSpeakingSession>(`/exam-speaking/${id}/submit`, { teileData }),

  getSession: (id: string) =>
    apiGet<ExamSpeakingSession>(`/exam-speaking/${id}`),

  getHistory: (params?: { page?: number; limit?: number; status?: string; examType?: string; cefrLevel?: string }) =>
    apiGet<ExamSpeakingHistoryResponse>(`/exam-speaking/history${toQS(params)}`),

  getStats: () =>
    apiGet<ExamSpeakingStats>('/exam-speaking/stats'),

  deleteSession: (id: string) =>
    api(`/exam-speaking/${id}`, { method: 'DELETE' }),
};
