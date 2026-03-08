'use client';

import Link from 'next/link';

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', padding: '80px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#F1F5F9', marginBottom: 12 }}>
          Đang trong giai đoạn Beta
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
          Tất cả tính năng đang được mở khóa miễn phí để bạn trải nghiệm và đóng góp phản hồi.
          Gói Premium sẽ được ra mắt sau khi kết thúc giai đoạn Beta.
        </p>
        <Link href="/dashboard" style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 10,
          backgroundColor: '#6366F1', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          ← Về Dashboard
        </Link>
      </div>
    </div>
  );
}
