'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCheckQuota, useIsPremium } from '@/hooks/useSubscription';
import { ACCENT, STATUS } from '@/lib/tokens';

interface Props {
  /** Hide the entire counter when shadowing is paused/inactive. */
  enabled?: boolean;
}

export function AiReviewCounter({ enabled = true }: Props) {
  const t = useTranslations('practice.dictation.shadow.components');
  const { data: quota, isLoading } = useCheckQuota('shadowing', enabled);
  const isPremium = useIsPremium();

  if (!enabled) return null;

  if (isLoading || !quota) {
    return (
      <p className="text-xs font-medium opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
        {t('aiLoading')}
      </p>
    );
  }

  // Premium / unlimited
  if (quota.limit < 0 || isPremium) {
    return (
      <p
        className="text-xs font-bold flex items-center justify-center gap-1.5"
        style={{ color: ACCENT.reading }}
      >
        <span>⭐</span>
        {t.rich('aiUnlimited', { b: (chunks) => <strong>{chunks}</strong> })}
      </p>
    );
  }

  const remaining = Math.max(0, quota.limit - quota.used);
  const periodLabel = quota.window === 'daily' ? t('aiPeriodDaily') : t('aiPeriodWeekly');

  if (remaining === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p
          className="text-xs font-bold"
          style={{ color: STATUS.danger }}
        >
          {t('aiExhausted', { period: quota.window === 'daily' ? t('aiPeriodToday') : t('aiPeriodThisWeek') })}
        </p>
        <Link
          href="/pricing"
          className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all hover:brightness-110 active:scale-95 text-white"
          style={{ background: ACCENT.premium }}
        >
          {t('aiUpgrade')}
        </Link>
      </div>
    );
  }

  // Free, has remaining
  return (
    <p
      className="text-xs font-medium"
      style={{ color: 'var(--theme-text-secondary)' }}
    >
      {t.rich('aiRemaining', {
        remaining,
        limit: quota.limit,
        period: periodLabel,
        b: (chunks) => <strong style={{ color: ACCENT.reading }}>{chunks}</strong>,
      })}
    </p>
  );
}
