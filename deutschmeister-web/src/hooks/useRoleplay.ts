'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  roleplayApi,
  RoleplayScenario,
  RoleplaySession,
  RoleplayLevel,
  RoleplayStatus,
  RoleplayHistoryResponse,
  SendMessageResponse,
} from '@/lib/api/roleplay';

export const roleplayKeys = {
  all: ['roleplay'] as const,
  scenarios: (level?: RoleplayLevel) =>
    [...roleplayKeys.all, 'scenarios', level ?? 'all'] as const,
  history: (params?: { page?: number; limit?: number; status?: RoleplayStatus }) =>
    [...roleplayKeys.all, 'history', params ?? {}] as const,
  session: (id: string) => [...roleplayKeys.all, 'session', id] as const,
};

// ── Queries ──

export function useRoleplayScenarios(level?: RoleplayLevel) {
  return useQuery<RoleplayScenario[]>({
    queryKey: roleplayKeys.scenarios(level),
    queryFn: () => roleplayApi.getScenarios(level),
    staleTime: 60 * 60 * 1000,
  });
}

export function useRoleplayHistory(params?: {
  page?: number;
  limit?: number;
  status?: RoleplayStatus;
}) {
  return useQuery<RoleplayHistoryResponse>({
    queryKey: roleplayKeys.history(params),
    queryFn: () => roleplayApi.getHistory(params),
    staleTime: 30 * 1000,
  });
}

export function useRoleplaySession(id: string, enabled = true) {
  return useQuery<RoleplaySession>({
    queryKey: roleplayKeys.session(id),
    queryFn: () => roleplayApi.getSession(id),
    enabled: enabled && !!id,
  });
}

// ── Mutations ──

export function useStartRoleplay() {
  const qc = useQueryClient();
  return useMutation<
    RoleplaySession,
    Error,
    { scenario: string; level: RoleplayLevel }
  >({
    mutationFn: ({ scenario, level }) => roleplayApi.startSession(scenario, level),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...roleplayKeys.all, 'history'] });
    },
  });
}

export function useSendRoleplayMessage(sessionId: string) {
  const qc = useQueryClient();
  return useMutation<SendMessageResponse, Error, { text: string }>({
    mutationFn: ({ text }) => roleplayApi.sendMessage(sessionId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleplayKeys.session(sessionId) });
    },
  });
}

export function useEndRoleplay(sessionId: string) {
  const qc = useQueryClient();
  return useMutation<RoleplaySession, Error, void>({
    mutationFn: () => roleplayApi.endSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleplayKeys.session(sessionId) });
      qc.invalidateQueries({ queryKey: [...roleplayKeys.all, 'history'] });
    },
  });
}

export function useDeleteRoleplay() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { sessionId: string }>({
    mutationFn: ({ sessionId }) => roleplayApi.deleteSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...roleplayKeys.all, 'history'] });
    },
  });
}
