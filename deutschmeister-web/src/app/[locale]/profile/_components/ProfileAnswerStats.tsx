'use client';

import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { IconTarget, IconBrain, IconCheckAll, IconX } from '@/components/ui/Icons';

interface Props {
  isLoading: boolean;
  accuracyPct: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalAnswers: number;
}

export function ProfileAnswerStats({ isLoading, accuracyPct, correctAnswers, wrongAnswers, totalAnswers }: Props) {
  const t = useTranslations('progress.profile.answerStats');
  return (
    <div className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
        {t('title')}
      </h2>

      <div className="mb-4 p-3.5 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-body font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
            <IconTarget size={14} style={{ color: STATUS.success }} />
            {t('accuracyRate')}
          </div>
          <span className="text-sm font-extrabold" style={{ color: STATUS.success }}>
            {isLoading ? '—' : `${accuracyPct}%`}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${accuracyPct}%`, background: `linear-gradient(90deg, ${STATUS.success}, ${ACCENT.teal})` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>
          <span>{t('correctShort', { n: correctAnswers })}</span>
          <span>{t('wrongShort', { n: wrongAnswers })}</span>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: t('totalAnswers'), value: totalAnswers, color: 'var(--theme-text-primary)', icon: IconBrain, accent: ACCENT.srs },
          { label: t('correctAnswers'), value: correctAnswers, color: STATUS.success, icon: IconCheckAll, accent: STATUS.success },
          { label: t('wrongAnswers'), value: wrongAnswers, color: STATUS.danger, icon: IconX, accent: STATUS.danger },
        ].map((row, i) => {
          const RowIcon = row.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${row.accent}15` }}>
                <RowIcon size={14} style={{ color: row.accent }} />
              </div>
              <span className="flex-1 text-body" style={{ color: 'var(--theme-text-muted)' }}>{row.label}</span>
              <span className="text-sm font-bold" style={{ color: row.color }}>
                {isLoading ? '—' : row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
