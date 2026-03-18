import { apiGet, apiPut } from './client';
import type {
  TopicWithWords,
  TopicWithProgress,
  TopicsQueryParams,
  TopicsListResponse,
  TopicsStats,
  TopicProgress,
} from '@/types/topic';

const BASE_URL = '/topics';

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

export async function getTopic(idOrSlug: string, includeWords = true): Promise<TopicWithWords> {
  return apiGet<TopicWithWords>(`${BASE_URL}/${idOrSlug}?includeWords=${includeWords}`);
}

export async function getTopicsStats(): Promise<TopicsStats> {
  return apiGet<TopicsStats>(`${BASE_URL}/stats`);
}

export async function getUserTopicsProgress(): Promise<TopicWithProgress[]> {
  return apiGet<TopicWithProgress[]>(`${BASE_URL}/user/progress`);
}

export async function updateTopicProgress(
  topicId: string,
  wordsLearned: number,
): Promise<TopicProgress> {
  return apiPut<TopicProgress>(`${BASE_URL}/${topicId}/progress`, { wordsLearned });
}
