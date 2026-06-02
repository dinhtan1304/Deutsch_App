'use client';

import { useTranslations } from 'next-intl';
import { IconBrain, IconBookOpen, IconTarget, IconFlame, IconChevronLeft, IconPlus } from '@/components/ui/Icons';

type ProgressStats = { total: number; mastered: number; learning: number; due: number; new: number };

type QuizMode = 'gender' | 'de-vi' | 'vi-de' | 'mixed';

function IconLanguages({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
    </svg>
  );
}

function IconShuffle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" /><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" /><path d="m18 14 4 4-4 4" />
    </svg>
  );
}

function IconZap({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// Calm v2 palette routed through CSS vars (same set the immersive review screen uses).
const QUIZ_MODES: { key: QuizMode; labelKey: 'modeGender' | 'modeDeVi' | 'modeViDe' | 'modeMixed'; descKey: 'modeGenderDesc' | 'modeDeViDesc' | 'modeViDeDesc' | 'modeMixedDesc'; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string }[] = [
  { key: 'gender', labelKey: 'modeGender', descKey: 'modeGenderDesc', icon: IconTarget,    color: 'var(--der)' },
  { key: 'de-vi',  labelKey: 'modeDeVi',   descKey: 'modeDeViDesc',   icon: IconLanguages, color: 'var(--violet)' },
  { key: 'vi-de',  labelKey: 'modeViDe',   descKey: 'modeViDeDesc',   icon: IconBookOpen,  color: 'var(--warn)' },
  { key: 'mixed',  labelKey: 'modeMixed',  descKey: 'modeMixedDesc',  icon: IconShuffle,   color: 'var(--success)' },
];

interface SRSSetupScreenProps {
  stats: ProgressStats | undefined;
  quizMode: QuizMode;
  onSetMode: (m: QuizMode) => void;
  onStart: () => void;
  onBack: () => void;
  onAddWords: () => void;
}

export function SRSSetupScreen({ stats, quizMode, onSetMode, onStart, onBack, onAddWords }: SRSSetupScreenProps) {
  const t = useTranslations('progress.review');
  const statItems = [
    { label: t('setupStatDue'),      value: stats?.due ?? 0,      icon: IconFlame,    color: 'var(--streak)' },
    { label: t('setupStatMastered'), value: stats?.mastered ?? 0, icon: IconTarget,   color: 'var(--success)' },
    { label: t('setupStatLearning'), value: stats?.learning ?? 0, icon: IconBookOpen, color: 'var(--warn)' },
    { label: t('setupStatTotal'),    value: stats?.total ?? 0,    icon: IconBrain,    color: 'var(--accent)' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"
          style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
          <IconBrain size={30} style={{ color: 'var(--accent)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--theme-text-primary)' }}>{t('setupTitle')}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {statItems.map(item => {
            const Ic = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border p-4 text-center"
                style={{ background: 'var(--theme-bg-tertiary)', borderColor: 'var(--theme-border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 mx-auto"
                  style={{ background: `color-mix(in srgb, ${item.color} 15%, transparent)`, color: item.color }}>
                  <Ic size={16} />
                </div>
                <div className="mono text-2xl font-bold leading-none" style={{ color: item.color }}>{item.value}</div>
                <div className="text-caption font-medium mt-1.5" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
              </div>
            );
          })}
        </div>

        {(stats?.due ?? 0) > 0 ? (
          <>
            <p className="text-body font-semibold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>{t('chooseMode')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 max-w-md mx-auto">
              {QUIZ_MODES.map(mode => {
                const active = quizMode === mode.key;
                const Ic = mode.icon;
                return (
                  <button key={mode.key} onClick={() => onSetMode(mode.key)}
                    data-active={active}
                    style={{ ['--mode' as string]: mode.color } as React.CSSProperties}
                    className="v2-mode-card p-3 rounded-xl border-[1.5px]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                      style={{ background: active ? `color-mix(in srgb, ${mode.color} 18%, transparent)` : 'var(--theme-bg-tertiary)' }}>
                      <Ic size={16} style={{ color: active ? mode.color : 'var(--theme-text-muted)' }} />
                    </div>
                    <div className="text-[13px] font-bold" style={{ color: active ? mode.color : 'var(--theme-text-secondary)' }}>{t(mode.labelKey)}</div>
                    <div className="text-[10.5px] leading-tight mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{t(mode.descKey)}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
              {t.rich('dueCountMessage', { count: stats?.due ?? 0, b: (chunks) => <span className="font-bold" style={{ color: 'var(--accent)' }}>{chunks}</span> })}
            </p>
            <button onClick={onStart}
              className="flex items-center gap-2.5 mx-auto px-8 h-12 rounded-[14px] font-bold text-[15px] transition-transform hover:-translate-y-0.5 active:scale-95"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
              <IconZap size={18} /> {t('startReview')}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: 'var(--success)' }}>{t('allDone')}</p>
            <button onClick={onAddWords}
              className="v2-btn-soft flex items-center gap-2 mx-auto px-6 h-11 rounded-md font-semibold text-sm">
              <IconPlus size={16} /> {t('addNewWords')}
            </button>
          </>
        )}

        <div className="mt-6">
          <button onClick={onBack}
            className="flex items-center gap-1.5 mx-auto text-body font-medium transition-all hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={16} /> {t('back')}
          </button>
        </div>
      </div>
    </div>
  );
}
