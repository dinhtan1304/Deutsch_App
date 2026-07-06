import { apiGet, apiPost, api } from './client';

// ─── Types (mirror src/modules/mock-exam on the API) ─────────────────────────

export type MockSkill = 'reading' | 'listening' | 'writing' | 'speaking';

export type MockModuleStatus = 'PENDING' | 'ACTIVE' | 'GRADING' | 'DONE';

export interface MockModuleView {
  skill: MockSkill;
  sessionId: string | null;
  status: MockModuleStatus;
  scorePercent: number | null;
}

export interface MockModuleResult {
  skill: MockSkill;
  scorePercent: number;
  pass: boolean;
}

export interface MockExamResult {
  rule: 'PER_MODULE_60' | 'TOTAL_60';
  passThreshold: number;
  modules: MockModuleResult[];
  overallPercent: number;
  overall: 'BESTANDEN' | 'NICHT_BESTANDEN';
  gradeLabel: string | null;
}

export interface MockExamState {
  id: string;
  examType: string;
  cefrLevel: string;
  includeSpeaking: boolean;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  completedAt: string | null;
  result: MockExamResult | null;
  modules: MockModuleView[];
  canAdvance: boolean;
  allGraded: boolean;
}

export interface MockExamHistoryItem {
  id: string;
  examType: string;
  cefrLevel: string;
  includeSpeaking: boolean;
  status: string;
  result: MockExamResult | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface MockExamHistoryResponse {
  items: MockExamHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── API client ───────────────────────────────────────────────────────────────

export const mockExamApi = {
  start: (data: { examType: string; cefrLevel: string; includeSpeaking?: boolean }) =>
    apiPost<MockExamState>('/mock-exam/start', data),

  advance: (id: string) =>
    apiPost<MockExamState>(`/mock-exam/${id}/advance`, {}),

  finish: (id: string) =>
    apiPost<MockExamState>(`/mock-exam/${id}/finish`, {}),

  getState: (id: string) =>
    apiGet<MockExamState>(`/mock-exam/${id}`),

  getHistory: (params?: { page?: number; limit?: number; status?: string }) => {
    const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null);
    const qs = entries.length
      ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
      : '';
    return apiGet<MockExamHistoryResponse>(`/mock-exam/history${qs}`);
  },

  abandon: (id: string) =>
    api(`/mock-exam/${id}`, { method: 'DELETE' }),
};
