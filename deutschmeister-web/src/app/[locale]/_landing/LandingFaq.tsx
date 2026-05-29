'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
/* eslint-disable no-restricted-syntax */

export function LandingFaq() {
  const t = useTranslations('landing.faq');
  const faqItems = [1, 2, 3, 4, 5, 6, 7].map(n => ({
    q: t(`q${n}` as 'q1'),
    a: t(`a${n}` as 'a1'),
  }));

  return (
    <section id="faq" style={{ padding: '96px 24px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.3)', fontSize: 12.5, fontWeight: 700, color: '#60A5FA', marginBottom: 16 }}>
          {t('kicker')}
        </div>
        <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
          {t('titleStart')} <span className="gradient-text">{t('titleAccent')}</span> {t('titleEnd')}
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqItems.map(({ q, a }) => (
          <details key={q} style={{ borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', padding: '0' }}>
            <summary style={{ padding: '18px 22px', fontSize: 15, fontWeight: 600, color: 'white', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              {q}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </summary>
            <p style={{ padding: '0 22px 18px', margin: 0, fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.8 }}>{a}</p>
          </details>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <Link href="/pricing" style={{ fontSize: 14, color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
          {t('viewPricing')}
        </Link>
      </div>
    </section>
  );
}
