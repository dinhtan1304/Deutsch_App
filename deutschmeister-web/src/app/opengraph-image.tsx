import { ImageResponse } from 'next/og';
/* eslint-disable no-restricted-syntax */
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

export const runtime = 'edge';
export const alt = 'Deutschmeister — Học tiếng Đức cùng AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0f1e',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow blobs */}
        <div style={{
          position: 'absolute', top: -80, left: -80,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: -60,
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '25%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Top badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 100,
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.4)',
          marginBottom: 32,
        }}>
          <div style={{ fontSize: 16, color: '#a78bfa', fontWeight: 700, letterSpacing: '0.05em' }}>
            🇩🇪  CHUẨN GOETHE / TELC  •  AI POWERED
          </div>
        </div>

        {/* Logo + App name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #22C55E, #14B8A6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 38, fontWeight: 900, color: 'white',
            boxShadow: '0 8px 32px rgba(34,197,94,0.4)',
          }}>
            D
          </div>
          <div style={{
            fontSize: 52, fontWeight: 900, letterSpacing: '-1.5px',
            background: 'linear-gradient(135deg, #ffffff, #a78bfa)',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
          }}>
            Deutschmeister
          </div>
        </div>

        {/* Main tagline */}
        <div style={{
          fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
          textAlign: 'center', maxWidth: 760, lineHeight: 1.4,
          marginBottom: 40,
        }}>
          Học tiếng Đức toàn diện — AI chấm bài,{' '}
          <span style={{ color: '#4ADE80' }}>luyện thi Goethe & TELC</span>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { text: '5000+ Từ vựng', color: STATUS.success, bg: 'rgba(34,197,94,0.12)' },
            { text: '8 Mini-games', color: ACCENT.vocab, bg: 'rgba(139,92,246,0.12)' },
            { text: 'AI chấm Writing & Speaking', color: ACCENT.xp, bg: 'rgba(245,158,11,0.12)' },
            { text: 'Đề thi A1 · A2 · B1', color: ACCENT.listening, bg: 'rgba(236,72,153,0.12)' },
          ].map((pill) => (
            <div
              key={pill.text}
              style={{
                padding: '10px 20px', borderRadius: 100,
                background: pill.bg,
                border: `1px solid ${pill.color}44`,
                color: pill.color,
                fontSize: 16, fontWeight: 700,
                display: 'flex',
              }}
            >
              {pill.text}
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div style={{
          position: 'absolute', bottom: 32,
          color: 'rgba(255,255,255,0.25)', fontSize: 15, fontWeight: 500,
          display: 'flex',
        }}>
          deutschmeister.vn
        </div>
      </div>
    ),
    { ...size },
  );
}
