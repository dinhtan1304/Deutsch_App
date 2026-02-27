import { apiGet, apiPost, api } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListeningQuestion {
  id: string;
  questionText: string;
  type: 'richtig_falsch' | 'multiple_choice';
  options?: { id: string; text: string }[];
  correctAnswer: string;
  explanationVi: string;
  explanationDe: string;
}

export interface ListeningSession {
  id: string;
  cefrLevel: string;
  scriptType: string;
  title: string;
  transcript: string;
  questions: ListeningQuestion[];
  userAnswers?: Record<string, string>;
  score?: number;
  correctCount: number;
  totalQ: number;
  status: 'DRAFT' | 'GRADED';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListeningHistoryItem {
  id: string;
  cefrLevel: string;
  scriptType: string;
  title: string;
  score?: number;
  correctCount: number;
  totalQ: number;
  status: string;
  submittedAt?: string;
  createdAt: string;
}

export interface ListeningHistoryResponse {
  items: ListeningHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListeningStats {
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

export const listeningApi = {
  generateSession: (data: { cefrLevel: string; scriptType: string }) =>
    apiPost<ListeningSession>('/listening/generate', data),

  submitAnswers: (id: string, userAnswers: Record<string, string>) =>
    apiPost<ListeningSession>(`/listening/${id}/submit`, { userAnswers }),

  getSession: (id: string) =>
    apiGet<ListeningSession>(`/listening/${id}`),

  getHistory: (params?: { page?: number; limit?: number; cefrLevel?: string; status?: string }) =>
    apiGet<ListeningHistoryResponse>(`/listening/history${toQS(params)}`),

  getStats: () =>
    apiGet<ListeningStats>('/listening/stats'),

  deleteSession: (id: string) =>
    api(`/listening/${id}`, { method: 'DELETE' }),
};
