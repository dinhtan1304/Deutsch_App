'use client';
/* eslint-disable no-restricted-syntax */

import { IconTrophy, IconRefresh, IconChevronLeft, IconPlus } from '@/components/ui/Icons';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

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
  const accuracy = sessionStats.correct + sessionStats.wrong > 0
    ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100) : 0;

  const resultItems = [
    { label: 'Đúng',      value: sessionStats.correct,       color: STATUS.success, bg: `linear-gradient(135deg, ${STATUS.success}1F, ${STATUS.success}0F)` },
    { label: 'Sai',       value: sessionStats.wrong,         color: STATUS.danger,  bg: `linear-gradient(135deg, ${STATUS.danger}1F, ${STATUS.danger}0F)` },
    { label: 'Chính xác', value: `${accuracy}%`,             color: ACCENT.srs,     bg: `linear-gradient(135deg, ${ACCENT.srs}1F, ${ACCENT.srs}0F)` },
    { label: 'Best Streak', value: sessionStats.bestStreak,  color: ACCENT.games,   bg: `linear-gradient(135deg, ${ACCENT.games}1F, ${ACCENT.games}0F)` },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4"
          style={{ background: `linear-gradient(135deg, ${STATUS.success}26, ${STATUS.success}1A)` }}>
          <IconTrophy size={36} style={{ color: STATUS.success }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Hoàn thành! 🎉</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          {resultItems.map(item => (
            <div key={item.label} className="p-4 rounded-2xl" style={{ background: item.bg }}>
              <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
              <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {(stats?.due ?? 0) > 0 && (
            <button onClick={onContinue}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: GRADIENT.action }}>
              <IconRefresh size={16} /> Ôn tiếp ({stats?.due} từ còn lại)
            </button>
          )}
          <button onClick={onAddWords}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-medium text-sm border transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconPlus size={16} /> Thêm từ mới
          </button>
          <button onClick={onBack}
            className="flex items-center gap-1.5 mx-auto text-body font-medium transition-all hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={16} /> Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
