import { apiGet, apiPost } from './client';
import type {
  ArenaMode,
  ArenaRoomCreatedResponse,
  ArenaRoomMetadata,
  ArenaRoomSummary,
  ArenaRoomVisibility,
  CefrLevel,
} from '@/types/arena-events.types';

export interface ArenaMatchSummary {
  id: string;
  status: string;
  mode: ArenaMode;
  level: CefrLevel;
  player1Id: string;
  player2Id: string | null;
  isBotMatch: boolean;
  isCustomMatch?: boolean;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  totalRounds: number;
  createdAt: string;
  endedAt: string | null;
  player1: { id: string; name: string | null; avatar: string | null };
  player2: { id: string; name: string | null; avatar: string | null } | null;
}

export interface ArenaPlayerStats {
  userId: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  totalCorrect: number;
  rating: number;
  bestWinStreak: number;
  currentStreak: number;
}

export interface ArenaLeaderboardRow extends ArenaPlayerStats {
  user: { id: string; name: string | null; avatar: string | null };
}

export interface ArenaMatchAnswer {
  id: string;
  roundId: string;
  userId: string | null;
  isBot: boolean;
  answer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  attemptNumber: number;
  clientSentAt: string | null;
  clockSkewMs: number | null;
  isImplausible: boolean;
  createdAt: string;
}

export interface ArenaMatchRound {
  id: string;
  matchId: string;
  roundNumber: number;
  wordId: string;
  mode: 'vi_to_de' | 'de_to_vi';
  startedAt: string;
  endedAt: string | null;
  winnerPlayerId: string | null;
  winnerResponseTimeMs: number | null;
  answers: ArenaMatchAnswer[];
  word: {
    id: string;
    word: string;
    article: string;
    translationVi: string | null;
    pronunciation?: string | null;
    examples?: string[];
    tips?: string[];
  } | null;
}

export interface ArenaMatchDetail extends ArenaMatchSummary {
  rounds: ArenaMatchRound[];
}

export const arenaApi = {
  getHistory: (page = 1, limit = 20) =>
    apiGet<{ data: ArenaMatchSummary[]; total: number; page: number; limit: number; totalPages: number }>(
      `/arena/history?page=${page}&limit=${limit}`,
    ),

  getMatch: (id: string) => apiGet<ArenaMatchDetail>(`/arena/match/${id}`),

  getMyStats: () => apiGet<ArenaPlayerStats>(`/arena/stats/me`),

  getLeaderboard: (limit = 50) =>
    apiGet<ArenaLeaderboardRow[]>(`/arena/leaderboard?limit=${limit}`),

  // ─── Custom rooms ─────────────────────────────────────────────────────
  createRoom: (dto: {
    mode: ArenaMode;
    level: CefrLevel;
    visibility: ArenaRoomVisibility;
    password?: string;
    name?: string;
  }) => apiPost<ArenaRoomCreatedResponse>(`/arena/rooms`, dto),

  listRooms: (limit = 20) => apiGet<ArenaRoomSummary[]>(`/arena/rooms?limit=${limit}`),

  getRoomByCode: (code: string) =>
    apiGet<ArenaRoomMetadata>(`/arena/rooms/code/${encodeURIComponent(code)}`),

  cancelRoom: (id: string) => apiPost<{ ok: true }>(`/arena/rooms/${id}/cancel`, {}),
};
