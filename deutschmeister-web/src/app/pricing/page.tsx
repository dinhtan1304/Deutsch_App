'use client';
/* eslint-disable no-restricted-syntax */

import { useState } from 'react';
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

const FREE_FEATURES = [
  'Word Bank cá nhân — tối đa 10 từ',
  'Bộ chủ đề cá nhân — tối đa 10 bộ',
  'Tất cả mini-games & Vocabulary Arena',
  'Ngữ pháp A1–A2 đầy đủ',
  'Topics cộng đồng (xem không giới hạn)',
  'Dictionary click-to-lookup',
  'Streak & Leaderboard',
];

const LITE_EXTRA = [
  'Luyện AI không giới hạn (Writing, Speaking, Reading, Listening)',
  'Phát âm + Shadowing không giới hạn',
  'Speaking Rooms hội thoại nhóm',
  'Roleplay AI — 20 sessions/tháng',
  'Không bao gồm đề thi Goethe/TELC',
];

const PREMIUM_EXTRA = [
  'Tất cả tính năng Premium Lite',
  'Thi thử Goethe/TELC chuẩn (A1–B2)',
  'Mock exam full-length 4 kỹ năng',
  'AI chấm điểm theo rubric Goethe',
  'Roleplay AI — Không giới hạn',
];

const EXAM_BUNDLE_EXTRA = [
  'Toàn bộ tính năng Premium',
  'Hiệu lực 90 ngày — đủ cho 1 kỳ thi',
  'Dành cho người sắp thi A1–B2',
  'Mua một lần, không tự gia hạn',
  'Tự động về Free sau 90 ngày',
];

const LIFETIME_EXTRA = [
  'Tất cả tính năng Premium',
  'Trọn đời — không gia hạn',
  'Early Backer badge',
  'Ưu tiên tính năng AI mới',
  'Hỗ trợ khách hàng ưu tiên',
];

