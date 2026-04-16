import { apiGet } from './client';

export interface XpInfo {
  xp: number;
  level: number;
  name: string;
  nameVi: string;
  cefr: string;
  cefrLabel: string;
  currentLevelXp: number;
  nextLevelXp: number;
  xpInLevel: number;
  xpNeeded: number;
  progress: number;
}

export const getXpInfo = () => apiGet<XpInfo>('/users/xp');
