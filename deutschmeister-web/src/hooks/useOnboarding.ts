import { useMutation } from '@tanstack/react-query';
import { onboardingApi } from '@/lib/api/onboarding';

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: onboardingApi.complete,
  });
}
