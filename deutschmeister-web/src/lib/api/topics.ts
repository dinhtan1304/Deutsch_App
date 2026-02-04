import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type {
  Topic,
  TopicWithWords,
  TopicWithProgress,
  TopicsQueryParams,
  TopicsListResponse,
  TopicsStats,
  TopicProgress,
} from '@/types/topic';

const BASE_URL = '/topics';

// ============================================
// Public Endpoints
// ============================================

/**
 * Lấy danh sách topics
 */
export async function getTopics(params?: TopicsQueryParams): Promise<TopicsListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.level) searchParams.set('level', params.level);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params?.includeWords) searchParams.set('includeWords', String(params.includeWords));
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return apiGet<TopicsListResponse>(`${BASE_URL}${query ? `?${query}` : ''}`);
}

/**
 * Lấy chi tiết topic theo ID hoặc slug
 */
export async function getTopic(idOrSlug: string, includeWords = true): Promise<TopicWithWords> {
  return apiGet<TopicWithWords>(`${BASE_URL}/${idOrSlug}?includeWords=${includeWords}`);
}

/**
 * Lấy thống kê topics
 */
export async function getTopicsStats(): Promise<TopicsStats> {
  return apiGet<TopicsStats>(`${BASE_URL}/stats`);
}

// ============================================
// Authenticated Endpoints
// ============================================

/**
 * Lấy progress của user cho tất cả topics
 */
export async function getUserTopicsProgress(): Promise<TopicWithProgress[]> {
  return apiGet<TopicWithProgress[]>(`${BASE_URL}/user/progress`);
}

/**
 * Cập nhật progress cho topic
 */
export async function updateTopicProgress(
  topicId: string,
  wordsLearned: number,
): Promise<TopicProgress> {
  return apiPut<TopicProgress>(`${BASE_URL}/${topicId}/progress`, { wordsLearned });
}

// ============================================
// Admin Endpoints
// ============================================

/**
 * Tạo topic mới
 */
export async function createTopic(data: Partial<Topic>): Promise<Topic> {
  return apiPost<Topic>(BASE_URL, data);
}

/**
 * Cập nhật topic
 */
export async function updateTopic(id: string, data: Partial<Topic>): Promise<Topic> {
  return apiPut<Topic>(`${BASE_URL}/${id}`, data);
}

/**
 * Xóa topic
 */
export async function deleteTopic(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`${BASE_URL}/${id}`);
}

/**
 * Thêm words vào topic
 */
export async function addWordsToTopic(
  topicId: string,
  wordIds: string[],
  isCore = false,
): Promise<{ added: number; skipped: number }> {
  return apiPost(`${BASE_URL}/${topicId}/words`, { wordIds, isCore });
}

/**
 * Xóa words khỏi topic
 */
export async function removeWordsFromTopic(
  topicId: string,
  wordIds: string[],
): Promise<{ deleted: number }> {
  const query = new URLSearchParams();
  wordIds.forEach(id => query.append('wordIds', id));
  return apiDelete<{ deleted: number }>(`${BASE_URL}/${topicId}/words?${query.toString()}`);
}