'use client';

import { useTranslations } from 'next-intl';
import { IconBrain, IconBookOpen, IconTarget, IconFlame, IconChevronLeft, IconPlus } from '@/components/ui/Icons';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

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

const QUIZ_MODES: { key: QuizMode; labelKey: 'modeGender' | 'modeDeVi' | 'modeViDe' | 'modeMixed'; descKey: 'modeGenderDesc' | 'modeDeViDesc' | 'modeViDeDesc' | 'modeMixedDesc'; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string }[] = [
  { key: 'gender', labelKey: 'modeGender', descKey: 'modeGenderDesc', icon: IconTarget,    color: ACCENT.srs },
  { key: 'de-vi',  labelKey: 'modeDeVi',   descKey: 'modeDeViDesc',   icon: IconLanguages, color: ACCENT.vocab },
  { key: 'vi-de',  labelKey: 'modeViDe',   descKey: 'modeViDeDesc',   icon: IconBookOpen,  color: ACCENT.xp },
  { key: 'mixed',  labelKey: 'modeMixed',  descKey: 'modeMixedDesc',  icon: IconShuffle,   color: STATUS.success },
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
    { label: t('setupStatDue'), value: stats?.due ?? 0,      icon: IconFlame,    color: STATUS.danger,   bg: `linear-gradient(135deg, ${STATUS.danger}1F, ${STATUS.danger}0F)` },
    { label: t('setupStatMastered'), value: stats?.mastered ?? 0, icon: IconTarget,   color: STATUS.success,  bg: `linear-gradient(135deg, ${STATUS.success}1F, ${STATUS.success}0F)` },
    { label: t('setupStatLearning'), value: stats?.learning ?? 0, icon: IconBookOpen, color: ACCENT.xp,       bg: `linear-gradient(135deg, ${ACCENT.xp}1F, ${ACCENT.xp}0F)` },
    { label: t('setupStatTotal'),     value: stats?.total ?? 0,    icon: IconBrain,    color: ACCENT.writing,  bg: `linear-gradient(135deg, ${ACCENT.writing}1F, ${ACCENT.writing}0F)` },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6"
          style={{ background: `linear-gradient(135deg, ${ACCENT.srs}26, ${ACCENT.writing}1A)` }}>
          <IconBrain size={36} style={{ color: ACCENT.srs }} />
        </div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--theme-text-primary)' }}>{t('setupTitle')}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {statItems.map(item => {
            const Ic = item.icon;
            return (
              <div key={item.label} className="relative overflow-hidden p-4 rounded-2xl" style={{ background: item.bg }}>
                <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full" style={{ backgroundColor: item.color, opacity: 0.06 }} />
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 mx-auto"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}>
                  <Ic size={14} className="text-white" />
                </div>
                <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
                <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
              </div>
            );
          })}
        </div>

        {(stats?.due ?? 0) > 0 ? (
          <>
            <p className="text-body font-semibold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>{t('chooseMode')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 max-w-md mx-auto">
              {QUIZ_MODES.map(mode => {
                const active = quizMode === mode.key;
                const Ic = mode.icon;
                return (
                  <button key={mode.key} onClick={() => onSetMode(mode.key)}
                    className="p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 border-2"
                    style={{ borderColor: active ? mode.color : 'var(--theme-border)', backgroundColor: active ? `${mode.color}10` : 'transparent' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                      style={{ background: active ? `linear-gradient(135deg, ${mode.color}, ${mode.color}cc)` : 'var(--theme-bg-secondary)' }}>
                      <Ic size={16} style={{ color: active ? 'white' : 'var(--theme-text-muted)' }} />
                    </div>
                    <div className="text-xs font-bold" style={{ color: active ? mode.color : 'var(--theme-text-secondary)' }}>{t(mode.labelKey)}</div>
                    <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t(mode.descKey)}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
              {t.rich('dueCountMessage', { count: stats?.due ?? 0, b: (chunks) => <span className="font-bold" style={{ color: ACCENT.srs }}>{chunks}</span> })}
            </p>
            <button onClick={onStart}
              className="flex items-center gap-2 mx-auto px-8 py-3 rounded-xl font-semibold text-[15px] text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: GRADIENT.action }}>
              <IconZap size={18} /> {t('startReview')}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: STATUS.success }}>{t('allDone')}</p>
            <button onClick={onAddWords}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:-translate-y-0.5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
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
