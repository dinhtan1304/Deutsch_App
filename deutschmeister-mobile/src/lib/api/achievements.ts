import { apiGet } from './client';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  icon: string;
  xpReward: number;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export const getAchievements = () => apiGet<Achievement[]>('/achievements');
