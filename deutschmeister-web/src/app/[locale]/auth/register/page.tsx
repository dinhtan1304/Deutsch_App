'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuthStore } from '@/stores/authStore';
import { trackEvent } from '@/lib/analytics';
import {
  IconUser, IconMail, IconLock, IconLoader, IconEye, IconEyeOff,
  IconUserPlus, IconCheckCircle,
  IconBook, IconGamepad, IconBrain, IconFlame,
} from '@/components/ui/Icons';
import { FormLayout } from '@/components/ui/FormLayout';
import { FormField } from '@/components/ui/FormField';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useValidateReferralCode } from '@/hooks/useReferral';

// Plain rule predicates — labels are resolved at render time via useTranslations.
const PW_RULES = [
  { id: 'length' as const, test: (p: string) => p.length >= 8 },
  { id: 'lower' as const,  test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper' as const,  test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number' as const, test: (p: string) => /\d/.test(p) },
];

type RuleId = (typeof PW_RULES)[number]['id'];

function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations('auth');
  const strength = useMemo(() => {
    const results = PW_RULES.map(r => ({ ...r, ok: r.test(password) }));
    const score = results.filter(r => r.ok).length;
    const colors = ['', STATUS.danger, ACCENT.games, STATUS.warning, STATUS.success];
    const strengthKeys = ['', 'weak', 'medium', 'good', 'strong'] as const;
    return {
      results,
      score,
      pct: (score / PW_RULES.length) * 100,
      color: colors[score],
      labelKey: strengthKeys[score],
    };
  }, [password]);

  if (!password) return null;

  // Map rule id → translation key. Co-located with PW_RULES so the relationship
  // is obvious; renamed rule ids would require updating this map too.
  const labelByRule: Record<RuleId, string> = {
    length: t('register.passwordRules.length'),
    lower: t('register.passwordRules.lower'),
    upper: t('register.passwordRules.upper'),
    number: t('register.passwordRules.number'),
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex-1 h-1 rounded-pill overflow-hidden" style={{ background: 'var(--theme-bg-tertiary)' }}>
          <div
            className="h-full rounded-pill transition-all duration-300"
            style={{ width: `${strength.pct}%`, background: strength.color }}
          />
        </div>
        {strength.labelKey && (
          <span className="text-caption font-bold" style={{ color: strength.color, minWidth: 54, textAlign: 'right' }}>
            {t(`register.strengthLabels.${strength.labelKey}` as 'register.strengthLabels.weak')}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {strength.results.map(r => (
          <div
            key={r.id}
            className="flex items-center gap-1.5 text-caption transition-colors"
            style={{ color: r.ok ? STATUS.success : 'var(--theme-text-muted)' }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
              style={{
                border: `1.5px solid ${r.ok ? STATUS.success : 'var(--theme-border)'}`,
                background: r.ok ? 'rgba(34,197,94,0.15)' : 'transparent',
              }}
            >
              {r.ok && <IconCheckCircle size={11} />}
            </div>
            {labelByRule[r.id]}
          </div>
        ))}
      </div>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading, isAuthenticated, _hasHydrated } = useAuthStore();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const t = useTranslations('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  // Pre-fill referral fields from ?ref= URL param (sharing link target).
  // Lazy init reads searchParams once on mount — sidestepping the
  // `react-hooks/set-state-in-effect` rule which forbids syncing URL → state
  // through a useEffect.
  const initialRef = (searchParams.get('ref') || '').toUpperCase();
  const [referralCode, setReferralCode] = useState(initialRef);
  const [referralExpanded, setReferralExpanded] = useState(initialRef.length > 0);
  const [debouncedReferral, setDebouncedReferral] = useState(initialRef);

  const HIGHLIGHTS = [
    { icon: <IconBook size={18} />,    text: t('highlights.vocab') },
    { icon: <IconGamepad size={18} />, text: t('highlights.games') },
    { icon: <IconBrain size={18} />,   text: t('highlights.ai') },
    { icon: <IconFlame size={18} />,   text: t('highlights.streak') },
  ];

  // Debounce referral code lookup so we don't hammer /validate on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedReferral(referralCode.trim().toUpperCase()), 400);
    return () => clearTimeout(timer);
  }, [referralCode]);

  const refValidation = useValidateReferralCode(
    debouncedReferral,
    debouncedReferral.length >= 4,
  );

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) router.replace('/dashboard');
  }, [_hasHydrated, isAuthenticated, router]);

  const isPasswordValid = useMemo(() => PW_RULES.every(r => r.test(password)), [password]);
  const isFormValid = useMemo(
    () => isPasswordValid && password === confirmPassword && name.trim().length >= 2,
    [isPasswordValid, password, confirmPassword, name],
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError(t('register.errors.nameTooShort')); return; }
    if (!isPasswordValid) { setError(t('register.errors.passwordWeak')); return; }
    if (password !== confirmPassword) { setError(t('register.errors.passwordMismatch')); return; }
    try {
      const captchaToken = executeRecaptcha ? await executeRecaptcha('register') : undefined;
      const ref = referralCode.trim().toUpperCase();
      await register({
        name: name.trim(),
        email,
        password,
        captchaToken,
        ...(ref.length >= 4 ? { referralCode: ref } : {}),
      });
      trackEvent('sign_up', { method: 'email' });
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t('register.errors.generic'));
    }
  }, [executeRecaptcha, name, email, password, confirmPassword, isPasswordValid, register, router, referralCode, t]);

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
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      trustPoints={HIGHLIGHTS}
      brandSlot={brandSlot}
      footer={
        <>
          {t('register.hasAccount')}{' '}
          <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: ACCENT.brand }}>
            {t('register.hasAccountCta')}
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
          label={t('register.nameLabel')}
          type="text"
          name="name"
          icon={<IconUser size={16} />}
          placeholder={t('register.namePlaceholder')}
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

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
          <div className="relative">
            <FormField
              variant="marketing"
              label={t('common.passwordLabel')}
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
              className="absolute right-3 bottom-3 p-1 hover:opacity-80"
              style={{ color: 'var(--marketing-dim)' }}
              aria-label={showPw ? t('common.hidePassword') : t('common.showPassword')}
            >
              {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        <FormField
          variant="marketing"
          label={t('register.passwordConfirmLabel')}
          type={showPw ? 'text' : 'password'}
          name="confirmPassword"
          icon={<IconLock size={16} />}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          error={confirmPassword.length > 0 && confirmPassword !== password ? t('register.passwordMismatch') : undefined}
        />

        {!referralExpanded ? (
          <button
            type="button"
            onClick={() => setReferralExpanded(true)}
            className="text-caption text-left hover:opacity-80"
            style={{ color: 'var(--marketing-dim)' }}
          >
            {t('register.referral.expandCta')}
          </button>
        ) : (
          <div>
            <FormField
              variant="marketing"
              label={t('register.referral.label')}
              type="text"
              name="referralCode"
              placeholder={t('register.referral.placeholder')}
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              maxLength={16}
              autoCapitalize="characters"
            />
            {debouncedReferral.length >= 4 && (
              <div className="mt-1.5 text-caption" style={{ color: refValidation.data?.valid ? STATUS.success : STATUS.danger }}>
                {refValidation.isLoading
                  ? t('register.referral.checking')
                  : refValidation.data?.valid
                    ? t('register.referral.valid', { pct: refValidation.data.discountPct })
                    : t('register.referral.invalid')}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="flex items-center justify-center gap-2 rounded-md px-5 py-3.5 text-body font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'var(--marketing-submit)',
            boxShadow: 'var(--marketing-submit-shadow)',
          }}
        >
          {isLoading ? <><IconLoader /> {t('register.submittingButton')}</> : <><IconUserPlus /> {t('register.submitButton')}</>}
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

      <p className="text-caption text-center" style={{ color: 'var(--marketing-dim)' }}>
        {t.rich('register.terms', {
          terms: (chunks) => <Link href="/terms" className="underline">{chunks}</Link>,
          privacy: (chunks) => <Link href="/privacy" className="underline">{chunks}</Link>,
        })}
      </p>
    </FormLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--marketing-bg)' }} />}>
      <RegisterForm />
    </Suspense>
  );
}
