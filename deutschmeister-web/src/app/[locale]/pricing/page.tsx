'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePlans, useLifetimeRemaining } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import type { BillingPeriod } from '@/lib/api/subscriptions';
import { IconChevronLeft, IconCheck, IconZap, IconStar, IconMessageCircle, IconUser } from '@/components/ui/Icons';
import Link from 'next/link';
import Image from 'next/image';

// Per-tier accent — CSS vars so the palette tracks the v2 theme (free → muted slate).
const TIER = {
  free: 'var(--theme-text-muted)',
  lite: 'var(--success)',
  pro: 'var(--accent)',
  exam: 'var(--violet)',
  lifetime: 'var(--pink)',
};
const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

// Simple X icon for comparison
const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type Val = boolean | string;
type Row = { featureKey: string; free: Val; lite: Val; premium: Val; lifetime: Val };
const COMPARISON_KEYS: Row[] = [
  { featureKey: 'miniGames', free: true, lite: true, premium: true, lifetime: true },
  { featureKey: 'grammarA1A2', free: true, lite: true, premium: true, lifetime: true },
  { featureKey: 'grammarB1B2', free: 'grammarB1B2Free', lite: true, premium: true, lifetime: true },
  { featureKey: 'streak', free: true, lite: true, premium: true, lifetime: true },
  { featureKey: 'wordBank', free: 'wordBankFree', lite: 'unlimited', premium: 'unlimited', lifetime: 'unlimited' },
  { featureKey: 'topicSets', free: 'topicSetsFree', lite: 'unlimited', premium: 'unlimited', lifetime: 'unlimited' },
  { featureKey: 'aiSkills', free: 'aiSkillsFree', lite: 'unlimited', premium: 'unlimited', lifetime: 'unlimited' },
  { featureKey: 'pronunciation', free: 'pronunciationFree', lite: 'unlimited', premium: 'unlimited', lifetime: 'unlimited' },
  { featureKey: 'shadowing', free: 'shadowingFree', lite: 'unlimited', premium: 'unlimited', lifetime: 'unlimited' },
  { featureKey: 'roleplay', free: 'roleplayFree', lite: 'roleplayLite', premium: 'unlimited', lifetime: 'unlimited' },
  { featureKey: 'speakingRooms', free: 'speakingRoomsFree', lite: 'unlimited', premium: 'unlimited', lifetime: 'unlimited' },
  { featureKey: 'examGoetheTelc', free: false, lite: false, premium: true, lifetime: true },
  { featureKey: 'aiGrading', free: false, lite: false, premium: true, lifetime: true },
  { featureKey: 'duration', free: 'durationFree', lite: 'durationSubscription', premium: 'durationSubscription', lifetime: 'durationLifetime' },
  { featureKey: 'earlyBacker', free: false, lite: false, premium: false, lifetime: true },
];

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function ReferralRate({ label, pct, amount, highlight = false }: { label: string; pct: number; amount: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-[11px] p-3 text-center"
      style={{
        background: highlight ? mix('var(--accent)', 12) : 'var(--theme-bg-secondary)',
        border: `1px solid ${highlight ? mix('var(--accent)', 35) : 'var(--theme-border)'}`,
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      <div className="mono mt-1 text-2xl font-extrabold" style={{ color: 'var(--accent)' }}>{pct}%</div>
      <div className="mt-0.5 text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{amount}</div>
    </div>
  );
}

// One tier card — keeps each card's bespoke price / CTA logic via the children-style props.
function TierCard({
  color, name, tagline, popular, popularLabel, metaBadge, price, features, FeatureIcon, cta,
}: {
  color: string;
  name: string;
  tagline: string;
  popular?: boolean;
  popularLabel?: string;
  metaBadge?: React.ReactNode;
  price: React.ReactNode;
  features: string[];
  FeatureIcon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  cta: React.ReactNode;
}) {
  return (
    <article
      className="word-card-v2 relative flex flex-col gap-3.5 rounded-lg border p-5"
      style={{
        ...({ '--card-accent': color } as React.CSSProperties),
        background: popular ? mix(color, 6) : 'var(--theme-bg-card)',
        borderColor: popular ? color : 'var(--theme-border)',
        borderWidth: 1.5,
        boxShadow: popular ? `0 12px 32px ${mix(color, 14)}` : undefined,
      }}
    >
      {popular && popularLabel && (
        <span className="v2-match-grad absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[8px] px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          ★ {popularLabel}
        </span>
      )}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color }}>{name}</span>
          {metaBadge}
        </div>
        <p className="mt-1 text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{tagline}</p>
      </div>
      <div>{price}</div>
      {cta}
      <ul className="flex flex-col gap-2.5">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2 text-caption leading-snug" style={{ color: 'var(--theme-text-secondary)' }}>
            <span className="mt-px shrink-0" style={{ color }}><FeatureIcon size={13} /></span>
            {f}
          </li>
        ))}
      </ul>
    </article>
  );
}

