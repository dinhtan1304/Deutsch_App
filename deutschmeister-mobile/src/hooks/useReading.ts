/**
 * Reading Comprehension React Query Hooks
 *
 * Queries: topics, history, stats, session detail
 * Mutations: generate exercise, submit answers, delete
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  readingApi,
  CreateReadingDto,
  ReadingSession,
  ReadingHistoryResponse,
  ReadingStats,
  ReadingTopicsResponse,
} from '@/lib/api/reading';

// ── Query Keys ──

export const readingKeys = {
  all: ['reading'] as const,
  topics: (level: string) => [...readingKeys.all, 'topics', level] as const,
  history: (params?: Record<string, any>) => [...readingKeys.all, 'history', params] as const,
  stats: () => [...readingKeys.all, 'stats'] as const,
  session: (id: string) => [...readingKeys.all, 'session', id] as const,
};

// ── Queries ──

/** Lấy chủ đề + loại văn bản theo level */
export function useReadingTopics(level: string = 'A1') {
  return useQuery<ReadingTopicsResponse>({
    queryKey: readingKeys.topics(level),
    queryFn: () => readingApi.getTopics(level),
    staleTime: 30 * 60 * 1000,
  });
}

/** Lịch sử bài đọc (phân trang) */
export function useReadingHistory(params?: {
  page?: number;
  limit?: number;
  status?: string;
  cefrLevel?: string;
}) {
  return useQuery<ReadingHistoryResponse>({
    queryKey: readingKeys.history(params),
    queryFn: () => readingApi.getHistory(params),
  });
}

/** Thống kê kết quả */
export function useReadingStats() {
  return useQuery<ReadingStats>({
    queryKey: readingKeys.stats(),
    queryFn: () => readingApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Chi tiết session */
export function useReadingSession(id: string) {
  return useQuery<ReadingSession>({
    queryKey: readingKeys.session(id),
    queryFn: () => readingApi.getSession(id),
    enabled: !!id,
  });
}

// ── Mutations ──

/** AI tạo bài đọc mới */
export function useGenerateReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateReadingDto) => readingApi.generateExercise(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingKeys.history() });
    },
  });
}

/** Nộp bài + chấm điểm */
export function useSubmitReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userAnswers }: { id: string; userAnswers: Record<string, string> }) =>
      readingApi.submitAnswers(id, userAnswers),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: readingKeys.session(id) });
      queryClient.invalidateQueries({ queryKey: readingKeys.history() });
      queryClient.invalidateQueries({ queryKey: readingKeys.stats() });
    },
  });
}

/** Xóa session */
export function useDeleteReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => readingApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingKeys.history() });
      queryClient.invalidateQueries({ queryKey: readingKeys.stats() });
    },
  });
}
