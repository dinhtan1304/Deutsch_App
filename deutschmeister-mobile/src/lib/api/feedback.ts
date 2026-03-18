import { apiPost } from './client';

export type FeedbackType = 'bug' | 'suggestion' | 'other';

export interface SubmitFeedbackPayload {
  type: FeedbackType;
  content: string;
  pageUrl?: string;
}

export const feedbackApi = {
  submit: (payload: SubmitFeedbackPayload) =>
    apiPost<{ success: boolean }>('/feedback', payload),
};
