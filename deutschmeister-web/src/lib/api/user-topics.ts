import { api, apiDelete, apiGet, apiPatch, apiPost } from './client';
import type {
  AddCardsDto,
  CreateSetDto,
  CreateUserTopicDto,
  PaginatedResponse,
  QueryMineDto,
  UpdateCardDto,
  UpdateSetDto,
  UpdateUserTopicDto,
  UserTopic,
  UserTopicCard,
  UserTopicDetail,
  UserTopicSet,
  UserTopicVisibility,
} from '@/types/user-topic';

const BASE = '/user-topics';

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

// ─── Topic CRUD ──────────────────────────────────────────────────────────

export function listMineTopics(query?: QueryMineDto) {
  return apiGet<PaginatedResponse<UserTopic>>(
    `${BASE}/mine${buildQuery(query as Record<string, unknown> | undefined)}`,
  );
}

export function getMineTopic(id: string) {
  return apiGet<UserTopicDetail>(`${BASE}/mine/${id}`);
}

export function createUserTopic(dto: CreateUserTopicDto) {
  return apiPost<UserTopic>(BASE, dto);
}

export function updateUserTopic(id: string, dto: UpdateUserTopicDto) {
  return apiPatch<UserTopic>(`${BASE}/${id}`, dto);
}

export function deleteUserTopic(id: string) {
  return apiDelete<{ ok: boolean }>(`${BASE}/${id}`);
}

export function updateVisibility(id: string, visibility: UserTopicVisibility) {
  return apiPatch<UserTopic>(`${BASE}/${id}/visibility`, { visibility });
}

// ─── Sets ────────────────────────────────────────────────────────────────

export function createSet(topicId: string, dto: CreateSetDto) {
  return apiPost<UserTopicSet>(`${BASE}/${topicId}/sets`, dto);
}

export function updateSet(topicId: string, setId: string, dto: UpdateSetDto) {
  return apiPatch<UserTopicSet>(`${BASE}/${topicId}/sets/${setId}`, dto);
}

export function deleteSet(topicId: string, setId: string) {
  return apiDelete<{ ok: boolean }>(`${BASE}/${topicId}/sets/${setId}`);
}

export function reorderSets(topicId: string, items: Array<{ id: string; order: number }>) {
  return apiPost<{ ok: boolean }>(`${BASE}/${topicId}/sets/reorder`, { items });
}

// ─── Cards ───────────────────────────────────────────────────────────────

export function addCards(topicId: string, setId: string, dto: AddCardsDto) {
  return apiPost<{ ok: boolean; count: number }>(
    `${BASE}/${topicId}/sets/${setId}/cards`,
    dto,
  );
}

export function updateCard(
  topicId: string,
  setId: string,
  cardId: string,
  dto: UpdateCardDto,
) {
  return apiPatch<UserTopicCard>(
    `${BASE}/${topicId}/sets/${setId}/cards/${cardId}`,
    dto,
  );
}

export function deleteCards(topicId: string, setId: string, cardIds: string[]) {
  // DELETE with JSON body — use raw api() since apiDelete() doesn't take a body
  return api<{ ok: boolean; count: number }>(
    `${BASE}/${topicId}/sets/${setId}/cards`,
    {
      method: 'DELETE',
      body: JSON.stringify({ cardIds }),
    },
  );
}
