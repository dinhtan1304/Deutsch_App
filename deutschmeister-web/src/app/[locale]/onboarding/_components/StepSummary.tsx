'use client';
/* eslint-disable no-restricted-syntax */

import { useTranslations } from 'next-intl';
import { LEVEL_CONFIG } from '../_data';
import { gradientBtn, cardBg, borderColor } from '../_styles';

interface Props {
  detectedLevel: keyof typeof LEVEL_CONFIG;
  dailyGoal: number | null;
  scores: { total: number };
  totalQuestions: number;
  isPending: boolean;
  onComplete: () => void;
}

export function StepSummary({ detectedLevel, dailyGoal, scores, totalQuestions, isPending, onComplete }: Props) {
  const t = useTranslations('onboarding.summary');
  const tRoot = useTranslations('onboarding');
  const lc = LEVEL_CONFIG[detectedLevel];

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        {t('title')}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '32px' }}>
        {t('subtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
        {/* Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '16px', background: cardBg, border: `1px solid ${borderColor}` }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${lc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${lc.color}30` }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={lc.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginBottom: '2px' }}>{t('levelLabel')}</div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>{t('levelValue', { level: detectedLevel, label: tRoot(lc.labelKey) })}</div>
          </div>
        </div>

        {/* Goal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '16px', background: cardBg, border: `1px solid ${borderColor}` }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(139,92,246,0.25)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginBottom: '2px' }}>{t('goalLabel')}</div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>{dailyGoal != null ? t('goalValue', { count: dailyGoal }) : t('goalEmpty')}</div>
          </div>
        </div>

        {/* Quiz score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '16px', background: cardBg, border: `1px solid ${borderColor}` }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(34,197,94,0.25)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginBottom: '2px' }}>{t('quizLabel')}</div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>{t('quizValue', { correct: scores.total, total: totalQuestions })}</div>
          </div>
        </div>
      </div>

      <button
        onClick={onComplete}
        disabled={isPending}
        style={{ ...gradientBtn, opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '17px', padding: '16px 32px' }}
        className="ob-btn"
      >
        {isPending ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {t('savingBtn')}
          </span>
        ) : (
          t('startBtn')
        )}
      </button>
    </div>
  );
}
