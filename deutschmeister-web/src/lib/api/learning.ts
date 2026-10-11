import { apiGet, apiPost } from './client';

export interface LearningStep {
  id: string;
  kind: string;
  href: string;
  minutes: number;
  count?: number;
}
export interface LearningSession {
  id: string;
  sessionKey: string;
  steps: LearningStep[];
  completed: string[];
  createdAt: string;
}
export interface ErrorCard {
  id: string;
  sourceId: string;
  errorType: string;
  originalText: string;
  correctedText: string;
  explanationDe: string;
  explanationVi: string;
  repetitions: number;
  nextReviewAt: string;
}
export interface ErrorNotebook {
  cards: ErrorCard[];
  total: number;
  due: number;
}
export const learningApi = {
  today: () => apiGet<LearningSession>('/learning/today'),
  session: (id: string) =>
    apiGet<LearningSession>(`/learning/sessions/${encodeURIComponent(id)}`),
  pack: (id: string) =>
    apiPost<LearningSession>(`/learning/packs/${encodeURIComponent(id)}`, {}),
  complete: (id: string, stepId: string) =>
    apiPost<LearningSession>(
      `/learning/sessions/${encodeURIComponent(id)}/complete`,
      { stepId },
    ),
  errors: (all = false) => apiGet<ErrorNotebook>(`/learning/errors?all=${all}`),
  review: (id: string, answer: string, requestId: string) =>
    apiPost<{ card: ErrorCard; correct: boolean }>(
      `/learning/errors/${encodeURIComponent(id)}/review`,
      { answer, requestId },
    ),
};
