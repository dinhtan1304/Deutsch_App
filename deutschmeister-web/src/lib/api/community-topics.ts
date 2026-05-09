import { apiDelete, apiGet, apiPost } from './client';
import type {
  CommunityTopicDetail,
  ForkTopicDto,
  PaginatedResponse,
  QueryCommunityDto,
  RecordStudyEventDto,
  UserTopic,
  UserTopicCard,
  UserTopicSet,
  UserTopicWithOwner,
} from '@/types/user-topic';

const BASE = '/community/topics';

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

// ─── Discovery ───────────────────────────────────────────────────────────

export function browseCommunity(query?: QueryCommunityDto) {
  return apiGet<PaginatedResponse<UserTopicWithOwner>>(
    `${BASE}${buildQuery(query as Record<string, unknown> | undefined)}`,
  );
}

export function getFeatured() {
  return apiGet<{ items: UserTopicWithOwner[] }>(`${BASE}/featured`);
}

// ─── Detail ──────────────────────────────────────────────────────────────

export function getCommunityTopic(slug: string) {
  return apiGet<CommunityTopicDetail>(`${BASE}/${slug}`);
}

export function getSetCards(slug: string, setId: string) {
  return apiGet<{ topicId: string; set: UserTopicSet; cards: UserTopicCard[] }>(
    `${BASE}/${slug}/sets/${setId}/cards`,
  );
}

// ─── Social ──────────────────────────────────────────────────────────────

export function followTopic(topicId: string) {
  return apiPost<{ ok: boolean; alreadyFollowing: boolean }>(
    `${BASE}/${topicId}/follow`,
    {},
  );
}

export function unfollowTopic(topicId: string) {
  return apiDelete<{ ok: boolean; wasFollowing: boolean }>(`${BASE}/${topicId}/follow`);
}

export function forkTopic(topicId: string, dto: ForkTopicDto) {
  return apiPost<UserTopic>(`${BASE}/${topicId}/fork`, dto);
}

export function recordStudyEvent(topicId: string, dto: RecordStudyEventDto) {
  return apiPost<{ ok: boolean; firstStudy: boolean }>(
    `${BASE}/${topicId}/study-events`,
    dto,
  );
}

export function listFollowing() {
  return apiGet<
    PaginatedResponse<UserTopic & { followedAt: string; isAccessible: boolean }>
  >(`${BASE}/me/following`);
}
