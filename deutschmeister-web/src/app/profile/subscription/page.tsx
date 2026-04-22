'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMySubscription } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const STATUS_LABELS: Record<string, { text: string; color: string; bg: string }> = {
  pending: { text: 'Chờ xác nhận', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  confirmed: { text: 'Đã xác nhận', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  rejected: { text: 'Từ chối', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function SubscriptionPage() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useMySubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Vui lòng đăng nhập để xem gói đăng ký.</p>
        <Link href="/login" className="text-sm font-bold" style={{ color: '#6366F1' }}>Đăng nhập</Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          <div className="h-48 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        </div>
      </div>
    );
  }

  const isLifetime = data.plan === 'lifetime' && data.status === 'active';
  const isPremium = (data.plan === 'premium' || data.plan === 'lifetime') && data.status === 'active';
  const isExpired = data.status === 'expired';

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div>
        <Link href="/profile" className="text-body mb-2 inline-block" style={{ color: 'var(--theme-text-muted)' }}>
          &larr; Hồ sơ
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Gói đăng ký</h1>
      </div>

      {/* Current Plan Card */}
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: isPremium ? 'rgba(139,92,246,0.3)' : 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)',
          background: isPremium
            ? 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))'
            : undefined,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: isPremium ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--theme-bg-secondary)' }}
            >
              {isPremium ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-text-muted)' }}>
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>
            <div>
              <div className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {isLifetime ? 'Lifetime' : isPremium ? 'Premium' : 'Free'}
              </div>
              {isPremium && !isLifetime && data.expiresAt && (
                <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Còn {daysUntil(data.expiresAt)} ngày &middot; Hết hạn {formatDate(data.expiresAt)}
                </div>
              )}
              {isLifetime && (
                <div className="text-xs font-semibold" style={{ color: '#EC4899' }}>
                  ⭐ Trọn đời — Early Backer
                </div>
              )}
              {isExpired && (
                <div className="text-xs" style={{ color: '#EF4444' }}>
                  Đã hết hạn {data.expiresAt ? formatDate(data.expiresAt) : ''}
                </div>
              )}
              {!isPremium && !isExpired && (
                <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>3 lượt luyện tập/ngày</div>
              )}
            </div>
          </div>
          {isPremium && (
            <span className="text-caption font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
              ACTIVE
            </span>
          )}
        </div>

        {!isPremium && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            {isExpired ? 'Gia hạn Premium' : 'Nâng cấp lên Premium'}
          </button>
        )}
        {isPremium && !isLifetime && data.expiresAt && daysUntil(data.expiresAt) <= 30 && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)' }}
          >
            Gia hạn
          </button>
        )}
      </div>

      {/* Payment History */}
      {data.payments && data.payments.length > 0 && (
        <div>
          <h2 className="text-[15px] font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Lịch sử thanh toán
          </h2>
          <div className="space-y-2">
            {data.payments.map((p) => {
              const s = STATUS_LABELS[p.status] || STATUS_LABELS.pending;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border p-3.5"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
                >
                  <div>
                    <div className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                      Premium {p.period === 'yearly' ? 'Năm' : p.period === 'lifetime' ? 'Trọn đời' : 'Tháng'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {formatDate(p.createdAt)} &middot; {formatVND(p.amount)}
                    </div>
                  </div>
                  <span
                    className="text-caption font-bold px-2 py-0.5 rounded-md"
                    style={{ color: s.color, backgroundColor: s.bg }}
                  >
                    {s.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Link to pricing */}
      <div className="text-center pt-2">
        <Link href="/pricing" className="text-body font-medium" style={{ color: '#8B5CF6' }}>
          Xem so sánh chi tiết các gói &rarr;
        </Link>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="yearly"
      />
    </div>
  );
}
