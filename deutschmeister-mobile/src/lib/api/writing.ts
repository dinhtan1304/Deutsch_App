/**
 * Writing Workshop API Client (Mobile)
 *
 * Endpoints:
 * - GET    /writing/topics?level=A1     -> Topic suggestions
 * - POST   /writing/generate            -> AI generate prompt
 * - PATCH  /writing/:id/draft           -> Save draft
 * - POST   /writing/:id/submit          -> Submit + AI grade
 * - GET    /writing/history             -> History
 * - GET    /writing/stats               -> Stats
 * - GET    /writing/:id                 -> Session detail
 * - DELETE /writing/:id                 -> Delete
 */

import { api, apiGet, apiPost, apiDelete } from './client';

// ── Types ──

export interface WritingTopic {
  topic: string;
  labelDe: string;
  labelVi: string;
  icon: string;
}

export interface WritingType {
  value: string;
  labelDe: string;
  labelVi: string;
  icon: string;
  levels: string[];
}

export interface WordCountSuggestion {
  min: number;
  max: number;
  label: string;
}

export interface TopicSuggestions {
  topics: WritingTopic[];
  writingTypes: WritingType[];
  wordCountSuggestions: WordCountSuggestion[];
}

export interface CreateWritingDto {
  topic: string;
  cefrLevel: string;
  writingType: string;
  wordCountMin: number;
  wordCountMax: number;
}

export interface WritingSession {
  id: string;
  topic: string;
  cefrLevel: string;
  writingType: string;
  wordCountMin: number;
  wordCountMax: number;
  prompt: string;
  vocabHints: string[];
  grammarHints: string[];
  userText: string | null;
  wordCount: number | null;
  overallScore: number | null;
  correctedText: string | null;
  feedbackDe: string | null;
  feedbackVi: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  errors: WritingError[];
  status: 'DRAFT' | 'SUBMITTED' | 'GRADING' | 'GRADED' | 'ERROR';
  createdAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface WritingError {
  id: string;
  errorType: string;
  severity: 'error' | 'warning' | 'suggestion';
  originalText: string;
  correctedText: string;
  explanationDe: string;
  explanationVi: string;
  position: number | null;
}

export interface WritingHistoryItem {
  id: string;
  topic: string;
  cefrLevel: string;
  writingType: string;
  wordCountMin: number;
  wordCountMax: number;
  wordCount: number | null;
  overallScore: number | null;
  errorCount: number;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface WritingHistoryResponse {
  data: WritingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WritingStats {
  totalSessions: number;
  totalErrors: number;
  averageScore: number;
  errorsByType: { errorType: string; count: number; label: { de: string; vi: string } }[];
  errorsBySeverity: { severity: string; count: number }[];
  topErrors: { errorType: string; count: number; label: { de: string; vi: string } }[];
}

// ── Helpers ──

function toQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ── API Functions ──

export const writingApi = {
  getTopicSuggestions: async (level: string = 'A1'): Promise<TopicSuggestions> => {
    return apiGet<TopicSuggestions>(`/writing/topics${toQueryString({ level })}`);
  },

  generatePrompt: async (dto: CreateWritingDto): Promise<WritingSession> => {
    return apiPost<WritingSession>('/writing/generate', dto);
  },

  saveDraft: async (id: string, userText: string): Promise<WritingSession> => {
    return api<WritingSession>(`/writing/${id}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ userText }),
    });
  },

  submitWriting: async (id: string, userText: string): Promise<WritingSession> => {
    return apiPost<WritingSession>(`/writing/${id}/submit`, { userText });
  },

  getHistory: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    cefrLevel?: string;
  }): Promise<WritingHistoryResponse> => {
    return apiGet<WritingHistoryResponse>(`/writing/history${toQueryString(params)}`);
  },

  getStats: async (): Promise<WritingStats> => {
    return apiGet<WritingStats>('/writing/stats');
  },

  getSession: async (id: string): Promise<WritingSession> => {
    return apiGet<WritingSession>(`/writing/${id}`);
  },

  deleteSession: async (id: string): Promise<void> => {
    await apiDelete(`/writing/${id}`);
  },
};
