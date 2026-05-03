'use client';
/* eslint-disable no-restricted-syntax */

import { useState } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { usePlans, useLifetimeRemaining } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import type { BillingPeriod } from '@/lib/api/subscriptions';
import { IconChevronLeft, IconCheck, IconZap, IconStar, IconMessageCircle } from '@/components/ui/Icons';
import Link from 'next/link';
import Image from 'next/image';

// Simple X icon for comparison
const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FREE_FEATURES = [
  'Từ vựng & Word Bank',
  'Tất cả mini-games ôn tập',
  'Ngữ pháp cơ bản',
  'Chủ đề & Topics',
  'Dictionary click-to-lookup',
  'Streak & Leaderboard',
];

const PREMIUM_EXTRA = [
  'Luyện tập không giới hạn',
  'Thi thử Goethe/TELC chuẩn',
  'AI chấm điểm Writing',
  'AI chấm điểm Speaking',
  'Luyện nghe theo đề thi',
  'Giải thích lỗi tiếng Việt',
];

const LIFETIME_EXTRA = [
  'Tất cả tính năng Premium',
  'Trọn đời — không gia hạn',
  'Early Backer badge',
  'Ưu tiên tính năng AI mới',
  'Hỗ trợ khách hàng ưu tiên',
];

type Val = boolean | string;
const COMPARISON: { feature: string; free: Val; premium: Val; lifetime: Val }[] = [
  { feature: 'Từ vựng & mini-games', free: true, premium: true, lifetime: true },
  { feature: 'Ngữ pháp & chủ đề', free: true, premium: true, lifetime: true },
  { feature: 'Streak & Leaderboard', free: true, premium: true, lifetime: true },
  { feature: 'Luyện viết / nói (AI)', free: '3 lần/tuần', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Roleplay hội thoại AI', free: '3 lần/tuần', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Đề thi Goethe/TELC (A1-B2)', free: false, premium: true, lifetime: true },
  { feature: 'AI chấm điểm & giải thích', free: false, premium: true, lifetime: true },
  { feature: 'Thời hạn sử dụng', free: '∞', premium: 'Gói đăng ký', lifetime: 'Mãi mãi' },
  { feature: 'Early Backer badge', free: false, premium: false, lifetime: true },
];

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

type PremiumPeriod = 'monthly' | 'quarterly' | 'yearly';

