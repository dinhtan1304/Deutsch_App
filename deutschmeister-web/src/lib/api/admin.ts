'use client';

import { apiGet, apiPost, apiDelete, api } from './client';
import type { FeedbackThread, FeedbackMessageItem, PostMessagePayload } from './feedback';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeatureStat {
  total: number;
  today: number;
  week: number;
  isAi: boolean;
}

export interface AdminStats {
  // Users
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  premiumUsers: number;
  // Content
  totalWords: number;
  totalTopics: number;
  totalGrammarLessons: number;
  // Traffic
  sessionsToday: number;
  sessionsThisWeek: number;
  sessionsAllTime: number;
  // AI usage
  aiSessionsAllTime: number;
  aiSessionsToday: number;
  aiSessionsWeek: number;
  avgScore: number;
  // Per-feature
  features: {
    writing: FeatureStat;
    reading: FeatureStat;
    listening: FeatureStat;
    examReading: FeatureStat;
    examWriting: FeatureStat;
    examListening: FeatureStat;
    examSpeaking: FeatureStat;
    freeSpeaking: FeatureStat;
  };
}

// ─── Token Usage Types ───────────────────────────────────────────────────────

export interface TokenTotals {
  allTime: { calls: number; promptTokens: number; candidatesTokens: number; totalTokens: number };
  today: { calls: number; totalTokens: number };
  week: { calls: number; totalTokens: number };
  month: { calls: number; totalTokens: number };
}

export interface TokenByFeature {
  feature: string;
  calls: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface TokenDaily {
  day: string;
  tokens: number;
  calls: number;
}

export interface TokenTopUser {
  userId: string;
  email: string | null;
  name: string | null;
  calls: number;
  totalTokens: number;
}

export interface AdminTokenStats {
  totals: TokenTotals;
  byFeature: TokenByFeature[];
  daily: TokenDaily[];
  topUsers: TokenTopUser[];
}

export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subscription?: { plan: string; status: string; expiresAt: string | null } | null;
}

export interface AdminUserAiUsageFeature {
  feature: string;
  calls: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  lastUsedAt: string;
}

export interface AdminUserAiUsage {
  totals: {
    calls: number;
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
    lastUsedAt: string | null;
  };
  byFeature: AdminUserAiUsageFeature[];
}

export interface AdminUserDetail extends AdminUserItem {
  stats: {
    totalSessions: number;
    writing: number;
    reading: number;
    listening: number;
    examReading: number;
    examWriting: number;
    examListening: number;
    examSpeaking: number;
    freeSpeaking: number;
    avgScore: number;
  };
  aiUsage: AdminUserAiUsage;
}

