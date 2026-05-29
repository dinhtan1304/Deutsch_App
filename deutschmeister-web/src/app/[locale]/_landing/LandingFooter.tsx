'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const IconArrow = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const LEVEL_BADGES = [
  // eslint-disable-next-line no-restricted-syntax
  { label: 'A1', color: '#22C55E' },
  // eslint-disable-next-line no-restricted-syntax
  { label: 'A2', color: '#3B82F6' },
  // eslint-disable-next-line no-restricted-syntax
  { label: 'B1', color: '#8B5CF6' },
];

const linkHover = (e: React.MouseEvent<HTMLElement>, hover: boolean) => {
  e.currentTarget.style.color = hover ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.5)';
};

const linkStyle: React.CSSProperties = {
  fontSize: 13.5, color: 'rgba(255,255,255,.5)', textDecoration: 'none', transition: 'color .2s',
};

const colHeading: React.CSSProperties = {
  fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.6)',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
};

export function LandingFooter() {
  const t = useTranslations('landing.footer');

  const learningLinks: [string, string][] = [
    [t('learnDictionary'), '#features'],
    [t('learnGames'), '#games'],
    [t('learnSrs'), '#features'],
    [t('learnGrammar'), '#features'],
  ];

  const examLinks: [string, string][] = [
    [t('examReading'), '#exam'],
    [t('examListening'), '#exam'],
    [t('examWriting'), '#exam'],
    [t('examSpeaking'), '#exam'],
    [t('examLevels'), '#exam'],
  ];

  const accountLinks: [string, string][] = [
    [t('accountRegister'), '/auth/register'],
    [t('accountLogin'), '/auth/login'],
  ];

  const policyLinks: [string, string][] = [
    [t('policyPrivacy'), '/privacy'],
    [t('policyTerms'), '/terms'],
  ];

  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.015)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px 32px' }}>

        {/* Brand */}
        <div style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Image src="/logo-48.png" width={38} height={38} alt="Deutschmeister" style={{ borderRadius: 11, flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>Deutschmeister</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 20, maxWidth: 240 }}>
            {t('brandDesc')}
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div
              // eslint-disable-next-line no-restricted-syntax
              style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'white', flexShrink: 0 }}>G</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>{t('geminiTitle')}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.6)' }}>{t('geminiSub')}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={colHeading}>{t('colLearning')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {learningLinks.map(([label, href]) => (
              <li key={label}>
                <a href={href} style={linkStyle}
                  onMouseEnter={e => linkHover(e, true)} onMouseLeave={e => linkHover(e, false)}>{label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={colHeading}>{t('colExam')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {examLinks.map(([label, href]) => (
              <li key={label}>
                <a href={href} style={linkStyle}
                  onMouseEnter={e => linkHover(e, true)} onMouseLeave={e => linkHover(e, false)}>{label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={colHeading}>{t('colCommunity')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <li>
              <a href="https://discord.gg/NfztBxtxh" target="_blank" rel="noopener noreferrer" style={linkStyle}
                onMouseEnter={e => linkHover(e, true)} onMouseLeave={e => linkHover(e, false)}>
                {t('discord')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 style={colHeading}>{t('colAccount')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
            {accountLinks.map(([label, href]) => (
              <li key={label}>
                <Link href={href} style={linkStyle}
                  onMouseEnter={e => linkHover(e, true)} onMouseLeave={e => linkHover(e, false)}>{label}</Link>
              </li>
            ))}
          </ul>
          <Link href="/words"
            // eslint-disable-next-line no-restricted-syntax
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,.35)' }}>
            {t('startNow')} <IconArrow />
          </Link>

          <h3 style={{ ...colHeading, marginTop: 28, marginBottom: 12 }}>{t('colPolicy')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {policyLinks.map(([label, href]) => (
              <li key={label}>
                <Link href={href} style={linkStyle}
                  onMouseEnter={e => linkHover(e, true)} onMouseLeave={e => linkHover(e, false)}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>{t('copyright')}</span>
            <span style={{ color: 'rgba(255,255,255,.12)' }}>|</span>
            <Link href="/privacy" style={{ color: 'rgba(255,255,255,.6)', textDecoration: 'none', fontSize: 12 }}>{t('bottomPrivacy')}</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,.6)', textDecoration: 'none', fontSize: 12 }}>{t('bottomTerms')}</Link>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {LEVEL_BADGES.map(l => (
              <span key={l.label} style={{ fontSize: 11.5, fontWeight: 700, color: l.color, padding: '2px 10px', borderRadius: 6, background: `${l.color}15`, border: `1px solid ${l.color}30` }}>{l.label}</span>
            ))}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', marginLeft: 4 }}>Goethe · TELC</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
