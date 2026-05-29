'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
/* eslint-disable no-restricted-syntax */

const textStyle = { fontSize: 14.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.85 as const };
const pStyle = { ...textStyle, margin: '0 0 10px' };
const ulStyle = { ...textStyle, paddingLeft: 20, margin: '10px 0', display: 'flex' as const, flexDirection: 'column' as const, gap: 6, listStyle: 'disc' as const };
const liStyle = { lineHeight: 1.8 };
const h2Style = { fontSize: 18, fontWeight: 800 as const, color: 'white', marginBottom: 14 };
const h3Style = { fontSize: 15, fontWeight: 700 as const, color: 'rgba(255,255,255,.85)', marginBottom: 8, marginTop: 16 };

const richB = { b: (chunks: React.ReactNode) => <strong>{chunks}</strong> };

export default function TermsPage() {
  const t = useTranslations('account.terms');
  const tLegal = useTranslations('account.legal');

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0f1e', color: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,.06)',
        background: 'rgba(10,15,30,.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/logo-32.png" width={32} height={32} alt="" priority style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>Deutschmeister</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>
            {tLegal('navHome')}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.5px' }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
            {tLegal('lastUpdated', { date: tLegal('lastUpdatedDate') })}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <div>
            <h2 style={h2Style}>{t('s1Title')}</h2>
            <p style={pStyle}>{t('s1p1')}</p>
            <p style={pStyle}>{t('s1p2')}</p>
          </div>

          <div>
            <h2 style={h2Style}>{t('s2Title')}</h2>
            <ul style={ulStyle}>
              <li style={liStyle}>{t('s2l1')}</li>
              <li style={liStyle}>{t('s2l2')}</li>
              <li style={liStyle}>{t('s2l3')}</li>
              <li style={liStyle}>{t('s2l4')}</li>
              <li style={liStyle}>{t('s2l5')}</li>
            </ul>
          </div>

          <div>
            <h2 style={h2Style}>{t('s3Title')}</h2>

            <h3 style={h3Style}>{t('s3_1Title')}</h3>
            <p style={pStyle}>{t('s3_1p')}</p>

            <h3 style={h3Style}>{t('s3_2Title')}</h3>
            <p style={pStyle}>{t('s3_2p')}</p>

            <h3 style={h3Style}>{t('s3_3Title')}</h3>
            <p style={pStyle}>{t('s3_3p')}</p>
          </div>

          <div>
            <h2 style={h2Style}>{t('s4Title')}</h2>
            <p style={pStyle}>{t('s4p')}</p>
            <ul style={ulStyle}>
              <li style={liStyle}>{t('s4l1')}</li>
              <li style={liStyle}>{t('s4l2')}</li>
              <li style={liStyle}>{t('s4l3')}</li>
              <li style={liStyle}>{t('s4l4')}</li>
              <li style={liStyle}>{t('s4l5')}</li>
            </ul>
          </div>

          <div>
            <h2 style={h2Style}>{t('s5Title')}</h2>
            <p style={pStyle}>{t('s5p')}</p>
            <ul style={ulStyle}>
              <li style={liStyle}>{t('s5l1')}</li>
              <li style={liStyle}>{t('s5l2')}</li>
              <li style={liStyle}>{t('s5l3')}</li>
            </ul>
          </div>

          <div>
            <h2 style={h2Style}>{t('s6Title')}</h2>
            <p style={pStyle}>{t('s6p1')}</p>
            <ul style={ulStyle}>
              <li style={liStyle}>{t('s6l1')}</li>
              <li style={liStyle}>{t('s6l2')}</li>
              <li style={liStyle}>{t('s6l3')}</li>
              <li style={liStyle}>{t.rich('s6l4', richB)}</li>
            </ul>
            <p style={pStyle}>{t('s6p2')}</p>
          </div>

          <div>
            <h2 style={h2Style}>{t('s7Title')}</h2>
            <p style={pStyle}>
              {t.rich('s7p', {
                link: (chunks) => <Link href="/privacy" style={{ color: '#A78BFA', textDecoration: 'underline' }}>{chunks}</Link>,
              })}
            </p>
          </div>

          <div>
            <h2 style={h2Style}>{t('s8Title')}</h2>
            <ul style={ulStyle}>
              <li style={liStyle}>{t('s8l1')}</li>
              <li style={liStyle}>{t('s8l2')}</li>
              <li style={liStyle}>{t('s8l3')}</li>
              <li style={liStyle}>{t('s8l4')}</li>
            </ul>
          </div>

          <div>
            <h2 style={h2Style}>{t('s9Title')}</h2>
            <p style={pStyle}>{t('s9p')}</p>
          </div>

          <div>
            <h2 style={h2Style}>{t('s10Title')}</h2>
            <p style={pStyle}>{t('s10p')}</p>
            <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)', marginTop: 8 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,.7)' }}>
                {tLegal('contactEmail')} <strong style={{ color: '#A78BFA' }}>{tLegal('supportEmail')}</strong>
              </p>
            </div>
          </div>

        </div>

        {/* Back link */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 24 }}>
          <Link href="/" style={{ fontSize: 14, color: '#A78BFA', textDecoration: 'none', fontWeight: 600 }}>
            {tLegal('backHome')}
          </Link>
          <Link href="/privacy" style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', textDecoration: 'none', fontWeight: 500 }}>
            {tLegal('linkPrivacy')}
          </Link>
        </div>
      </main>
    </div>
  );
}
