'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCheckQuota, useIsPremium } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from './UpgradeModal';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import type { PracticeFeat } from '@/lib/api/subscriptions';

interface Props {
  feature: PracticeFeat;
  /** Vietnamese feature name shown in the banner. e.g. "Writing AI", "Roleplay AI". */
  label: string;
  /** Optional context tag passed to UpgradeModal for analytics. */
  featureContext?: string;
}

type QuotaT = ReturnType<typeof useTranslations<'subscription.quota'>>;

function formatResetHint(resetsAt: string | undefined, window: 'daily' | 'weekly', t: QuotaT): string {
  if (!resetsAt) {
    return window === 'daily' ? t('resetDailyDefault') : t('resetWeeklyDefault');
  }
  const reset = new Date(resetsAt);
  const now = new Date();
  const diffMs = reset.getTime() - now.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.floor(diffHours / 24);

  if (window === 'daily') {
    if (diffHours < 1) return t('resetUnderHour');
    return t('resetHours', { h: diffHours });
  }
  if (diffDays === 0) return t('resetHours', { h: diffHours });
  if (diffDays === 1) return t('resetTomorrow');
  return t('resetDays', { d: diffDays });
}

/**
 * Sticky quota banner shown at the top of practice pages. Renders nothing for
 * premium users or while loading. For free users, displays usage progress with
 * graceful color escalation (green → amber → red) and an upgrade CTA.
 *
 * Pair with <QuotaPaywall /> at the action site — banner gives ambient awareness,
 * paywall blocks the action when quota is depleted.
 */
export function QuotaBanner({ feature, label, featureContext }: Props) {
  const t = useTranslations('subscription.quota');
  const tc = useTranslations('subscription.common');
  const { isAuthenticated } = useAuthStore();
  const isPremium = useIsPremium(isAuthenticated);
  const { data: quota, isLoading } = useCheckQuota(feature, isAuthenticated);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!isAuthenticated || isLoading || !quota) return null;
  if (isPremium || quota.limit < 0) return null; // unlimited

  const used = Math.min(quota.used, quota.limit);
  const remaining = Math.max(0, quota.limit - used);
  const percent = (used / quota.limit) * 100;
  const depleted = remaining === 0;
  const lastOne = remaining === 1;

  const accent = depleted ? STATUS.danger : lastOne ? STATUS.warning : ACCENT.reading;
  const periodLabel = quota.window === 'daily' ? t('periodDaily') : t('periodWeekly');
  const resetHint = formatResetHint(quota.resetsAt, quota.window, t);

  return (
    <>
      <div
        className="rounded-xl border px-4 py-3 mb-4 flex items-center gap-3 flex-wrap"
        style={{
          borderColor: depleted || lastOne ? `${accent}55` : 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)',
        }}
        role="status"
        aria-live="polite"
      >
        <div className="flex-1 min-w-50">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
              {label} {periodLabel}:{' '}
              <strong style={{ color: accent }}>
                {used}/{quota.limit}
              </strong>
            </span>
            <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              {resetHint}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percent}%`,
                background: depleted
                  ? GRADIENT.dangerSolidH
                  : lastOne
                  ? GRADIENT.xpGoldH
                  : GRADIENT.readingGreenH,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-transform hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          style={{ background: GRADIENT.premium }}
        >
          {depleted ? tc('upgradeNow') : tc('premiumFrom')}
        </button>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="lite_monthly"
        featureContext={featureContext ?? label}
      />
    </>
  );
}
