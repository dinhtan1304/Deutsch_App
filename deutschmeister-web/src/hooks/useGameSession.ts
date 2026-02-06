'use client';

import { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@/lib/api/games';
import { GameType, Difficulty } from '@/types';
import { dashboardKeys } from '@/hooks/useDashboard';

/**
 * Hook to track game sessions in the backend.
 * Fire-and-forget: never blocks game UX, silently handles errors.
 *
 * Usage:
 *   const session = useGameSession('quick-quiz');
 *   // When game starts:
 *   await session.start(totalQuestions);
 *   // When game ends:
 *   session.end(score, bestStreak);
 */
export function useGameSession(gameType: GameType, difficulty: Difficulty = 'beginner') {
  const sessionIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const start = useCallback(async (totalQuestions: number) => {
    try {
      const session = await gamesApi.start({ gameType, difficulty, totalQuestions });
      sessionIdRef.current = session.id;
    } catch (e) {
      console.warn('[GameSession] Failed to start:', e);
      sessionIdRef.current = null;
    }
  }, [gameType, difficulty]);

  const end = useCallback(async (score: number, bestStreak: number, correctAnswers: number, wrongAnswers: number) => {
    if (!sessionIdRef.current) return;
    try {
      await gamesApi.end({
        sessionId: sessionIdRef.current,
        score,
        bestStreak,
        correctAnswers,
        wrongAnswers,
      });
      // Refresh dashboard data so Recent Activity updates
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['games', 'history'] });
    } catch (e) {
      console.warn('[GameSession] Failed to end:', e);
    } finally {
      sessionIdRef.current = null;
    }
  }, [queryClient]);

  return { start, end };
}