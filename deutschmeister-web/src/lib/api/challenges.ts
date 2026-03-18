import { apiGet } from './client';

export interface ChallengeProgress {
  id: string;
  challengeKey: string;
  title: string;
  titleVi: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
  xpRewarded: boolean;
  weekStart: string;
  completedAt: string | null;
}

export const getWeeklyChallenges = () => apiGet<ChallengeProgress[]>('/challenges/weekly');
export const getChallengeHistory = () => apiGet<ChallengeProgress[]>('/challenges/history');
