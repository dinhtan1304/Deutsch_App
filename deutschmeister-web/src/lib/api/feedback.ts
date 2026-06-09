import { apiGet, apiPost } from './client';

export type FeedbackType = 'bug' | 'suggestion' | 'other';
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved';

export interface SubmitFeedbackPayload {
  type: FeedbackType;
  content: string;
  pageUrl?: string;
  imageUrls?: string[];
}

export interface FeedbackMessageItem {
  id: string;
  feedbackId: string;
  senderRole: 'user' | 'admin';
  senderId: string | null;
  content: string;
  imageUrls: string[];
  createdAt: string;
}

/** A feedback item the current user owns, as shown in the chat widget list. */
export interface MyFeedbackListItem {
  id: string;
  type: FeedbackType;
  content: string;
  status: FeedbackStatus;
  createdAt: string;
  lastMessageAt: string | null;
  userUnread: number;
  imageUrls: string[];
  messageCount: number;
}

/** Full thread: the original report (content/imageUrls) + follow-up messages. */
export interface FeedbackThread {
  id: string;
  type: FeedbackType;
  content: string;
  status: FeedbackStatus;
  pageUrl: string | null;
  imageUrls: string[];
  createdAt: string;
  userUnread: number;
  adminUnread: number;
  messages: FeedbackMessageItem[];
}

export interface PostMessagePayload {
  content: string;
  imageUrls?: string[];
}

export const feedbackApi = {
  submit: (payload: SubmitFeedbackPayload) =>
    apiPost<{ success: boolean }>('/feedback', payload),

  // ─── My feedback conversations (chat widget) ──────────────────────────────
  myList: () => apiGet<{ items: MyFeedbackListItem[] }>('/feedback/my'),

  myUnreadCount: () => apiGet<{ count: number }>('/feedback/my/unread-count'),

  getMyThread: (id: string) => apiGet<FeedbackThread>(`/feedback/my/${id}/messages`),

  sendMyMessage: (id: string, payload: PostMessagePayload) =>
    apiPost<FeedbackMessageItem>(`/feedback/my/${id}/messages`, payload),
};
