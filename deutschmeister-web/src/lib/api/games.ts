import { apiGet, apiPost } from './client';
import { GameSession, StartGameDto } from '@/types';

export const gamesApi = {
  start: async (data: StartGameDto): Promise<GameSession> => {
    return apiPost<GameSession>('/games/start', data);
  },

  submitAnswer: async (data: {
    sessionId: string;
    wordId: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    responseTime: number;
  }): Promise<{ success: boolean }> => {
    return apiPost('/games/answer', data);
  },

  end: async (data: {
    sessionId: string;
    score: number;
    bestStreak: number;
  }): Promise<GameSession> => {
    return apiPost<GameSession>('/games/end', data);
  },

  getHistory: async (limit = 20): Promise<GameSession[]> => {
    return apiGet<GameSession[]>(`/games/history?limit=${limit}`);
  },

  getLeaderboard: async (gameType?: string, limit = 10): Promise<(GameSession & { user: { id: string; name: string } })[]> => {
    const params = new URLSearchParams();
    if (gameType) params.set('gameType', gameType);
    params.set('limit', limit.toString());
    return apiGet(`/games/leaderboard?${params.toString()}`);
  },
};