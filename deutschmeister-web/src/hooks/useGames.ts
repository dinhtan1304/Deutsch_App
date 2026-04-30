'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@/lib/api/games';
import { StartGameDto } from '@/types';

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
  return useQuery({
    queryKey: ['games', 'history', limit],
    queryFn: () => gamesApi.getHistory(limit),
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