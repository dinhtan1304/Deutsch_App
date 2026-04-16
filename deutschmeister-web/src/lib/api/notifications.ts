'use client';

import { apiGet, apiPatch } from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  icon: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  items: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

export interface UnreadCount {
  count: number;
}

export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    apiGet<NotificationsPage>(`/notifications?page=${page}&limit=${limit}`),

  unreadCount: () => apiGet<UnreadCount>('/notifications/unread-count'),

  markRead: (id: string) => apiPatch<{ success: boolean }>(`/notifications/${id}/read`, {}),

  markAllRead: () => apiPatch<{ marked: number }>('/notifications/read-all', {}),
};
