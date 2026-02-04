'use client';

import { apiGet, apiPut } from './client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
}

export interface Settings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  dailyGoal: number;
  preferredLevel: string;
  showVietnamese: boolean;
}

export interface UserStats {
  gamesPlayed: number;
  totalAnswers: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  favorites: number;
  wordsLearned: number;
}

export const usersApi = {
  getProfile: async (): Promise<User> => {
    return apiGet<User>('/users/profile');
  },

  updateProfile: async (data: { name?: string; avatar?: string }): Promise<User> => {
    return apiPut<User>('/users/profile', data);
  },

  getSettings: async (): Promise<Settings> => {
    return apiGet<Settings>('/users/settings');
  },

  updateSettings: async (data: Partial<Settings>): Promise<Settings> => {
    return apiPut<Settings>('/users/settings', data);
  },

  getStats: async (): Promise<UserStats> => {
    return apiGet<UserStats>('/users/stats');
  },
};