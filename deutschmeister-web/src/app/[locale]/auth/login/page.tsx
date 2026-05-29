'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuthStore } from '@/stores/authStore';
import { trackEvent } from '@/lib/analytics';
import {
  IconMail, IconLock, IconLogIn, IconLoader, IconEye, IconEyeOff,
  IconBook, IconGamepad, IconBrain, IconFlame,
} from '@/components/ui/Icons';
import { FormLayout } from '@/components/ui/FormLayout';
import { FormField } from '@/components/ui/FormField';
import { ACCENT } from '@/lib/tokens';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { login, isLoading, isAuthenticated, user, _hasHydrated } = useAuthStore();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('auth');

  // Highlight items resolved from the auth namespace — computed inline so the
  // translator is in scope.
  const HIGHLIGHTS = [
    { icon: <IconBook size={18} />,    text: t('highlights.vocab') },
    { icon: <IconGamepad size={18} />, text: t('highlights.games') },
    { icon: <IconBrain size={18} />,   text: t('highlights.ai') },
    { icon: <IconFlame size={18} />,   text: t('highlights.streak') },
  ];

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      const dest = returnTo || (user?.role === 'admin' ? '/admin' : user?.onboardingCompleted === false ? '/onboarding' : '/dashboard');
      router.replace(dest);
    }
  }, [_hasHydrated, isAuthenticated, user, router, returnTo]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const captchaToken = executeRecaptcha ? await executeRecaptcha('login') : undefined;
      await login({ email: email.trim(), password, captchaToken });
      trackEvent('login', { method: 'email' });
      const { user: loggedInUser } = useAuthStore.getState();
      const dest = returnTo || (loggedInUser?.role === 'admin' ? '/admin' : loggedInUser?.onboardingCompleted === false ? '/onboarding' : '/dashboard');
      router.push(dest);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'EMAIL_NOT_VERIFIED') {
        setError(t('login.errors.emailNotVerified'));
      } else {
        // Backend still returns Vietnamese strings; pass through for now, else
        // fall back to localized generic. The api/client.ts → error-code refactor
        // is a separate task (see plan).
        setError(msg || t('login.errors.generic'));
      }
    }
  }, [executeRecaptcha, email, password, login, router, returnTo, t]);

  if (!_hasHydrated || isAuthenticated) {
    return <div className="min-h-screen" style={{ backgroundColor: 'var(--marketing-bg)' }} />;
  }

  const brandSlot = (
    <div>
      <Link href="/" className="inline-flex items-center gap-1.5 text-body mb-8 hover:opacity-80"
        style={{ color: 'var(--marketing-dim)' }}>
        {t('common.backHome')}
      </Link>
      <div className="mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-64.png"
          width={64}
          height={64}
          alt="Deutschmeister"
          className="rounded-lg mb-5"
          style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}
        />
        <div
          className="text-h1 font-bold leading-tight"
          style={{
            backgroundImage: 'var(--marketing-brand-text)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Deutschmeister
        </div>
      </div>
      <p className="text-body" style={{ color: 'var(--marketing-muted)' }}>
        {t('common.tagline')}
      </p>
    </div>
  );

  return (
    <FormLayout
      variant="marketing"
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      trustPoints={HIGHLIGHTS}
      brandSlot={brandSlot}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: ACCENT.brand }}>
            {t('login.noAccountCta')}
          </Link>
        </>
      }
    >
      {error && (
        <div
          className="rounded-md px-4 py-3 text-body"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--marketing-error)',
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          variant="marketing"
          label={t('common.emailLabel')}
          type="email"
          name="email"
          icon={<IconMail size={16} />}
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-body font-semibold" style={{ color: 'var(--marketing-muted)' }}>
              {t('common.passwordLabel')}
            </span>
            <Link href="/auth/forgot-password" className="text-caption font-medium hover:underline"
              style={{ color: 'var(--marketing-link)' }}>
              {t('login.forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <FormField
              variant="marketing"
              label=""
              type={showPw ? 'text' : 'password'}
              name="password"
              icon={<IconLock size={16} />}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-80"
              style={{ color: 'var(--marketing-dim)' }}
              aria-label={showPw ? t('common.hidePassword') : t('common.showPassword')}
            >
              {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-md px-5 py-3.5 text-body font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'var(--marketing-submit)',
            boxShadow: 'var(--marketing-submit-shadow)',
          }}
        >
          {isLoading ? <><IconLoader /> {t('login.submittingButton')}</> : <><IconLogIn /> {t('login.submitButton')}</>}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--marketing-border)' }} />
        <span className="text-caption" style={{ color: 'var(--marketing-dim)' }}>{t('common.orContinueWith')}</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--marketing-border)' }} />
      </div>

      <a
        href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
        className="flex items-center justify-center gap-2.5 rounded-md border px-4 py-3 text-body font-medium transition-all hover:-translate-y-0.5"
        style={{
          borderColor: 'var(--marketing-border)',
          backgroundColor: 'var(--marketing-panel)',
          color: 'var(--marketing-text)',
        }}
      >
        {/* eslint-disable no-restricted-syntax -- Google brand colors, mandated by Google brand guidelines */}
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {/* eslint-enable no-restricted-syntax */}
        {t('common.continueWithGoogle')}
      </a>
    </FormLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--marketing-bg)' }} />}>
      <LoginContent />
    </Suspense>
  );
}
