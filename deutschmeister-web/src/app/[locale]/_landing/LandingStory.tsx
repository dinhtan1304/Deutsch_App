'use client';
/* eslint-disable no-restricted-syntax */
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

const RICH = {
  b: (chunks: ReactNode) => <strong style={{ color: 'inherit' }}>{chunks}</strong>,
  i: (chunks: ReactNode) => <em>{chunks}</em>,
};

export function LandingStory() {
  const t = useTranslations('landing.story');

  const storyItems = [
    {
      emoji: '😫',
      iconBg: 'linear-gradient(135deg, #EF4444, #F97316)',
      iconShadow: '0 4px 20px rgba(239,68,68,.3)',
      cardBg: 'rgba(239,68,68,.04)',
      label: t('item1Label'),
      labelColor: '#F87171',
      paras: ['item1Para1', 'item1Para2'] as const,
    },
    {
      emoji: '💡',
      iconBg: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      iconShadow: '0 4px 20px rgba(245,158,11,.3)',
      cardBg: 'rgba(245,158,11,.04)',
      label: t('item2Label'),
      labelColor: '#FBBF24',
      paras: ['item2Para1', 'item2Para2'] as const,
    },
    {
      emoji: '✨',
      iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      iconShadow: '0 4px 20px rgba(99,102,241,.3)',
      cardBg: 'rgba(99,102,241,.04)',
      label: t('item3Label'),
      labelColor: '#A78BFA',
      paras: ['item3Para1', 'item3Para2'] as const,
    },
  ];

  return (
    <section id="story" style={{ padding: '96px 24px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)', fontSize: 12.5, fontWeight: 700, color: '#4ade80', marginBottom: 16 }}>
          {t('kicker')}
        </div>
        <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
          {t('titleStart')} <span className="gradient-text">{t('titleAccent')}</span>
        </h2>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 23, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, rgba(99,102,241,.3), rgba(34,197,94,.3), rgba(245,158,11,.3))', borderRadius: 2 }} className="hide-mobile" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {storyItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 20 }}>
              <div className="hide-mobile" style={{ width: 48, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, zIndex: 1, boxShadow: item.iconShadow }}>
                  {item.emoji}
                </div>
              </div>
              <div className="glow-border" style={{ flex: 1, borderRadius: 20, padding: '24px 28px', background: item.cardBg }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.labelColor, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                {item.paras.map((paraKey, j) => (
                  <p key={paraKey} style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: j === 0 ? 0 : '14px 0 0' }}>
                    {t.rich(paraKey, RICH)}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* Final card — Deutschmeister */}
          <div style={{ display: 'flex', gap: 20 }}>
            <div className="hide-mobile" style={{ width: 48, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #22C55E, #14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, zIndex: 1, boxShadow: '0 4px 20px rgba(34,197,94,.3)' }}>
                {'🚀'}
              </div>
            </div>
            <div style={{ flex: 1, borderRadius: 20, padding: '24px 28px', background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)', boxShadow: '0 0 20px rgba(34,197,94,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('finalLabel')}</div>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: 0 }}>
                {t.rich('finalPara1', RICH)}
              </p>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: '14px 0 0' }}>
                {t('finalPara2')}
              </p>
              <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 14, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.15)' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
                  {t('quote')}
                </p>
                <p style={{ fontSize: 13, color: '#4ADE80', fontWeight: 700, margin: '10px 0 0' }}>
                  {t('quoteAuthor')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
