/**
 * Writing Workshop React Query Hooks
 *
 * Queries: topics, history, stats, session detail
 * Mutations: generate prompt, save draft, submit & grade, delete
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  writingApi,
  CreateWritingDto,
  WritingSession,
  WritingHistoryResponse,
  WritingStats,
  TopicSuggestions,
} from '@/lib/api/writing';

// ── Query Keys ──

export const writingKeys = {
  all: ['writing'] as const,
  topics: (level: string) => [...writingKeys.all, 'topics', level] as const,
  history: (params?: Record<string, any>) => [...writingKeys.all, 'history', params] as const,
  stats: () => [...writingKeys.all, 'stats'] as const,
  session: (id: string) => [...writingKeys.all, 'session', id] as const,
};

// ── Queries ──

/** Lấy gợi ý chủ đề + dạng bài theo level */
export function useWritingTopics(level: string = 'A1') {
  return useQuery<TopicSuggestions>({
    queryKey: writingKeys.topics(level),
    queryFn: () => writingApi.getTopicSuggestions(level),
    staleTime: 30 * 60 * 1000, // 30 phút (data tĩnh)
  });
}

/** Lịch sử bài viết (phân trang) */
export function useWritingHistory(params?: {
  page?: number;
  limit?: number;
  status?: string;
  cefrLevel?: string;
}) {
  return useQuery<WritingHistoryResponse>({
    queryKey: writingKeys.history(params),
    queryFn: () => writingApi.getHistory(params),
  });
}

/** Thống kê lỗi */
export function useWritingStats() {
  return useQuery<WritingStats>({
    queryKey: writingKeys.stats(),
    queryFn: () => writingApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Chi tiết session */
export function useWritingSession(id: string) {
  return useQuery<WritingSession>({
    queryKey: writingKeys.session(id),
    queryFn: () => writingApi.getSession(id),
    enabled: !!id,
  });
}

// ── Mutations ──

/** AI tạo đề bài mới */
export function useGeneratePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateWritingDto) => writingApi.generatePrompt(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: writingKeys.history() });
    },
  });
}

/** Lưu nháp */
export function useSaveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userText }: { id: string; userText: string }) =>
      writingApi.saveDraft(id, userText),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: writingKeys.session(id) });
    },
  });
}

/** Nộp bài + AI chấm */
export function useSubmitWriting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userText }: { id: string; userText: string }) =>
      writingApi.submitWriting(id, userText),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: writingKeys.session(id) });
      queryClient.invalidateQueries({ queryKey: writingKeys.history() });
      queryClient.invalidateQueries({ queryKey: writingKeys.stats() });
    },
  });
}

/** Xóa session */
export function useDeleteWriting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => writingApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: writingKeys.history() });
      queryClient.invalidateQueries({ queryKey: writingKeys.stats() });
    },
  });
}
