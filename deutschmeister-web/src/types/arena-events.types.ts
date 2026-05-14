// ⚠️ KEEP IN SYNC with deutschmeister-api/src/modules/vocabulary-arena/types/arena-events.types.ts
// Shared wire contract for the Vocabulary Arena WebSocket gateway.

export type ArenaMode = 'vi_to_de' | 'de_to_vi' | 'mixed';
export type ArenaRoundMode = 'vi_to_de' | 'de_to_vi';
export type ArenaMatchStatus = 'matchmaking' | 'active' | 'completed' | 'abandoned';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const ARENA_NAMESPACE = '/arena';
export const ARENA_TOTAL_ROUNDS = 10;
export const ARENA_ROUND_DURATION_MS = 30_000;
export const ARENA_COUNTDOWN_MS = 3_000;
export const ARENA_BOT_FALLBACK_MS = 15_000;
export const ARENA_REVEAL_DURATION_MS = 5_000;
export const ARENA_EXPANSION_1_MS = 8_000;
export const ARENA_EXPANSION_2_MS = 12_000;
export const ARENA_GRACE_PERIOD_MS = 10_000;
export const ARENA_MIN_REACTION_MS = 200;
export const ARENA_SUBMIT_COOLDOWN_MS = 500;
export const ARENA_MAX_ATTEMPTS_PER_ROUND = 50;
export const ARENA_MAX_CONCURRENT_MATCHES = 5_000;
export const ARENA_QUEUE_DEPTH_CAP = 1_000;
export const BOT_SENTINEL_USER_ID = 'BOT';

export type ArenaPlayerSlot = 'player1' | 'player2';
export type ArenaScorePair = Record<ArenaPlayerSlot, number>;
export type ArenaSlotNumberPair = Record<ArenaPlayerSlot, number>;
export type ArenaRuntimePhase = 'countdown' | 'playing' | 'round-reveal' | 'match-result';

export interface ArenaPlayerLite {
  userId: string;
  displayName: string;
  avatar: string | null;
  level: CefrLevel;
  isBot: boolean;
}

interface ArenaRoundClueBase {
  roundNumber: number;
  roundStartedAt: number;
  durationMs: number;
  imageUrl: string | null;
  category: string;
  wordLength: number;
  firstChar: string;
  lastChar: string;
}

export interface ArenaRoundClueViToDe extends ArenaRoundClueBase {
  mode: 'vi_to_de';
  translationVi: string;
}

export interface ArenaRoundClueDeToVi extends ArenaRoundClueBase {
  mode: 'de_to_vi';
  word: string;
  article: 'der' | 'die' | 'das' | null;
  pronunciation: string | null;
}

export type ArenaRoundClue = ArenaRoundClueViToDe | ArenaRoundClueDeToVi;

export interface ArenaQueueJoinPayload {
  mode: ArenaMode;
}

export interface ArenaAnswerSubmitPayload {
  matchId: string;
  roundNumber: number;
  answer: string;
  clientSentAt: number;
}

export interface ArenaForfeitPayload {
  matchId: string;
}

export interface ArenaRejoinPayload {
  matchId: string;
}

export interface ArenaPingPayload {
  clientNow: number;
}

export interface ArenaHelloEvent {
  serverTime: number;
}

export interface ArenaQueueWaitingEvent {
  bucketKey: string;
  estimatedWaitMs: number;
}

export interface ArenaMatchFoundEvent {
  matchId: string;
  mode: ArenaMode;
  opponent: ArenaPlayerLite;
  me: ArenaPlayerLite;
  mySlot: ArenaPlayerSlot;
  scores: ArenaScorePair;
  totalRounds: number;
  countdownMs: number;
  upcomingFirstImageUrl: string | null;
}

export interface ArenaRoundStartEvent {
  matchId: string;
  clue: ArenaRoundClue;
}

export interface ArenaAnswerResultEvent {
  matchId: string;
  roundNumber: number;
  userId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  attemptNumber: number;
}

export interface ArenaAnswerRejectedEvent {
  matchId: string;
  roundNumber: number;
  reason: 'ROUND_CLOSED' | 'TOO_MANY_ATTEMPTS' | 'RATE_LIMITED' | 'INVALID_STATE';
}

export interface ArenaWordReveal {
  word: string;
  article: string | null;
  gender: string | null;
  plural: string | null;
  pronunciation: string | null;
  translationVi: string | null;
  examples: string[];
  tips: string[];
  partOfSpeech: string;
}

export interface ArenaRoundEndEvent {
  matchId: string;
  roundNumber: number;
  winnerUserId: string | null;
  correctAnswer: string;
  correctAnswerWithArticle: string;
  scores: ArenaScorePair;
  nextRoundImageUrl: string | null;
  wordReveal: ArenaWordReveal;
  revealDurationMs: number;
}

