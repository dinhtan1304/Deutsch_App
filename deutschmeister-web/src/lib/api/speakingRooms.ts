import { apiDelete, apiGet, apiPost } from './client';

export type SpeakingRoomVisibility = 'PUBLIC' | 'PRIVATE';
export type SpeakingRoomStatus = 'WAITING' | 'ACTIVE' | 'CLOSED';
export type SpeakingMessageKind = 'TEXT' | 'SYSTEM' | 'PROMPT';

export interface SpeakingRoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  user: { id: string; name: string | null; avatar: string | null };
}

export interface SpeakingRoom {
  id: string;
  ownerId: string;
  title: string;
  cefrLevel: string;
  topic: string;
  visibility: SpeakingRoomVisibility;
  maxSeats: number;
  inviteCode: string;
  status: SpeakingRoomStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  participants: SpeakingRoomParticipant[];
}

export interface SpeakingMessage {
  id: string;
  roomId: string;
  senderId: string | null;
  kind: SpeakingMessageKind;
  text: string;
  createdAt: string;
}

export interface SpeakingRoomDetail extends SpeakingRoom {
  messages: SpeakingMessage[];
}

export interface CreateRoomDto {
  title: string;
  cefrLevel: string;
  topic: string;
  visibility?: SpeakingRoomVisibility;
}

export interface EnqueueMatchDto {
  cefrLevel: string;
  topic: string;
}

export interface MatchResult {
  matched: boolean;
  roomId?: string;
  partnerUserId?: string;
}

export interface SpeakingSuggestion {
  subTopics: { de: string; vi: string }[];
  starterSentences: { de: string; vi: string }[];
  followUpQuestions: { de: string; vi: string }[];
}

export interface SpeakingRoomQuota {
  feature: 'speakingRoom';
  window: 'daily' | 'weekly';
  limit: number;
  used: number;
  isPremium: boolean;
  resetsAt: string;
}

export interface SpeakingRoomStats {
  onlineCount: number;
  activeRooms: number;
  waitingRooms: number;
  my: {
    sessions: number;
    talkSeconds: number;
    roomSeconds: number;
    roomsCreated: number;
    messages: number;
  };
}

export interface IceConfigResponse {
  iceServers: RTCIceServer[];
}

export function parseSpeakingRoomInviteCode(input: string): string {
  const raw = input.trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const segments = url.pathname.split('/').filter(Boolean);
    const joinIndex = segments.findIndex((segment) => segment === 'join');
    const code = joinIndex >= 0 ? segments[joinIndex + 1] : undefined;
    if (code) {
      return decodeURIComponent(code).trim();
    }
    return decodeURIComponent(segments[segments.length - 1] ?? '').trim();
  } catch {
    const withoutQuery = raw.split(/[?#]/)[0] ?? raw;
    const segments = withoutQuery.split('/').filter(Boolean);
    const joinIndex = segments.findIndex((segment) => segment === 'join');
    const code = joinIndex >= 0 ? segments[joinIndex + 1] : segments[segments.length - 1];
    return decodeURIComponent(code ?? '').trim();
  }
}

export const speakingRoomsApi = {
  list: (filter?: { cefrLevel?: string; topic?: string }) => {
    const params = new URLSearchParams();
    if (filter?.cefrLevel) params.set('cefrLevel', filter.cefrLevel);
    if (filter?.topic) params.set('topic', filter.topic);
    const qs = params.toString();
    return apiGet<SpeakingRoom[]>(`/speaking-rooms${qs ? `?${qs}` : ''}`);
  },
  listMine: () => apiGet<SpeakingRoom[]>('/speaking-rooms/my'),
  get: (id: string) => apiGet<SpeakingRoomDetail>(`/speaking-rooms/${id}`),
  create: (dto: CreateRoomDto) => apiPost<SpeakingRoom>('/speaking-rooms', dto),
  join: (id: string) => apiPost<SpeakingRoom>(`/speaking-rooms/${id}/join`, {}),
  joinByCode: (code: string) => apiPost<SpeakingRoom>('/speaking-rooms/join-by-code', { code: parseSpeakingRoomInviteCode(code) }),
  leave: (id: string) => apiPost<{ success: boolean }>(`/speaking-rooms/${id}/leave`, {}),
  reopen: (id: string) => apiPost<SpeakingRoom>(`/speaking-rooms/${id}/reopen`, {}),
  enqueueMatch: (dto: EnqueueMatchDto) => apiPost<MatchResult>('/speaking-rooms/match/enqueue', dto),
  dequeueMatch: () => apiDelete<{ success: boolean }>('/speaking-rooms/match/dequeue'),
  getMyQueueEntry: () => apiGet<{ id: string; cefrLevel: string; topic: string; enqueuedAt: string } | null>('/speaking-rooms/match/me'),
  sendMessage: (id: string, text: string) =>
    apiPost<SpeakingMessage>(`/speaking-rooms/${id}/messages`, { text }),
  getSuggestions: (id: string) => apiGet<SpeakingSuggestion>(`/speaking-rooms/${id}/suggestions`),
  getQuota: () => apiGet<SpeakingRoomQuota>('/speaking-rooms/quota'),
  getStats: () => apiGet<SpeakingRoomStats>('/speaking-rooms/stats'),
  getIceConfig: () => apiGet<IceConfigResponse>('/speaking-rooms/ice-config'),
};
