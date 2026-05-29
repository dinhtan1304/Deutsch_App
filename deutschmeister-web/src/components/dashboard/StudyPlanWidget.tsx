'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
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

  const { plan, currentWeek, currentPhase, overallProgress, daysUntilExam, todayTasks } = data;
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

  return (
    <Link
      href="/study-plan"
      className="flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all group hover:-translate-y-1 relative overflow-hidden shadow-sm active:scale-95"
      style={{
        borderColor: `${currentPhase.color}15`,
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Decorative level badge watermark */}
      <div
        className="absolute -right-2 -bottom-2 text-5xl font-black opacity-[0.03] pointer-events-none select-none leading-none"
        style={{ color: currentPhase.color }}
      >
        {plan.targetLevel}
      </div>
      
      <div className="flex items-center gap-3 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: `${currentPhase.color}12`, border: `1px solid ${currentPhase.color}20`, color: currentPhase.color }}
        >
          <span className="text-lg">{currentPhase.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-sm font-black tracking-tight truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {plan.examFormat} {plan.targetLevel}
            </div>
            <div
              className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
              style={{ background: `${currentPhase.color}12`, color: currentPhase.color, border: `1px solid ${currentPhase.color}20` }}
            >
              W{currentWeek}/{plan.totalWeeks}
            </div>
          </div>
          <div className="text-[11px] font-medium mt-0.5 opacity-60 flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
            <IconCalendar size={10} />
            <span>{t('daysUntilExam', { days: daysUntilExam })}</span>
            {totalToday > 0 && (
              <>
                <span className="opacity-30">•</span>
                <span style={{ color: completedToday === totalToday ? STATUS.success : 'inherit', fontWeight: completedToday === totalToday ? 800 : 500 }}>
                  {completedToday}/{totalToday} Tasks
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="h-1.5 rounded-full overflow-hidden relative" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${overallProgress}%`, background: currentPhase.color }}
        />
        <div className="absolute inset-0 bg-white/10 animate-[pulse_2s_infinite] pointer-events-none" />
      </div>
    </Link>
  );
}
