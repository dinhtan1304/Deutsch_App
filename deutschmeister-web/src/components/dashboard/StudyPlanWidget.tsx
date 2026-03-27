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
        className="block p-4 rounded-2xl border transition-all group"
        style={{
          borderColor: 'rgba(99,102,241,0.15)',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Tạo lịch học cá nhân
            </div>
            <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
              Chuẩn bị cho Goethe/TELC với lịch trình riêng
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: 'var(--theme-text-muted)' }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Link>
    );
  }

  const { plan, currentWeek, currentPhase, overallProgress, daysUntilExam } = data;

  if (plan.status === 'paused') {
    return (
      <Link
        href="/study-plan"
        className="block p-4 rounded-2xl border"
        style={{
          borderColor: 'rgba(249,115,22,.15)',
          background: 'rgba(249,115,22,.04)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">&#x23F8;&#xFE0F;</div>
          <div className="flex-1">
            <div className="text-[14px] font-bold" style={{ color: '#F97316' }}>
              Lịch học đang tạm dừng
            </div>
            <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
              {plan.examFormat} {plan.targetLevel} — Nhấn để tiếp tục
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/study-plan"
      className="block p-4 rounded-2xl border transition-all group"
      style={{
        borderColor: `${currentPhase.color}25`,
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{currentPhase.icon}</span>
          <div>
            <div className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {plan.examFormat} {plan.targetLevel}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              Phase: {currentPhase.name}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold" style={{ color: currentPhase.color }}>
            Tuần {currentWeek}/{plan.totalWeeks}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            Còn {daysUntilExam} ngày
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${overallProgress}%`, background: currentPhase.color }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{overallProgress}%</span>
        <span
          className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: currentPhase.color }}
        >
          Xem chi tiết
        </span>
      </div>
    </Link>
  );
}
