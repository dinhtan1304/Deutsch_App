'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlans, useLifetimeRemaining } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import type { BillingPeriod } from '@/lib/api/subscriptions';

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const CROSS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
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
  'Thi thử Goethe/TELC chuẩn (A1–B1)',
  'AI chấm điểm Writing',
  'AI chấm điểm Speaking',
  'Luyện nghe theo đề thi',
  'Giải thích lỗi bằng tiếng Việt',
];

const LIFETIME_EXTRA = [
  'Tất cả tính năng Premium',
  'Trọn đời — không cần gia hạn',
  'Early Backer badge',
  'Ưu tiên tính năng AI mới',
  'Ưu tiên hỗ trợ & custom tính năng',
];

type Val = boolean | string;
const COMPARISON: { feature: string; free: Val; premium: Val; lifetime: Val }[] = [
  { feature: 'Từ vựng & mini-games', free: true, premium: true, lifetime: true },
  { feature: 'Ngữ pháp & chủ đề', free: true, premium: true, lifetime: true },
  { feature: 'Dictionary click-to-lookup', free: true, premium: true, lifetime: true },
  { feature: 'Streak & Leaderboard', free: true, premium: true, lifetime: true },
  { feature: 'Luyện viết / đọc / nghe / nói', free: '3 lần/tuần', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Roleplay AI (hội thoại)', free: '3 lần/tuần', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Phát âm AI', free: '3 lần/tuần', premium: 'Không giới hạn', lifetime: 'Không giới hạn' },
  { feature: 'Đề thi Goethe/TELC (Reading)', free: false, premium: true, lifetime: true },
  { feature: 'Đề thi Goethe/TELC (Writing)', free: false, premium: true, lifetime: true },
  { feature: 'Đề thi Goethe/TELC (Listening)', free: false, premium: true, lifetime: true },
  { feature: 'Đề thi Goethe/TELC (Speaking)', free: false, premium: true, lifetime: true },
  { feature: 'AI chấm điểm Writing', free: false, premium: true, lifetime: true },
  { feature: 'AI chấm điểm Speaking', free: false, premium: true, lifetime: true },
  { feature: 'AI giải thích lỗi tiếng Việt', free: false, premium: true, lifetime: true },
  { feature: 'Thời hạn sử dụng', free: '∞', premium: 'Theo gói', lifetime: '∞ (Trọn đời)' },
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

  const isPremium =
    (user?.subscription?.plan === 'premium' ||
      (user?.subscription?.plan as string) === 'lifetime') &&
    user?.subscription?.status === 'active';
  const isLifetime = (user?.subscription?.plan as string) === 'lifetime';

  const premiumPlan = plans?.find((p) => p.code === 'premium');
  const lifetimePlan = plans?.find((p) => p.code === 'lifetime');
  const monthlyPrice = premiumPlan?.monthlyPrice ?? 99000;
  const quarterlyPrice = premiumPlan?.quarterlyPrice ?? 249000;
  const yearlyPrice = premiumPlan?.yearlyPrice ?? 990000;
  const lifetimePrice = lifetimePlan?.price ?? 1490000;
  const savePctYearly = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  const savePctQuarterly = Math.round((1 - quarterlyPrice / (monthlyPrice * 3)) * 100);
  const lifetimeSoldOut = lifetimeInfo ? lifetimeInfo.remaining <= 0 : false;

  const currentPrice =
    activePeriod === 'monthly' ? monthlyPrice :
    activePeriod === 'quarterly' ? quarterlyPrice :
    yearlyPrice;

  const perMonthPrice =
    activePeriod === 'monthly' ? null :
    activePeriod === 'quarterly' ? Math.round(quarterlyPrice / 3) :
    Math.round(yearlyPrice / 12);

  const periodLabel =
    activePeriod === 'monthly' ? '/tháng' :
    activePeriod === 'quarterly' ? '/3 tháng' :
    '/năm';

  const ctaLabel =
    activePeriod === 'monthly' ? 'Đăng ký tháng' :
    activePeriod === 'quarterly' ? 'Đăng ký 3 tháng' :
    `Đăng ký năm — Tiết kiệm ${savePctYearly}%`;

  const openUpgrade = (period: BillingPeriod) => {
    setDefaultPeriod(period);
    setUpgradeOpen(true);
  };

  const PERIOD_OPTIONS: { key: PremiumPeriod; label: string; savePct?: number }[] = [
    { key: 'monthly', label: '1 Tháng' },
    { key: 'quarterly', label: '3 Tháng', savePct: savePctQuarterly },
    { key: 'yearly', label: '1 Năm', savePct: savePctYearly },
  ];

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Nâng cấp lên Premium
          </h1>
          <p className="text-[15px] max-w-xl mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
            Luyện thi Goethe/TELC không giới hạn. AI chấm bài, mô phỏng đề thi chuẩn, giải thích lỗi bằng tiếng Việt.
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex justify-center mb-10">
          <div
            className="inline-flex items-center gap-1 p-1 rounded-2xl"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
          >
            {PERIOD_OPTIONS.map(({ key, label, savePct }) => {
              const isActive = activePeriod === key;
              return (
                <button
                  key={key}
                  onClick={() => setActivePeriod(key)}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                  style={isActive ? {
                    backgroundColor: 'var(--theme-bg-card)',
                    color: 'var(--theme-text-primary)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                    border: '1.5px solid var(--theme-border)',
                  } : {
                    color: 'var(--theme-text-muted)',
                    border: '1.5px solid transparent',
                  }}
                >
                  {label}
                  {savePct != null && savePct > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                      style={{
                        backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
                        color: '#22C55E',
                      }}
                    >
                      Tiết kiệm {savePct}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan Cards — always 3 */}
        <div className="grid md:grid-cols-3 gap-5 mb-14">

          {/* Free */}
          <div
            className="rounded-2xl border p-6 flex flex-col"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          >
            <div className="mb-5">
              <div className="text-[13px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Free</div>
              <div className="text-3xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>0đ</div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>Mãi mãi miễn phí</div>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  {CHECK}<span>{f}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                {CHECK}<span>Luyện viết/đọc/nghe/nói/roleplay/phát âm — 3 lần/tuần</span>
              </li>
            </ul>
            {isAuthenticated ? (
              isPremium ? (
                <div className="text-center text-[13px] font-medium py-2.5 rounded-lg" style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                  Gói hiện tại: Premium
                </div>
              ) : (
                <div className="text-center text-[13px] font-medium py-2.5 rounded-lg" style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                  Gói hiện tại
                </div>
              )
            ) : (
              <Link
                href="/login"
                className="text-center text-[13px] font-bold py-2.5 rounded-lg transition-colors block"
                style={{ color: 'var(--theme-text-primary)', backgroundColor: 'var(--theme-bg-secondary)' }}
              >
                Đăng ký miễn phí
              </Link>
            )}
          </div>

          {/* Premium — dynamic by period */}
          <div
            className="rounded-2xl border-2 p-6 flex flex-col relative"
            style={{ borderColor: '#8B5CF6', backgroundColor: 'var(--theme-bg-card)' }}
          >
            {activePeriod !== 'monthly' && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-0.5 rounded-full text-white whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                Tiết kiệm {activePeriod === 'quarterly' ? savePctQuarterly : savePctYearly}%
              </div>
            )}
            <div className="mb-5">
              <div className="text-[13px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#8B5CF6' }}>Premium</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                  {formatVND(currentPrice)}
                </span>
                <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>{periodLabel}</span>
              </div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {perMonthPrice != null
                  ? `Chỉ ${formatVND(perMonthPrice)}/tháng`
                  : 'Huỷ bất kỳ lúc nào'}
              </div>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.slice(0, 2).map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  {CHECK}<span>{f}</span>
                </li>
              ))}
              {PREMIUM_EXTRA.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  {CHECK}<span className="font-medium">{f}</span>
                </li>
              ))}
            </ul>
            {isPremium ? (
              <div className="text-center text-[13px] font-medium py-2.5 rounded-lg" style={{ color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' }}>
                Đang sử dụng
              </div>
            ) : (
              <button
                onClick={() => openUpgrade(activePeriod)}
                className="w-full py-2.5 rounded-lg text-[14px] font-bold text-white transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                {ctaLabel}
              </button>
            )}
          </div>

          {/* Lifetime */}
          <div
            className="rounded-2xl border-2 p-6 flex flex-col relative"
            style={{
              borderColor: '#EC4899',
              background: 'linear-gradient(180deg, var(--theme-bg-card), rgba(236,72,153,0.05))',
            }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-0.5 rounded-full text-white whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #EC4899, #F59E0B)' }}
            >
              🔥 Early Bird — Limited
            </div>
            <div className="mb-5">
              <div className="text-[13px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#EC4899' }}>Lifetime</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{formatVND(lifetimePrice)}</span>
              </div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Trả 1 lần — dùng trọn đời
              </div>
              {lifetimeInfo && !lifetimeSoldOut && (
                <div className="text-[12px] mt-2 font-semibold" style={{ color: '#EC4899' }}>
                  🔥 Còn {lifetimeInfo.remaining}/{lifetimeInfo.max} suất
                </div>
              )}
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {LIFETIME_EXTRA.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  {CHECK}<span className="font-medium">{f}</span>
                </li>
              ))}
            </ul>
            {isLifetime ? (
              <div className="text-center text-[13px] font-medium py-2.5 rounded-lg" style={{ color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' }}>
                Đang sử dụng
              </div>
            ) : lifetimeSoldOut ? (
              <div className="text-center text-[13px] font-medium py-2.5 rounded-lg" style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                Hết suất
              </div>
            ) : (
              <button
                onClick={() => openUpgrade('lifetime')}
                className="w-full py-2.5 rounded-lg text-[14px] font-bold text-white transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #EC4899, #F59E0B)' }}
              >
                Mua trọn đời
              </button>
            )}
          </div>
        </div>

        {/* Payment Guide */}
        <div className="rounded-2xl border p-6 mb-14" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h2 className="text-[15px] font-bold mb-5" style={{ color: 'var(--theme-text-primary)' }}>
            Cách thanh toán — 3 bước đơn giản
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Chọn gói & nhấn đăng ký', desc: 'Chọn Premium (tháng/quý/năm) hoặc Lifetime. Nhập mã giảm giá nếu có, xem số tiền cuối cùng.' },
              { step: '2', title: 'Chuyển khoản ngân hàng', desc: 'Chuyển đúng số tiền và nội dung chuyển khoản hiển thị trong modal (dạng "NANGCAP XXXXXXXX"). Quét mã VietQR cho nhanh.' },
              { step: '3', title: 'Kích hoạt trong vài giờ', desc: 'Admin xác nhận giao dịch — thường trong 1-4 giờ, tối đa 24 giờ. Bạn nhận email thông báo khi Premium đã active.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                  {step}
                </div>
                <div>
                  <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{title}</div>
                  <div className="text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 flex items-center gap-2 text-[12px]" style={{ borderTop: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
            Hỗ trợ qua email nếu có vấn đề thanh toán · Hoàn tiền trong 7 ngày nếu chưa hài lòng
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--theme-text-primary)' }}>
            So sánh chi tiết
          </h2>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Tính năng</th>
                  <th className="text-center py-3 px-4 font-semibold w-24" style={{ color: 'var(--theme-text-muted)' }}>Free</th>
                  <th className="text-center py-3 px-4 font-semibold w-24" style={{ color: '#8B5CF6' }}>Premium</th>
                  <th className="text-center py-3 px-4 font-semibold w-24" style={{ color: '#EC4899' }}>Lifetime</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} style={{ borderTop: '1px solid var(--theme-border)' }}>
                    <td className="py-2.5 px-4" style={{ color: 'var(--theme-text-secondary)' }}>{row.feature}</td>
                    <td className="text-center py-2.5 px-4">
                      {row.free === true ? CHECK : row.free === false ? CROSS : (
                        <span className="text-[12px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{row.free}</span>
                      )}
                    </td>
                    <td className="text-center py-2.5 px-4">
                      {row.premium === true ? CHECK : row.premium === false ? CROSS : (
                        <span className="text-[12px] font-medium" style={{ color: '#8B5CF6' }}>{row.premium}</span>
                      )}
                    </td>
                    <td className="text-center py-2.5 px-4">
                      {row.lifetime === true ? CHECK : row.lifetime === false ? CROSS : (
                        <span className="text-[12px] font-medium" style={{ color: '#EC4899' }}>{row.lifetime}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-10">
          <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--theme-text-primary)' }}>
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-3">
            {[
              { q: 'Làm sao để thanh toán?', a: 'Chuyển khoản ngân hàng hoặc quét mã VietQR. Sau khi chuyển, admin sẽ xác nhận trong 24 giờ.' },
              { q: 'Bao lâu thì Premium được kích hoạt?', a: 'Sau khi admin xác nhận thanh toán — thường trong vòng vài giờ, tối đa 24 giờ.' },
              { q: 'Có được hoàn tiền không?', a: 'Trong 7 ngày đầu, nếu chưa hài lòng hãy liên hệ email support để được hoàn tiền.' },
              { q: 'Free hết lượt thì sao?', a: 'Bạn vẫn dùng được từ vựng, games, ngữ pháp, dictionary. Lượt luyện tập AI reset vào thứ Hai hàng tuần (00:00 UTC+7).' },
              { q: 'Gói Lifetime là gì?', a: 'Trả 1 lần, dùng mãi mãi. Early bird deal giới hạn 500 slot đầu tiên — khi hết là không mở lại. Bạn sẽ nhận Early Backer badge và được ưu tiên tính năng AI mới.' },
              { q: 'Tôi có mã giảm giá, dùng ở đâu?', a: 'Khi bấm nút đăng ký, modal thanh toán sẽ có ô "Mã giảm giá". Nhập mã và bấm "Áp dụng" để thấy giá sau giảm trước khi chuyển khoản.' },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <summary className="text-[14px] font-semibold cursor-pointer list-none flex items-center justify-between" style={{ color: 'var(--theme-text-primary)' }}>
                  {q}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--theme-text-muted)' }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {!isPremium && (
          <div className="text-center">
            <button
              onClick={() => openUpgrade('yearly')}
              className="px-8 py-3 rounded-xl text-[15px] font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              Bắt đầu với Premium
            </button>
            <p className="text-[12px] mt-2" style={{ color: 'var(--theme-text-muted)' }}>
              Chỉ từ {formatVND(Math.round(yearlyPrice / 12))}/tháng khi đăng ký năm
            </p>
          </div>
        )}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod={defaultPeriod}
      />
    </div>
  );
}
