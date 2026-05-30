'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { SpeakingRoomQuota } from '@/lib/api/speakingRooms';
import { ACCENT } from '@/lib/tokens';

export function QuotaBanner({ quota }: { quota?: SpeakingRoomQuota }) {
  const t = useTranslations('speakingRooms.components');
  if (!quota || quota.isPremium) return null;

  const remaining = Math.max(0, quota.limit - quota.used);
  const isExhausted = remaining === 0;
  const isLow = remaining === 1;

  const periodLabel = quota.window === 'weekly' ? t('periodWeekly') : t('periodDaily');

  return (
    <div
      className="my-3 p-3 rounded-2xl flex items-center gap-3"
      style={{
        backgroundColor: isExhausted ? 'rgba(239,68,68,0.08)' : isLow ? 'rgba(245,158,11,0.08)' : 'var(--theme-bg-card)',
        border: `1px solid ${isExhausted ? '#EF4444' : isLow ? '#F59E0B' : 'var(--theme-border)'}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${ACCENT.speaking}1A`, color: ACCENT.speaking }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
          {t.rich('quotaRemaining', { remaining, limit: quota.limit, period: periodLabel, b: (chunks) => <strong>{chunks}</strong> })}
        </p>
        <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
          {isExhausted ? t('quotaExhaustedHint') : t('quotaNormalHint')}
        </p>
      </div>
      {(isExhausted || isLow) && (
        <Link
          href="/pricing"
          className="px-3 py-1.5 rounded-lg text-sm font-bold text-white whitespace-nowrap"
          style={{ backgroundColor: ACCENT.premium }}
        >
          {t('premium')}
        </Link>
      )}
    </div>
  );
}