export interface ArenaMatchEndEvent {
  matchId: string;
  winnerUserId: string | null;
  isDraw: boolean;
  finalScores: ArenaScorePair;
  ratingDelta: ArenaSlotNumberPair;
  xpAwarded: ArenaSlotNumberPair;
  rounds: Array<{
    roundNumber: number;
    word: string;
    correctAnswer: string;
    translationVi: string | null;
    winnerUserId: string | null;
    mode: ArenaRoundMode;
  }>;
}

export interface ArenaRoundRevealSnapshot {
  correctAnswer: string;
  correctAnswerWithArticle: string;
  winnerUserId: string | null;
  wordReveal: ArenaWordReveal;
  revealDurationMs: number;
  nextRoundImageUrl: string | null;
}

export interface ArenaStateSnapshotEvent {
  match: ArenaMatchFoundEvent;
  phase: ArenaRuntimePhase;
  currentClue: ArenaRoundClue | null;
  roundReveal: ArenaRoundRevealSnapshot | null;
  matchResult: ArenaMatchEndEvent | null;
  serverTime: number;
}

export interface ArenaOpponentDisconnectedEvent {
  opponentUserId: string;
  graceRemainingMs: number;
}

export interface ArenaOpponentReconnectedEvent {
  opponentUserId: string;
}

export interface ArenaOpponentTypingEvent {
  opponentUserId: string;
  isBot?: boolean;
}

export type ArenaErrorCode =
  | 'UNAUTHORIZED'
  | 'AUTH_EXPIRED'
  | 'REPLACED_BY_NEW_TAB'
  | 'ALREADY_QUEUED'
  | 'SERVER_BUSY'
  | 'INVALID_STATE'
  | 'MATCH_NOT_FOUND'
  | 'NOT_A_PARTICIPANT'
  | 'TOO_MANY_ATTEMPTS'
  | 'RATE_LIMITED'
  | 'PERSIST_FAILURE'
  | 'INTERNAL';

export interface ArenaErrorEvent {
  code: ArenaErrorCode;
  message?: string;
}

export interface ArenaPongEvent {
  serverTime: number;
}

// ─── Custom rooms ────────────────────────────────────────────────────────

export type ArenaRoomVisibility = 'public' | 'link' | 'password';
export type ArenaRoomStatus = 'waiting' | 'active' | 'closed' | 'abandoned';

export interface ArenaRoomSummary {
  id: string;
  inviteCode: string;
  mode: ArenaMode;
  level: CefrLevel;
  name: string | null;
  visibility: ArenaRoomVisibility;
  status: ArenaRoomStatus;
  createdAt: string;
  owner: { id: string; name: string | null; avatar: string | null };
}

export interface ArenaRoomMetadata {
  id: string;
  inviteCode: string;
  mode: ArenaMode;
  level: CefrLevel;
  name: string | null;
  visibility: ArenaRoomVisibility;
  status: ArenaRoomStatus;
  hasPassword: boolean;
  isFull: boolean;
  isOwner: boolean;
  owner: { id: string; name: string | null; avatar: string | null };
}

export interface ArenaRoomCreatedResponse {
  id: string;
  inviteCode: string;
  joinPath: string;
}

export type ArenaRoomErrorCode =
  | 'WRONG_PASSWORD'
  | 'ROOM_FULL'
  | 'ROOM_CLOSED'
  | 'OWNER_LEFT'
  | 'CANNOT_JOIN_OWN_ROOM'
  | 'ALREADY_QUEUED'
  | 'ALREADY_OWNS_ROOM'
  | 'ROOM_NOT_FOUND';

export interface ArenaRoomWaitPayload {
  roomId: string;
}

export interface ArenaRoomJoinPayload {
  code: string;
  password?: string;
}

export interface ArenaRoomCancelledEvent {
  roomId: string;
}

export interface ArenaRoomErrorEvent {
  code: ArenaRoomErrorCode;
  message?: string;
}

export const ARENA_EVENTS = {
  QUEUE_JOIN: 'arena:queue:join',
  QUEUE_LEAVE: 'arena:queue:leave',
  ANSWER_SUBMIT: 'arena:answer:submit',
  REJOIN: 'arena:rejoin',
  FORFEIT: 'arena:match:forfeit',
  PING: 'arena:ping',
  HELLO: 'arena:hello',
  QUEUE_WAITING: 'arena:queue:waiting',
  MATCH_FOUND: 'arena:match:found',
  STATE: 'arena:state',
  ROUND_START: 'arena:round:start',
  ANSWER_RESULT: 'arena:answer:result',
  ANSWER_REJECTED: 'arena:answer:rejected',
  ROUND_END: 'arena:round:end',
  MATCH_END: 'arena:match:end',
  OPPONENT_DISCONNECTED: 'arena:opponent:disconnected',
  OPPONENT_RECONNECTED: 'arena:opponent:reconnected',
  OPPONENT_TYPING: 'arena:opponent:typing',
  ERROR: 'arena:error',
  PONG: 'arena:pong',
  ROOM_WAIT: 'arena:room:wait',
  ROOM_JOIN: 'arena:room:join',
  ROOM_CANCELLED: 'arena:room:cancelled',
  ROOM_ERROR: 'arena:room:error',
} as const;
