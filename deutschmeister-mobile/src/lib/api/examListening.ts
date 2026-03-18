import { apiGet, apiPost, api } from './client';

// --- Types ---

export interface ExamListeningText {
  id: string;
  label?: string;
  type: string;
  title?: string;
  content: string;
  speakers?: string[];
}

export interface ExamListeningQuestion {
  id: string;
  questionText: string;
  options?: { id: string; text: string }[];
  correctAnswer: string;
  explanationVi: string;
  explanationDe: string;
}

export interface ExamListeningTeil {
  number: number;
  taskType: 'richtig_falsch' | 'multiple_choice' | 'zuordnung';
  instruction: string;
  playCount: number;
  maxPoints: number;
  texts: ExamListeningText[];
  questions: ExamListeningQuestion[];
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

export interface ExamListeningSession {
  id: string;
  examType: string;
  cefrLevel: string;
  teile: ExamListeningTeil[];
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

export interface ExamListeningHistoryItem {
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

export interface ExamListeningHistoryResponse {
  items: ExamListeningHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExamListeningStats {
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

// --- API ---

export const examListeningApi = {
  generateSession: (data: { examType: string; cefrLevel: string }) =>
    apiPost<ExamListeningSession>('/exam-listening/generate', data),

  submitAnswers: (id: string, userAnswers: Record<string, Record<string, string>>) =>
    apiPost<ExamListeningSession>(`/exam-listening/${id}/submit`, { userAnswers }),

  getSession: (id: string) =>
    apiGet<ExamListeningSession>(`/exam-listening/${id}`),

  getHistory: (params?: { page?: number; limit?: number; status?: string; examType?: string; cefrLevel?: string }) =>
    apiGet<ExamListeningHistoryResponse>(`/exam-listening/history${toQS(params)}`),

  getStats: () =>
    apiGet<ExamListeningStats>('/exam-listening/stats'),

  deleteSession: (id: string) =>
    api(`/exam-listening/${id}`, { method: 'DELETE' }),
};
