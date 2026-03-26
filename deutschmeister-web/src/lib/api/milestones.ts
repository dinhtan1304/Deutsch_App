import { apiGet } from './client';

export interface UnlockedAchievement {
  key: string;
  name: string;
  nameVi: string;
  icon: string;
}

export const milestonesApi = {
  check: () => apiGet<UnlockedAchievement[]>('/dashboard/milestones'),
};
