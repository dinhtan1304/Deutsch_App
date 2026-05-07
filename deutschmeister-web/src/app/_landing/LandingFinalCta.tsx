import Link from 'next/link';
import { GRADIENT, STATUS } from '@/lib/tokens';

const IconArrow = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconCheck = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function LandingFinalCta() {
  return (
    <section style={{ padding: '96px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontSize: 52, marginBottom: 20 }} className="float-2">🇩🇪</div>
        <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16, lineHeight: 1.15 }}>
          Sẵn sàng bắt đầu <span className="gradient-text">hành trình</span> của bạn?
        </h2>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, lineHeight: 1.7, marginBottom: 40 }}>
          Bắt đầu học tiếng Đức ngay hôm nay với sự hỗ trợ của AI.
        </p>
        <Link href="/auth/register" className="btn-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 16, background: GRADIENT.writing, color: 'white', fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 12px 40px rgba(99,102,241,.5)' }}>
          Tạo tài khoản <IconArrow />
        </Link>
        <div style={{ marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['AI', 'Chuẩn Goethe/TELC'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>
              <span style={{ color: STATUS.success }}><IconCheck /></span> {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
