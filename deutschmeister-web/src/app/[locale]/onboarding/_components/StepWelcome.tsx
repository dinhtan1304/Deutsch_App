'use client';
/* eslint-disable no-restricted-syntax */

import { useTranslations } from 'next-intl';
import { gradientBtn } from '../_styles';

interface Props {
  userName?: string | null;
  isPending: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function StepWelcome({ userName, isPending, onNext, onSkip }: Props) {
  const t = useTranslations('onboarding.welcome');
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '36px', fontWeight: 800,
        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', marginBottom: '12px', lineHeight: 1.2,
      }}>
        {t('greeting')}
      </div>
      {userName && (
        <div style={{ fontSize: '22px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
          {userName}
        </div>
      )}
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
        {t('intro')}
      </p>
      <div style={{
        margin: '0 auto 40px', width: '100px', height: '100px', borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(139,92,246,0.3)',
      }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="url(#wGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <path d="M12 20h9" />
          <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
        </svg>
      </div>
      <button onClick={onNext} style={gradientBtn} className="ob-btn">
        {t('startBtn')}
      </button>
      <button onClick={onSkip} disabled={isPending}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer', marginTop: '16px', padding: '8px 16px' }}
        className="ob-btn">
        {t('skipBtn')}
      </button>
    </div>
  );
}
