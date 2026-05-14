'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/client';
import type { SpeakingMessage } from '@/lib/api/speakingRooms';
import { speakingRoomKeys } from '@/hooks/useSpeakingRooms';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deutschmeister-api-production.up.railway.app/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

let sharedSocket: Socket | null = null;
let sharedConnectCount = 0;

function getSocket(): Socket {
  if (sharedSocket && sharedSocket.connected) return sharedSocket;
  if (sharedSocket) return sharedSocket;
  const token = getAccessToken();
  sharedSocket = io(`${SOCKET_URL}/speaking-rooms`, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });
  return sharedSocket;
}

export interface UseSpeakingRoomSocketReturn {
  socket: Socket | null;
  connected: boolean;
  messages: SpeakingMessage[];
  typingUserIds: Set<string>;
  sendText: (text: string) => void;
  setTyping: (isTyping: boolean) => void;
}

export function useSpeakingRoomSocket(
  roomId: string | null,
  initialMessages: SpeakingMessage[] = [],
): UseSpeakingRoomSocketReturn {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<SpeakingMessage[]>(initialMessages);
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const initialMessagesRef = useRef(initialMessages);
  const qc = useQueryClient();

  useEffect(() => {
    initialMessagesRef.current = initialMessages;
  }, [initialMessages]);

  useEffect(() => {
    setMessages(initialMessagesRef.current);
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    sharedConnectCount += 1;

    const onConnect = () => {
      setConnected(true);
      if (roomId) socket.emit('room:join', { roomId });
    };
    const onDisconnect = () => setConnected(false);
    const onMessage = (msg: SpeakingMessage) => {
      if (!roomId || msg.roomId !== roomId) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    const onTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    const onParticipantChange = () => {
      if (roomId) qc.invalidateQueries({ queryKey: speakingRoomKeys.detail(roomId) });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onMessage);
    socket.on('typing', onTyping);
    socket.on('room:participant_joined', onParticipantChange);
    socket.on('room:participant_left', onParticipantChange);

    if (socket.connected) onConnect();

    return () => {
      if (roomId) socket.emit('room:leave', { roomId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onMessage);
      socket.off('typing', onTyping);
      socket.off('room:participant_joined', onParticipantChange);
      socket.off('room:participant_left', onParticipantChange);
      sharedConnectCount = Math.max(0, sharedConnectCount - 1);
      if (sharedConnectCount === 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, [roomId]);

  return {
    socket: socketRef.current,
    connected,
    messages,
    typingUserIds,
    sendText: (text) => {
      if (!roomId) return;
      socketRef.current?.emit('message:send', { roomId, text });
    },
    setTyping: (isTyping) => {
      if (!roomId) return;
      socketRef.current?.emit('typing', { roomId, isTyping });
    },
  };
}

export function getSpeakingRoomSocket(): Socket | null {
  return sharedSocket;
}

/**
 * Open a socket connection for presence-only purposes (e.g. matchmaking page
 * needs to receive `match:found` without joining any room).
 *
 * Returns the connected socket. The caller is responsible for adding/removing
 * listeners. The socket is shared with useSpeakingRoomSocket — disconnect when
 * the last consumer unmounts.
 */
export function useSpeakingRoomPresence(active: boolean): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!active) return;
    const s = getSocket();
    sharedConnectCount += 1;
    setSocket(s);
    return () => {
      sharedConnectCount = Math.max(0, sharedConnectCount - 1);
      if (sharedConnectCount === 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, [active]);

  return socket;
}
