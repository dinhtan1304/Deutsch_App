'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { useStudyPlan } from '@/hooks/useStudyPlan';
import { IconRocket, IconCalendar } from '@/app/[locale]/study-plan/icons';

export function StudyPlanWidget() {
  const t = useTranslations('dashboard.studyPlanWidget');
  const { data, isLoading } = useStudyPlan();

  if (isLoading) return (
    <div className="h-24 rounded-2xl animate-pulse bg-gray-100" />
  );

  // No plan — show CTA
  if (!data) {
    return (
      <Link
        href="/study-plan/setup"
        className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group hover:-translate-y-1 relative overflow-hidden active:scale-95 shadow-sm"
        style={{
          borderColor: 'rgba(99,102,241,0.1)',
          background: GRADIENT.srsBg,
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110"
          style={{ background: GRADIENT.srsVocab }}
        >
          <IconRocket size={22} style={{ color: 'white' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {t('ctaTitle')}
          </div>
          <div className="text-[11px] font-medium opacity-60 truncate" style={{ color: 'var(--theme-text-muted)' }}>
            {t('ctaSubtitle')}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-600">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Link>
    );
  }

  const { plan, currentWeek, currentPhase, daysUntilExam, todayTasks } = data;
  const completedToday = todayTasks?.filter((t) => t.completed).length ?? 0;
  const totalToday = todayTasks?.length ?? 0;

  if (plan.status === 'paused') {
    return (
      <Link
        href="/study-plan"
        className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:bg-orange-50/30"
        style={{
          borderColor: 'rgba(249,115,22,.15)',
          background: 'rgba(249,115,22,.02)',
        }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-orange-100 text-orange-500 shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black tracking-tight" style={{ color: ACCENT.games }}>
            {t('pausedTitle')}
          </div>
          <div className="text-[11px] font-medium opacity-60 truncate" style={{ color: 'var(--theme-text-muted)' }}>
            {t('pausedSubtitle', { exam: plan.examFormat, level: plan.targetLevel })}
          </div>
        </div>
      </Link>
    );
  }

  const currentTaskTitle = todayTasks?.find(tk => !tk.completed)?.title ?? todayTasks?.[0]?.title ?? '—';
  const phaseColor = currentPhase.color;

  // v2 CourseCard — icon box + W-badge + week pips + current task footer.
  return (
    <Link
      href="/study-plan"
      className="word-card-v2 block rounded-2xl p-4.5"
      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: phaseColor } as React.CSSProperties}
    >
      <div className="flex items-start gap-3 mb-3.5">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-white"
          style={{ background: `linear-gradient(135deg, ${phaseColor}, #6F89FF)` }}>
          <span className="text-base leading-none">{currentPhase.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-body font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>{plan.examFormat} {plan.targetLevel}</span>
            <span className="mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: 'var(--streak-soft)', color: 'var(--streak)' }}>
              W{currentWeek}/{plan.totalWeeks}
            </span>
          </div>
          <div className="text-caption mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
            <IconCalendar size={11} />
            <span>{t('daysUntilExam', { days: daysUntilExam })}</span>
            {totalToday > 0 && <><span>·</span><span>{t('tasksToday', { count: totalToday })}</span></>}
          </div>
        </div>
        <span className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14 14 6m-6 0h6v6" /></svg>
        </span>
      </div>

      {/* Week pips */}
      <div className="flex gap-1 mb-2.5">
        {Array.from({ length: plan.totalWeeks }).map((_, i) => (
          <span key={i} className="flex-1 h-1.5 rounded-full" style={{
            background: i < currentWeek ? phaseColor : i === currentWeek ? `${phaseColor}55` : 'var(--theme-bg-secondary)',
          }} />
        ))}
      </div>

      <div className="flex items-center justify-between text-caption">
        <span className="truncate pr-2" style={{ color: 'var(--theme-text-secondary)' }}>{t('currentTask')}: {currentTaskTitle}</span>
        <span className="mono shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{completedToday}/{totalToday}</span>
      </div>
    </Link>
  );
}
