'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  feedbackApi,
  type MyFeedbackListItem,
  type FeedbackThread,
  type PostMessagePayload,
} from '@/lib/api/feedback';

export const feedbackChatKeys = {
  all: ['feedback-chat'] as const,
  list: () => [...feedbackChatKeys.all, 'list'] as const,
  unread: () => [...feedbackChatKeys.all, 'unread'] as const,
  thread: (id: string) => [...feedbackChatKeys.all, 'thread', id] as const,
};

/** The user's feedback conversations, newest activity first. */
export function useMyFeedbackList(enabled = true) {
  return useQuery<{ items: MyFeedbackListItem[] }>({
    queryKey: feedbackChatKeys.list(),
    queryFn: () => feedbackApi.myList(),
    enabled,
    staleTime: 30 * 1000,
  });
}

/** Unread admin-reply count for the floating widget badge. Polls every 60s. */
export function useMyFeedbackUnread(enabled = true) {
  return useQuery<{ count: number }>({
    queryKey: feedbackChatKeys.unread(),
    queryFn: () => feedbackApi.myUnreadCount(),
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: enabled ? 60 * 1000 : false,
  });
}

/**
 * Full thread for one feedback item. While the panel is open we poll every 15s
 * so admin replies surface in near-real-time without a socket connection.
 * Fetching marks the thread read (userUnread → 0) server-side.
 */
export function useMyFeedbackThread(id: string | null, open: boolean) {
  return useQuery<FeedbackThread>({
    queryKey: feedbackChatKeys.thread(id ?? ''),
    queryFn: () => feedbackApi.getMyThread(id!),
    enabled: !!id && open,
    refetchInterval: id && open ? 15 * 1000 : false,
  });
}

export function useSendMyFeedbackMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PostMessagePayload) => feedbackApi.sendMyMessage(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedbackChatKeys.thread(id) });
      qc.invalidateQueries({ queryKey: feedbackChatKeys.list() });
      qc.invalidateQueries({ queryKey: feedbackChatKeys.unread() });
    },
  });
}
