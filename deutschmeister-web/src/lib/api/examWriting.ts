import { apiGet, apiPost, api } from './client';
import type { GradingInsights } from './types/grading-insights';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExamWritingTeil {
  number: number;
  taskType: 'form_fill' | 'informal_email' | 'formal_email' | 'sms' | 'forum_comment';
  scenario: string;
  taskDescription: string;
  requiredPoints: string[];
  minWords: number;
  maxWords: number;
  maxPoints: number;
}

export interface CriterionScores {
  aufgabenerfuellung: number;
  grammatik: number;
  wortschatz: number;
  kohaerenz: number;
}

export interface TeilGrading {
  teilNumber: number;
  score: number;
  maxPoints: number;
  criterionScores?: CriterionScores;
  feedback: string;
  corrections: {
    original: string;
    corrected: string;
    explanationVi: string;
    explanationDe: string;
  }[];
  strengths: string[];
  improvements: string[];
  insights?: GradingInsights | null;
}

export interface ExamWritingSession {
  id: string;
  examType: string;
  cefrLevel: string;
  teile: ExamWritingTeil[];
  userTexts?: Record<string, string>;
  grading?: Record<string, TeilGrading>;
  totalScore?: number;
  status: 'DRAFT' | 'GRADING' | 'GRADED' | 'ERROR';
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamWritingHistoryItem {
  id: string;
  examType: string;
  cefrLevel: string;
  totalScore?: number;
  status: string;
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
}

export interface ExamWritingHistoryResponse {
  items: ExamWritingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExamWritingStats {
  total: number;
  graded: number;
  avgScore: number;
  bestScore: number;
}

// ─── API client ───────────────────────────────────────────────────────────────

function toQS(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const examWritingApi = {
  generateSession: (data: { examType: string; cefrLevel: string; teilNumber?: number }) =>
    apiPost<ExamWritingSession>('/exam-writing/generate', data),

  saveDraft: (id: string, userTexts: Record<string, string>) =>
    api<ExamWritingSession>(`/exam-writing/${id}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ userTexts }),
    }),

  submitAndGrade: (id: string, userTexts: Record<string, string>) =>
    apiPost<ExamWritingSession>(`/exam-writing/${id}/submit`, { userTexts }),

  getSession: (id: string) =>
    apiGet<ExamWritingSession>(`/exam-writing/${id}`),

  getHistory: (params?: {
    page?: number; limit?: number; status?: string; examType?: string; cefrLevel?: string;
  }) => apiGet<ExamWritingHistoryResponse>(`/exam-writing/history${toQS(params)}`),

  getStats: () =>
    apiGet<ExamWritingStats>('/exam-writing/stats'),

  deleteSession: (id: string) =>
    api(`/exam-writing/${id}`, { method: 'DELETE' }),
};
