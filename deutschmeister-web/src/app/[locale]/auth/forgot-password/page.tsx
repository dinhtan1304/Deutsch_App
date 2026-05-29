'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { authApi } from '@/lib/api/auth';
import { MarketingAuthShell } from '@/components/ui/MarketingAuthShell';
import { FormField } from '@/components/ui/FormField';
import {
  IconKey, IconMail, IconArrowLeft, IconLoader,
} from '@/components/ui/Icons';
import { GRADIENT, ACCENT } from '@/lib/tokens';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const captchaToken = executeRecaptcha ? await executeRecaptcha('forgot_password') : undefined;
      await authApi.forgotPassword(email.trim(), captchaToken);
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t('forgotPassword.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  }, [executeRecaptcha, email, t]);

  if (sent) {
    return (
      <MarketingAuthShell orbAccent="indigo">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-white"
          style={{
            background: GRADIENT.writing,
            boxShadow: `0 12px 40px ${ACCENT.writing}59`,
          }}
        >
          <IconMail size={36} aria-label={t('forgotPassword.sent.iconLabel')} />
        </div>
        <h1
          className="mb-3 text-h1 font-bold"
          style={{ color: 'var(--marketing-text)' }}
        >
          {t('forgotPassword.sent.title')}
        </h1>
        <p className="mb-2 text-body leading-relaxed" style={{ color: 'var(--marketing-muted)' }}>
          {t.rich('forgotPassword.sent.description', {
            email: () => (
              <strong style={{ color: 'var(--marketing-link)' }}>{email}</strong>
            ),
          })}
        </p>
        <p className="mb-7 text-caption" style={{ color: 'var(--marketing-dim)' }}>
          {t('forgotPassword.sent.hint')}
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md px-8 py-3 text-body font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: 'var(--marketing-submit)',
            boxShadow: 'var(--marketing-submit-shadow)',
          }}
        >
          {t('forgotPassword.backToLogin')}
        </Link>
      </MarketingAuthShell>
    );
  }

  return (
    <MarketingAuthShell centered={false} maxWidth={420}>
      <Link
        href="/auth/login"
        className="mb-7 inline-flex items-center gap-1.5 text-caption transition-colors hover:opacity-80"
        style={{ color: 'var(--marketing-dim)' }}
      >
        <IconArrowLeft size={14} aria-hidden />
        {t('forgotPassword.backToLogin')}
      </Link>

      <div className="mb-7">
        <div
          className="mb-5 flex items-center justify-center rounded-2xl text-white"
          style={{
            width: 52,
            height: 52,
            background: GRADIENT.writing,
            boxShadow: `0 6px 20px ${ACCENT.writing}59`,
          }}
        >
          <IconKey size={24} aria-label={t('forgotPassword.iconLabel')} />
        </div>
        <h1
          className="mb-1.5 text-h1 font-bold"
          style={{ color: 'var(--marketing-text)' }}
        >
          {t('forgotPassword.title')}
        </h1>
        <p className="text-body" style={{ color: 'var(--marketing-muted)' }}>
          {t('forgotPassword.subtitle')}
        </p>
      </div>

      <div
        className="rounded-3xl border p-7"
        style={{
          background: 'var(--marketing-panel)',
          borderColor: 'var(--marketing-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {error && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-caption"
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderColor: 'rgba(239,68,68,0.25)',
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
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="flex items-center justify-center gap-2 rounded-md px-5 py-3.5 text-body font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{
              background: (isLoading || !email.trim())
                ? 'rgba(99,102,241,0.4)'
                : 'var(--marketing-submit)',
              boxShadow: 'var(--marketing-submit-shadow)',
            }}
          >
            {isLoading && <IconLoader size={16} />}
            {isLoading ? t('forgotPassword.submittingButton') : t('forgotPassword.submitButton')}
          </button>
        </form>
      </div>
    </MarketingAuthShell>
  );
}
