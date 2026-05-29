'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { authApi } from '@/lib/api/auth';
import { MarketingAuthShell } from '@/components/ui/MarketingAuthShell';
import { FormField } from '@/components/ui/FormField';
import {
  IconLock, IconCheck, IconEye, IconEyeOff, IconLoader,
} from '@/components/ui/Icons';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';

const PW_RULES = [
  { id: 'length' as const, test: (p: string) => p.length >= 8 },
  { id: 'lower' as const,  test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper' as const,  test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number' as const, test: (p: string) => /\d/.test(p) },
];

type RuleId = (typeof PW_RULES)[number]['id'];

const PW_COLORS = ['', STATUS.danger, ACCENT.games, STATUS.warning, ACCENT.reading];

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const t = useTranslations('auth');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const pwResults = useMemo(
    () => PW_RULES.map((r) => ({ ...r, ok: r.test(password) })),
    [password],
  );
  const pwScore = pwResults.filter((r) => r.ok).length;
  const isPasswordValid = pwScore === PW_RULES.length;
  const isFormValid = isPasswordValid && password === confirm;

  // Same rule→label map as register page; duplicated here to keep the page
  // self-contained without coupling to the register module.
  const ruleLabels: Record<RuleId, string> = {
    length: t('register.passwordRules.length'),
    lower: t('register.passwordRules.lower'),
    upper: t('register.passwordRules.upper'),
    number: t('register.passwordRules.number'),
  };

  // Lookup table for strength label by score (1..4). Index 0 reserved for "empty".
  const strengthKeys = ['', 'weak', 'medium', 'good', 'strong'] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError('');
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t('resetPassword.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <MarketingAuthShell>
        <p className="mb-4 text-body" style={{ color: 'var(--marketing-error)' }}>
          {t('resetPassword.invalidLink')}
        </p>
        <Link
          href="/auth/forgot-password"
          className="text-body font-semibold hover:underline"
          style={{ color: 'var(--marketing-link)' }}
        >
          {t('resetPassword.requestNewLink')}
        </Link>
      </MarketingAuthShell>
    );
  }

  if (done) {
    return (
      <MarketingAuthShell orbAccent="green">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-white"
          style={{
            background: GRADIENT.reading,
            boxShadow: `0 12px 40px ${ACCENT.reading}59`,
          }}
        >
          <IconCheck size={40} strokeWidth={3} aria-label={t('resetPassword.done.iconLabel')} />
        </div>
        <h1
          className="mb-3 text-h1 font-bold"
          style={{ color: 'var(--marketing-text)' }}
        >
          {t('resetPassword.done.title')}
        </h1>
        <p className="mb-6 text-body leading-relaxed" style={{ color: 'var(--marketing-muted)' }}>
          {t('resetPassword.done.redirecting')}
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md px-8 py-3 text-body font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: GRADIENT.reading,
            boxShadow: `0 8px 24px ${ACCENT.reading}4D`,
          }}
        >
          {t('resetPassword.done.loginNow')}
        </Link>
      </MarketingAuthShell>
    );
  }

  const confirmError = confirm && confirm !== password ? t('resetPassword.passwordMismatch') : undefined;
  // Backend may return either translated copy or English error key; we still
  // need to surface a "request new link" CTA when the token expired. Match
  // against well-known substrings (cheap heuristic — keeps the UI helpful
  // without a backend contract change).
  const isExpiredOrInvalid = /hết hạn|không hợp lệ|expired|invalid|abgelaufen|ungültig/i.test(error);

  return (
    <MarketingAuthShell centered={false} maxWidth={440}>
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
          <IconLock size={24} aria-label={t('resetPassword.iconLabel')} />
        </div>
        <h1
          className="mb-1.5 text-h1 font-bold"
          style={{ color: 'var(--marketing-text)' }}
        >
          {t('resetPassword.title')}
        </h1>
        <p className="text-body" style={{ color: 'var(--marketing-muted)' }}>
          {t('resetPassword.subtitle')}
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
            {isExpiredOrInvalid && (
              <div className="mt-2">
                <Link
                  href="/auth/forgot-password"
                  className="text-caption hover:underline"
                  style={{ color: 'var(--marketing-link)' }}
                >
                  {t('resetPassword.expiredLinkCta')}
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="relative">
              <FormField
                variant="marketing"
                label={t('resetPassword.newPasswordLabel')}
                type={showPw ? 'text' : 'password'}
                name="password"
                icon={<IconLock size={16} />}
                placeholder={t('resetPassword.newPasswordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={50}
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-9.5 p-1 transition-colors hover:opacity-80"
                style={{ color: 'var(--marketing-dim)' }}
                aria-label={showPw ? t('common.hidePassword') : t('common.showPassword')}
              >
                {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>

            {password && (
              <div className="mt-2.5">
                <div className="mb-2 flex items-center gap-2.5">
                  <div
                    className="h-1 flex-1 overflow-hidden rounded"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="h-full rounded transition-[width] duration-300"
                      style={{
                        width: `${(pwScore / PW_RULES.length) * 100}%`,
                        background: PW_COLORS[pwScore],
                      }}
                    />
                  </div>
                  <span
                    className="min-w-13.5 text-right text-[11px] font-bold"
                    style={{ color: PW_COLORS[pwScore] }}
                  >
                    {strengthKeys[pwScore]
                      ? t(`register.strengthLabels.${strengthKeys[pwScore]}` as 'register.strengthLabels.weak')
                      : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {pwResults.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-1.5 text-[11px]"
                      style={{ color: r.ok ? ACCENT.reading : 'var(--marketing-dim)' }}
                    >
                      <div
                        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px]"
                        style={{ borderColor: r.ok ? ACCENT.reading : 'rgba(255,255,255,0.2)' }}
                      >
                        {r.ok && <IconCheck size={8} strokeWidth={3} />}
                      </div>
                      {ruleLabels[r.id]}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <FormField
            variant="marketing"
            label={t('resetPassword.confirmLabel')}
            type={showPw ? 'text' : 'password'}
            name="confirm"
            icon={<IconLock size={16} />}
            placeholder={t('resetPassword.confirmPlaceholder')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            error={confirmError}
          />

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="mt-1 flex items-center justify-center gap-2 rounded-md px-5 py-3.5 text-body font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{
              background: (!isFormValid || isLoading)
                ? `${ACCENT.writing}66`
                : 'var(--marketing-submit)',
              boxShadow: 'var(--marketing-submit-shadow)',
            }}
          >
            {isLoading && <IconLoader size={16} />}
            {isLoading ? t('resetPassword.submittingButton') : t('resetPassword.submitButton')}
          </button>
        </form>
      </div>
    </MarketingAuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ backgroundColor: 'var(--marketing-bg)' }} />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
