'use client';

import { create } from 'zustand';
import type {
  ArenaAnswerRejectedEvent,
  ArenaErrorEvent,
  ArenaMatchEndEvent,
  ArenaMatchFoundEvent,
  ArenaMode,
  ArenaPlayerSlot,
  ArenaQueueWaitingEvent,
  ArenaRoundClue,
  ArenaRoundEndEvent,
  ArenaRoundRevealSnapshot,
  ArenaStateSnapshotEvent,
  ArenaWordReveal,
} from '@/types/arena-events.types';

export type ArenaPhase =
  | 'idle'
  | 'matchmaking'
  | 'countdown'
  | 'playing'
  | 'round-reveal'
  | 'match-result';

export type ArenaConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface ArenaUiError {
  code: string;
  message: string;
}

interface ArenaRoundRevealState {
  correctAnswer: string;
  correctAnswerWithArticle: string;
  winnerUserId: string | null;
  wordReveal: ArenaWordReveal;
  revealDurationMs: number;
  nextRoundImageUrl: string | null;
}

interface ArenaStoreState {
  phase: ArenaPhase;
  connectionStatus: ArenaConnectionStatus;
  lastError: ArenaUiError | null;
  lastRejection: ArenaUiError | null;
  serverClockSkewMs: number;
  queuedMode: ArenaMode | null;
  queueStartedAt: number | null;
  queueEstimatedWaitMs: number | null;
  match: ArenaMatchFoundEvent | null;
  mySlot: ArenaPlayerSlot | null;
  currentClue: ArenaRoundClue | null;
  scores: { me: number; opponent: number };
  myUserId: string | null;
  myLastAnswer: { isCorrect: boolean; attempts: number; responseTimeMs?: number } | null;
  opponentLastResult: { isCorrect: boolean; attempts: number; responseTimeMs?: number } | null;
  answeredCorrectThisRound: boolean;
  opponentTyping: boolean;
  opponentConnected: boolean;
  graceRemainingMs: number;
  roundReveal: ArenaRoundRevealState | null;
  matchResult: ArenaMatchEndEvent | null;
  announcement: string;
  roomError: { code: string; message?: string } | null;
  roomCancelled: boolean;
  currentRoomId: string | null;

  setPhase: (p: ArenaPhase) => void;
  applyRoomError: (e: { code: string; message?: string }) => void;
  applyRoomCancelled: () => void;
  clearRoomError: () => void;
  setCurrentRoomId: (id: string | null) => void;
  setConnectionStatus: (s: ArenaConnectionStatus) => void;
  setServerClockSkewMs: (skew: number) => void;
  startMatchmaking: (mode: ArenaMode) => void;
  applyQueueWaiting: (e: ArenaQueueWaitingEvent) => void;
  cancelMatchmaking: () => void;
  applyMatchFound: (e: ArenaMatchFoundEvent, myUserId: string) => void;
  applyStateSnapshot: (e: ArenaStateSnapshotEvent, myUserId: string) => void;
  applyRoundStart: (clue: ArenaRoundClue) => void;
  applyAnswerResult: (e: { userId: string; isCorrect: boolean; attemptNumber: number; responseTimeMs?: number }) => void;
  applyAnswerRejected: (e: ArenaAnswerRejectedEvent) => void;
  applyRoundEnd: (e: ArenaRoundEndEvent) => void;
  applyMatchEnd: (e: ArenaMatchEndEvent) => void;
  applyOpponentDisconnected: (graceMs: number) => void;
  applyOpponentReconnected: () => void;
  applyOpponentTyping: () => void;
  applyError: (e: ArenaErrorEvent) => void;
  setAnnouncement: (s: string) => void;
  clearError: () => void;
  reset: () => void;
}

const INITIAL: Omit<ArenaStoreState,
  | 'setPhase'
  | 'setConnectionStatus'
  | 'setServerClockSkewMs'
  | 'startMatchmaking'
  | 'applyQueueWaiting'
  | 'cancelMatchmaking'
  | 'applyMatchFound'
  | 'applyStateSnapshot'
  | 'applyRoundStart'
  | 'applyAnswerResult'
  | 'applyAnswerRejected'
  | 'applyRoundEnd'
  | 'applyMatchEnd'
  | 'applyOpponentDisconnected'
  | 'applyOpponentReconnected'
  | 'applyOpponentTyping'
  | 'applyError'
  | 'setAnnouncement'
  | 'clearError'
  | 'reset'
  | 'applyRoomError'
  | 'applyRoomCancelled'
  | 'clearRoomError'
  | 'setCurrentRoomId'
