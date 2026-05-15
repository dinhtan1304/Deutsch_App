'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  speakingRoomsApi,
  CreateRoomDto,
  EnqueueMatchDto,
  MatchResult,
  SpeakingMessage,
  SpeakingRoom,
  SpeakingRoomDetail,
  SpeakingRoomQuota,
  SpeakingRoomStats,
  SpeakingSuggestion,
} from '@/lib/api/speakingRooms';

export const speakingRoomKeys = {
  all: ['speaking-rooms'] as const,
  list: (filter?: { cefrLevel?: string; topic?: string }) =>
    [...speakingRoomKeys.all, 'list', filter ?? {}] as const,
  detail: (id: string) => [...speakingRoomKeys.all, 'detail', id] as const,
  suggestions: (id: string) => [...speakingRoomKeys.all, 'suggestions', id] as const,
  quota: () => [...speakingRoomKeys.all, 'quota'] as const,
  stats: () => [...speakingRoomKeys.all, 'stats'] as const,
  iceConfig: () => [...speakingRoomKeys.all, 'ice-config'] as const,
  myQueue: () => [...speakingRoomKeys.all, 'my-queue'] as const,
};

export function useSpeakingRoomsList(filter?: { cefrLevel?: string; topic?: string }) {
  return useQuery<SpeakingRoom[]>({
    queryKey: speakingRoomKeys.list(filter),
    queryFn: () => speakingRoomsApi.list(filter),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useSpeakingRoom(id: string, enabled = true) {
  return useQuery<SpeakingRoomDetail>({
    queryKey: speakingRoomKeys.detail(id),
    queryFn: () => speakingRoomsApi.get(id),
    enabled: enabled && !!id,
  });
}

export function useSpeakingRoomSuggestions(id: string) {
  return useQuery<SpeakingSuggestion>({
    queryKey: speakingRoomKeys.suggestions(id),
    queryFn: () => speakingRoomsApi.getSuggestions(id),
    enabled: false,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSpeakingRoomQuota() {
  return useQuery<SpeakingRoomQuota>({
    queryKey: speakingRoomKeys.quota(),
    queryFn: () => speakingRoomsApi.getQuota(),
    staleTime: 30 * 1000,
  });
}

export function useSpeakingRoomStats() {
  return useQuery<SpeakingRoomStats>({
    queryKey: speakingRoomKeys.stats(),
    queryFn: () => speakingRoomsApi.getStats(),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useIceConfig() {
  return useQuery({
    queryKey: speakingRoomKeys.iceConfig(),
    queryFn: () => speakingRoomsApi.getIceConfig(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useMyQueueEntry(enabled = true) {
  return useQuery({
    queryKey: speakingRoomKeys.myQueue(),
    queryFn: () => speakingRoomsApi.getMyQueueEntry(),
    enabled,
    refetchInterval: 10_000,
  });
}

export function useCreateSpeakingRoom() {
  const qc = useQueryClient();
  return useMutation<SpeakingRoom, Error, CreateRoomDto>({
    mutationFn: (dto) => speakingRoomsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: speakingRoomKeys.all });
    },
  });
}

export function useJoinSpeakingRoom() {
  const qc = useQueryClient();
  return useMutation<SpeakingRoom, Error, { id: string }>({
    mutationFn: ({ id }) => speakingRoomsApi.join(id),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: speakingRoomKeys.detail(id) });
      qc.invalidateQueries({ queryKey: speakingRoomKeys.quota() });
    },
  });
}

export function useJoinByCode() {
  const qc = useQueryClient();
  return useMutation<SpeakingRoom, Error, { code: string }>({
    mutationFn: ({ code }) => speakingRoomsApi.joinByCode(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: speakingRoomKeys.all });
    },
  });
}

export function useLeaveSpeakingRoom() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string }>({
    mutationFn: ({ id }) => speakingRoomsApi.leave(id),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: speakingRoomKeys.detail(id) });
      qc.invalidateQueries({ queryKey: speakingRoomKeys.all });
    },
  });
}

export function useEnqueueMatch() {
  const qc = useQueryClient();
  return useMutation<MatchResult, Error, EnqueueMatchDto>({
    mutationFn: (dto) => speakingRoomsApi.enqueueMatch(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: speakingRoomKeys.quota() });
      qc.invalidateQueries({ queryKey: speakingRoomKeys.myQueue() });
    },
  });
}

export function useDequeueMatch() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: () => speakingRoomsApi.dequeueMatch(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: speakingRoomKeys.myQueue() });
    },
  });
}

export function useSendSpeakingMessage(roomId: string) {
  const qc = useQueryClient();
  return useMutation<SpeakingMessage, Error, { text: string }>({
    mutationFn: ({ text }) => speakingRoomsApi.sendMessage(roomId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: speakingRoomKeys.detail(roomId) });
    },
  });
}
