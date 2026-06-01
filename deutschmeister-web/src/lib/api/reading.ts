/**
 * Reading Comprehension API Client
 *
 * Endpoints:
 * - GET    /reading/topics?level=A1  → Chủ đề + loại văn bản
 * - POST   /reading/generate         → AI tạo bài đọc
 * - POST   /reading/:id/submit       → Nộp bài + chấm điểm
 * - GET    /reading/history          → Lịch sử
 * - GET    /reading/stats            → Thống kê
 * - GET    /reading/:id              → Chi tiết session
 * - DELETE /reading/:id              → Xóa
 */

import { apiGet, apiPost, apiDelete } from './client';
import type { GradingInsights } from './types/grading-insights';

// ── Types ──

export interface ReadingQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'zuordnung';
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanationVi: string;
  explanationDe: string;
}

export interface VocabHighlight {
  word: string;
  translation: string;
  article?: string; // "der" | "die" | "das" | undefined for non-nouns
}

export interface GradingDetail {
  questionId: string;
  userAnswer: string | undefined;
  correctAnswer: string;
  isCorrect: boolean;
  explanationVi: string;
  explanationDe: string;
}

export interface ReadingSession {
  id: string;
  topic: string;
  cefrLevel: string;
  textType: string;
  title: string;
  passage: string;
  questions: ReadingQuestion[];
  vocabHighlights: VocabHighlight[];
  userAnswers: Record<string, string> | null;
  score: number | null;
  totalQuestions: number;
  correctCount: number;
  gradingDetails: GradingDetail[] | null;
  insights: GradingInsights | null;
  status: 'DRAFT' | 'GRADED';
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string;
}

export interface ReadingHistoryItem {
  id: string;
  topic: string;
  cefrLevel: string;
  textType: string;
  title: string;
  passagePreview: string | null;
  totalQuestions: number;
  correctCount: number;
  score: number | null;
  status: 'DRAFT' | 'GRADED';
  createdAt: string;
  submittedAt: string | null;
}

export interface ReadingHistoryResponse {
  data: ReadingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReadingStats {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  recentScores: number[];
  scoresByLevel: { level: string; averageScore: number; count: number }[];
}

export interface ReadingTopic {
  topic: string;
  labelDe: string;
  labelVi: string;
  icon: string;
}

export interface ReadingTextType {
  value: string;
  labelDe: string;
  labelVi: string;
  icon: string;
  levels: string[];
  description: string;
}

export interface ReadingTopicsResponse {
  topics: ReadingTopic[];
  textTypes: ReadingTextType[];
}

export interface CreateReadingDto {
  cefrLevel: string;
  topic: string;
  textType: string;
  questionCount: number;
}

// ── Helpers ──

function toQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ── API Functions ──

export const readingApi = {
  /** Lấy chủ đề + loại văn bản theo CEFR level */
  getTopics: async (level: string = 'A1'): Promise<ReadingTopicsResponse> => {
    return apiGet<ReadingTopicsResponse>(`/reading/topics${toQueryString({ level })}`);
  },

  /** AI tạo bài đọc mới */
  generateExercise: async (dto: CreateReadingDto): Promise<ReadingSession> => {
    return apiPost<ReadingSession>('/reading/generate', dto);
  },

  /** Nộp bài + chấm điểm tự động */
  submitAnswers: async (id: string, userAnswers: Record<string, string>): Promise<ReadingSession> => {
    return apiPost<ReadingSession>(`/reading/${id}/submit`, { userAnswers });
  },

  /** Lịch sử bài đọc */
  getHistory: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    cefrLevel?: string;
  }): Promise<ReadingHistoryResponse> => {
    return apiGet<ReadingHistoryResponse>(`/reading/history${toQueryString(params)}`);
  },

  /** Thống kê kết quả */
  getStats: async (): Promise<ReadingStats> => {
    return apiGet<ReadingStats>('/reading/stats');
  },

  /** Chi tiết session */
  getSession: async (id: string): Promise<ReadingSession> => {
    return apiGet<ReadingSession>(`/reading/${id}`);
  },

  /** Xóa session */
  deleteSession: async (id: string): Promise<void> => {
    await apiDelete(`/reading/${id}`);
  },
};