> = {
  phase: 'idle',
  connectionStatus: 'idle',
  lastError: null,
  lastRejection: null,
  serverClockSkewMs: 0,
  queuedMode: null,
  queueStartedAt: null,
  queueEstimatedWaitMs: null,
  match: null,
  mySlot: null,
  currentClue: null,
  scores: { me: 0, opponent: 0 },
  myUserId: null,
  myLastAnswer: null,
  opponentLastResult: null,
  answeredCorrectThisRound: false,
  opponentTyping: false,
  opponentConnected: true,
  graceRemainingMs: 0,
  roundReveal: null,
  matchResult: null,
  announcement: '',
  roomError: null,
  roomCancelled: false,
  currentRoomId: null,
};

function otherSlot(slot: ArenaPlayerSlot): ArenaPlayerSlot {
  return slot === 'player1' ? 'player2' : 'player1';
}

function mapScores(
  scores: { player1: number; player2: number },
  mySlot: ArenaPlayerSlot | null,
): { me: number; opponent: number } {
  if (!mySlot) return { me: scores.player1, opponent: scores.player2 };
  return {
    me: scores[mySlot],
    opponent: scores[otherSlot(mySlot)],
  };
}

function rejectionMessage(reason: ArenaAnswerRejectedEvent['reason']): string {
  if (reason === 'ROUND_CLOSED') return 'Vòng này đã kết thúc.';
  if (reason === 'TOO_MANY_ATTEMPTS') return 'Bạn đã thử quá nhiều lần trong vòng này.';
  if (reason === 'RATE_LIMITED') return 'Bạn gửi quá nhanh. Chờ một nhịp rồi thử lại.';
  return 'Trạng thái trận không hợp lệ. Vui lòng tải lại trận.';
}

function errorMessage(e: ArenaErrorEvent): string {
  if (e.message) return e.message;
  if (e.code === 'SERVER_BUSY') return 'Đấu trường đang quá tải. Vui lòng thử lại sau.';
  if (e.code === 'ALREADY_QUEUED') return 'Bạn đang ở trong hàng chờ khác.';
  if (e.code === 'RATE_LIMITED') return 'Bạn thao tác quá nhanh. Vui lòng chờ vài giây.';
  if (e.code === 'MATCH_NOT_FOUND') return 'Không tìm thấy trận đấu này.';
  if (e.code === 'NOT_A_PARTICIPANT') return 'Bạn không thuộc trận đấu này.';
  if (e.code === 'PERSIST_FAILURE') return 'Trận đấu bị hủy vì không lưu được dữ liệu.';
  return 'Đấu trường gặp lỗi. Vui lòng thử lại.';
}

function toRevealState(reveal: ArenaRoundRevealSnapshot): ArenaRoundRevealState {
  return {
    correctAnswer: reveal.correctAnswer,
    correctAnswerWithArticle: reveal.correctAnswerWithArticle,
    winnerUserId: reveal.winnerUserId,
    wordReveal: reveal.wordReveal,
    revealDurationMs: reveal.revealDurationMs,
    nextRoundImageUrl: reveal.nextRoundImageUrl,
  };
}

