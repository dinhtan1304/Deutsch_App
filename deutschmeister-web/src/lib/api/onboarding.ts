import { apiPatch } from './client';

export const onboardingApi = {
  complete: (data: { preferredLevel?: string; dailyGoal?: number }) =>
    apiPatch<{ message: string }>('/users/onboarding', data),
};
