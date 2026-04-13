import { apiGet, apiPost, apiDelete } from './client';

export type RoleplayLevel = 'A1' | 'A2' | 'B1';
export type RoleplayStatus = 'active' | 'completed';

export interface RoleplayScenario {
  code: string;
  level: RoleplayLevel;
  titleDe: string;
  titleVi: string;
  descriptionVi: string;
  icon: string;
  aiRole: string;
  context: string;
  tips: string[];
}

export interface RoleplayScenarioInfo {
  titleDe: string;
  titleVi: string;
  descriptionVi?: string;
  icon: string;
  tips?: string[];
}

export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  translationVi?: string;
  timestamp: string;
}

export interface RoleplayFeedback {
  overallScore: number;
  grammarScore: number;
  vocabScore: number;
  fluencyScore: number;
  strengths: string[];
  improvements: string[];
  corrections: {
    original: string;
    corrected: string;
    explanationVi: string;
  }[];
  feedbackVi: string;
}

export interface RoleplaySession {
  id: string;
  scenario: string;
  scenarioInfo: RoleplayScenarioInfo | null;
  level: RoleplayLevel;
  status: RoleplayStatus;
  messages: ChatMessage[];
  aiFeedback: RoleplayFeedback | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleplayHistoryItem {
  id: string;
  scenario: string;
  scenarioInfo: { titleDe: string; titleVi: string; icon: string } | null;
  level: RoleplayLevel;
  status: RoleplayStatus;
  overallScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleplayHistoryResponse {
  data: RoleplayHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  sessionId: string;
}

export const roleplayApi = {
  getScenarios: (level?: RoleplayLevel) =>
    apiGet<RoleplayScenario[]>(
      level ? `/roleplay/scenarios?level=${level}` : '/roleplay/scenarios',
    ),

  startSession: (scenario: string, level: RoleplayLevel) =>
    apiPost<RoleplaySession>('/roleplay/start', { scenario, level }),

  sendMessage: (sessionId: string, text: string) =>
    apiPost<SendMessageResponse>(`/roleplay/${sessionId}/message`, { text }),

  endSession: (sessionId: string) =>
    apiPost<RoleplaySession>(`/roleplay/${sessionId}/end`),

  getSession: (sessionId: string) =>
    apiGet<RoleplaySession>(`/roleplay/${sessionId}`),

  getHistory: (params?: { page?: number; limit?: number; status?: RoleplayStatus }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return apiGet<RoleplayHistoryResponse>(`/roleplay/history${q ? `?${q}` : ''}`);
  },

  deleteSession: (sessionId: string) =>
    apiDelete<{ message: string }>(`/roleplay/${sessionId}`),
};
