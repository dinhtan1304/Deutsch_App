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

export interface DailyMission {
  id: string;
  localDate: string;
  missionKey: string;
  title: string;
  titleVi: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
  xpRewarded: boolean;
  completedAt: string | null;
  metadata?: {
    href?: string;
    description?: string;
    unit?: string;
    poolVersion?: string;
  };
}

export const getWeeklyChallenges = () => apiGet<ChallengeProgress[]>('/challenges/weekly');
export const getChallengeHistory = () => apiGet<ChallengeProgress[]>('/challenges/history');
export const getDailyMissions = () => apiGet<DailyMission[]>('/challenges/daily');
export const getDailyMissionHistory = () => apiGet<DailyMission[]>('/challenges/daily/history');