type PremiumPeriod = 'monthly' | 'quarterly' | 'yearly';

type CompareKey = 'miniGames' | 'grammarA1A2' | 'grammarB1B2' | 'grammarB1B2Free' | 'streak' | 'wordBank' | 'wordBankFree' | 'topicSets' | 'topicSetsFree' | 'unlimited' | 'aiSkills' | 'aiSkillsFree' | 'pronunciation' | 'pronunciationFree' | 'shadowing' | 'shadowingFree' | 'roleplay' | 'roleplayFree' | 'roleplayLite' | 'speakingRooms' | 'speakingRoomsFree' | 'examGoetheTelc' | 'aiGrading' | 'duration' | 'durationFree' | 'durationSubscription' | 'durationLifetime' | 'earlyBacker';

export default function PricingPage() {
  const t = useTranslations('account.pricing');
  const tc = useTranslations('account.pricing.compareRows');
  const cellKey = (val: Val) => typeof val === 'string' ? tc(val as CompareKey) : '';
  const { isAuthenticated, user } = useAuthStore();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: lifetimeInfo } = useLifetimeRemaining();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [defaultPeriod, setDefaultPeriod] = useState<BillingPeriod>('yearly');
  const [activePeriod, setActivePeriod] = useState<PremiumPeriod>('yearly');

  const userPlan = user?.subscription?.plan;
  const isPremium = (userPlan === 'premium' || userPlan === 'lifetime' || userPlan === 'premium_lite' || userPlan === 'exam_bundle') && user?.subscription?.status === 'active';
  const isLifetime = userPlan === 'lifetime';
  const isExamBundle = userPlan === 'exam_bundle';
  const isPremiumLite = userPlan === 'premium_lite';

  const litePlan = plans?.find((p) => p.code === 'premium_lite');
  const premiumPlan = plans?.find((p) => p.code === 'premium');
  const examBundlePlan = plans?.find((p) => p.code === 'exam_bundle');
  const lifetimePlan = plans?.find((p) => p.code === 'lifetime');
  const priceReady = !plansLoading && !!plans;

  const monthlyPrice = premiumPlan?.monthlyPrice ?? 0;
  const quarterlyPrice = premiumPlan?.quarterlyPrice ?? 0;
  const yearlyPrice = premiumPlan?.yearlyPrice ?? 0;
  const liteMonthlyPrice = litePlan?.monthlyPrice ?? 0;
  const liteQuarterlyPrice = litePlan?.quarterlyPrice ?? 0;
  const examBundlePrice = examBundlePlan?.price ?? 0;
  const lifetimePrice = lifetimePlan?.price ?? 0;

  const savePctYearly = priceReady && monthlyPrice > 0 ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100) : 0;
  const savePctQuarterly = priceReady && monthlyPrice > 0 ? Math.round((1 - quarterlyPrice / (monthlyPrice * 3)) * 100) : 0;
  const savePctLiteQuarterly = priceReady && liteMonthlyPrice > 0 ? Math.round((1 - liteQuarterlyPrice / (liteMonthlyPrice * 3)) * 100) : 0;
  const lifetimeSoldOut = lifetimeInfo ? lifetimeInfo.remaining <= 0 : false;

  const currentPrice = activePeriod === 'monthly' ? monthlyPrice : activePeriod === 'quarterly' ? quarterlyPrice : yearlyPrice;
  const perMonthPrice = activePeriod === 'monthly' ? null : activePeriod === 'quarterly' ? Math.round(quarterlyPrice / 3) : Math.round(yearlyPrice / 12);
  const periodLabel = activePeriod === 'monthly' ? t('perMonth') : activePeriod === 'quarterly' ? t('perQuarter') : t('perYear');

  // Lite doesn't have a yearly plan — when period toggle is "yearly", show quarterly price for Lite.
  const liteEffectivePeriod: 'lite_monthly' | 'lite_quarterly' = activePeriod === 'monthly' ? 'lite_monthly' : 'lite_quarterly';
  const liteCurrentPrice = liteEffectivePeriod === 'lite_monthly' ? liteMonthlyPrice : liteQuarterlyPrice;
  const litePeriodLabel = liteEffectivePeriod === 'lite_monthly' ? t('perMonth') : t('perQuarter');

  const PERIOD_OPTIONS: { key: PremiumPeriod; label: string; savePct?: number }[] = [
    { key: 'monthly', label: t('period1Month') },
    { key: 'quarterly', label: t('period3Months'), savePct: savePctQuarterly },
    { key: 'yearly', label: t('period1Year'), savePct: savePctYearly },
  ];

  const freeFeatures = [t('free.f1'), t('free.f2'), t('free.f3'), t('free.f4'), t('free.fAi'), t('free.fRoleplay')];
  const liteExtra = [t('lite.f1'), t('lite.f2'), t('lite.f3'), t('lite.f4'), t('lite.f5')];
  const premiumExtra = [t('premium.f1'), t('premium.f2'), t('premium.f3'), t('premium.f4'), t('premium.f5')];
  const examBundleExtra = [t('examBundle.f1'), t('examBundle.f2'), t('examBundle.f3'), t('examBundle.f4'), t('examBundle.f5')];
  const lifetimeExtra = [t('lifetime.f1'), t('lifetime.f2'), t('lifetime.f3'), t('lifetime.f4'), t('lifetime.f5')];
  const faqEntries = [1, 2, 3, 4, 5, 6, 7].map(n => ({ q: t(`faq.q${n}` as 'faq.q1'), a: t(`faq.a${n}` as 'faq.a1') }));

  const openUpgrade = (period: BillingPeriod) => {
    setDefaultPeriod(period);
    setUpgradeOpen(true);
  };

  const compareCols: { id: keyof Pick<Row, 'free' | 'lite' | 'premium' | 'lifetime'>; label: string; color: string; Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
    { id: 'free', label: t('compareFree'), color: TIER.free, Icon: IconCheck },
    { id: 'lite', label: t('compareLite'), color: TIER.lite, Icon: IconCheck },
    { id: 'premium', label: t('comparePremium'), color: TIER.pro, Icon: IconZap },
    { id: 'lifetime', label: t('compareLifetime'), color: TIER.lifetime, Icon: IconStar },
  ];

  const softCta = (color: string): React.CSSProperties => ({
    background: mix(color, 12),
    color,
    border: `1px solid ${mix(color, 24)}`,
  });

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{
        backgroundColor: 'var(--theme-bg-body)',
        color: 'var(--theme-text-primary)',
        backgroundImage: `radial-gradient(circle at 50% -10%, ${mix('var(--accent)', 12)}, transparent 70%)`,
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* ── Hero ── */}
        <div className="mb-10 text-center animate-[slideUp_0.4s_ease-out_both]">
          <div className="mb-7 flex flex-col items-center">
            <Image src="/logo-48.png" width={44} height={44} alt="Logo" priority className="mb-3 rounded-[14px] shadow-lg" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--theme-text-muted)' }}>{t('appName')}</span>
          </div>

          <h1 className="mb-4 flex flex-col items-center justify-center gap-x-3 text-4xl font-extrabold tracking-tight md:flex-row md:text-5xl">
            <span style={{ color: 'var(--theme-text-primary)' }}>{t('titleStart')}</span>
            <span style={{ color: 'var(--accent)' }}>{t('titleAccent')}</span>
          </h1>

          <p className="mx-auto mb-6 max-w-2xl text-body font-medium leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('subtitle')}
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[9px] border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors hover:opacity-80"
            style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
          >
            <IconChevronLeft size={12} /> {t('backToDashboard')}
          </Link>
        </div>

        {/* ── Billing toggle ── */}
        <div className="mb-10 flex justify-center animate-[slideUp_0.5s_ease-out_0.1s_both]">
          <div className="inline-flex rounded-[12px] border p-1" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
            {PERIOD_OPTIONS.map(({ key, label, savePct }) => {
              const active = activePeriod === key;
              return (
                <button
                  key={key}
                  onClick={() => setActivePeriod(key)}
                  className="relative flex items-center gap-2 rounded-[8px] px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all"
                  style={active
                    ? { background: 'var(--accent)', color: 'white', boxShadow: `0 4px 12px ${mix('var(--accent)', 40)}` }
                    : { color: 'var(--theme-text-muted)' }}
                >
                  {label}
                  {savePct != null && savePct > 0 && (
                    <span
                      className="rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold"
                      style={active ? { background: 'rgba(255,255,255,.22)', color: 'white' } : { background: mix('var(--success)', 16), color: 'var(--success)' }}
                    >
                      −{savePct}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tier cards ── */}
        <div className="mb-9 grid items-start gap-4 md:grid-cols-2 lg:grid-cols-4 animate-[slideUp_0.6s_ease-out_0.2s_both]">
          {/* Free */}
          <TierCard
            color={TIER.free}
            name={t('freeTier')}
            tagline={t('freeDesc')}
            FeatureIcon={IconCheck}
            features={freeFeatures}
            price={
              <div className="flex items-baseline gap-1">
                <span className="mono text-[28px] font-bold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{t('freePrice')}</span>
              </div>
            }
            cta={
              <button
                disabled={!isAuthenticated || isPremium}
                className="h-10.5 rounded-[10px] text-[11px] font-bold uppercase tracking-widest"
                style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
              >
                {isPremium ? t('alreadyUpgraded') : t('currentPlan')}
              </button>
            }
          />

          {/* Lite */}
          <TierCard
            color={TIER.lite}
            name={t('liteTier')}
            tagline={t('liteDesc')}
            FeatureIcon={IconCheck}
            features={liteExtra}
            metaBadge={liteEffectivePeriod === 'lite_quarterly' && savePctLiteQuarterly > 0 ? (
              <span className="rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold" style={{ background: mix(TIER.lite, 16), color: TIER.lite }}>−{savePctLiteQuarterly}%</span>
            ) : null}
            price={
              <div className="flex items-baseline gap-1">
                <span className="mono text-[28px] font-bold tracking-tight" style={{ color: TIER.lite }}>{priceReady ? formatVND(liteCurrentPrice) : '—'}</span>
                <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{litePeriodLabel}</span>
              </div>
            }
            cta={!isAuthenticated ? (
              <Link href="/auth/login?returnTo=/pricing" className="flex h-10.5 items-center justify-center rounded-[10px] text-[11px] font-bold uppercase tracking-widest" style={softCta(TIER.lite)}>
                {t('loginToBuy')}
              </Link>
            ) : (
              <button onClick={() => openUpgrade(liteEffectivePeriod)} className="h-10.5 rounded-[10px] text-[11px] font-bold uppercase tracking-widest transition-transform active:scale-95" style={softCta(TIER.lite)}>
                {isPremiumLite ? t('yourPlanLite') : t('startLite')}
              </button>
            )}
          />

          {/* Premium (popular) */}
          <TierCard
            color={TIER.pro}
            name={t('professionalTier')}
            tagline={t('mostPopular')}
            popular
            popularLabel={t('mostPopular')}
            FeatureIcon={IconZap}
            features={premiumExtra}
            metaBadge={activePeriod !== 'monthly' ? (
              <span className="rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold" style={{ background: mix(TIER.pro, 14), color: TIER.pro }}>−{activePeriod === 'quarterly' ? savePctQuarterly : savePctYearly}%</span>
            ) : null}
            price={
              <>
                <div className="flex items-baseline gap-1">
                  <span className="mono text-[28px] font-bold tracking-tight" style={{ color: TIER.pro }}>{priceReady ? formatVND(currentPrice) : '—'}</span>
                  <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{periodLabel}</span>
                </div>
                {priceReady && perMonthPrice ? <div className="mt-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{t('onlyPerMonth', { price: formatVND(perMonthPrice) })}</div> : null}
              </>
            }
            cta={!isAuthenticated ? (
              <Link href="/auth/login?returnTo=/pricing" className="v2-match-grad flex h-10.5 items-center justify-center rounded-[10px] text-[11px] font-bold uppercase tracking-widest text-white" style={{ boxShadow: `0 4px 14px ${mix(TIER.pro, 55)}` }}>
                {t('loginToBuy')}
              </Link>
            ) : (
              <button onClick={() => openUpgrade(activePeriod)} className="v2-match-grad h-10.5 rounded-[10px] text-[11px] font-bold uppercase tracking-widest text-white transition-transform active:scale-95" style={{ boxShadow: `0 4px 14px ${mix(TIER.pro, 55)}` }}>
                {userPlan === 'premium' ? t('yourPlanPremium') : t('upgradeNow')}
              </button>
            )}
          />

          {/* Exam bundle */}
          <TierCard
            color={TIER.exam}
            name={t('examBundleTier')}
            tagline={t('examBundleDesc')}
            FeatureIcon={IconStar}
            features={examBundleExtra}
            metaBadge={<span className="mono rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold" style={{ background: mix(TIER.exam, 14), color: TIER.exam }}>{t('examBundleBadge')}</span>}
            price={
              <div className="flex items-baseline gap-1">
                <span className="mono text-[28px] font-bold tracking-tight" style={{ color: TIER.exam }}>{priceReady ? formatVND(examBundlePrice) : '—'}</span>
              </div>
            }
            cta={!isAuthenticated ? (
              <Link href="/auth/login?returnTo=/pricing" className="flex h-10.5 items-center justify-center rounded-[10px] text-[11px] font-bold uppercase tracking-widest" style={softCta(TIER.exam)}>
                {t('loginToBuy')}
              </Link>
            ) : (
              <button onClick={() => openUpgrade('exam_bundle')} className="h-10.5 rounded-[10px] text-[11px] font-bold uppercase tracking-widest transition-transform active:scale-95" style={softCta(TIER.exam)}>
                {isExamBundle ? t('usingBundle') : t('buyExamBundle')}
              </button>
            )}
          />
        </div>

        {/* ── Lifetime banner ── */}
        <div className="mb-16 animate-[slideUp_0.6s_ease-out_0.25s_both]">
          <section
            className="v2-lifetime-hero relative flex flex-col items-start gap-6 overflow-hidden rounded-[18px] border p-6 md:flex-row md:items-center md:p-7"
            style={{ borderColor: mix(TIER.lifetime, 35) }}
          >
            <div className="pointer-events-none absolute -top-20 right-20 h-64 w-64 rounded-full" style={{ background: mix(TIER.lifetime, 12), filter: 'blur(50px)' }} />
            <div className="v2-pinkviolet-grad relative z-10 flex h-15 w-15 shrink-0 items-center justify-center rounded-[16px] text-3xl" style={{ boxShadow: `0 8px 24px ${mix(TIER.lifetime, 40)}` }}>👑</div>
            <div className="relative z-10 flex-1">
              <div className="mb-1 flex items-center gap-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: TIER.lifetime }}>{t('lifetimeTier')}</span>
                {lifetimeInfo && !lifetimeSoldOut && (
                  <span className="rounded-[5px] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide" style={{ background: mix(TIER.lifetime, 18), color: TIER.lifetime }}>{t('lifetimeRemaining', { count: lifetimeInfo.remaining })}</span>
                )}
              </div>
              <div className="mb-2.5 flex items-baseline gap-2.5">
                <span className="mono text-[30px] font-bold tracking-tight" style={{ color: TIER.lifetime }}>{priceReady ? formatVND(lifetimePrice) : '—'}</span>
                <span className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{t('lifetimeForever')}</span>
              </div>
              <div className="grid max-w-xl grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                {lifetimeExtra.map((f, i) => (
                  <span key={i} className="flex items-start gap-1.5 text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
                    <IconStar size={12} style={{ color: TIER.lifetime, marginTop: 2, flexShrink: 0 }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative z-10 w-full md:w-auto md:min-w-50">
              {!isAuthenticated ? (
                <Link href="/auth/login?returnTo=/pricing" className="block rounded-[12px] px-6 py-3 text-center text-[11px] font-bold uppercase tracking-widest" style={softCta(TIER.lifetime)}>
                  {t('loginToBuy')}
                </Link>
              ) : lifetimeSoldOut ? (
                <button disabled className="w-full cursor-not-allowed rounded-[12px] px-6 py-3 text-[11px] font-bold uppercase tracking-widest" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                  {t('lifetimeSoldOut')}
                </button>
              ) : isLifetime ? (
                <button disabled className="flex w-full items-center justify-center gap-1.5 rounded-[12px] px-6 py-3 text-[11px] font-bold uppercase tracking-widest" style={softCta(TIER.lifetime)}>
                  <IconCheck size={15} /> {t('lifetimeActive')}
                </button>
              ) : (
                <button onClick={() => openUpgrade('lifetime')} className="v2-pinkviolet-grad w-full rounded-[12px] px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-transform active:scale-95" style={{ boxShadow: `0 8px 24px ${mix(TIER.lifetime, 40)}` }}>
                  {t('buyLifetime')}
                </button>
              )}
            </div>
          </section>
        </div>

        {/* ── Referral banner ── */}
        <div className="mb-16 animate-[slideUp_0.6s_ease-out_0.28s_both]">
          <section className="relative overflow-hidden rounded-[18px] border p-6 md:p-7" style={{ background: 'var(--theme-bg-card)', borderColor: mix('var(--accent)', 25) }}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full" style={{ background: mix('var(--accent)', 16), filter: 'blur(60px)' }} />
            <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: mix('var(--accent)', 12), color: 'var(--accent)' }}>
                    <IconUser size={18} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>{t('refKicker')}</span>
                </div>
                <h2 className="mb-2 text-h2 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{t('refHeading')}</h2>
                <p className="mb-4 max-w-2xl text-caption font-medium leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{t('refBody')}</p>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ReferralRate label={t('refRate3m')} pct={5} amount={t('refRateAmount3m')} />
                  <ReferralRate label={t('refRate1y')} pct={10} amount={t('refRateAmount1y')} />
                  <ReferralRate label={t('refRateLifetime')} pct={15} amount={t('refRateAmountLifetime')} highlight />
                </div>

                <div className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{t('refDisclaimer')}</div>
              </div>

              <div className="w-full md:w-auto md:min-w-50">
                <Link
                  href={isAuthenticated ? '/referral' : '/auth/register'}
                  className="v2-match-grad block rounded-[12px] px-6 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-white transition-transform active:scale-95"
                  style={{ boxShadow: `0 4px 14px ${mix('var(--accent)', 40)}` }}
                >
                  {isAuthenticated ? t('refCtaGetCode') : t('refCtaRegister')}
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* ── Comparison table ── */}
        <div className="mb-16 animate-[slideUp_0.6s_ease-out_0.3s_both]">
          <div className="mb-7 text-center">
            <h2 className="mb-1.5 text-h2 font-extrabold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{t('compareTitle')}</h2>
            <p className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{t('compareSubtitle')}</p>
          </div>
          <div className="overflow-x-auto rounded-[14px] border" style={{ borderColor: 'var(--theme-border)' }}>
            <table className="w-full min-w-180 border-collapse text-caption">
              <thead>
                <tr style={{ background: 'var(--theme-bg-card)' }}>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{t('compareFeature')}</th>
                  {compareCols.map((c) => (
                    <th key={c.id} className="w-28 px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-wide" style={{ color: c.color }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_KEYS.map((row, ri) => (
                  <tr key={row.featureKey} style={{ background: ri % 2 === 0 ? 'var(--theme-bg-card)' : 'var(--theme-bg-secondary)', borderTop: '1px solid var(--theme-border)' }}>
                    <td className="px-5 py-3 font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{tc(row.featureKey as CompareKey)}</td>
                    {compareCols.map((c) => {
                      const v = row[c.id];
                      return (
                        <td key={c.id} className="px-3 py-3 text-center">
                          {v === true ? (
                            <span className="inline-flex justify-center" style={{ color: c.color }}><c.Icon size={15} /></span>
                          ) : v === false ? (
                            <span className="inline-flex justify-center" style={{ color: 'var(--theme-text-muted)' }}><IconX size={14} /></span>
                          ) : (
                            <span className="mono text-[11px] font-bold" style={{ color: c.color }}>{cellKey(v)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mx-auto mb-14 max-w-3xl animate-[slideUp_0.6s_ease-out_0.4s_both]">
          <div className="mb-7 flex items-center justify-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[11px]" style={{ background: mix('var(--accent)', 12), color: 'var(--accent)' }}>
              <IconMessageCircle size={20} />
            </span>
            <h2 className="text-h2 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{t('faqTitle')}</h2>
          </div>
          <div className="grid gap-3">
            {faqEntries.map(({ q, a }) => (
              <details key={q} className="group rounded-[14px] border p-5" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                <summary className="flex cursor-pointer list-none items-center justify-between text-body font-bold group-open:mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                  {q}
                  <span className="flex h-6 w-6 items-center justify-center rounded-[8px] transition-transform group-open:rotate-180" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
                  </span>
                </summary>
                <div className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="py-8 text-center text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--theme-text-muted)' }}>
          {t('footer')}
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} defaultPeriod={defaultPeriod} />
    </div>
  );
}
