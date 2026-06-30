'use client';

import { apiGet, apiPost, apiPut, apiUpload } from './client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio?: string | null;
  coverImage?: string | null;
  isPublic?: boolean;
  createdAt: string;
}

export type UpdateProfilePayload = {
  name?: string;
  avatar?: string;
  bio?: string;
  coverImage?: string;
  isPublic?: boolean;
};

export interface PublicProfile {
  id: string;
  name: string | null;
  avatar: string | null;
  isPublic: boolean;
  isPrivate: boolean;
  bio?: string | null;
  coverImage?: string | null;
  xp?: number;
  level?: number;
  createdAt?: string;
  stats?: UserStats;
  subscription?: { plan: 'free' | 'premium' | 'lifetime' };
  xpInfo?: { xp: number; level: number; cefr: string; name?: string; nameVi?: string };
}

export interface Settings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  dailyGoal: number;
  // preferredLevel: stored in DB, synced to backend
  preferredLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all';
  showVietnamese: boolean;
  dailyReminder: boolean;
  weeklyEmailEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fields synced to backend (exist in DB schema)
export const BACKEND_SYNCED_SETTINGS: (keyof Settings)[] = [
  'theme', 'soundEnabled', 'dailyGoal', 'preferredLevel', 'showVietnamese', 'dailyReminder', 'weeklyEmailEnabled',
];

export interface UserStats {
  gamesPlayed: number;
  totalAnswers: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  favorites: number;
  wordsLearned: number;
}

export interface DailyBonusResult {
  claimed: boolean;
  xp: number;
  streak: number;
  alreadyClaimed?: boolean;
}

export interface StreakStatus {
  streak: number;
  activeToday: boolean;
}

// Only fields that the backend accepts for update (matches UpdateSettingsDto)
export type UpdateSettingsPayload = {
  theme?: 'light' | 'dark' | 'system';
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  dailyGoal?: number;
  preferredLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all';
  showVietnamese?: boolean;
  dailyReminder?: boolean;
  weeklyEmailEnabled?: boolean;
  webPushEnabled?: boolean;
};

export interface ErrorPattern {
  errorType: string;
  count: number;
  percentage: number;
  grammarSlug: string | null;
}

export interface SkillScore {
  score: number | null;
  sampleCount: number;
  trend: 'up' | 'down' | 'flat';
}

export interface SkillScores {
  reading: SkillScore;
  writing: SkillScore;
  listening: SkillScore;
  speaking: SkillScore;
  grammar: SkillScore;
  overall: number | null;
  weakestSkill: 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar' | null;
}

export const usersApi = {
  getProfile: async (): Promise<User> => {
    return apiGet<User>('/users/profile');
  },

  updateProfile: async (data: UpdateProfilePayload): Promise<User> => {
    return apiPut<User>('/users/profile', data);
  },

  getPublicProfile: async (id: string): Promise<PublicProfile> => {
    return apiGet<PublicProfile>(`/users/public/${encodeURIComponent(id)}`);
  },

  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    return apiUpload<{ url: string }>('/users/profile/avatar', fd);
  },

  uploadCover: async (file: File): Promise<{ url: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    return apiUpload<{ url: string }>('/users/profile/cover', fd);
  },

  getSettings: async (): Promise<Settings> => {
    return apiGet<Settings>('/users/settings');
  },

  updateSettings: async (data: UpdateSettingsPayload): Promise<Settings> => {
    return apiPut<Settings>('/users/settings', data);
  },

  getStats: async (): Promise<UserStats> => {
    return apiGet<UserStats>('/users/stats');
  },

  claimDailyBonus: async (): Promise<DailyBonusResult> => {
    return apiPost<DailyBonusResult>('/users/daily-bonus/claim', {});
  },

  getStreakStatus: async (): Promise<StreakStatus> => {
    return apiGet<StreakStatus>('/users/streak/status');
  },

  getErrorPatterns: async (): Promise<ErrorPattern[]> => {
    return apiGet<ErrorPattern[]>('/users/me/error-patterns');
  },

  getSkills: async (): Promise<SkillScores> => {
    return apiGet<SkillScores>('/users/me/skills');
  },
};
