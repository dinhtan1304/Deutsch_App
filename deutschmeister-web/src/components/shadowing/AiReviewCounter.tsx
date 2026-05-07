'use client';

import Link from 'next/link';
import { useCheckQuota, useIsPremium } from '@/hooks/useSubscription';
import { ACCENT, STATUS } from '@/lib/tokens';

interface Props {
  /** Hide the entire counter when shadowing is paused/inactive. */
  enabled?: boolean;
}

export function AiReviewCounter({ enabled = true }: Props) {
  const { data: quota, isLoading } = useCheckQuota('shadowing', enabled);
  const isPremium = useIsPremium();

  if (!enabled) return null;

  if (isLoading || !quota) {
    return (
      <p className="text-xs font-medium opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
        Đang tải lượt AI review...
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
        Số lượt AI review: <strong>Không giới hạn</strong>
      </p>
    );
  }

  const remaining = Math.max(0, quota.limit - quota.used);
  const periodLabel = quota.window === 'daily' ? 'Làm mới mỗi ngày' : 'Reset vào thứ Hai hàng tuần';

  if (remaining === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p
          className="text-xs font-bold"
          style={{ color: STATUS.danger }}
        >
          Hết lượt AI review {quota.window === 'daily' ? 'hôm nay' : 'tuần này'}
        </p>
        <Link
          href="/pricing"
          className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all hover:brightness-110 active:scale-95 text-white"
          style={{ background: ACCENT.premium }}
        >
          Nâng cấp Premium →
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
      Số lượt AI review còn lại:{' '}
      <strong style={{ color: ACCENT.reading }}>
        {remaining}/{quota.limit}
      </strong>
      . {periodLabel}.
    </p>
  );
}
