'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  subscriptionsApi,
  Plan,
  MySubscription,
  UpgradeResponse,
  QuotaInfo,
  PracticeFeat,
  BillingPeriod,
  PromoValidation,
  LifetimeRemaining,
  BetaStatus,
} from '@/lib/api/subscriptions';

// ── Query Keys ──

export const subscriptionKeys = {
  all: ['subscription'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  me: () => [...subscriptionKeys.all, 'me'] as const,
  quota: (feature: PracticeFeat) => [...subscriptionKeys.all, 'quota', feature] as const,
  lifetimeRemaining: () => [...subscriptionKeys.all, 'lifetime-remaining'] as const,
  betaStatus: () => [...subscriptionKeys.all, 'beta-status'] as const,
};

// ── Queries ──

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: subscriptionKeys.plans(),
    queryFn: () => subscriptionsApi.getPlans(),
    staleTime: 5 * 60 * 1000, // 5min — prices can change after deploy
  });
}

export function useMySubscription(enabled = true) {
  return useQuery<MySubscription>({
    queryKey: subscriptionKeys.me(),
    queryFn: () => subscriptionsApi.getMySubscription(),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useCheckQuota(feature: PracticeFeat, enabled = true) {
  return useQuery<QuotaInfo>({
    queryKey: subscriptionKeys.quota(feature),
    queryFn: () => subscriptionsApi.checkQuota(feature),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useLifetimeRemaining() {
  return useQuery<LifetimeRemaining>({
    queryKey: subscriptionKeys.lifetimeRemaining(),
    queryFn: () => subscriptionsApi.getLifetimeRemaining(),
    staleTime: 5 * 60 * 1000, // 5min — count doesn't change often
  });
}

// ── Mutations ──

export function useRequestUpgrade() {
  const qc = useQueryClient();
  return useMutation<
    UpgradeResponse,
    Error,
    { period: BillingPeriod; promoCode?: string }
  >({
    mutationFn: ({ period, promoCode }) =>
      subscriptionsApi.requestUpgrade(period, promoCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.me() });
      qc.invalidateQueries({ queryKey: subscriptionKeys.lifetimeRemaining() });
    },
  });
}

export function useValidatePromo() {
  return useMutation<
    PromoValidation,
    Error,
    { code: string; period: BillingPeriod }
  >({
    mutationFn: ({ code, period }) =>
      subscriptionsApi.validatePromo(code, period),
  });
}

export function useBetaStatus() {
  return useQuery<BetaStatus>({
    queryKey: subscriptionKeys.betaStatus(),
    queryFn: () => subscriptionsApi.getBetaStatus(),
    staleTime: 5 * 60 * 1000, // 5min
  });
}

// ── Helpers ──

export function useIsPremium(enabled = true): boolean {
  const { data } = useMySubscription(enabled);
  return (
    (data?.plan === 'premium' || data?.plan === 'lifetime') &&
    data?.status === 'active'
  );
}

export function useBetaOpen(): boolean {
  const { data } = useBetaStatus();
  return data?.betaOpen ?? false;
}

/**
 * Exam "đề chuẩn" features are unlocked either when the user is Premium
 * or when the backend has BETA_OPEN=true. Use this hook to gate exam UI.
 */
export function useIsExamUnlocked(): boolean {
  const isPremium = useIsPremium();
  const betaOpen = useBetaOpen();
  return isPremium || betaOpen;
}
