import { apiGet, apiPost, api } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DictationVideo {
  id: string;
  youtubeId: string;
  title: string;
  channelName?: string;
  thumbnailUrl?: string;
  cefrLevel: string;
  topic?: string;
  durationSec: number;
  /** "youtube" = extracted from CC, "ai" = Gemini-transcribed (shadowing only) */
  transcriptSource?: 'youtube' | 'ai';
}

export type Part =
  | { type: 'text'; text: string }
  | { type: 'blank'; blankId: string; displayLength: number }
  | { type: 'blank'; blankId: string; displayLength: number; correctWord: string; isCorrect: boolean; userAnswer: string };

export interface SegmentWithParts {
  id: string;
  start: number;
  end: number;
  parts: Part[];
}

interface DictationSessionBase {
  id: string;
  difficulty: string;
  totalBlanks: number;
  answeredCount: number;
  userAnswers: Record<string, string>;
  video: DictationVideo;
  segments: SegmentWithParts[];
  createdAt: string;
  submittedAt?: string;
}

export interface DictationSessionDraft extends DictationSessionBase {
  status: 'DRAFT';
}

export interface DictationSessionGraded extends DictationSessionBase {
  status: 'GRADED';
  score: number;
  correctBlanks: number;
  gradingDetails: Array<{ blankId: string; userAnswer: string; correctWord: string; isCorrect: boolean }>;
}

export type DictationSession = DictationSessionDraft | DictationSessionGraded;

export type StartFromUrlResponse =
  | { id: string; status: 'DRAFT' }
  | { status: 'QUEUED'; requestId: string; message: string };

export interface MyDictationRequestItem {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  cefrLevel: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  video: { id: string; title: string; thumbnailUrl: string | null; cefrLevel: string } | null;
}

export interface MyDictationRequestsResponse {
  items: MyDictationRequestItem[];
}

export interface DictationHistoryItem {
  id: string;
  difficulty: string;
  totalBlanks: number;
  correctBlanks: number;
  score?: number;
  status: string;
  submittedAt?: string;
  createdAt: string;
  video: Pick<DictationVideo, 'id' | 'youtubeId' | 'title' | 'thumbnailUrl' | 'cefrLevel' | 'topic'>;
}

export interface DictationHistoryResponse {
  items: DictationHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DictationLibraryResponse {
  items: DictationVideo[];
  availableTopics: string[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DictationStats {
  total: number;
  graded: number;
  avgScore: number;
  bestScore: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toQS(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ─── API client ───────────────────────────────────────────────────────────────

export const dictationApi = {
  getLibrary: (params?: { page?: number; limit?: number; cefrLevel?: string; topic?: string }) =>
    apiGet<DictationLibraryResponse>(`/dictation/library${toQS(params)}`),

  getRandom: (params?: { cefrLevel?: string; topic?: string }) =>
    apiGet<DictationVideo>(`/dictation/library/random${toQS(params)}`),

  startSession: (data: { videoId: string }) =>
    apiPost<{ id: string; status: string }>('/dictation/start', data),

  startFromUrl: (data: { youtubeUrl: string; cefrLevel?: string }) =>
    apiPost<StartFromUrlResponse>('/dictation/start-from-url', data),

  getMyRequests: () =>
    apiGet<MyDictationRequestsResponse>('/dictation/my-requests'),

  getSession: (id: string) =>
    apiGet<DictationSession>(`/dictation/session/${id}`),

  saveDraft: (id: string, userAnswers: Record<string, string>) =>
    api(`/dictation/session/${id}/draft`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAnswers }),
    }),

  submitSession: (id: string, userAnswers: Record<string, string>) =>
    apiPost<DictationSession>(`/dictation/session/${id}/submit`, { userAnswers }),

  getHistory: (params?: { page?: number; limit?: number; status?: string; cefrLevel?: string }) =>
    apiGet<DictationHistoryResponse>(`/dictation/history${toQS(params)}`),

  getStats: () =>
    apiGet<DictationStats>('/dictation/stats'),

  deleteSession: (id: string) =>
    api(`/dictation/session/${id}`, { method: 'DELETE' }),
};
