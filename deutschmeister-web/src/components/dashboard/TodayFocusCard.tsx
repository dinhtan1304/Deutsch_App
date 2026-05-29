'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import { useDailyPath } from '@/hooks/useDashboard';

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TaskIcon({ type, completed }: { type: string; completed: boolean }) {
  if (completed) {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: STATUS.success, color: 'white' }}>
        <CheckIcon />
      </div>
    );
  }

  const iconMap = {
    learn_words: {
      bg: GRADIENT.action,
      svg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>,
    },
    review: {
      bg: GRADIENT.vocab,
      svg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
    },
    quiz: {
      bg: GRADIENT.speaking,
      svg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    },
    reading: {
      bg: GRADIENT.reading,
      svg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    },
  };

  const icon = (iconMap as unknown as Record<string, typeof iconMap.learn_words>)[type] ?? iconMap.learn_words;

  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: icon.bg }}>
      {icon.svg}
    </div>
  );
}

export function TodayFocusCard() {
  const t = useTranslations('dashboard.todayFocus');
  const { data, isLoading } = useDailyPath();

  if (isLoading || !data) return null;

  const { tasks, completedCount, totalCount, srsDueCount } = data;
  const allDone = completedCount === totalCount;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className="rounded-2xl border p-4 transition-all"
      style={{
        borderColor: allDone ? 'rgba(34,197,94,0.2)' : 'var(--theme-border)',
        background: allDone
          ? GRADIENT.readingBgSoft
          : 'var(--theme-bg-secondary)',
      }}
    >
      {/* Top row: title + progress + CTA */}
      <div className="flex items-center gap-4 mb-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-lg"
          style={{ background: allDone ? GRADIENT.reading : GRADIENT.srsVocab }}
        >
          {allDone
            ? <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            : <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
          }
        </div>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {t('title')}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {allDone
              ? t('allDone')
              : srsDueCount > 0
                ? t('progressWithSrs', { completed: completedCount, total: totalCount, srs: srsDueCount })
                : t('progress', { completed: completedCount, total: totalCount })
            }
          </div>
        </div>

        {/* Progress percentage — replaces CTA button (HeroActionCard handles the primary action) */}
        <div
          className="shrink-0 text-xs font-bold tabular-nums"
          style={{ color: allDone ? STATUS.success : 'var(--theme-text-muted)' }}
        >
          {progressPct}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'rgba(148,163,184,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: allDone ? GRADIENT.readingH : GRADIENT.srsVocabH,
          }}
        />
      </div>

      {/* Task chips */}
      <div className="flex gap-2 flex-wrap">
        {tasks.map((t, i) => (
          <Link
            key={i}
            href={t.href}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-[1.02]"
            style={{
              background: t.completed ? 'rgba(34,197,94,0.08)' : 'var(--theme-overlay-soft)',
              border: `1px solid ${t.completed ? 'rgba(34,197,94,0.15)' : 'var(--theme-border)'}`,
              color: t.completed ? ACCENT.readingLight : 'var(--theme-text-secondary)',
              textDecoration: t.completed ? 'line-through' : 'none',
              opacity: t.completed ? 0.7 : 1,
            }}
          >
            <TaskIcon type={t.type} completed={t.completed} />
            <span className="font-medium">{t.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
