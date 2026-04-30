'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCheckQuota } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from './UpgradeModal';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import type { PracticeFeat } from '@/lib/api/subscriptions';

interface Props {
  feature: PracticeFeat;
  children: React.ReactNode;
  featureContext?: string;
}

/**
 * Wraps practice content. If quota is exhausted, shows paywall instead of children.
 * If user is premium or still has quota, renders children normally.
 * If user is not authenticated, shows a login prompt.
 */
export function QuotaPaywall({ feature, children, featureContext }: Props) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const { data: quota, isLoading } = useCheckQuota(feature, isAuthenticated);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Guest — show login prompt instead of broken generation form
  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border p-8 text-center max-w-md mx-auto my-8"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(135deg, ${ACCENT.writing}26, ${ACCENT.vocab}1A)` }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT.writing} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Đăng nhập để dùng AI luyện tập
        </h3>
        <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
          Tạo tài khoản miễn phí để AI sinh đề luyện tập cá nhân hóa cho bạn.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={`/auth/register?returnTo=${pathname}`}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: GRADIENT.brand }}>
            Đăng ký miễn phí
          </Link>
          <Link href={`/auth/login?returnTo=${pathname}`}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-opacity hover:opacity-80"
            style={{ color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

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
          style={{ background: `linear-gradient(135deg, ${ACCENT.vocab}26, ${ACCENT.writing}1A)` }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT.vocab} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Hết lượt luyện tập tuần này
        </h3>
        <p className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          Bạn đã sử dụng {quota.used}/{quota.limit} lượt miễn phí tuần này
        </p>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-5 mx-auto max-w-50" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: '100%', background: `linear-gradient(90deg, ${ACCENT.xp}, ${STATUS.danger})` }}
          />
        </div>

        <button
          onClick={() => setUpgradeOpen(true)}
          className="w-full py-3 rounded-xl text-sm font-bold text-white mb-3 transition-transform hover:scale-[1.01]"
          style={{ background: GRADIENT.writing }}
        >
          Nâng cấp Premium — Không giới hạn
        </button>

        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Lượt miễn phí reset vào thứ Hai hàng tuần (00:00 UTC+7)
        </p>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="yearly"
        featureContext={featureContext}
      />
    </>
  );
}
