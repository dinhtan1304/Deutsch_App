import { apiGet, apiPost, api } from './client';
import type { DictationVideo } from './dictation';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShadowingSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface ShadowingAttempt {
  id: string;
  segmentId: string;
  segmentText: string;
  userTranscript?: string | null;
  pronunciationScore?: number | null;
  fluencyScore?: number | null;
  feedback?: string | null;
  attemptCount: number;
  createdAt: string;
}

export interface ShadowingSession {
  id: string;
  status: 'DRAFT' | 'SUBMITTED';
  difficulty: string;
  totalSegments: number;
  completedSegments: number;
  overallScore?: number | null;
  submittedAt?: string | null;
  createdAt: string;
  video: DictationVideo;
  segments: ShadowingSegment[];
  attempts: ShadowingAttempt[];
}

export interface GradeAttemptResponse {
  attemptId: string;
  segmentId: string;
  pronunciationScore: number;
  userTranscript: string;
  feedback: string | null;
  attemptCount: number;
  wordScores: Array<{ word: string; score: number; issue?: string | null }>;
}

export interface ShadowingHistoryItem {
  id: string;
  difficulty: string;
  status: 'DRAFT' | 'SUBMITTED';
  totalSegments: number;
  completedSegments: number;
  overallScore?: number | null;
  submittedAt?: string | null;
  createdAt: string;
  video: Pick<DictationVideo, 'id' | 'youtubeId' | 'title' | 'thumbnailUrl' | 'cefrLevel' | 'topic'>;
}

export interface ShadowingHistoryResponse {
  items: ShadowingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShadowingStats {
  total: number;
  submitted: number;
  avgScore: number;
  bestScore: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ─── API client ───────────────────────────────────────────────────────────────

export const shadowingApi = {
  startSession: (data: { videoId: string; difficulty?: string }) =>
    apiPost<{ id: string; status: 'DRAFT'; totalSegments: number }>('/shadowing/start', data),

  startFromUrl: (data: { youtubeUrl: string; cefrLevel?: string }) =>
    apiPost<{ id: string; status: 'DRAFT'; totalSegments: number }>('/shadowing/start-from-url', data),

  getSession: (id: string) =>
    apiGet<ShadowingSession>(`/shadowing/session/${id}`),

  gradeAttempt: (id: string, data: { segmentId: string; audioBase64: string; mimeType?: string }) =>
    apiPost<GradeAttemptResponse>(`/shadowing/session/${id}/attempt`, data),

  submitSession: (id: string) =>
    apiPost<ShadowingSession>(`/shadowing/session/${id}/submit`, {}),

  getHistory: (params?: { page?: number; limit?: number; status?: string; cefrLevel?: string }) =>
    apiGet<ShadowingHistoryResponse>(`/shadowing/history${toQS(params)}`),

  getStats: () =>
    apiGet<ShadowingStats>('/shadowing/stats'),

  deleteSession: (id: string) =>
    api(`/shadowing/session/${id}`, { method: 'DELETE' }),
};
