'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlans } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';

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

const COMPARISON = [
  { feature: 'Từ vựng & mini-games', free: true, premium: true },
  { feature: 'Ngữ pháp & chủ đề', free: true, premium: true },
  { feature: 'Dictionary click-to-lookup', free: true, premium: true },
  { feature: 'Streak & Leaderboard', free: true, premium: true },
  { feature: 'Luyện viết / đọc / nghe / nói', free: '3 lần/ngày', premium: 'Không giới hạn' },
  { feature: 'Đề thi Goethe/TELC (Reading)', free: false, premium: true },
  { feature: 'Đề thi Goethe/TELC (Writing)', free: false, premium: true },
  { feature: 'Đề thi Goethe/TELC (Listening)', free: false, premium: true },
  { feature: 'Đề thi Goethe/TELC (Speaking)', free: false, premium: true },
  { feature: 'AI chấm điểm Writing', free: false, premium: true },
  { feature: 'AI chấm điểm Speaking', free: false, premium: true },
  { feature: 'AI giải thích lỗi tiếng Việt', free: false, premium: true },
];

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

export default function PricingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { data: plans } = usePlans();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [defaultPeriod, setDefaultPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const isPremium = user?.subscription?.plan === 'premium' && user?.subscription?.status === 'active';

  const premiumPlan = plans?.find((p) => p.code === 'premium');
  const monthlyPrice = premiumPlan?.monthlyPrice ?? 99000;
  const yearlyPrice = premiumPlan?.yearlyPrice ?? 990000;
  const yearlyMonthly = Math.round(yearlyPrice / 12);
  const savePct = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

  const openUpgrade = (period: 'monthly' | 'yearly') => {
    setDefaultPeriod(period);
    setUpgradeOpen(true);
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Nâng cấp lên Premium
          </h1>
          <p className="text-[15px] max-w-xl mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
            Luyện thi Goethe/TELC không giới hạn. AI chấm bài, mô phỏng đề thi chuẩn, giải thích lỗi bằng tiếng Việt.
          </p>
        </div>

        {/* Plan Cards */}
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
                  {CHECK}
                  <span>{f}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                {CHECK}
                <span>Luyện viết/đọc/nghe/nói — 3 lần/ngày</span>
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
                className="text-center text-[13px] font-bold py-2.5 rounded-lg transition-colors"
                style={{ color: 'var(--theme-text-primary)', backgroundColor: 'var(--theme-bg-secondary)' }}
              >
                Đăng ký miễn phí
              </Link>
            )}
          </div>

          {/* Premium Monthly */}
          <div
            className="rounded-2xl border p-6 flex flex-col"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          >
            <div className="mb-5">
              <div className="text-[13px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#8B5CF6' }}>Premium</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{formatVND(monthlyPrice)}</span>
                <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>/tháng</span>
              </div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>Huỷ bất kỳ lúc nào</div>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.slice(0, 2).map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  {CHECK}
                  <span>{f}</span>
                </li>
              ))}
              {PREMIUM_EXTRA.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  {CHECK}
                  <span className="font-medium">{f}</span>
                </li>
              ))}
            </ul>
            {isPremium ? (
              <div className="text-center text-[13px] font-medium py-2.5 rounded-lg" style={{ color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' }}>
                Đang sử dụng
              </div>
            ) : (
              <button
                onClick={() => openUpgrade('monthly')}
                className="w-full py-2.5 rounded-lg text-[14px] font-bold text-white transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                Đăng ký tháng
              </button>
            )}
          </div>

          {/* Premium Yearly — Recommended */}
          <div
            className="rounded-2xl border-2 p-6 flex flex-col relative"
            style={{ borderColor: '#8B5CF6', backgroundColor: 'var(--theme-bg-card)' }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-0.5 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
            >
              Tiết kiệm {savePct}%
            </div>
            <div className="mb-5">
              <div className="text-[13px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#8B5CF6' }}>Premium Năm</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{formatVND(yearlyPrice)}</span>
                <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>/năm</span>
              </div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Chỉ {formatVND(yearlyMonthly)}/tháng
              </div>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.slice(0, 2).map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  {CHECK}
                  <span>{f}</span>
                </li>
              ))}
              {PREMIUM_EXTRA.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  {CHECK}
                  <span className="font-medium">{f}</span>
                </li>
              ))}
            </ul>
            {isPremium ? (
              <div className="text-center text-[13px] font-medium py-2.5 rounded-lg" style={{ color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' }}>
                Đang sử dụng
              </div>
            ) : (
              <button
                onClick={() => openUpgrade('yearly')}
                className="w-full py-2.5 rounded-lg text-[14px] font-bold text-white transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
              >
                Đăng ký năm — Tiết kiệm {savePct}%
              </button>
            )}
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
                  <th className="text-center py-3 px-4 font-semibold w-28" style={{ color: 'var(--theme-text-muted)' }}>Free</th>
                  <th className="text-center py-3 px-4 font-semibold w-28" style={{ color: '#8B5CF6' }}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} style={{ borderTop: '1px solid var(--theme-border)' }}>
                    <td className="py-2.5 px-4" style={{ color: 'var(--theme-text-secondary)' }}>{row.feature}</td>
                    <td className="text-center py-2.5 px-4">
                      {row.free === true ? CHECK : row.free === false ? CROSS : (
                        <span className="text-[12px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{row.free}</span>
                      )}
                    </td>
                    <td className="text-center py-2.5 px-4">
                      {row.premium === true ? CHECK : typeof row.premium === 'string' ? (
                        <span className="text-[12px] font-medium" style={{ color: '#8B5CF6' }}>{row.premium}</span>
                      ) : CROSS}
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
              { q: 'Free hết lượt thì sao?', a: 'Bạn vẫn dùng được từ vựng, games, ngữ pháp, dictionary. Lượt luyện tập AI reset mỗi ngày (00:00 UTC+7).' },
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
              Chỉ từ {formatVND(yearlyMonthly)}/tháng khi đăng ký năm
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
