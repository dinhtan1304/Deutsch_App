import { apiGet, apiPost, apiDelete, api } from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExamText {
  id: string;
  label?: string;
  type: string;
  title?: string;
  author?: string;
  content: string;
}

export interface ExamTeilQuestion {
  id: string;
  questionText: string;
  options?: { id: string; text: string }[];
  correctAnswer: string;
  explanationVi: string;
  explanationDe: string;
}

export type ExamReadingTaskType =
  | 'richtig_falsch'
  | 'multiple_choice'
  | 'zuordnung'
  | 'ja_nein'
  | 'sprachbausteine';

export interface ExamReadingTeil {
  number: number;
  taskType: ExamReadingTaskType;
  instruction: string;
  maxPoints: number;
  texts: ExamText[];
  questions: ExamTeilQuestion[];
  wordBank?: string[];
}

export interface TeilScore {
  teil: number;
  correct: number;
  total: number;
  maxPoints: number;
}

export interface TeilGradingDetail {
  questionId: string;
  userAnswer: string | undefined;
  correctAnswer: string;
  isCorrect: boolean;
  explanationVi: string;
  explanationDe: string;
}

export interface ExamReadingSession {
  id: string;
  examType: string;
  cefrLevel: string;
  teile: ExamReadingTeil[];
  userAnswers?: Record<string, Record<string, string>>;
  teilScores?: TeilScore[];
  gradingDetails?: Record<string, TeilGradingDetail[]>;
  score?: number;
  totalQuestions: number;
  correctCount: number;
  status: 'DRAFT' | 'GRADED';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamReadingHistoryItem {
  id: string;
  examType: string;
  cefrLevel: string;
  totalQuestions: number;
  correctCount: number;
  score?: number;
  status: string;
  teilScores?: TeilScore[];
  submittedAt?: string;
  createdAt: string;
}

export interface ExamReadingHistoryResponse {
  items: ExamReadingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExamReadingStats {
  total: number;
  graded: number;
  avgScore: number;
  bestScore: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toQS(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ─── API client ───────────────────────────────────────────────────────────────

export const examReadingApi = {
  generateSession: (data: { examType: string; cefrLevel: string }) =>
    apiPost<ExamReadingSession>('/exam-reading/generate', data),

  submitAnswers: (id: string, userAnswers: Record<string, Record<string, string>>) =>
    apiPost<ExamReadingSession>(`/exam-reading/${id}/submit`, { userAnswers }),

  getSession: (id: string) =>
    apiGet<ExamReadingSession>(`/exam-reading/${id}`),

  getHistory: (params?: {
    page?: number; limit?: number; status?: string; examType?: string; cefrLevel?: string;
  }) => apiGet<ExamReadingHistoryResponse>(`/exam-reading/history${toQS(params)}`),

  getStats: () =>
    apiGet<ExamReadingStats>('/exam-reading/stats'),

  deleteSession: (id: string) =>
    api(`/exam-reading/${id}`, { method: 'DELETE' }),
};
