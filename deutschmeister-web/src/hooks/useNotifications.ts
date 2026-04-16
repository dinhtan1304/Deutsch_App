'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type NotificationsPage, type UnreadCount } from '@/lib/api/notifications';

export const notifKeys = {
  all: ['notifications'] as const,
  list: (page: number) => [...notifKeys.all, 'list', page] as const,
  unread: () => [...notifKeys.all, 'unread'] as const,
};

export function useNotifications(page = 1) {
  return useQuery<NotificationsPage>({
    queryKey: notifKeys.list(page),
    queryFn: () => notificationsApi.list(page),
    staleTime: 30 * 1000,
  });
}

export function useUnreadCount() {
  return useQuery<UnreadCount>({
    queryKey: notifKeys.unread(),
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all });
    },
  });
}
