import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTopics,
  getTopic,
  getTopicsStats,
  getUserTopicsProgress,
  updateTopicProgress,
  createTopic,
  updateTopic,
  deleteTopic,
  addWordsToTopic,
  removeWordsFromTopic,
} from '@/lib/api/topics';
import type { TopicsQueryParams, Topic } from '@/types/topic';

// ============================================
// Query Keys
// ============================================

export const topicsKeys = {
  all: ['topics'] as const,
  lists: () => [...topicsKeys.all, 'list'] as const,
  list: (params?: TopicsQueryParams) => [...topicsKeys.lists(), params] as const,
  details: () => [...topicsKeys.all, 'detail'] as const,
  detail: (idOrSlug: string) => [...topicsKeys.details(), idOrSlug] as const,
  stats: () => [...topicsKeys.all, 'stats'] as const,
  progress: () => [...topicsKeys.all, 'progress'] as const,
};

// Dashboard keys (for invalidation)
export const dashboardKeys = {
  all: ['dashboard'] as const,
  full: () => [...dashboardKeys.all, 'full'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  topics: () => [...dashboardKeys.all, 'topics'] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Hook lấy danh sách topics
 */
export function useTopics(params?: TopicsQueryParams) {
  return useQuery({
    queryKey: topicsKeys.list(params),
    queryFn: () => getTopics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook lấy chi tiết topic
 */
export function useTopic(idOrSlug: string, includeWords = true) {
  return useQuery({
    queryKey: topicsKeys.detail(idOrSlug),
    queryFn: () => getTopic(idOrSlug, includeWords),
    enabled: !!idOrSlug,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook lấy thống kê topics
 */
export function useTopicsStats() {
  return useQuery({
    queryKey: topicsKeys.stats(),
    queryFn: getTopicsStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook lấy progress của user
 * Pass enabled=false (or isAuthenticated) to skip when not logged in
 * and avoid a wasted 401 request.
 */
export function useUserTopicsProgress(enabled = true) {
  return useQuery({
    queryKey: topicsKeys.progress(),
    queryFn: getUserTopicsProgress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Hook cập nhật progress - INVALIDATES DASHBOARD TOO
 */
export function useUpdateTopicProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, wordsLearned }: { topicId: string; wordsLearned: number }) =>
      updateTopicProgress(topicId, wordsLearned),
    onSuccess: () => {
      // Invalidate topics progress
      queryClient.invalidateQueries({ queryKey: topicsKeys.progress() });
      queryClient.invalidateQueries({ queryKey: topicsKeys.stats() });

      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook tạo topic (Admin)
 */
export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Topic>) => createTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: topicsKeys.stats() });
    },
  });
}

/**
 * Hook cập nhật topic (Admin)
 */
export function useUpdateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Topic> }) => updateTopic(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: topicsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: topicsKeys.detail(id) });
    },
  });
}

/**
 * Hook xóa topic (Admin)
 */
export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: topicsKeys.stats() });
    },
  });
}

/**
 * Hook thêm words vào topic (Admin)
 */
export function useAddWordsToTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, wordIds, isCore }: { topicId: string; wordIds: string[]; isCore?: boolean }) =>
      addWordsToTopic(topicId, wordIds, isCore),
    onSuccess: (_, { topicId }) => {
      queryClient.invalidateQueries({ queryKey: topicsKeys.detail(topicId) });
      queryClient.invalidateQueries({ queryKey: topicsKeys.lists() });
    },
  });
}

/**
 * Hook xóa words khỏi topic (Admin)
 */
export function useRemoveWordsFromTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, wordIds }: { topicId: string; wordIds: string[] }) =>
      removeWordsFromTopic(topicId, wordIds),
    onSuccess: (_, { topicId }) => {
      queryClient.invalidateQueries({ queryKey: topicsKeys.detail(topicId) });
      queryClient.invalidateQueries({ queryKey: topicsKeys.lists() });
    },
  });
}
