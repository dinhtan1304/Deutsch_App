'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

const PLANS = [
  {
    code: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Miễn phí',
    features: [
      'Từ vựng & Word Bank đầy đủ',
      'Tất cả mini-games',
      'Ngữ pháp & luyện tập cơ bản',
      'Topics & chủ đề',
      'Luyện viết / đọc / nghe / nói — 3 lần/ngày',
    ],
    excluded: [
      'Thi thử Goethe/TELC chuẩn (A1–B1)',
      'AI chấm điểm Writing nâng cao',
      'AI chấm điểm Speaking',
    ],
    color: '#64748B',
    cta: 'Bắt đầu miễn phí',
    ctaHref: '/auth/register',
  },
  {
    code: 'premium',
    name: 'Premium',
    monthlyPrice: 99000,
    yearlyPrice: 990000,
    priceLabel: '99.000đ / tháng',
    yearlyLabel: '990.000đ / năm (tiết kiệm 2 tháng)',
    features: [
      'Tất cả tính năng Free',
      'Luyện tập không giới hạn',
      'Thi thử Goethe/TELC chuẩn (A1–B1)',
      'AI chấm điểm Writing chi tiết',
      'AI chấm điểm Speaking',
      'Luyện nghe theo đề thi',
      'Theo dõi tiến độ nâng cao',
    ],
    excluded: [],
    color: '#6366F1',
    cta: 'Nâng cấp Premium',
    ctaHref: '/billing',
  },
];

function CheckIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function PricingPage() {
  const { user } = useAuthStore();
  const currentPlan = user?.subscription?.plan ?? 'free';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', padding: '60px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#F1F5F9', marginBottom: 12 }}>
            Chọn gói phù hợp với bạn
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 500, margin: '0 auto' }}>
            Bắt đầu miễn phí, nâng cấp khi bạn cần thêm tính năng để luyện thi Goethe/TELC.
          </p>
        </div>

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 48 }}>
          {PLANS.map(plan => {
            const isCurrentPlan = currentPlan === plan.code;
            const isPremium = plan.code === 'premium';
            return (
              <div key={plan.code} style={{
                backgroundColor: '#1E293B',
                borderRadius: 16,
                border: `2px solid ${isPremium ? '#6366F1' : '#334155'}`,
                padding: 32,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {isPremium && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#6366F1', color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>Phổ biến nhất</div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {plan.name}
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#F1F5F9' }}>
                    {plan.priceLabel}
                  </p>
                  {isPremium && (
                    <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      hoặc {(plan as typeof PLANS[1]).yearlyLabel}
                    </p>
                  )}
                </div>

                <div style={{ flex: 1, marginBottom: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#94A3B8' }}>
                        <span style={{ color: '#22C55E', marginTop: 1 }}><CheckIcon /></span>
                        {f}
                      </div>
                    ))}
                    {plan.excluded.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#475569' }}>
                        <span style={{ color: '#475569', marginTop: 1 }}><XIcon /></span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {isCurrentPlan ? (
                  <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: 700, color: '#64748B', border: '1px solid #334155', borderRadius: 10 }}>
                    Gói hiện tại
                  </div>
                ) : (
                  <Link href={user ? plan.ctaHref : '/auth/register'} style={{
                    display: 'block', textAlign: 'center', padding: '12px 0',
                    borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    backgroundColor: isPremium ? '#6366F1' : '#1E293B',
                    color: isPremium ? '#fff' : '#94A3B8',
                    border: isPremium ? 'none' : '1px solid #334155',
                  }}>
                    {plan.cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Bank transfer note */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 6 }}>
            Thanh toán qua <strong style={{ color: '#F1F5F9' }}>chuyển khoản ngân hàng</strong> — Admin xác nhận trong vòng 24 giờ.
          </p>
          <p style={{ fontSize: 13, color: '#475569' }}>
            Sau khi chuyển khoản, gói Premium sẽ được kích hoạt thủ công bởi admin.
          </p>
          {user && (
            <Link href="/billing" style={{ display: 'inline-block', marginTop: 14, padding: '8px 20px', borderRadius: 8, backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Nâng cấp ngay →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
