'use client';

import { useState } from 'react';
import { useCheckQuota } from '@/hooks/useSubscription';
import { UpgradeModal } from './UpgradeModal';
import type { PracticeFeat } from '@/lib/api/subscriptions';

interface Props {
  feature: PracticeFeat;
  children: React.ReactNode;
}

/**
 * Wraps practice content. If quota is exhausted, shows paywall instead of children.
 * If user is premium or still has quota, renders children normally.
 */
export function QuotaPaywall({ feature, children }: Props) {
  const { data: quota, isLoading } = useCheckQuota(feature);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Still loading or has quota — render children
  if (isLoading || !quota || quota.allowed) {
    return <>{children}</>;
  }

  // Quota exhausted
  return (
    <>
      <div
        className="rounded-2xl border p-8 text-center max-w-md mx-auto my-8"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Hết lượt luyện tập tuần này
        </h3>
        <p className="text-[13px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          Bạn đã sử dụng {quota.used}/{quota.limit} lượt miễn phí tuần này
        </p>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-5 mx-auto max-w-[200px]" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: '100%', background: 'linear-gradient(90deg, #F59E0B, #EF4444)' }}
          />
        </div>

        <button
          onClick={() => setUpgradeOpen(true)}
          className="w-full py-3 rounded-xl text-[14px] font-bold text-white mb-3 transition-transform hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          Nâng cấp Premium — Không giới hạn
        </button>

        <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
          Lượt miễn phí reset vào thứ Hai hàng tuần (00:00 UTC+7)
        </p>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="yearly"
      />
    </>
  );
}
