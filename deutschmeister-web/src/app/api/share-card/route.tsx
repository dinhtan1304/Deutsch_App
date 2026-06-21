import { ImageResponse } from 'next/og';
/* eslint-disable no-restricted-syntax */
import { ACCENT, GRADIENT } from '@/lib/tokens';

export const runtime = 'edge';

// Dynamic shareable result card (1200×630 PNG) for the viral share loop.
// Reuses the visual language of /opengraph-image.tsx but is parameterised:
//   /api/share-card?score=88&level=B1&skill=reading&code=ABC123&lang=vi
// The client (useShareResult) builds this URL and shares the PNG as a file,
// embedding the user's referral code so recipients land with a discount.

type Lang = 'vi' | 'en' | 'de';

const SKILL: Record<string, { grad: string; accent: string }> = {
  reading: { grad: GRADIENT.reading, accent: ACCENT.reading },
  writing: { grad: GRADIENT.writing, accent: ACCENT.writing },
  listening: { grad: GRADIENT.listening, accent: ACCENT.listening },
  speaking: { grad: GRADIENT.speaking, accent: ACCENT.speaking },
};

const SKILL_LABEL: Record<Lang, Record<string, string>> = {
  vi: { reading: 'Đọc hiểu', writing: 'Viết', listening: 'Nghe', speaking: 'Nói' },
  en: { reading: 'Reading', writing: 'Writing', listening: 'Listening', speaking: 'Speaking' },
  de: { reading: 'Lesen', writing: 'Schreiben', listening: 'Hören', speaking: 'Sprechen' },
};

function grade(score: number, lang: Lang): { emoji: string; label: string } {
  const t = {
    vi: ['Xuất sắc', 'Rất tốt', 'Đạt', 'Cố thêm chút', 'Đừng bỏ cuộc'],
    en: ['Excellent', 'Very good', 'Passed', 'Keep going', "Don't give up"],
    de: ['Ausgezeichnet', 'Sehr gut', 'Bestanden', 'Weiter üben', 'Nicht aufgeben'],
  }[lang] as [string, string, string, string, string];
  if (score >= 90) return { emoji: '🏆', label: t[0] };
  if (score >= 75) return { emoji: '🌟', label: t[1] };
  if (score >= 60) return { emoji: '✓', label: t[2] };
  if (score >= 40) return { emoji: '📖', label: t[3] };
  return { emoji: '💪', label: t[4] };
}

const CTA: Record<Lang, (code: string, pct: number) => string> = {
  vi: (c, p) => `Nhập mã ${c} khi đăng ký để giảm ${p}%`,
  en: (c, p) => `Use code ${c} at sign-up for ${p}% off`,
  de: (c, p) => `Code ${c} bei der Anmeldung für ${p}% Rabatt`,
};

const TRY: Record<Lang, string> = {
  vi: 'Thử sức tại deutschmeister.vn',
  en: 'Try it at deutschmeister.vn',
  de: 'Teste es auf deutschmeister.vn',
};

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const score = Math.max(0, Math.min(100, Math.round(Number(searchParams.get('score')) || 0)));
  const level = (searchParams.get('level') || '').slice(0, 4).toUpperCase();
  const skillKey = (searchParams.get('skill') || 'reading').toLowerCase();
  const code = (searchParams.get('code') || '').slice(0, 16).toUpperCase();
  const pct = Math.max(1, Math.min(100, Math.round(Number(searchParams.get('pct')) || 10)));
  const lang: Lang = (['vi', 'en', 'de'] as const).includes(searchParams.get('lang') as Lang)
    ? (searchParams.get('lang') as Lang)
    : 'vi';

  const skill = SKILL[skillKey] ?? { grad: GRADIENT.brand, accent: ACCENT.brand };
  const skillLabel = SKILL_LABEL[lang][skillKey] ?? skillKey;
  const g = grade(score, lang);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630, background: '#0a0f1e',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden',
          padding: 64,
        }}
      >
        {/* Glow blobs tinted by the skill accent */}
        <div style={{
          position: 'absolute', top: -120, left: -100, width: 520, height: 520, borderRadius: '50%',
          background: `radial-gradient(circle, ${skill.accent}40 0%, transparent 70%)`, display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -140, right: -80, width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)', display: 'flex',
        }} />

        {/* Header: logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: GRADIENT.reading,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 900, color: 'white',
          }}>D</div>
          <div style={{
            fontSize: 34, fontWeight: 900, letterSpacing: '-1px',
            background: 'linear-gradient(135deg, #ffffff, #a78bfa)',
            backgroundClip: 'text', color: 'transparent', display: 'flex',
          }}>Deutschmeister</div>
        </div>

        {/* Body: big score badge + grade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 56, flex: 1 }}>
          <div style={{
            width: 300, height: 300, borderRadius: '50%', background: skill.grad,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 16px 64px ${skill.accent}55`,
          }}>
            <div style={{ fontSize: 110, fontWeight: 900, color: 'white', lineHeight: 1, display: 'flex' }}>
              {score}<span style={{ fontSize: 48, fontWeight: 800, opacity: 0.85, display: 'flex' }}>%</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 80, display: 'flex' }}>{g.emoji}</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: 'white', display: 'flex' }}>{g.label}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {level && (
                <div style={{
                  padding: '8px 22px', borderRadius: 100, background: `${skill.accent}26`,
                  border: `1px solid ${skill.accent}66`, color: 'white', fontSize: 26, fontWeight: 800, display: 'flex',
                }}>{level}</div>
              )}
              <div style={{
                padding: '8px 22px', borderRadius: 100, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.9)',
                fontSize: 26, fontWeight: 700, display: 'flex',
              }}>{skillLabel}</div>
            </div>
          </div>
        </div>

        {/* Footer: referral CTA / domain */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24,
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#4ADE80', display: 'flex' }}>
            {code ? CTA[lang](code, pct) : TRY[lang]}
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
            deutschmeister.vn
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
