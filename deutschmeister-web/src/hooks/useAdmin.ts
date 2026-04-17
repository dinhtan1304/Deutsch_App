'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminApi, adminWordApi, adminFeedbackApi,
  AdminStats, AdminUserListResponse, AdminUserDetail, AdminWordItem, CreateWordPayload,
  AdminFeedbackListResponse, AdminTokenStats,
} from '@/lib/api/admin';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  tokenStats: () => [...adminKeys.all, 'token-stats'] as const,
  users: (params?: Record<string, any>) => [...adminKeys.all, 'users', params] as const,
  user: (id: string) => [...adminKeys.all, 'users', id] as const,
};

// ─── Admin stats ──────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: adminKeys.stats(),
    queryFn: () => adminApi.getStats(),
    staleTime: 30_000,
  });
}

export function useAdminTokenStats() {
  return useQuery<AdminTokenStats>({
    queryKey: adminKeys.tokenStats(),
    queryFn: () => adminApi.getTokenStats(),
    staleTime: 30_000,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useAdminUsers(params?: { search?: string; role?: string; isActive?: string; plan?: string; page?: number; limit?: number }) {
  return useQuery<AdminUserListResponse>({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.getUsers(params),
  });
}

export function useAdminUser(id: string) {
  return useQuery<AdminUserDetail>({
    queryKey: adminKeys.user(id),
    queryFn: () => adminApi.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; role?: string; isActive?: boolean } }) =>
      adminApi.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export const adminFeedbackKeys = {
  all: ['admin-feedback'] as const,
  list: (params?: Record<string, any>) => [...adminFeedbackKeys.all, 'list', params] as const,
};

export function useAdminFeedback(params?: { status?: string; type?: string; page?: number }) {
  return useQuery<AdminFeedbackListResponse>({
    queryKey: adminFeedbackKeys.list(params),
    queryFn: () => adminFeedbackApi.getAll(params),
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'reviewed' | 'resolved' }) =>
      adminFeedbackApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminFeedbackKeys.all });
    },
  });
}

// ─── Words (admin CRUD) ───────────────────────────────────────────────────────

export const adminWordKeys = {
  all: ['admin-words'] as const,
  list: (params?: Record<string, any>) => [...adminWordKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminWordKeys.all, id] as const,
};

export function useCreateWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWordPayload) => adminWordApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminWordKeys.all });
    },
  });
}

export function useUpdateWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWordPayload> }) =>
      adminWordApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminWordKeys.all });
      queryClient.invalidateQueries({ queryKey: adminWordKeys.detail(id) });
    },
  });
}

export function useDeleteWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminWordApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminWordKeys.all });
    },
  });
}
