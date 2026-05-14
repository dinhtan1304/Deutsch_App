'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useArenaStore } from '@/stores/arenaStore';
import {
  ARENA_EVENTS,
  ARENA_NAMESPACE,
  type ArenaAnswerRejectedEvent,
  type ArenaAnswerResultEvent,
  type ArenaErrorEvent,
  type ArenaHelloEvent,
  type ArenaMatchEndEvent,
  type ArenaMatchFoundEvent,
  type ArenaMode,
  type ArenaOpponentDisconnectedEvent,
  type ArenaPongEvent,
  type ArenaQueueWaitingEvent,
  type ArenaRoundEndEvent,
  type ArenaRoundStartEvent,
  type ArenaStateSnapshotEvent,
} from '@/types/arena-events.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deutschmeister-api-production.up.railway.app/api';
const WS_URL = API_URL.replace(/\/api\/?$/, '');

if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'development' &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  // Avoid silently hitting prod from a local dev build.
  console.warn(
    '[arena] NEXT_PUBLIC_API_URL chưa set — đang fallback sang production. Dev cần set .env.local.',
  );
}

let socketSingleton: Socket | null = null;
let connectedToken: string | null = null;

// Emits enqueued before the dynamic socket.io chunk finishes loading.
// Once the socket connects we flush these in order.
type PendingEmit = { event: string; payload: unknown };
const pendingEmits: PendingEmit[] = [];

function safeEmit(event: string, payload: unknown) {
  if (socketSingleton) {
    // socket.io-client buffers outgoing emits when the instance exists
    // but isn't connected yet — flushed automatically on connect.
    socketSingleton.emit(event, payload);
  } else {
    pendingEmits.push({ event, payload });
  }
}

// Router ref refreshed by the hook on every mount so wireSocket
// (which only runs once per singleton) doesn't capture a stale instance.
type ArenaRouter = Pick<ReturnType<typeof useRouter>, 'push' | 'replace'>;
let currentRouter: ArenaRouter | null = null;

async function getSocketIo() {
  const mod = await import('socket.io-client');
  return mod.io;
}

interface UseArenaSocketReturn {
  isConnected: boolean;
  joinQueue: (mode: ArenaMode) => void;
  leaveQueue: () => void;
  submitAnswer: (answer: string) => void;
  rejoin: (matchId: string) => void;
  forfeitMatch: (matchId: string) => void;
  ping: () => void;
  disconnect: () => void;
  waitInRoom: (roomId: string) => void;
  joinRoom: (code: string, password?: string) => void;
}

