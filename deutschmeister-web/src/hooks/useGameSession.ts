'use client';

import { useRef, useCallback, useMemo } from 'react';
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
  const answersRef = useRef<{ wordId: string; selectedAnswer: string; replays?: number }[]>([]);
  const startingRef = useRef<Promise<void> | null>(null);
  const endingRef = useRef(false);
  const generationRef = useRef(0);
  const queryClient = useQueryClient();

  const start = useCallback((totalQuestions: number) => {
    const generation = ++generationRef.current;
    sessionIdRef.current = null;
    answersRef.current = [];
    endingRef.current = false;
    const pending = (async () => {
    try {
      const session = await gamesApi.start({ gameType, difficulty, totalQuestions });
      if (generation !== generationRef.current) return;
      sessionIdRef.current = session.id;
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.warn('[GameSession] Failed to start:', e);
      if (generation === generationRef.current) sessionIdRef.current = null;
    }
    })();
    startingRef.current = pending;
    return pending;
  }, [gameType, difficulty]);

  const recordAnswer = useCallback((wordId: string, selectedAnswer: string, replays?: number) => {
    if (endingRef.current) return;
    answersRef.current.push({ wordId, selectedAnswer, ...(replays !== undefined ? { replays } : {}) });
  }, []);

  const end = useCallback(async (score: number, bestStreak: number, correctAnswers: number, wrongAnswers: number) => {
    if (endingRef.current) return;
    endingRef.current = true;
    const generation = generationRef.current;
    await startingRef.current;
    if (generation !== generationRef.current || !sessionIdRef.current) return;
    try {
      await gamesApi.end({
        sessionId: sessionIdRef.current,
        score,
        bestStreak,
        correctAnswers,
        wrongAnswers,
        answers: [...answersRef.current],
      });
      // Refresh dashboard data so Recent Activity updates
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['games', 'history'] });
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.warn('[GameSession] Failed to end:', e);
    } finally {
      if (generation === generationRef.current) sessionIdRef.current = null;
    }
  }, [queryClient]);

  // Stable object reference — prevents useEffect([phase, session]) from
  // re-running on every render during the result phase, which would call
  // session.end() multiple times before sessionIdRef.current is nullified.
  return useMemo(() => ({ start, end, recordAnswer }), [start, end, recordAnswer]);
}
