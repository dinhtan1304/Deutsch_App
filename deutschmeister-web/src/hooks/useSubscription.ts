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

export function useMySubscription(enabled = true, refetchInterval?: number | false) {
  return useQuery<MySubscription>({
    queryKey: subscriptionKeys.me(),
    queryFn: () => subscriptionsApi.getMySubscription(),
    enabled,
    staleTime: 60 * 1000,
    refetchInterval,
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

function isSubActive(sub: MySubscription | undefined): boolean {
  if (!sub || sub.status !== 'active') return false;
  if (!sub.expiresAt) return true; // lifetime
  return new Date(sub.expiresAt) > new Date();
}

/**
 * True when the user has ANY active paid plan: premium_lite, premium, lifetime,
 * exam_bundle. Use this for gates that any paid user should bypass (e.g.
 * practice-quota counters in the UI).
 */
export function useIsPremium(enabled = true): boolean {
  const { data } = useMySubscription(enabled);
  if (!isSubActive(data)) return false;
  return ['premium_lite', 'premium', 'lifetime', 'exam_bundle'].includes(data!.plan);
}

/** Specifically Premium Lite (entry tier). */
export function useIsPremiumLite(enabled = true): boolean {
  const { data } = useMySubscription(enabled);
  return isSubActive(data) && data!.plan === 'premium_lite';
}

/**
 * "Full" premium parity — premium, lifetime, or exam_bundle. NOT premium_lite.
 * Use this to gate features that Lite does NOT include (exam mode, AI Partner
 * Voice, premium analytics).
 */
export function useHasExamAccess(enabled = true): boolean {
  const { data } = useMySubscription(enabled);
  if (!isSubActive(data)) return false;
  return ['premium', 'lifetime', 'exam_bundle'].includes(data!.plan);
}

export function useBetaOpen(): boolean {
  const { data } = useBetaStatus();
  return data?.betaOpen ?? false;
}

/**
 * Whether the user can access ALL content levels (A1–C2). Free/guest are
 * restricted to A1 only. Mirrors backend `getAllowedLevels`: any active paid
 * plan unlocks every level, and BETA_OPEN unlocks everything for everyone.
 */
export function useAllLevelsUnlocked(): boolean {
  const isPremium = useIsPremium();
  const betaOpen = useBetaOpen();
  return isPremium || betaOpen;
}

/**
 * Exam "đề chuẩn" features are unlocked either when the user has exam access
 * (premium/lifetime/exam_bundle) or when the backend has BETA_OPEN=true.
 * Premium Lite does NOT unlock exam routes — they hit PremiumGuard.
 */
export function useIsExamUnlocked(): boolean {
  const hasAccess = useHasExamAccess();
  const betaOpen = useBetaOpen();
  return hasAccess || betaOpen;
}