export function useArenaSocket(): UseArenaSocketReturn {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const connectionStatus = useArenaStore((s) => s.connectionStatus);
  const setSkew = useArenaStore((s) => s.setServerClockSkewMs);
  const store = useArenaStore;

  useEffect(() => {
    currentRouter = router;
    let cancelled = false;
    const token = getAccessToken();
    if (!user?.id || !token) return;

    (async () => {
      store.getState().setConnectionStatus('connecting');
      if (socketSingleton) {
        if (connectedToken === token) {
          store.getState().setConnectionStatus(
            socketSingleton.connected ? 'connected' : 'connecting',
          );
          return;
        }
        // Token rotated (refresh) or different user signed in — discard the
        // stale instance so we don't leak listeners or fight a ghost socket.
        socketSingleton.removeAllListeners();
        socketSingleton.disconnect();
        socketSingleton = null;
        connectedToken = null;
      }
      const io = await getSocketIo();
      if (cancelled) return;
      socketSingleton = io(`${WS_URL}${ARENA_NAMESPACE}`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      connectedToken = token;
      wireSocket(socketSingleton, { setSkew });
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, setSkew, router, store]);

  const joinQueue = useCallback((mode: ArenaMode) => {
    if (!socketSingleton?.connected) {
      store.getState().applyError({
        code: 'INTERNAL',
        message: 'Chưa kết nối được Đấu trường. Vui lòng thử lại.',
      });
      return;
    }
    safeEmit(ARENA_EVENTS.QUEUE_JOIN, { mode });
    store.getState().startMatchmaking(mode);
  }, [store]);

  const leaveQueue = useCallback(() => {
    safeEmit(ARENA_EVENTS.QUEUE_LEAVE, {});
    store.getState().cancelMatchmaking();
  }, [store]);

  const submitAnswer = useCallback((answer: string) => {
    const state = store.getState();
    if (!state.match || !state.currentClue || state.answeredCorrectThisRound) return;
    safeEmit(ARENA_EVENTS.ANSWER_SUBMIT, {
      matchId: state.match.matchId,
      roundNumber: state.currentClue.roundNumber,
      answer,
      clientSentAt: Date.now(),
    });
  }, [store]);

  const rejoin = useCallback((matchId: string) => {
    safeEmit(ARENA_EVENTS.REJOIN, { matchId });
  }, []);

  const forfeitMatch = useCallback((matchId: string) => {
    safeEmit(ARENA_EVENTS.FORFEIT, { matchId });
  }, []);

  const ping = useCallback(() => {
    safeEmit(ARENA_EVENTS.PING, { clientNow: Date.now() });
  }, []);

  const disconnect = useCallback(() => {
    if (socketSingleton) {
      // Symmetric with the token-rotation path above — drop listeners
      // explicitly so they don't linger in memory until GC.
      socketSingleton.removeAllListeners();
      socketSingleton.disconnect();
      socketSingleton = null;
      connectedToken = null;
    }
    pendingEmits.length = 0;
    store.getState().setConnectionStatus('idle');
  }, [store]);

  const waitInRoom = useCallback((roomId: string) => {
    store.getState().setCurrentRoomId(roomId);
    safeEmit(ARENA_EVENTS.ROOM_WAIT, { roomId });
  }, [store]);

  const joinRoom = useCallback((code: string, password?: string) => {
    safeEmit(ARENA_EVENTS.ROOM_JOIN, { code, password });
  }, []);

  return {
    isConnected: connectionStatus === 'connected',
    joinQueue,
    leaveQueue,
    submitAnswer,
    rejoin,
    forfeitMatch,
    ping,
    disconnect,
    waitInRoom,
    joinRoom,
  };
}

function flushPendingEmits(socket: Socket) {
  while (pendingEmits.length > 0) {
    const e = pendingEmits.shift()!;
    socket.emit(e.event, e.payload);
  }
}

function wireSocket(socket: Socket, ctx: { setSkew: (n: number) => void }) {
  socket.on('connect', () => {
    useArenaStore.getState().setConnectionStatus('connected');
    socket.emit(ARENA_EVENTS.PING, { clientNow: Date.now() });
    flushPendingEmits(socket);
  });

  socket.io.on('reconnect_attempt', () => {
    useArenaStore.getState().setConnectionStatus('reconnecting');
  });

  socket.io.on('reconnect', () => {
    useArenaStore.getState().setConnectionStatus('connected');
    // Re-assert room/match attachment so the server can restore state
    // if it cleared this client's record while the socket was gone.
    const { currentRoomId, match } = useArenaStore.getState();
    if (currentRoomId) socket.emit(ARENA_EVENTS.ROOM_WAIT, { roomId: currentRoomId });
    if (match?.matchId) socket.emit(ARENA_EVENTS.REJOIN, { matchId: match.matchId });
    flushPendingEmits(socket);
  });

  socket.on('connect_error', () => {
    useArenaStore.getState().setConnectionStatus('disconnected');
  });

  socket.on(ARENA_EVENTS.HELLO, (e: ArenaHelloEvent) => {
    ctx.setSkew(Date.now() - e.serverTime);
  });

  socket.on(ARENA_EVENTS.PONG, (e: ArenaPongEvent) => {
    ctx.setSkew(Date.now() - e.serverTime);
  });

  socket.on(ARENA_EVENTS.QUEUE_WAITING, (e: ArenaQueueWaitingEvent) => {
    useArenaStore.getState().applyQueueWaiting(e);
  });

  socket.on(ARENA_EVENTS.MATCH_FOUND, (e: ArenaMatchFoundEvent) => {
    const myUserId = useAuthStore.getState().user?.id ?? '';
    useArenaStore.getState().applyMatchFound(e, myUserId);
    if (e.upcomingFirstImageUrl) {
      const img = new Image();
      img.src = e.upcomingFirstImageUrl;
    }
    currentRouter?.push(`/arena/match/${e.matchId}`);
  });

  socket.on(ARENA_EVENTS.STATE, (e: ArenaStateSnapshotEvent) => {
    const myUserId = useAuthStore.getState().user?.id ?? '';
    useArenaStore.getState().setServerClockSkewMs(Date.now() - e.serverTime);
    useArenaStore.getState().applyStateSnapshot(e, myUserId);
    if (e.match.upcomingFirstImageUrl) {
      const img = new Image();
      img.src = e.match.upcomingFirstImageUrl;
    }
  });

  socket.on(ARENA_EVENTS.ROUND_START, (e: ArenaRoundStartEvent) => {
    useArenaStore.getState().applyRoundStart(e.clue);
  });

  socket.on(ARENA_EVENTS.ANSWER_RESULT, (e: ArenaAnswerResultEvent) => {
    useArenaStore.getState().applyAnswerResult({
      userId: e.userId,
      isCorrect: e.isCorrect,
      attemptNumber: e.attemptNumber,
      responseTimeMs: e.responseTimeMs,
    });
  });

  socket.on(ARENA_EVENTS.ANSWER_REJECTED, (e: ArenaAnswerRejectedEvent) => {
    useArenaStore.getState().applyAnswerRejected(e);
  });

  socket.on(ARENA_EVENTS.ROUND_END, (e: ArenaRoundEndEvent) => {
    useArenaStore.getState().applyRoundEnd(e);
    if (e.nextRoundImageUrl) {
      const img = new Image();
      img.src = e.nextRoundImageUrl;
    }
  });

  socket.on(ARENA_EVENTS.MATCH_END, (e: ArenaMatchEndEvent) => {
    useArenaStore.getState().applyMatchEnd(e);
  });

  socket.on(ARENA_EVENTS.OPPONENT_DISCONNECTED, (e: ArenaOpponentDisconnectedEvent) => {
    useArenaStore.getState().applyOpponentDisconnected(e.graceRemainingMs);
  });

  socket.on(ARENA_EVENTS.OPPONENT_RECONNECTED, () => {
    useArenaStore.getState().applyOpponentReconnected();
  });

  socket.on(ARENA_EVENTS.OPPONENT_TYPING, () => {
    useArenaStore.getState().applyOpponentTyping();
  });

  socket.on(ARENA_EVENTS.ERROR, (e: ArenaErrorEvent) => {
    if (e.code === 'UNAUTHORIZED' || e.code === 'AUTH_EXPIRED') {
      window.location.reload();
      return;
    }
    if (e.code === 'REPLACED_BY_NEW_TAB') {
      currentRouter?.push('/arena?replaced=1');
      return;
    }
    useArenaStore.getState().applyError(e);
    console.warn('[arena]', e.code, e.message);
  });

  socket.on(ARENA_EVENTS.ROOM_ERROR, (e: { code: string; message?: string }) => {
    useArenaStore.getState().applyRoomError(e);
    console.warn('[arena.room]', e.code, e.message);
  });

  socket.on(ARENA_EVENTS.ROOM_CANCELLED, () => {
    useArenaStore.getState().applyRoomCancelled();
  });

  socket.on('disconnect', () => {
    useArenaStore.getState().setConnectionStatus('reconnecting');
  });
}
