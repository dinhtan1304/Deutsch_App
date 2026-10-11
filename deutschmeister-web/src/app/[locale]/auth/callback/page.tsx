'use client';
/* eslint-disable no-restricted-syntax */

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { trackSignup } from '@/lib/analytics';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.callback');
  const { loginWithOAuth } = useAuthStore();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.replace(`/auth/login?error=${encodeURIComponent(error || 'oauth_failed')}`);
      return;
    }

    // Accept old callbacks during a rolling deployment, removing the token
    // from browser history before bootstrapping or sending analytics.
    if (token) window.history.replaceState(null, '', window.location.pathname);
    loginWithOAuth(token ?? undefined)
      .then(() => {
        const { user } = useAuthStore.getState();
        // New OAuth users land on onboarding — use that as the signup signal.
        if (user?.onboardingCompleted === false) trackSignup('google');
        const dest = user?.role === 'admin' ? '/admin' : user?.onboardingCompleted === false ? '/onboarding' : '/dashboard';
        router.replace(dest);
      })
      .catch(() => {
        router.replace('/auth/login?error=oauth_failed');
      });
  }, [loginWithOAuth, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--theme-bg-primary)' }}>
      <p role="status" className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('loggingIn')}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
