'use client';

import { useTranslations } from 'next-intl';

interface Props {
  isLoading: boolean;
  accuracyPct: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalAnswers: number;
}

function StatRow({ label, value, color, dot, isLoading }: { label: string; value: number; color: string; dot?: boolean; isLoading: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[9px] border px-3 py-2"
      style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
      <span className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--theme-text-secondary)' }}>
        {dot && <span className="h-1.75 w-1.75 rounded-full" style={{ background: color }} />}
        {label}
      </span>
      <span className="mono text-[15px] font-bold" style={{ color }}>{isLoading ? '—' : value}</span>
    </div>
  );
}

export function ProfileAnswerStats({ isLoading, accuracyPct, correctAnswers, wrongAnswers, totalAnswers }: Props) {
  const t = useTranslations('progress.profile.answerStats');
  const size = 120, r = 48, c = 2 * Math.PI * r;
  const off = c - (accuracyPct / 100) * c;

  return (
    <div className="rounded-lg border p-5" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <h2 className="mb-4 text-h3 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{t('title')}</h2>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} stroke="color-mix(in srgb, var(--danger) 30%, transparent)" strokeWidth={10} fill="none" />
            <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--success)" strokeWidth={10} fill="none"
              strokeDasharray={c} strokeDashoffset={isLoading ? c : off} strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="mono text-[26px] font-bold" style={{ color: 'var(--success)' }}>{isLoading ? '—' : `${accuracyPct}%`}</span>
            <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{t('accuracyRate')}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <StatRow label={t('totalAnswers')} value={totalAnswers} color="var(--theme-text-primary)" isLoading={isLoading} />
          <StatRow label={t('correctAnswers')} value={correctAnswers} color="var(--success)" dot isLoading={isLoading} />
          <StatRow label={t('wrongAnswers')} value={wrongAnswers} color="var(--danger)" dot isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