export interface AdminUserListResponse {
  items: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminWordItem {
  id: string;
  word: string;
  article: string;
  gender: string;
  plural: string | null;
  pronunciation: string | null;
  imageUrl: string | null;
  translationEn: string;
  translationVi: string | null;
  category: string;
  level: string;
  frequency: number;
  examples: string[];
  tips: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWordPayload {
  word: string;
  article: string;
  gender: string;
  plural?: string;
  pronunciation?: string;
  imageUrl?: string;
  translationEn: string;
  translationVi?: string;
  category: string;
  level: string;
  frequency?: number;
  examples?: string[];
  tips?: string[];
}

function toQS(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ─── Admin User API ───────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () =>
    apiGet<AdminStats>('/admin/stats'),

  getUsers: (params?: { search?: string; role?: string; isActive?: string; plan?: string; page?: number; limit?: number }) =>
    apiGet<AdminUserListResponse>(`/admin/users${toQS(params)}`),

  getUser: (id: string) =>
    apiGet<AdminUserDetail>(`/admin/users/${id}`),

  updateUser: (id: string, data: { name?: string; role?: string; isActive?: boolean }) =>
    api<AdminUserItem>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteUser: (id: string) =>
    apiDelete<{ success: boolean }>(`/admin/users/${id}`),

  getTokenStats: () =>
    apiGet<AdminTokenStats>('/admin/token-stats'),
};

// ─── Admin Word API ───────────────────────────────────────────────────────────

export const adminWordApi = {
  create: (data: CreateWordPayload) =>
    apiPost<AdminWordItem>('/words', data),

  update: (id: string, data: Partial<CreateWordPayload>) =>
    api<AdminWordItem>(`/words/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    api<{ success: boolean }>(`/words/${id}`, { method: 'DELETE' }),
};

// ─── Admin Feedback API ──────────────────────────────────────────────────────

export interface AdminFeedbackItem {
  id: string;
  type: 'bug' | 'suggestion' | 'other';
  content: string;
  pageUrl: string | null;
  imageUrls: string[];
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
  adminUnread: number;
  messageCount: number;
  user: { id: string; email: string; name: string | null } | null;
}

export interface AdminFeedbackListResponse {
  items: AdminFeedbackItem[];
  total: number;
  page: number;
  totalPages: number;
}

export const adminFeedbackApi = {
  getAll: (params?: { status?: string; type?: string; page?: number }) =>
    apiGet<AdminFeedbackListResponse>(`/feedback/admin${toQS(params)}`),

  updateStatus: (id: string, status: 'new' | 'reviewed' | 'resolved') =>
    api<{ success: boolean }>(`/feedback/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getThread: (id: string) => apiGet<FeedbackThread>(`/feedback/admin/${id}/messages`),

  sendMessage: (id: string, payload: PostMessagePayload) =>
    apiPost<FeedbackMessageItem>(`/feedback/admin/${id}/messages`, payload),
};

// ─── Admin Grammar API ────────────────────────────────────────────────────────

export interface CreateGrammarLessonPayload {
  slug: string;
  level: string;
  lessonNumber: number;
  titleDe: string;
  titleEn: string;
  titleVi: string;
  objectives: Record<string, any>;
  theoryContent: Record<string, any>;
  estimatedMinutes?: number;
  order?: number;
  isActive?: boolean;
}

export interface AdminGrammarLessonItem {
  id: string;
  slug: string;
  level: string;
  lessonNumber: number;
  titleDe: string;
  titleEn: string;
  titleVi: string;
  estimatedMinutes: number;
  exerciseCount: number;
  isActive: boolean;
}

export interface AdminGrammarLessonListResponse {
  items: AdminGrammarLessonItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminGrammarApi = {
  createLesson: (data: CreateGrammarLessonPayload) =>
    apiPost<{ id: string }>('/grammar/lessons', data),

  getLessons: (params?: { level?: string; page?: number; limit?: number }) =>
    apiGet<AdminGrammarLessonListResponse>(`/grammar/admin/lessons${toQS(params)}`),

  getLessonById: <T = any>(id: string) =>
    apiGet<T>(`/grammar/admin/lessons/${id}`),

  updateLesson: (id: string, data: Partial<CreateGrammarLessonPayload>) =>
    api<{ id: string }>(`/grammar/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteLesson: (id: string) =>
    api<{ success: boolean }>(`/grammar/lessons/${id}`, { method: 'DELETE' }),
};

// ─── Admin Dictation Requests API ─────────────────────────────────────────────

export interface AdminDictationRequest {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  cefrLevel: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; name: string | null };
  reviewer: { id: string; name: string | null } | null;
  video: { id: string; title: string; thumbnailUrl: string | null; isActive: boolean } | null;
}

export interface AdminDictationRequestListResponse {
  items: AdminDictationRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApproveRequestPayload {
  cefrLevel?: 'A1' | 'A2' | 'B1';
  topic?: string;
  addToLibrary?: boolean;
}

export const adminDictationRequestApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    apiGet<AdminDictationRequestListResponse>(`/admin/dictation-requests${toQS(params)}`),

  getOne: (id: string) =>
    apiGet<AdminDictationRequest>(`/admin/dictation-requests/${id}`),

  approve: (id: string, data: ApproveRequestPayload) =>
    apiPost<{ request: AdminDictationRequest; video: { id: string; title: string } }>(
      `/admin/dictation-requests/${id}/approve`, data,
    ),

  reject: (id: string, reason: string) =>
    apiPost<AdminDictationRequest>(`/admin/dictation-requests/${id}/reject`, { reason }),
};
