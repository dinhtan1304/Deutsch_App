'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminApi, adminWordApi, adminFeedbackApi, adminDictationRequestApi,
  AdminStats, AdminUserListResponse, AdminUserDetail, CreateWordPayload,
  AdminFeedbackListResponse, AdminTokenStats,
  AdminDictationRequestListResponse, AdminDictationRequest, ApproveRequestPayload,
  adminVideoApi, AdminVideoListResponse, UpdateVideoPayload,
} from '@/lib/api/admin';
import type { FeedbackThread, PostMessagePayload } from '@/lib/api/feedback';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  tokenStats: () => [...adminKeys.all, 'token-stats'] as const,
  users: (params?: Record<string, unknown>) => [...adminKeys.all, 'users', params] as const,
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
  list: (params?: Record<string, unknown>) => [...adminFeedbackKeys.all, 'list', params] as const,
  thread: (id: string) => [...adminFeedbackKeys.all, 'thread', id] as const,
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

export function useAdminFeedbackThread(id: string | null, open: boolean) {
  return useQuery<FeedbackThread>({
    queryKey: adminFeedbackKeys.thread(id ?? ''),
    queryFn: () => adminFeedbackApi.getThread(id!),
    enabled: !!id && open,
    refetchInterval: id && open ? 15_000 : false,
  });
}

export function useSendAdminFeedbackMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PostMessagePayload) => adminFeedbackApi.sendMessage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminFeedbackKeys.thread(id) });
      queryClient.invalidateQueries({ queryKey: adminFeedbackKeys.all });
    },
  });
}

// ─── Dictation video requests (admin moderation queue) ───────────────────────

export const adminDictationKeys = {
  all: ['admin-dictation-requests'] as const,
  list: (params?: Record<string, unknown>) => [...adminDictationKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminDictationKeys.all, id] as const,
};

export function useAdminDictationRequests(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery<AdminDictationRequestListResponse>({
    queryKey: adminDictationKeys.list(params),
    queryFn: () => adminDictationRequestApi.getAll(params),
  });
}

export function useAdminDictationRequest(id: string) {
  return useQuery<AdminDictationRequest>({
    queryKey: adminDictationKeys.detail(id),
    queryFn: () => adminDictationRequestApi.getOne(id),
    enabled: !!id,
  });
}

export function useApproveDictationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveRequestPayload }) =>
      adminDictationRequestApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminDictationKeys.all });
    },
  });
}

export function useRejectDictationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminDictationRequestApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminDictationKeys.all });
    },
  });
}

// ─── Words (admin CRUD) ───────────────────────────────────────────────────────

export const adminWordKeys = {
  all: ['admin-words'] as const,
  list: (params?: Record<string, unknown>) => [...adminWordKeys.all, 'list', params] as const,
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

// ─── Video library (admin) ────────────────────────────────────────────────────

export const adminVideoKeys = {
  all: ['admin-videos'] as const,
  list: (params?: Record<string, unknown>) => [...adminVideoKeys.all, 'list', params] as const,
};

export function useAdminVideos(params?: {
  search?: string; cefrLevel?: string; topic?: string;
  isActive?: string; transcriptSource?: string; page?: number; limit?: number;
}) {
  return useQuery<AdminVideoListResponse>({
    queryKey: adminVideoKeys.list(params),
    queryFn: () => adminVideoApi.getAll(params),
  });
}

export function useUpdateAdminVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVideoPayload }) =>
      adminVideoApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminVideoKeys.all });
    },
  });
}

export function useDeleteAdminVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminVideoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminVideoKeys.all });
    },
  });
}

export function useRenormalizeAdminVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminVideoApi.renormalize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminVideoKeys.all });
    },
  });
}