type Val = boolean | string;
type Row = { feature: string; free: Val; lite: Val; premium: Val; lifetime: Val };
const COMPARISON: Row[] = [
  { feature: 'Mini-games & SRS', free: true, lite: true, premium: true, lifetime: true },
  { feature: 'Ngữ pháp A1–A2', free: true, lite: true, premium: true, lifetime: true },
  { feature: 'Ngữ pháp B1–B2', free: 'Xem 30%', lite: true, premium: true, lifetime: true },
  { feature: 'Streak & Leaderboard', free: true, lite: true, premium: true, lifetime: true },
  { feature: 'Word Bank cá nhân', free: '10 từ', lite: 'Không giới hạn', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Bộ chủ đề cá nhân', free: '10 bộ', lite: 'Không giới hạn', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'AI Nghe / Nói / Đọc / Viết', free: '2/tuần mỗi kỹ năng', lite: 'Không giới hạn', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Phát âm AI', free: '5/tuần', lite: 'Không giới hạn', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Shadowing AI', free: '3/tuần', lite: 'Không giới hạn', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Roleplay hội thoại AI', free: '1/tuần', lite: '20/tháng', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Speaking Rooms', free: '1/tuần', lite: 'Không giới hạn', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Đề thi Goethe/TELC (A1-B2)', free: false, lite: false, premium: true, lifetime: true },
  { feature: 'AI chấm điểm & giải thích', free: false, lite: false, premium: true, lifetime: true },
  { feature: 'Thời hạn sử dụng', free: '∞', lite: 'Gói đăng ký', premium: 'Gói đăng ký', lifetime: 'Mãi mãi' },
  { feature: 'Early Backer badge', free: false, lite: false, premium: false, lifetime: true },
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

export default function PricingPage() {
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
  const periodLabel = activePeriod === 'monthly' ? '/tháng' : activePeriod === 'quarterly' ? '/3 tháng' : '/năm';

  // Lite doesn't have a yearly plan — when period toggle is "yearly", show quarterly price for Lite.
  const liteEffectivePeriod: 'lite_monthly' | 'lite_quarterly' = activePeriod === 'monthly' ? 'lite_monthly' : 'lite_quarterly';
  const liteCurrentPrice = liteEffectivePeriod === 'lite_monthly' ? liteMonthlyPrice : liteQuarterlyPrice;
  const litePeriodLabel = liteEffectivePeriod === 'lite_monthly' ? '/tháng' : '/3 tháng';

  const PERIOD_OPTIONS: { key: PremiumPeriod; label: string; savePct?: number }[] = [
    { key: 'monthly', label: '1 Tháng' },
    { key: 'quarterly', label: '3 Tháng', savePct: savePctQuarterly },
    { key: 'yearly', label: '1 Năm', savePct: savePctYearly },
  ];

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
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">DeutschMeister</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 flex flex-col md:flex-row items-center justify-center gap-x-3">
            <span style={{ color: 'var(--theme-text-primary)' }}>Nâng tầm trình độ</span>
            <span className="text-indigo-500">Deutsch</span>
          </h1>
          
          <p className="text-sm md:text-base opacity-50 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            Mở khóa toàn bộ sức mạnh AI, luyện thi Goethe/TELC không giới hạn và nhận lộ trình học tập tối ưu nhất.
          </p>

          <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-bg-secondary border border-theme-border text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-all hover:bg-theme-bg-tertiary">
            <IconChevronLeft size={12} /> Trở về Dashboard
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
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Essential</div>
              <div className="text-2xl font-black mb-1">Miễn phí</div>
              <div className="text-xs opacity-60 font-medium">Cơ bản & ôn tập</div>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {FREE_FEATURES.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-medium opacity-70">
                  <IconCheck size={14} style={{ color: 'var(--theme-text-muted)', marginTop: '2px', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2 text-xs font-medium opacity-70">
                <IconCheck size={14} style={{ color: 'var(--theme-text-muted)', marginTop: '2px', flexShrink: 0 }} />
                AI Nghe/Nói/Đọc/Viết — 2/tuần mỗi kỹ năng
              </li>
              <li className="flex items-start gap-2 text-xs font-medium opacity-70">
                <IconCheck size={14} style={{ color: 'var(--theme-text-muted)', marginTop: '2px', flexShrink: 0 }} />
                Roleplay AI — 1 lượt/tuần
              </li>
            </ul>
            <button disabled={!isAuthenticated || isPremium}
              className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-theme-bg-secondary hover:bg-theme-border opacity-60">
              {isPremium ? 'Đã nâng cấp' : 'Gói hiện tại'}
            </button>
          </div>

          {/* Premium Lite Plan — entry tier */}
          <div className="group relative flex flex-col p-6 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-1"
            style={{ borderColor: 'var(--theme-border)' }}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Lite</div>
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
              <div className="text-[11px] opacity-60 font-medium mt-1">Practice AI không giới hạn</div>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {LITE_EXTRA.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-bold">
                  <IconCheck size={14} className="text-emerald-500" style={{ marginTop: '2px', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            {!isAuthenticated ? (
              <Link href="/auth/login?returnTo=/pricing"
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center">
                Đăng nhập để mua
              </Link>
            ) : (
              <button onClick={() => openUpgrade(liteEffectivePeriod)}
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 hover:scale-[1.02] active:scale-95">
                {isPremiumLite ? 'Gói của bạn' : 'Bắt đầu Lite'}
              </button>
            )}
          </div>

          {/* Premium Full - Featured */}
          <div className="group relative flex flex-col p-6 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-2 lg:scale-105 z-10"
            style={{ borderColor: ACCENT.writing, boxShadow: '0 20px 50px -12px rgba(99,102,241,0.15)' }}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
              Phổ biến nhất
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Professional</div>
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
              {priceReady && perMonthPrice ? <div className="text-[11px] opacity-60 font-medium mt-1">Chỉ {formatVND(perMonthPrice)}/tháng</div> : null}
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {PREMIUM_EXTRA.map((f, i) => (
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
                Đăng nhập để mua
              </Link>
            ) : (
              <button onClick={() => openUpgrade(activePeriod)}
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                {userPlan === 'premium' ? 'Gói của bạn' : 'Nâng cấp ngay'}
              </button>
            )}
          </div>

          {/* Exam Bundle — one-time 90-day */}
          <div className="group relative flex flex-col p-6 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-1"
            style={{ borderColor: '#A855F744' }}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-purple-500">Exam Bundle</div>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[9px] font-black">90 NGÀY</span>
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-black text-purple-500">
                  {priceReady ? formatVND(examBundlePrice) : <span className="opacity-60">—</span>}
                </div>
              </div>
              <div className="text-[11px] opacity-60 font-medium mt-1">Một lần — đủ cho 1 kỳ thi</div>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {EXAM_BUNDLE_EXTRA.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-bold">
                  <IconStar size={14} className="text-purple-500" style={{ marginTop: '2px', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            {!isAuthenticated ? (
              <Link href="/auth/login?returnTo=/pricing"
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 flex items-center justify-center">
                Đăng nhập để mua
              </Link>
            ) : (
              <button onClick={() => openUpgrade('exam_bundle')}
                className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 hover:scale-[1.02] active:scale-95">
                {isExamBundle ? 'Đang dùng Bundle' : 'Mua Exam Bundle'}
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
                <div className="text-[11px] font-black uppercase tracking-widest text-pink-500">Lifetime · Elite</div>
                {lifetimeInfo && !lifetimeSoldOut && (
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-500 text-[9px] font-black">CÒN {lifetimeInfo.remaining} SUẤT</span>
                )}
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-3xl md:text-4xl font-black text-pink-500">
                  {priceReady ? formatVND(lifetimePrice) : <span className="opacity-60">—</span>}
                </div>
                <div className="text-sm opacity-60 font-medium">Mua một lần · Dùng mãi mãi</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {LIFETIME_EXTRA.map((f, i) => (
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
                  Đăng nhập để mua
                </Link>
              ) : (
                <button onClick={() => openUpgrade('lifetime')} disabled={lifetimeSoldOut}
                  className={`w-full py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${lifetimeSoldOut ? 'bg-theme-bg-secondary opacity-60 cursor-not-allowed' : 'bg-pink-500/10 text-pink-500 border border-pink-500/20 hover:bg-pink-500/20 hover:scale-[1.02]'}`}>
                  {isLifetime ? 'Đã kích hoạt' : lifetimeSoldOut ? 'Hết suất ưu đãi' : 'Mua trọn đời'}
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
                    Giới thiệu bạn — cùng có lợi
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                  Bạn được giảm 10% · Bạn bè giúp bạn kiếm hoa hồng tới 15%
                </h2>
                <p className="text-xs md:text-sm opacity-60 font-medium leading-relaxed mb-4 max-w-2xl">
                  Khi bạn bè đăng ký bằng mã của bạn, họ được giảm 10% lần đầu mua bất kỳ gói nào. Khi họ mua gói Premium dài hạn, bạn nhận hoa hồng vào số dư — có thể rút tiền mặt qua chuyển khoản.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <ReferralRate label="Premium 3 tháng" pct={5} amount="từ 5.355đ" />
                  <ReferralRate label="Premium 1 năm" pct={10} amount="từ 33.210đ" />
                  <ReferralRate label="Premium trọn đời" pct={15} amount="từ 202.365đ" highlight />
                </div>

                <div className="text-[11px] opacity-50 font-medium">
                  * Hoa hồng tính trên số tiền thực thu sau giảm giá. Gói tháng, gói Lite và gói luyện thi 90 ngày không tính hoa hồng.
                </div>
              </div>

              <div className="w-full md:w-auto md:min-w-50">
                {!isAuthenticated ? (
                  <Link href="/auth/register"
                    className="w-full block py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white text-center shadow-xl shadow-indigo-500/20 hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                    Tạo tài khoản & nhận mã
                  </Link>
                ) : (
                  <Link href="/referral"
                    className="w-full block py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white text-center shadow-xl shadow-indigo-500/20 hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                    Lấy mã giới thiệu
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="mb-24 animate-[slideUp_0.6s_ease-out_0.3s_both]">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black mb-2">So sánh chi tiết</h2>
            <p className="text-xs opacity-60 font-medium uppercase tracking-widest">Lựa chọn thông minh cho lộ trình của bạn</p>
          </div>
          <div className="rounded-4xl border overflow-x-auto backdrop-blur-xl bg-theme-bg-card/50" style={{ borderColor: 'var(--theme-border)' }}>
            <table className="w-full min-w-180">
              <thead>
                <tr className="bg-theme-bg-secondary/50">
                  <th className="text-left py-5 px-6 text-[11px] font-black uppercase tracking-widest opacity-60">Tính năng</th>
                  <th className="text-center py-5 px-3 text-[11px] font-black uppercase tracking-widest opacity-60 w-24">Free</th>
                  <th className="text-center py-5 px-3 text-[11px] font-black uppercase tracking-widest text-emerald-500 w-24">Lite</th>
                  <th className="text-center py-5 px-3 text-[11px] font-black uppercase tracking-widest text-indigo-500 w-24">Premium</th>
                  <th className="text-center py-5 px-3 text-[11px] font-black uppercase tracking-widest text-pink-500 w-24">Lifetime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="hover:bg-white/1 transition-colors">
                    <td className="py-3 px-6 text-xs font-bold opacity-80">{row.feature}</td>
                    <td className="text-center py-3 px-3">
                      {row.free === true ? <div className="flex justify-center"><IconCheck size={14} className="opacity-60" /></div> : row.free === false ? <div className="flex justify-center"><IconX size={14} /></div> : <span className="text-[10px] font-black opacity-60">{row.free}</span>}
                    </td>
                    <td className="text-center py-3 px-3">
                      {row.lite === true ? <div className="flex justify-center"><IconCheck size={14} className="text-emerald-500" /></div> : row.lite === false ? <div className="flex justify-center"><IconX size={14} /></div> : <span className="text-[10px] font-black text-emerald-500">{row.lite}</span>}
                    </td>
                    <td className="text-center py-3 px-3">
                      {row.premium === true ? <div className="flex justify-center"><IconZap size={14} className="text-indigo-500" /></div> : row.premium === false ? <div className="flex justify-center"><IconX size={14} /></div> : <span className="text-[10px] font-black text-indigo-500">{row.premium}</span>}
                    </td>
                    <td className="text-center py-3 px-3">
                      {row.lifetime === true ? <div className="flex justify-center"><IconStar size={14} className="text-pink-500" /></div> : row.lifetime === false ? <div className="flex justify-center"><IconX size={14} /></div> : <span className="text-[10px] font-black text-pink-500">{row.lifetime}</span>}
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
             <h2 className="text-2xl font-black">Giải đáp thắc mắc</h2>
          </div>
          <div className="grid gap-4">
            {[
              { q: 'Làm sao để kích hoạt Premium?', a: 'Sau khi chuyển khoản ngân hàng hoặc quét mã VietQR, admin sẽ xác nhận giao dịch của bạn. Thông thường quá trình này mất 1-4 giờ, tối đa 24 giờ.' },
              { q: 'Quyền lợi của gói Lifetime là gì?', a: 'Bạn chỉ cần thanh toán một lần duy nhất và sở hữu trọn đời mọi tính năng Premium hiện tại và tương lai. Ngoài ra, bạn còn nhận được danh hiệu Early Backer độc quyền.' },
              { q: 'Chính sách hoàn tiền như thế nào?', a: 'Chúng tôi cam kết hoàn tiền 100% trong vòng 7 ngày đầu tiên nếu bạn không hài lòng với dịch vụ và chưa sử dụng quá 10 lượt luyện tập AI.' },
              { q: 'Nếu dùng hết lượt AI ở bản Free?', a: 'Bạn vẫn có thể học từ vựng, ngữ pháp và chơi mini-games bình thường. Các lượt luyện tập AI sẽ được làm mới vào mỗi thứ Hai hàng tuần.' },
              { q: 'Hoa hồng giới thiệu bạn bè hoạt động thế nào?', a: 'Mỗi tài khoản có một mã giới thiệu riêng (xem tại trang Giới thiệu bạn). Khi bạn bè đăng ký bằng mã của bạn và thanh toán gói Premium 3 tháng, 1 năm hoặc trọn đời, bạn nhận hoa hồng tương ứng 5% / 10% / 15% vào số dư. Gói tháng, gói Lite và gói luyện thi không tính hoa hồng.' },
              { q: 'Làm sao để nhận hoa hồng ra tiền mặt?', a: 'Vào trang Giới thiệu bạn, bấm "Rút tiền", nhập số tài khoản ngân hàng và số tiền muốn rút (tối thiểu 50.000đ). Admin sẽ duyệt và chuyển khoản trong vòng 1-3 ngày làm việc.' },
              { q: 'Mã giới thiệu giảm giá thế nào cho người mới?', a: 'Khi bạn nhập mã giới thiệu lúc đăng ký, bạn được giảm 10% cho lần đầu tiên mua bất kỳ gói trả phí nào (Lite / Premium / Lifetime / Exam Bundle). Ưu đãi này chỉ áp dụng một lần và không cộng dồn với mã khuyến mãi khác.' },
            ].map(({ q, a }) => (
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
          Bảo mật thanh toán · Hỗ trợ 24/7 · DeutschMeister Team
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} defaultPeriod={defaultPeriod} />
    </div>
  );
}
