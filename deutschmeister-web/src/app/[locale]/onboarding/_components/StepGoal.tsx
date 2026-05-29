'use client';
/* eslint-disable no-restricted-syntax */

import { useTranslations } from 'next-intl';
import { GOALS } from '../_data';
import { gradientBtn, disabledBtn, cardBg, borderColor } from '../_styles';

interface Props {
  dailyGoal: number | null;
  isPending: boolean;
  onSetGoal: (value: number) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepGoal({ dailyGoal, isPending, onSetGoal, onNext, onSkip }: Props) {
  const t = useTranslations('onboarding.goal');
  return (
    <div>
      <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>
        {t('title')}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', textAlign: 'center', marginBottom: '32px' }}>
        {t('subtitle')}
      </p>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex', width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
          alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(139,92,246,0.25)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#gGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {GOALS.map((g) => {
          const sel = dailyGoal === g.value;
          return (
            <button key={g.value} onClick={() => onSetGoal(g.value)}
              style={{
                padding: '16px 20px', borderRadius: '14px',
                background: sel ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : cardBg,
                border: `1.5px solid ${sel ? 'transparent' : borderColor}`,
                color: 'white', fontSize: '15px', fontWeight: sel ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', width: '100%',
                boxShadow: sel ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
              }}
              className="ob-pill"
            >
              <span>{t(g.labelKey)}</span>
              <span style={{ fontSize: '13px', opacity: sel ? 0.9 : 0.5 }}>{t(g.subKey)}</span>
            </button>
          );
        })}
      </div>

      <button onClick={onNext} disabled={!dailyGoal} style={dailyGoal ? gradientBtn : disabledBtn} className="ob-btn">
        {t('continueBtn')}
      </button>
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <button onClick={onSkip} disabled={isPending}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer', padding: '6px 12px' }}>
          {t('skipBtn')}
        </button>
      </div>
    </div>
  );
}
