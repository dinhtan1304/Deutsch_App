'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  referralsApi,
  ReferralInfo,
  ReferralWithdrawal,
  RequestWithdrawalPayload,
  ValidateReferralCodeResult,
} from '@/lib/api/referrals';
import { subscriptionKeys } from './useSubscription';

export const referralKeys = {
  all: ['referral'] as const,
  me: () => [...referralKeys.all, 'me'] as const,
  validate: (code: string) => [...referralKeys.all, 'validate', code] as const,
};

export function useMyReferralInfo(enabled = true) {
  return useQuery<ReferralInfo>({
    queryKey: referralKeys.me(),
    queryFn: () => referralsApi.getMine(),
    enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Validate a referral code on the register form. Debouncing is the caller's
 * responsibility — pass an empty string to disable.
 */
export function useValidateReferralCode(code: string, enabled = true) {
  const trimmed = code.trim().toUpperCase();
  return useQuery<ValidateReferralCodeResult>({
    queryKey: referralKeys.validate(trimmed),
    queryFn: () => referralsApi.validate(trimmed),
    enabled: enabled && trimmed.length >= 4,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation<ReferralWithdrawal, Error, RequestWithdrawalPayload>({
    mutationFn: (payload) => referralsApi.requestWithdrawal(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: referralKeys.me() });
      qc.invalidateQueries({ queryKey: subscriptionKeys.me() });
    },
  });
}
