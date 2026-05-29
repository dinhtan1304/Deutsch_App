'use client';
/* eslint-disable no-restricted-syntax */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { usePlans, useLifetimeRemaining } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import type { BillingPeriod } from '@/lib/api/subscriptions';
import { IconChevronLeft, IconCheck, IconZap, IconStar, IconMessageCircle, IconUser } from '@/components/ui/Icons';
import Link from 'next/link';
import Image from 'next/image';

// Simple X icon for comparison
const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Feature lists resolved by `useFeatureLists()` from i18n keys (defined inline in PricingPage).

type Val = boolean | string;
type Row = { featureKey: string; free: Val; lite: Val; premium: Val; lifetime: Val };
// Comparison rows: values that are strings reference compareRows.* keys; raw booleans pass through.
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
      className="p-3 rounded-2xl text-center transition"
      style={{
        background: highlight ? 'rgba(99,102,241,0.12)' : 'var(--theme-bg-secondary)',
        border: `1px solid ${highlight ? 'rgba(99,102,241,0.35)' : 'var(--theme-border)'}`,
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</div>
      <div className="text-2xl font-black mt-1" style={{ color: ACCENT.brand }}>{pct}%</div>
      <div className="text-[10px] opacity-60 font-medium mt-0.5">{amount}</div>
    </div>
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

  const freeFeatures = [t('free.f1'), t('free.f2'), t('free.f3'), t('free.f4'), t('free.f5'), t('free.f6'), t('free.f7')];
  const freeAi = t('free.fAi');
  const freeRoleplay = t('free.fRoleplay');
  const liteExtra = [t('lite.f1'), t('lite.f2'), t('lite.f3'), t('lite.f4'), t('lite.f5')];
  const premiumExtra = [t('premium.f1'), t('premium.f2'), t('premium.f3'), t('premium.f4'), t('premium.f5')];
  const examBundleExtra = [t('examBundle.f1'), t('examBundle.f2'), t('examBundle.f3'), t('examBundle.f4'), t('examBundle.f5')];
  const lifetimeExtra = [t('lifetime.f1'), t('lifetime.f2'), t('lifetime.f3'), t('lifetime.f4'), t('lifetime.f5')];
  const faqEntries = [1, 2, 3, 4, 5, 6, 7].map(n => ({ q: t(`faq.q${n}` as 'faq.q1'), a: t(`faq.a${n}` as 'faq.a1') }));

  const openUpgrade = (period: BillingPeriod) => {
    setDefaultPeriod(period);
    setUpgradeOpen(true);
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)', backgroundImage: 'radial-gradient(circle at 50% -20%, var(--color-accent-brand)15, transparent 70%)' }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12 animate-[slideUp_0.4s_ease-out_both]">
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo-48.png" width={48} height={48} alt="Logo" priority className="rounded-2xl shadow-2xl mb-3" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{t('appName')}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 flex flex-col md:flex-row items-center justify-center gap-x-3">
            <span style={{ color: 'var(--theme-text-primary)' }}>{t('titleStart')}</span>
            <span className="text-indigo-500">{t('titleAccent')}</span>
          </h1>

          <p className="text-sm md:text-base opacity-50 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            {t('subtitle')}
          </p>

          <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-bg-secondary border border-theme-border text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-all hover:bg-theme-bg-tertiary">
            <IconChevronLeft size={12} /> {t('backToDashboard')}
          </Link>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12 animate-[slideUp_0.5s_ease-out_0.1s_both]">
          <div className="inline-flex p-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-inner"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
            {PERIOD_OPTIONS.map(({ key, label, savePct }) => {
              const isActive = activePeriod === key;
              return (
                <button key={key} onClick={() => setActivePeriod(key)}
                  className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-theme-muted hover:text-theme-text'}`}>
                  {label}
                  {savePct != null && savePct > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(34,197,94,0.1)', color: isActive ? 'white' : STATUS.success }}>
                      -{savePct}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan Cards — Free / Premium Lite / Premium / Exam Bundle */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 animate-[slideUp_0.6s_ease-out_0.2s_both] items-stretch">
          {/* Free Plan */}
          <div className="group relative flex flex-col p-6 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-1" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="mb-6">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{t('freeTier')}</div>
              <div className="text-2xl font-black mb-1">{t('freePrice')}</div>
              <div className="text-xs opacity-60 font-medium">{t('freeDesc')}</div>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {freeFeatures.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-medium opacity-70">
                  <IconCheck size={14} style={{ color: 'var(--theme-text-muted)', marginTop: '2px', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2 text-xs font-medium opacity-70">
                <IconCheck size={14} style={{ color: 'var(--theme-text-muted)', marginTop: '2px', flexShrink: 0 }} />
                {freeAi}
              </li>
              <li className="flex items-start gap-2 text-xs font-medium opacity-70">
                <IconCheck size={14} style={{ color: 'var(--theme-text-muted)', marginTop: '2px', flexShrink: 0 }} />
                {freeRoleplay}
              </li>
            </ul>
            <button disabled={!isAuthenticated || isPremium}
              className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-theme-bg-secondary hover:bg-theme-border opacity-60">
              {isPremium ? t('alreadyUpgraded') : t('currentPlan')}
            </button>
          </div>

          {/* Premium Lite Plan — entry tier */}
          <div className="group relative flex flex-col p-6 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-1"
            style={{ borderColor: 'var(--theme-border)' }}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{t('liteTier')}</div>
                {liteEffectivePeriod === 'lite_quarterly' && savePctLiteQuarterly > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black">-{savePctLiteQuarterly}%</span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-black text-emerald-500">
                  {priceReady ? formatVND(liteCurrentPrice) : <span className="opacity-60">—</span>}
                </div>
                <div className="text-xs opacity-60 font-medium">{litePeriodLabel}</div>
              </div>
              <div className="text-[11px] opacity-60 font-medium mt-1">{t('liteDesc')}</div>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {liteExtra.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-bold">
                  <IconCheck size={14} className="text-emerald-500" style={{ marginTop: '2px', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            {!isAuthenticated ? (
              <Link href="/auth/login?returnTo=/pricing"
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center">
                {t('loginToBuy')}
              </Link>
            ) : (
              <button onClick={() => openUpgrade(liteEffectivePeriod)}
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 hover:scale-[1.02] active:scale-95">
                {isPremiumLite ? t('yourPlanLite') : t('startLite')}
              </button>
            )}
          </div>

          {/* Premium Full - Featured */}
          <div className="group relative flex flex-col p-6 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-2 lg:scale-105 z-10"
            style={{ borderColor: ACCENT.writing, boxShadow: '0 20px 50px -12px rgba(99,102,241,0.15)' }}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
              {t('mostPopular')}
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{t('professionalTier')}</div>
                {activePeriod !== 'monthly' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[9px] font-black">-{activePeriod === 'quarterly' ? savePctQuarterly : savePctYearly}%</span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-black text-indigo-500">
                  {priceReady ? formatVND(currentPrice) : <span className="opacity-60">—</span>}
                </div>
                <div className="text-xs opacity-60 font-medium">{periodLabel}</div>
              </div>
              {priceReady && perMonthPrice ? <div className="text-[11px] opacity-60 font-medium mt-1">{t('onlyPerMonth', { price: formatVND(perMonthPrice) })}</div> : null}
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {premiumExtra.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-bold">
                  <IconZap size={14} className="text-indigo-500" style={{ marginTop: '2px', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            {!isAuthenticated ? (
              <Link href="/auth/login?returnTo=/pricing"
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                {t('loginToBuy')}
              </Link>
            ) : (
              <button onClick={() => openUpgrade(activePeriod)}
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                {userPlan === 'premium' ? t('yourPlanPremium') : t('upgradeNow')}
              </button>
            )}
          </div>

          {/* Exam Bundle — one-time 90-day */}
          <div className="group relative flex flex-col p-6 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-1"
            style={{ borderColor: '#A855F744' }}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-purple-500">{t('examBundleTier')}</div>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[9px] font-black">{t('examBundleBadge')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-black text-purple-500">
                  {priceReady ? formatVND(examBundlePrice) : <span className="opacity-60">—</span>}
                </div>
              </div>
              <div className="text-[11px] opacity-60 font-medium mt-1">{t('examBundleDesc')}</div>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {examBundleExtra.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-bold">
                  <IconStar size={14} className="text-purple-500" style={{ marginTop: '2px', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            {!isAuthenticated ? (
              <Link href="/auth/login?returnTo=/pricing"
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 flex items-center justify-center">
                {t('loginToBuy')}
              </Link>
            ) : (
              <button onClick={() => openUpgrade('exam_bundle')}
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 hover:scale-[1.02] active:scale-95">
                {isExamBundle ? t('usingBundle') : t('buyExamBundle')}
              </button>
            )}
          </div>
        </div>

        {/* Lifetime — banner section below the main cards */}
        <div className="mb-20 animate-[slideUp_0.6s_ease-out_0.25s_both]">
          <div className="rounded-4xl border p-6 md:p-8 bg-theme-bg-card flex flex-col md:flex-row items-start md:items-center gap-6"
            style={{ borderColor: '#EC489933' }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-pink-500">{t('lifetimeTier')}</div>
                {lifetimeInfo && !lifetimeSoldOut && (
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-500 text-[9px] font-black">{t('lifetimeRemaining', { count: lifetimeInfo.remaining })}</span>
                )}
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-3xl md:text-4xl font-black text-pink-500">
                  {priceReady ? formatVND(lifetimePrice) : <span className="opacity-60">—</span>}
                </div>
                <div className="text-sm opacity-60 font-medium">{t('lifetimeForever')}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {lifetimeExtra.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-medium text-pink-500/80">
                    <IconStar size={14} className="text-pink-500" style={{ marginTop: '2px', flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-auto md:min-w-50">
              {!isAuthenticated ? (
                <Link href="/auth/login?returnTo=/pricing"
                  className="w-full block py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-pink-500/10 text-pink-500 border border-pink-500/20 hover:bg-pink-500/20 text-center">
                  {t('loginToBuy')}
                </Link>
              ) : (
                <button onClick={() => openUpgrade('lifetime')} disabled={lifetimeSoldOut}
                  className={`w-full py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${lifetimeSoldOut ? 'bg-theme-bg-secondary opacity-60 cursor-not-allowed' : 'bg-pink-500/10 text-pink-500 border border-pink-500/20 hover:bg-pink-500/20 hover:scale-[1.02]'}`}>
                  {isLifetime ? t('lifetimeActive') : lifetimeSoldOut ? t('lifetimeSoldOut') : t('buyLifetime')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Referral Program Banner */}
        <div className="mb-20 animate-[slideUp_0.6s_ease-out_0.28s_both]">
          <div className="rounded-4xl border p-6 md:p-8 bg-theme-bg-card relative overflow-hidden"
            style={{ borderColor: '#6366F133' }}>
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }} />
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <IconUser size={18} />
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-indigo-500">
                    {t('refKicker')}
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                  {t('refHeading')}
                </h2>
                <p className="text-xs md:text-sm opacity-60 font-medium leading-relaxed mb-4 max-w-2xl">
                  {t('refBody')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <ReferralRate label={t('refRate3m')} pct={5} amount={t('refRateAmount3m')} />
                  <ReferralRate label={t('refRate1y')} pct={10} amount={t('refRateAmount1y')} />
                  <ReferralRate label={t('refRateLifetime')} pct={15} amount={t('refRateAmountLifetime')} highlight />
                </div>

                <div className="text-[11px] opacity-50 font-medium">
                  {t('refDisclaimer')}
                </div>
              </div>

              <div className="w-full md:w-auto md:min-w-50">
                {!isAuthenticated ? (
                  <Link href="/auth/register"
                    className="w-full block py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white text-center shadow-xl shadow-indigo-500/20 hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                    {t('refCtaRegister')}
                  </Link>
                ) : (
                  <Link href="/referral"
                    className="w-full block py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white text-center shadow-xl shadow-indigo-500/20 hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                    {t('refCtaGetCode')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="mb-24 animate-[slideUp_0.6s_ease-out_0.3s_both]">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black mb-2">{t('compareTitle')}</h2>
            <p className="text-xs opacity-60 font-medium uppercase tracking-widest">{t('compareSubtitle')}</p>
          </div>
          <div className="rounded-4xl border overflow-x-auto backdrop-blur-xl bg-theme-bg-card/50" style={{ borderColor: 'var(--theme-border)' }}>
            <table className="w-full min-w-180">
              <thead>
                <tr className="bg-theme-bg-secondary/50">
                  <th className="text-left py-5 px-6 text-[11px] font-black uppercase tracking-widest opacity-60">{t('compareFeature')}</th>
                  <th className="text-center py-5 px-3 text-[11px] font-black uppercase tracking-widest opacity-60 w-24">{t('compareFree')}</th>
                  <th className="text-center py-5 px-3 text-[11px] font-black uppercase tracking-widest text-emerald-500 w-24">{t('compareLite')}</th>
                  <th className="text-center py-5 px-3 text-[11px] font-black uppercase tracking-widest text-indigo-500 w-24">{t('comparePremium')}</th>
                  <th className="text-center py-5 px-3 text-[11px] font-black uppercase tracking-widest text-pink-500 w-24">{t('compareLifetime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {COMPARISON_KEYS.map((row) => (
                  <tr key={row.featureKey} className="hover:bg-white/1 transition-colors">
                    <td className="py-3 px-6 text-xs font-bold opacity-80">{tc(row.featureKey as CompareKey)}</td>
                    <td className="text-center py-3 px-3">
                      {row.free === true ? <div className="flex justify-center"><IconCheck size={14} className="opacity-60" /></div> : row.free === false ? <div className="flex justify-center"><IconX size={14} /></div> : <span className="text-[10px] font-black opacity-60">{cellKey(row.free)}</span>}
                    </td>
                    <td className="text-center py-3 px-3">
                      {row.lite === true ? <div className="flex justify-center"><IconCheck size={14} className="text-emerald-500" /></div> : row.lite === false ? <div className="flex justify-center"><IconX size={14} /></div> : <span className="text-[10px] font-black text-emerald-500">{cellKey(row.lite)}</span>}
                    </td>
                    <td className="text-center py-3 px-3">
                      {row.premium === true ? <div className="flex justify-center"><IconZap size={14} className="text-indigo-500" /></div> : row.premium === false ? <div className="flex justify-center"><IconX size={14} /></div> : <span className="text-[10px] font-black text-indigo-500">{cellKey(row.premium)}</span>}
                    </td>
                    <td className="text-center py-3 px-3">
                      {row.lifetime === true ? <div className="flex justify-center"><IconStar size={14} className="text-pink-500" /></div> : row.lifetime === false ? <div className="flex justify-center"><IconX size={14} /></div> : <span className="text-[10px] font-black text-pink-500">{cellKey(row.lifetime)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16 animate-[slideUp_0.6s_ease-out_0.4s_both]">
          <div className="flex items-center gap-3 mb-10 justify-center">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
               <IconMessageCircle size={20} />
             </div>
             <h2 className="text-2xl font-black">{t('faqTitle')}</h2>
          </div>
          <div className="grid gap-4">
            {faqEntries.map(({ q, a }) => (
              <details key={q} className="group rounded-4xl border border-theme-border bg-theme-bg-card p-6 transition-all hover:bg-white/2">
                <summary className="text-sm font-bold cursor-pointer list-none flex items-center justify-between opacity-80 group-open:opacity-100 group-open:mb-4">
                  {q}
                  <div className="w-6 h-6 rounded-lg bg-theme-bg-secondary flex items-center justify-center transition-transform group-open:rotate-180">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </summary>
                <div className="text-[13px] leading-relaxed opacity-50 font-medium">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center py-10 opacity-60 text-[10px] font-black uppercase tracking-[0.2em]">
          {t('footer')}
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} defaultPeriod={defaultPeriod} />
    </div>
  );
}
