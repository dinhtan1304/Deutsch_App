import { apiGet } from './client';

export interface XpInfo {
  xp: number;
  level: number;
  name: string;
  nameVi: string;
  nextLevelXp: number;
  progress: number;
}

export const getXpInfo = () => apiGet<XpInfo>('/users/xp');
