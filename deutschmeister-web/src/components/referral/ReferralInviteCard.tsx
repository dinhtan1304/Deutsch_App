'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GRADIENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import { useMyReferralInfo } from '@/hooks/useReferral';
import { trackEvent } from '@/lib/analytics';

/**
 * Compact, embeddable referral promo — surfaces the (otherwise account-only)
 * referral program at high-intent moments (dashboard, post-result). Reuses the
 * `account.referral` i18n namespace and `useMyReferralInfo`. Renders nothing for
 * guests or until a code is available, so it's safe to drop anywhere.
 */
export function ReferralInviteCard({ className }: { className?: string }) {
  const t = useTranslations('account.referral');
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const enabled = _hasHydrated && isAuthenticated;
  const { data } = useMyReferralInfo(enabled);
  const [copied, setCopied] = useState(false);

  const shareLink = useMemo(() => {
    if (!data?.code) return '';
    if (typeof window === 'undefined') return `/auth/register?ref=${data.code}`;
    return `${window.location.origin}/auth/register?ref=${data.code}`;
  }, [data?.code]);

  if (!enabled || !data?.code) return null;

  const pct = data.refereeDiscountPct ?? 10;

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent('referral_copy', { surface: 'invite_card' });
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (!shareLink) return;
    trackEvent('referral_share', { surface: 'invite_card' });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: t('shareTitle'), text: t('shareText', { pct }), url: shareLink });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <section
      className={`p-5 rounded-2xl text-white ${className ?? ''}`}
      style={{ background: GRADIENT.brand, boxShadow: '0 16px 32px -18px rgba(99,102,241,0.6)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold flex items-center gap-2">
            <span aria-hidden>🎁</span> {t('inviteTitle')}
          </div>
          <p className="mt-1 text-sm opacity-90">{t('inviteSubtitle', { pct })}</p>
        </div>
        <Link
          href="/referral"
          className="shrink-0 text-xs font-medium underline opacity-90 hover:opacity-100"
        >
          {t('viewDetails')}
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <code className="px-3 py-1.5 rounded-lg font-mono font-bold tracking-widest bg-white/15">
          {data.code}
        </code>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/15 hover:bg-white/25 transition"
        >
          {copied ? t('copiedLink') : t('copyLink')}
        </button>
        <button
          onClick={handleShare}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white text-indigo-700 hover:bg-white/90 transition"
        >
          {t('share')}
        </button>
      </div>
    </section>
  );
}
