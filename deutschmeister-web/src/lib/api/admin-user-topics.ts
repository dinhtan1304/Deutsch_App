import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { PaginatedResponse, UserTopic } from '@/types/user-topic';

const BASE = '/admin/user-topics';

export interface AdminQueryDto {
  q?: string;
  visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC' | 'all';
  hiddenStatus?: 'hidden' | 'visible' | 'all';
  ownerUserId?: string;
  page?: number;
  limit?: number;
}

export interface AdminTopicRow extends UserTopic {
  owner: { id: string; name: string | null; email: string; avatar: string | null };
}

function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export function listAdminTopics(query?: AdminQueryDto) {
  return apiGet<PaginatedResponse<AdminTopicRow>>(
    `${BASE}${buildQuery(query as Record<string, unknown> | undefined)}`,
  );
}

export function hideTopic(id: string, reason?: string) {
  return apiPatch<UserTopic>(`${BASE}/${id}/hide`, { reason });
}

export function unhideTopic(id: string) {
  return apiPatch<UserTopic>(`${BASE}/${id}/unhide`, {});
}

export function toggleFeature(id: string) {
  return apiPatch<UserTopic>(`${BASE}/${id}/feature`, {});
}

export function adminDeleteTopic(id: string) {
  return apiDelete<{ ok: boolean }>(`${BASE}/${id}`);
}

export function recountTopics() {
  return apiPost<{ ok: boolean; topicsUpdated: number; setsUpdated: number }>(
    `${BASE}/recount`,
    {},
  );
}
