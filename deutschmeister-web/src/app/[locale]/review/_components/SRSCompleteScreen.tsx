'use client';

import { useTranslations } from 'next-intl';
import { IconTrophy, IconRefresh, IconChevronLeft, IconPlus } from '@/components/ui/Icons';

type ProgressStats = { total: number; mastered: number; learning: number; due: number; new: number };

interface SessionStats {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
}

interface SRSCompleteScreenProps {
  sessionStats: SessionStats;
  stats: ProgressStats | undefined;
  onContinue: () => void;
  onAddWords: () => void;
  onBack: () => void;
}

export function SRSCompleteScreen({ sessionStats, stats, onContinue, onAddWords, onBack }: SRSCompleteScreenProps) {
  const t = useTranslations('progress.review');
  const accuracy = sessionStats.correct + sessionStats.wrong > 0
    ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100) : 0;

  const resultItems = [
    { label: t('resultCorrect'),    value: sessionStats.correct,    color: 'var(--success)' },
    { label: t('resultWrong'),      value: sessionStats.wrong,      color: 'var(--danger)' },
    { label: t('resultAccuracy'),   value: `${accuracy}%`,          color: 'var(--accent)' },
    { label: t('resultBestStreak'), value: sessionStats.bestStreak, color: 'var(--streak)' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: 'color-mix(in srgb, var(--success) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)' }}>
          <IconTrophy size={30} style={{ color: 'var(--success)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('complete')}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          {resultItems.map(item => (
            <div key={item.label} className="rounded-2xl border p-4"
              style={{ background: 'var(--theme-bg-tertiary)', borderColor: 'var(--theme-border)' }}>
              <div className="mono text-2xl font-bold leading-none" style={{ color: item.color }}>{item.value}</div>
              <div className="text-caption font-medium mt-1.5" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {(stats?.due ?? 0) > 0 && (
            <button onClick={onContinue}
              className="flex items-center gap-2 mx-auto px-6 h-11 rounded-md font-bold text-sm transition-transform hover:-translate-y-0.5 active:scale-95"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
              <IconRefresh size={16} /> {t('continueReview', { count: stats?.due ?? 0 })}
            </button>
          )}
          <button onClick={onAddWords}
            className="v2-btn-soft flex items-center gap-2 mx-auto px-6 h-11 rounded-md font-semibold text-sm">
            <IconPlus size={16} /> {t('addNewWords')}
          </button>
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
