'use client';

import Link from 'next/link';
import { useStudyPlan } from '@/hooks/useStudyPlan';

export function StudyPlanWidget() {
  const { data, isLoading } = useStudyPlan();

  if (isLoading) return null;

  // No plan — show CTA
  if (!data) {
    return (
      <Link
        href="/study-plan/setup"
        className="flex items-center gap-3 p-3 rounded-xl border transition-all group hover:-translate-y-0.5 relative overflow-hidden"
        style={{
          borderColor: 'rgba(99,102,241,0.15)',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))',
        }}
      >
        {/* Decorative cap illustration in background */}
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none" width="52" height="52" viewBox="0 0 24 24" fill="#6366F1" stroke="none">
          <path d="M22 9L12 4 2 9l10 5 10-5z" />
          <path d="M6 11.5v4.5c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
          <line x1="22" y1="9" x2="22" y2="15" strokeWidth="2" stroke="#6366F1" />
        </svg>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          {/* Graduation cap icon */}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 9L12 4 2 9l10 5 10-5z" />
            <path d="M6 11.5v4.5c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
            <line x1="22" y1="9" x2="22" y2="15" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
            Tạo lịch học cá nhân
          </div>
          <div className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
            Goethe / TELC · lịch trình riêng
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: 'var(--theme-text-muted)' }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
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
        className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:-translate-y-0.5"
        style={{
          borderColor: 'rgba(249,115,22,.15)',
          background: 'rgba(249,115,22,.04)',
        }}
      >
        <div className="text-xl shrink-0">&#x23F8;&#xFE0F;</div>
        <div className="flex-1 min-w-0">
          <div className="text-body font-bold truncate" style={{ color: '#F97316' }}>
            Lịch học tạm dừng
          </div>
          <div className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
            {plan.examFormat} {plan.targetLevel}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/study-plan"
      className="flex flex-col gap-2 p-3 rounded-xl border transition-all group hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        borderColor: `${currentPhase.color}25`,
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Decorative level badge watermark */}
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[32px] font-black opacity-[0.04] pointer-events-none select-none leading-none"
        style={{ color: currentPhase.color }}
      >
        {plan.targetLevel}
      </div>
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base"
          style={{ background: `${currentPhase.color}20`, border: `1px solid ${currentPhase.color}30` }}
        >
          {currentPhase.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="text-body font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {plan.examFormat} {plan.targetLevel}
            </div>
            <span
              className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: `${currentPhase.color}18`, color: currentPhase.color }}
            >
              Tuần {currentWeek}/{plan.totalWeeks}
            </span>
          </div>
          <div className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
            Còn {daysUntilExam} ngày
            {totalToday > 0 && (
              <span style={{ color: completedToday === totalToday ? '#22C55E' : 'var(--theme-text-muted)' }}>
                {' '}· {completedToday}/{totalToday} nhiệm vụ
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${overallProgress}%`, background: currentPhase.color }}
        />
      </div>
    </Link>
  );
}
