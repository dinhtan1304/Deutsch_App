/**
 * Writing Workshop API Client
 *
 * Endpoints:
 * - GET    /writing/topics?level=A1     → Gợi ý chủ đề
 * - POST   /writing/generate            → AI tạo đề bài
 * - PATCH  /writing/:id/draft           → Lưu nháp
 * - POST   /writing/:id/submit          → Nộp + AI chấm
 * - GET    /writing/history             → Lịch sử
 * - GET    /writing/stats               → Thống kê lỗi
 * - GET    /writing/:id                 → Chi tiết session
 * - DELETE /writing/:id                 → Xóa
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

export interface CriterionScores {
  aufgabenerfuellung: number;
  grammatik: number;
  wortschatz: number;
  kohaerenz: number;
}

import type { GradingInsights } from './types/grading-insights';

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
  criterionScores: CriterionScores | null;
  correctedText: string | null;
  feedbackDe: string | null;
  feedbackVi: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  insights: GradingInsights | null;
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

export interface GrammarComponent {
  text: string;
  role: string;
  roleVi: string;
  case?: string;
  caseVi?: string;
  noteVi: string;
}

export interface GrammarRule {
  rule: string;
  ruleVi: string;
}

export interface GrammarAnalysis {
  sentence: string;
  correctedSentence: string;
  hasErrors: boolean;
  tense: string;
  tenseVi: string;
  sentenceType: string;
  sentenceTypeVi: string;
  components: GrammarComponent[];
  explanationVi: string;
  grammarRules: GrammarRule[];
  tipVi: string;
}

export interface ExplainErrorResponse {
  errorId: string;
  originalText: string;
  correctedText: string;
  errorType: string;
  analysis: GrammarAnalysis;
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

/** Build query string from params object */
function toQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ── API Functions ──

export const writingApi = {
  /** Lấy gợi ý chủ đề + dạng bài theo level */
  getTopicSuggestions: async (level: string = 'A1'): Promise<TopicSuggestions> => {
    return apiGet<TopicSuggestions>(`/writing/topics${toQueryString({ level })}`);
  },

  /** AI tạo đề bài mới */
  generatePrompt: async (dto: CreateWritingDto): Promise<WritingSession> => {
    return apiPost<WritingSession>('/writing/generate', dto);
  },

  /** Lưu nháp (PATCH — dùng api() vì client không export apiPatch) */
  saveDraft: async (id: string, userText: string): Promise<WritingSession> => {
    return api<WritingSession>(`/writing/${id}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ userText }),
    });
  },

  /** Nộp bài + AI chấm */
  submitWriting: async (id: string, userText: string): Promise<WritingSession> => {
    return apiPost<WritingSession>(`/writing/${id}/submit`, { userText });
  },

  /** Lịch sử bài viết */
  getHistory: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    cefrLevel?: string;
  }): Promise<WritingHistoryResponse> => {
    return apiGet<WritingHistoryResponse>(`/writing/history${toQueryString(params)}`);
  },

  /** Thống kê lỗi */
  getStats: async (): Promise<WritingStats> => {
    return apiGet<WritingStats>('/writing/stats');
  },

  /** Chi tiết session */
  getSession: async (id: string): Promise<WritingSession> => {
    return apiGet<WritingSession>(`/writing/${id}`);
  },

  /** Xóa session */
  deleteSession: async (id: string): Promise<void> => {
    await apiDelete(`/writing/${id}`);
  },

  /** AI giải thích lỗi chi tiết (Premium) */
  explainError: async (sessionId: string, errorId: string): Promise<ExplainErrorResponse> => {
    return apiPost<ExplainErrorResponse>(`/writing/${sessionId}/explain-error`, { errorId });
  },
};