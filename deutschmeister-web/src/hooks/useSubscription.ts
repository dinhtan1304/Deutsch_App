'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  subscriptionsApi,
  Plan,
  MySubscription,
  UpgradeResponse,
  QuotaInfo,
  PracticeFeat,
} from '@/lib/api/subscriptions';

// ── Query Keys ──

export const subscriptionKeys = {
  all: ['subscription'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  me: () => [...subscriptionKeys.all, 'me'] as const,
  quota: (feature: PracticeFeat) => [...subscriptionKeys.all, 'quota', feature] as const,
};

// ── Queries ──

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: subscriptionKeys.plans(),
    queryFn: () => subscriptionsApi.getPlans(),
    staleTime: 60 * 60 * 1000, // 1h — plans rarely change
  });
}

export function useMySubscription() {
  return useQuery<MySubscription>({
    queryKey: subscriptionKeys.me(),
    queryFn: () => subscriptionsApi.getMySubscription(),
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

// ── Mutations ──

export function useRequestUpgrade() {
  const qc = useQueryClient();
  return useMutation<UpgradeResponse, Error, 'monthly' | 'yearly'>({
    mutationFn: (period) => subscriptionsApi.requestUpgrade(period),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.me() });
    },
  });
}

// ── Helpers ──

export function useIsPremium(): boolean {
  const { data } = useMySubscription();
  return data?.plan === 'premium' && data?.status === 'active';
}
