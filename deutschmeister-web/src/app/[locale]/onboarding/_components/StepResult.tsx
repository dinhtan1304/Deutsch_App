'use client';

import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { LEVEL_CONFIG } from '../_data';
import { gradientBtn, cardBg, borderColor } from '../_styles';

interface Scores {
  a1: number;
  a2: number;
  b1: number;
  total: number;
}

interface Props {
  detectedLevel: keyof typeof LEVEL_CONFIG;
  scores: Scores;
  totalQuestions: number;
  onNext: () => void;
}

export function StepResult({ detectedLevel, scores, totalQuestions, onNext }: Props) {
  const t = useTranslations('onboarding.result');
  const tRoot = useTranslations('onboarding');
  const lc = LEVEL_CONFIG[detectedLevel];
  const pct = Math.round((scores.total / totalQuestions) * 100);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 24px' }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={lc.color} strokeWidth="3"
            strokeDasharray={`${pct * 0.94} 100`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>{scores.total}</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>/ {totalQuestions}</span>
        </div>
      </div>

      <div style={{
        display: 'inline-block', padding: '6px 20px', borderRadius: '10px', fontSize: '18px', fontWeight: 700,
        background: `${lc.color}18`, color: lc.color, border: `1.5px solid ${lc.color}40`, marginBottom: '12px',
      }}>
        {t('levelLabel', { level: detectedLevel, label: tRoot(lc.labelKey) })}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
        {scores.total >= 12 ? t('msgExcellent')
          : scores.total >= 7 ? t('msgGood')
          : t('msgBeginner')}
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
        {[
          { lv: 'A1', score: scores.a1, color: STATUS.success },
          { lv: 'A2', score: scores.a2, color: ACCENT.srs },
          { lv: 'B1', score: scores.b1, color: ACCENT.vocab },
        ].map(({ lv, score, color }) => (
          <div key={lv} style={{ flex: 1, padding: '14px 8px', borderRadius: '12px', background: cardBg, border: `1px solid ${borderColor}`, textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color, marginBottom: '4px' }}>{lv}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>
              {score}<span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>/5</span>
            </div>
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '2px', background: color, width: `${(score / 5) * 100}%`, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={onNext} style={gradientBtn} className="ob-btn">
        {t('continueBtn')}
      </button>
    </div>
  );
}
