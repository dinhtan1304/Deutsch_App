'use client';

/**
 * Grammar Trainer React Query hooks.
 * Queries: drill exercises (pool), stats, history, admin pool.
 * Mutations: record session, AI generate, import JSON, update status, delete.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  grammarTrainerApi,
  GenerateDto,
  RecordSessionDto,
  TrainerExercise,
  TrainerHistoryResponse,
  TrainerMode,
  TrainerStats,
  AdminExercisesResponse,
} from '@/lib/api/grammarTrainer';

export const trainerKeys = {
  all: ['grammar-trainer'] as const,
  exercises: (params: Record<string, unknown>) => [...trainerKeys.all, 'exercises', params] as const,
  stats: () => [...trainerKeys.all, 'stats'] as const,
  history: (params?: Record<string, unknown>) => [...trainerKeys.all, 'history', params] as const,
  adminExercises: (params?: Record<string, unknown>) => [...trainerKeys.all, 'admin', params] as const,
};

// ── Queries ──

/** Lấy đề drill từ pool. Chỉ fetch khi `enabled` (đã chọn xong setup). */
export function useTrainerExercises(
  params: { mode: TrainerMode; level: string; skillTags?: string[]; count?: number },
  enabled = true,
) {
  return useQuery<TrainerExercise[]>({
    queryKey: trainerKeys.exercises(params),
    queryFn: () => grammarTrainerApi.getExercises(params),
    enabled,
    staleTime: 0, // mỗi lần bắt đầu drill lấy bộ đề mới (ngẫu nhiên)
    gcTime: 0,
  });
}

export function useTrainerStats() {
  return useQuery<TrainerStats>({
    queryKey: trainerKeys.stats(),
    queryFn: () => grammarTrainerApi.getStats(),
    staleTime: 60 * 1000,
  });
}

export function useTrainerHistory(params?: { mode?: TrainerMode; page?: number; limit?: number }) {
  return useQuery<TrainerHistoryResponse>({
    queryKey: trainerKeys.history(params),
    queryFn: () => grammarTrainerApi.getHistory(params),
  });
}

export function useAdminTrainerExercises(params?: {
  mode?: string;
  level?: string;
  skillTag?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<AdminExercisesResponse>({
    queryKey: trainerKeys.adminExercises(params),
    queryFn: () => grammarTrainerApi.getAdminExercises(params),
  });
}

// ── Mutations ──

export function useRecordTrainerSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RecordSessionDto) => grammarTrainerApi.recordSession(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainerKeys.stats() });
      qc.invalidateQueries({ queryKey: trainerKeys.history() });
    },
  });
}

export function useGenerateExercises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: GenerateDto) => grammarTrainerApi.generate(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainerKeys.all });
    },
  });
}

export function useImportTrainerExercises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => grammarTrainerApi.importFromJson(files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainerKeys.all });
    },
  });
}

export function useUpdateExerciseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      grammarTrainerApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainerKeys.all });
    },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => grammarTrainerApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainerKeys.all });
    },
  });
}