export default function PricingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { data: plans } = usePlans();
  const { data: lifetimeInfo } = useLifetimeRemaining();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [defaultPeriod, setDefaultPeriod] = useState<BillingPeriod>('yearly');
  const [activePeriod, setActivePeriod] = useState<PremiumPeriod>('yearly');

  const isPremium = (user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'lifetime') && user?.subscription?.status === 'active';
  const isLifetime = user?.subscription?.plan === 'lifetime';

  const premiumPlan = plans?.find((p) => p.code === 'premium');
  const lifetimePlan = plans?.find((p) => p.code === 'lifetime');
  const monthlyPrice = premiumPlan?.monthlyPrice ?? 99000;
  const quarterlyPrice = premiumPlan?.quarterlyPrice ?? 249000;
  const yearlyPrice = premiumPlan?.yearlyPrice ?? 990000;
  const lifetimePrice = lifetimePlan?.price ?? 1490000;

  const savePctYearly = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  const savePctQuarterly = Math.round((1 - quarterlyPrice / (monthlyPrice * 3)) * 100);
  const lifetimeSoldOut = lifetimeInfo ? lifetimeInfo.remaining <= 0 : false;

  const currentPrice = activePeriod === 'monthly' ? monthlyPrice : activePeriod === 'quarterly' ? quarterlyPrice : yearlyPrice;
  const perMonthPrice = activePeriod === 'monthly' ? null : activePeriod === 'quarterly' ? Math.round(quarterlyPrice / 3) : Math.round(yearlyPrice / 12);
  const periodLabel = activePeriod === 'monthly' ? '/tháng' : activePeriod === 'quarterly' ? '/3 tháng' : '/năm';

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
            <Image src="/logo.png" width={48} height={48} alt="Logo" className="rounded-2xl shadow-2xl mb-3" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">DeutschMeister</span>
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

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20 animate-[slideUp_0.6s_ease-out_0.2s_both] items-stretch">
          {/* Free Plan */}
          <div className="group relative flex flex-col p-8 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-1" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="mb-8">
              <div className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-2">Essential</div>
              <div className="text-3xl font-black mb-1">Miễn phí</div>
              <div className="text-xs opacity-40 font-medium">Cơ bản & ôn tập nhẹ nhàng</div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] font-medium opacity-70">
                  <IconCheck size={16} style={{ color: 'var(--theme-text-muted)', marginTop: '2px' }} />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-3 text-[13px] font-medium opacity-70">
                <IconCheck size={16} style={{ color: 'var(--theme-text-muted)', marginTop: '2px' }} />
                AI — 3 lượt/tuần
              </li>
            </ul>
            <button disabled={!isAuthenticated || isPremium}
              className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isPremium ? 'opacity-20 cursor-not-allowed' : 'bg-theme-bg-secondary hover:bg-theme-border opacity-60'}`}>
              {isPremium ? 'Gói hiện tại: Premium' : 'Gói hiện tại'}
            </button>
          </div>

          {/* Premium Plan - Featured */}
          <div className="group relative flex flex-col p-8 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-2 scale-105 z-10"
            style={{ borderColor: ACCENT.writing, boxShadow: '0 20px 50px -12px rgba(99,102,241,0.15)' }}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
              Phổ biến nhất
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-indigo-500">Professional</div>
                {activePeriod !== 'monthly' && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[9px] font-black">TIẾT KIỆM {activePeriod === 'quarterly' ? savePctQuarterly : savePctYearly}%</span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-4xl font-black text-indigo-500">{formatVND(currentPrice)}</div>
                <div className="text-xs opacity-40 font-medium">{periodLabel}</div>
              </div>
              {perMonthPrice && <div className="text-[11px] opacity-40 font-medium mt-1">Chỉ {formatVND(perMonthPrice)}/tháng</div>}
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {PREMIUM_EXTRA.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] font-bold">
                  <IconZap size={16} className="text-indigo-500" style={{ marginTop: '2px' }} />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-3 text-[13px] font-bold opacity-40">
                <IconCheck size={16} style={{ marginTop: '2px' }} />
                Bao gồm mọi tính năng Free
              </li>
            </ul>
            <button onClick={() => openUpgrade(activePeriod)}
              className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
              {isPremium ? 'Gói của bạn' : 'Nâng cấp ngay'}
            </button>
          </div>

          {/* Lifetime Plan */}
          <div className="group relative flex flex-col p-8 rounded-4xl border bg-theme-bg-card transition-all duration-500 hover:-translate-y-1" 
            style={{ borderColor: '#EC489933' }}>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-pink-500">Elite</div>
                {lifetimeInfo && !lifetimeSoldOut && (
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-500 text-[9px] font-black">CÒN {lifetimeInfo.remaining} SUẤT</span>
                )}
              </div>
              <div className="text-3xl font-black text-pink-500">{formatVND(lifetimePrice)}</div>
              <div className="text-xs opacity-40 font-medium">Mua một lần - Dùng mãi mãi</div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {LIFETIME_EXTRA.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] font-medium text-pink-500/80">
                  <IconStar size={16} className="text-pink-500" style={{ marginTop: '2px' }} />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => openUpgrade('lifetime')} disabled={lifetimeSoldOut}
              className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg ${lifetimeSoldOut ? 'bg-theme-bg-secondary opacity-40 cursor-not-allowed' : 'bg-pink-500/10 text-pink-500 border border-pink-500/20 hover:bg-pink-500/20 hover:scale-[1.02]'}`}>
              {isLifetime ? 'Đã kích hoạt' : lifetimeSoldOut ? 'Hết suất ưu đãi' : 'Mua trọn đời'}
            </button>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="mb-24 animate-[slideUp_0.6s_ease-out_0.3s_both]">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black mb-2">So sánh chi tiết</h2>
            <p className="text-xs opacity-40 font-medium uppercase tracking-widest">Lựa chọn thông minh cho lộ trình của bạn</p>
          </div>
          <div className="rounded-4xl border overflow-hidden backdrop-blur-xl bg-theme-bg-card/50" style={{ borderColor: 'var(--theme-border)' }}>
            <table className="w-full">
              <thead>
                <tr className="bg-theme-bg-secondary/50">
                  <th className="text-left py-6 px-8 text-[11px] font-black uppercase tracking-widest opacity-40">Tính năng</th>
                  <th className="text-center py-6 px-6 text-[11px] font-black uppercase tracking-widest opacity-40 w-28">Free</th>
                  <th className="text-center py-6 px-6 text-[11px] font-black uppercase tracking-widest text-indigo-500 w-28">Premium</th>
                  <th className="text-center py-6 px-6 text-[11px] font-black uppercase tracking-widest text-pink-500 w-28">Lifetime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="hover:bg-white/1 transition-colors">
                    <td className="py-4 px-8 text-[13px] font-bold opacity-80">{row.feature}</td>
                    <td className="text-center py-4 px-6">
                      {row.free === true ? <div className="flex justify-center"><IconCheck size={16} className="opacity-30" /></div> : row.free === false ? <div className="flex justify-center"><IconX size={16} /></div> : <span className="text-[10px] font-black opacity-30">{row.free}</span>}
                    </td>
                    <td className="text-center py-4 px-6">
                      {row.premium === true ? <div className="flex justify-center"><IconZap size={16} className="text-indigo-500" /></div> : row.premium === false ? <div className="flex justify-center"><IconX size={16} /></div> : <span className="text-[10px] font-black text-indigo-500">{row.premium}</span>}
                    </td>
                    <td className="text-center py-4 px-6">
                      {row.lifetime === true ? <div className="flex justify-center"><IconStar size={16} className="text-pink-500" /></div> : row.lifetime === false ? <div className="flex justify-center"><IconX size={16} /></div> : <span className="text-[10px] font-black text-pink-500">{row.lifetime}</span>}
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
        <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-[0.2em]">
          Bảo mật thanh toán · Hỗ trợ 24/7 · DeutschMeister Team
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} defaultPeriod={defaultPeriod} />

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