export const useArenaStore = create<ArenaStoreState>((set, get) => ({
  ...INITIAL,

  setPhase: (phase) => set({ phase }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setServerClockSkewMs: (serverClockSkewMs) => set({ serverClockSkewMs }),

  startMatchmaking: (queuedMode) =>
    set({
      phase: 'matchmaking',
      queuedMode,
      queueStartedAt: Date.now(),
      queueEstimatedWaitMs: null,
      lastError: null,
      lastRejection: null,
    }),

  applyQueueWaiting: (e) => set({ queueEstimatedWaitMs: e.estimatedWaitMs }),

  cancelMatchmaking: () =>
    set({
      phase: 'idle',
      queuedMode: null,
      queueStartedAt: null,
      queueEstimatedWaitMs: null,
      lastRejection: null,
    }),

  applyMatchFound: (e, myUserId) =>
    set({
      phase: 'countdown',
      match: e,
      mySlot: e.mySlot,
      myUserId,
      scores: mapScores(e.scores, e.mySlot),
      currentClue: null,
      myLastAnswer: null,
      opponentLastResult: null,
      answeredCorrectThisRound: false,
      opponentTyping: false,
      opponentConnected: true,
      graceRemainingMs: 0,
      roundReveal: null,
      matchResult: null,
      lastError: null,
      lastRejection: null,
      currentRoomId: null,
      roomError: null,
      roomCancelled: false,
      announcement: e.opponent.isBot
        ? `Đối thủ: ${e.opponent.displayName} (Bot)`
        : `Đối thủ: ${e.opponent.displayName}`,
    }),

  applyStateSnapshot: (e, myUserId) =>
    set({
      phase: e.phase,
      match: e.match,
      mySlot: e.match.mySlot,
      myUserId,
      scores: mapScores(e.match.scores, e.match.mySlot),
      currentClue: e.currentClue,
      myLastAnswer: null,
      opponentLastResult: null,
      answeredCorrectThisRound: false,
      opponentTyping: false,
      opponentConnected: true,
      graceRemainingMs: 0,
      roundReveal: e.roundReveal ? toRevealState(e.roundReveal) : null,
      matchResult: e.matchResult,
      lastError: null,
      lastRejection: null,
      roomError: null,
      roomCancelled: false,
      announcement: 'Đã khôi phục trạng thái trận đấu',
    }),

  applyRoundStart: (clue) =>
    set({
      phase: 'playing',
      currentClue: clue,
      myLastAnswer: null,
      opponentLastResult: null,
      answeredCorrectThisRound: false,
      opponentTyping: false,
      roundReveal: null,
      lastRejection: null,
      announcement: `Vòng ${clue.roundNumber} bắt đầu`,
    }),

  applyAnswerResult: ({ userId, isCorrect, attemptNumber, responseTimeMs }) => {
    const me = get().myUserId;
    if (userId === me) {
      set({
        myLastAnswer: { isCorrect, attempts: attemptNumber, responseTimeMs },
        answeredCorrectThisRound: isCorrect || get().answeredCorrectThisRound,
        lastRejection: null,
      });
    } else {
      set({
        opponentLastResult: { isCorrect, attempts: attemptNumber, responseTimeMs },
        opponentTyping: false,
        announcement: isCorrect ? 'Đối thủ đã trả lời đúng' : 'Đối thủ đã trả lời sai',
      });
    }
  },

  applyAnswerRejected: (e) =>
    set({
      lastRejection: { code: e.reason, message: rejectionMessage(e.reason) },
      announcement: rejectionMessage(e.reason),
    }),

  applyRoundEnd: (e) => {
    const me = get().myUserId;
    const mySlot = get().mySlot;
    set({
      phase: 'round-reveal',
      scores: mapScores(e.scores, mySlot),
      roundReveal: {
        correctAnswer: e.correctAnswer,
        correctAnswerWithArticle: e.correctAnswerWithArticle,
        winnerUserId: e.winnerUserId,
        wordReveal: e.wordReveal,
        revealDurationMs: e.revealDurationMs,
        nextRoundImageUrl: e.nextRoundImageUrl,
      },
      lastRejection: null,
      announcement:
        e.winnerUserId === null
          ? `Hết giờ. Đáp án: ${e.correctAnswer}`
          : e.winnerUserId === me
            ? `Bạn thắng vòng. Đáp án: ${e.correctAnswer}`
            : `Đối thủ thắng vòng. Đáp án: ${e.correctAnswer}`,
    });
  },

  applyMatchEnd: (e) =>
    set({
      phase: 'match-result',
      matchResult: e,
      scores: mapScores(e.finalScores, get().mySlot),
      announcement:
        e.isDraw
          ? 'Trận hòa'
          : e.winnerUserId === get().myUserId
            ? 'Bạn đã thắng trận'
            : 'Bạn đã thua trận',
    }),

  applyOpponentDisconnected: (graceMs) =>
    set({
      opponentConnected: false,
      graceRemainingMs: graceMs,
      announcement: 'Đối thủ mất kết nối',
    }),

  applyOpponentReconnected: () =>
    set({
      opponentConnected: true,
      graceRemainingMs: 0,
      announcement: 'Đối thủ đã quay lại',
    }),

  applyOpponentTyping: () => set({ opponentTyping: true }),

  applyError: (e) => {
    const msg = errorMessage(e);
    const shouldLeaveQueue =
      get().phase === 'matchmaking' &&
      (e.code === 'RATE_LIMITED' || e.code === 'SERVER_BUSY' || e.code === 'ALREADY_QUEUED');
    set({
      lastError: { code: e.code, message: msg },
      phase: shouldLeaveQueue ? 'idle' : get().phase,
      queuedMode: shouldLeaveQueue ? null : get().queuedMode,
      queueStartedAt: shouldLeaveQueue ? null : get().queueStartedAt,
      queueEstimatedWaitMs: shouldLeaveQueue ? null : get().queueEstimatedWaitMs,
      announcement: msg,
    });
  },

  setAnnouncement: (announcement) => set({ announcement }),

  clearError: () => set({ lastError: null, lastRejection: null }),

  applyRoomError: (roomError) => set({ roomError }),

  applyRoomCancelled: () => set({ roomCancelled: true, currentRoomId: null }),

  clearRoomError: () => set({ roomError: null }),

  setCurrentRoomId: (currentRoomId) => set({ currentRoomId }),

  reset: () => set({ ...INITIAL }),
}));
