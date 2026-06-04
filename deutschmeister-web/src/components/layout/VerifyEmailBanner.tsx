'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthUser, useIsAuthenticated } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { GRADIENT } from '@/lib/tokens';

const DISMISSED_KEY = 'dm-verify-email-banner-dismissed';

function subscribe(): () => void { return () => {}; }
function getSnapshot(): boolean { return sessionStorage.getItem(DISMISSED_KEY) === '1'; }
function getServerSnapshot(): boolean { return true; }

/**
 * Nudges signed-in users who haven't verified their email yet. Login is allowed
 * for unverified accounts, but cost/payment features are gated server-side
 * (EmailVerifiedGuard) — this banner explains why and offers a one-tap resend.
 */
export function VerifyEmailBanner() {
  const t = useTranslations('common.ui');
  const tr = useTranslations('auth.verifyEmail.resend');
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const storedDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Only show when the email is explicitly unverified — `undefined` (older
  // payloads / still loading) is treated as "don't nag".
  if (!isAuthenticated || user?.emailVerified !== false || storedDismissed || dismissed) {
    return null;
  }

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const handleResend = async () => {
    if (!user?.email || cooldown > 0 || resending) return;
    setResending(true);
    try {
      await authApi.resendVerification(user.email);
      setCooldown(60);
    } catch { /* ignore — anti-enumeration response is always 200 */ }
    setResending(false);
  };

  const resendDisabled = cooldown > 0 || resending || !user?.email;

  return (
    <div
      className="sticky top-16 z-30 flex items-center justify-between gap-3 px-4 py-2 text-white text-sm font-medium"
      style={{ background: GRADIENT.xp }}
    >
      <span className="min-w-0 truncate">{t('verifyEmailBanner.text')}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleResend}
          disabled={resendDisabled}
          className="rounded-md bg-white/20 px-3 py-1 font-semibold transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? tr('sending') : cooldown > 0 ? tr('cooldown', { seconds: cooldown }) : tr('button')}
        </button>
        <button
          onClick={dismiss}
          className="opacity-70 transition-opacity hover:opacity-100"
          aria-label={t('verifyEmailBanner.dismiss')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
