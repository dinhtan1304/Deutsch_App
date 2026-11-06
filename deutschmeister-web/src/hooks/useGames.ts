'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@/lib/api/games';
import { StartGameDto } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export function useStartGame() {
  return useMutation({
    mutationFn: (data: StartGameDto) => gamesApi.start(data),
  });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: (data: {
      sessionId: string;
      wordId: string;
      selectedAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      responseTime: number;
    }) => gamesApi.submitAnswer(data),
  });
}

export function useEndGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { sessionId: string; score: number; bestStreak: number; correctAnswers: number; wrongAnswers: number }) => 
      gamesApi.end(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
    },
  });
}

export function useGameHistory(limit = 20) {
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['games', 'history', limit],
    queryFn: () => gamesApi.getHistory(limit),
    enabled: authenticated,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLeaderboard(gameType?: string, limit = 10) {
  return useQuery({
    queryKey: ['games', 'leaderboard', gameType, limit],
    queryFn: () => gamesApi.getLeaderboard(gameType, limit),
    staleTime: 5 * 60_000,
  });
}

export const gameKeys = {
  all: ['games'] as const,
  // Under ['games', 'history'] on purpose: every finished game already
  // invalidates that prefix (useGameSession / useEndGame), so per-rule
  // accuracy refreshes after each round with no extra wiring.
  genderRuleStats: () => [...gameKeys.all, 'history', 'gender-rule-stats'] as const,
};

/** Accuracy per der/die/das spelling rule; signed-in users only. */
export function useGenderRuleStats() {
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: gameKeys.genderRuleStats(),
    queryFn: () => gamesApi.getGenderRuleStats(),
    enabled: authenticated,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
