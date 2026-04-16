'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStudyPlan, useStudyPlanWeek, usePauseStudyPlan, useResumeStudyPlan, useDeleteStudyPlan } from '@/hooks/useStudyPlan';
import type { PhaseInfo, WeeklyTask } from '@/lib/api/studyPlan';

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const TASK_ICONS: Record<string, string> = {
  vocab: '\uD83D\uDCD6',
  grammar: '\uD83D\uDCDD',
  reading: '\uD83D\uDCD6',
  writing: '\u270D\uFE0F',
  listening: '\uD83C\uDFA7',
  speaking: '\uD83C\uDF99\uFE0F',
  review: '\uD83D\uDD01',
  game: '\uD83C\uDFAE',
  exam: '\uD83C\uDFC6',
};

function StudyPlanSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      <div className="h-48 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      <div className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
    </div>
  );
}

export default function StudyPlanPage() {
  const router = useRouter();
  const { data, isLoading } = useStudyPlan();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const pauseMut = usePauseStudyPlan();
  const resumeMut = useResumeStudyPlan();
  const deleteMut = useDeleteStudyPlan();

  const activeWeek = selectedWeek ?? data?.currentWeek ?? 1;
  const { data: weekData } = useStudyPlanWeek(activeWeek, !!data);

  if (isLoading) return <StudyPlanSkeleton />;

  // No plan — redirect to setup
  if (!data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">{'\uD83D\uDCCB'}</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          Chưa có lịch học
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          Tạo lịch trình học tập cá nhân để chuẩn bị cho kỳ thi Goethe/TELC
        </p>
        <Link
          href="/study-plan/setup"
          className="inline-block px-6 py-3 rounded-xl text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
        >
          Tạo lịch học
        </Link>
      </div>
    );
  }

  const { plan, currentWeek, currentPhase, phases, overallProgress, daysUntilExam, todayTasks, weekTasks } = data;
  const isPaused = plan.status === 'paused';
  const displayTasks = weekData?.tasks ?? weekTasks;
  const displayPhase = weekData?.phase ?? currentPhase;

  const handleDelete = async () => {
    await deleteMut.mutateAsync();
    router.push('/dashboard');
  };

  const today = new Date().getDay();

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {plan.examFormat} {plan.targetLevel}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Tuần {currentWeek}/{plan.totalWeeks} — Còn {daysUntilExam} ngày đến ngày thi
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={() => resumeMut.mutate()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)' }}
            >
              Tiếp tục
            </button>
          ) : (
            <button
              onClick={() => pauseMut.mutate()}
              className="px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
            >
              Tạm dừng
            </button>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ color: '#EF4444' }}
          >
            Xóa
          </button>
        </div>
      </div>

      {isPaused && (
        <div
          className="p-4 rounded-xl border text-sm font-medium"
          style={{ borderColor: 'rgba(249,115,22,.3)', background: 'rgba(249,115,22,.06)', color: '#F97316' }}
        >
          Lịch học đang tạm dừng. Nhấn &quot;Tiếp tục&quot; để học lại.
        </div>
      )}

      {/* ── Overall Progress ── */}
      <div
        className="p-5 rounded-2xl border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Tiến độ tổng thể
          </span>
          <span className="text-sm font-bold" style={{ color: '#3B82F6' }}>
            {overallProgress}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overallProgress}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }}
          />
        </div>

        {/* Phase Timeline */}
        <div className="flex mt-4 gap-1">
          {phases.map((phase: PhaseInfo, i: number) => {
            const widthPct = ((phase.weekEnd - phase.weekStart + 1) / plan.totalWeeks) * 100;
            const isCurrent = currentWeek >= phase.weekStart && currentWeek <= phase.weekEnd;
            return (
              <div key={i} className="relative" style={{ width: `${widthPct}%` }}>
                <div
                  className="h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white transition-all"
                  style={{
                    background: phase.color,
                    opacity: isCurrent ? 1 : 0.4,
                    border: isCurrent ? '2px solid #fff' : 'none',
                    boxShadow: isCurrent ? `0 0 0 2px ${phase.color}` : 'none',
                  }}
                >
                  {phase.icon} {phase.name}
                </div>
                <div className="text-[10px] text-center mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                  T{phase.weekStart}-{phase.weekEnd}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0, 200px) minmax(0, 1fr)' }}>

        {/* Week Selector */}
        <div
          className="rounded-2xl border p-3 overflow-y-auto"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            maxHeight: 480,
          }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: 'var(--theme-text-muted)' }}>
            Các tuần
          </div>
          <div className="space-y-0.5">
            {Array.from({ length: plan.totalWeeks }, (_, i) => {
              const w = i + 1;
              const isSelected = activeWeek === w;
              const isPast = w < currentWeek;
              const phase = phases.find((p: PhaseInfo) => w >= p.weekStart && w <= p.weekEnd);
              return (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all text-[13px]"
                  style={{
                    backgroundColor: isSelected ? `${phase?.color || '#3B82F6'}12` : undefined,
                    color: isSelected ? phase?.color || '#3B82F6' : isPast ? 'var(--theme-text-muted)' : 'var(--theme-text-secondary)',
                    fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  {isPast ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : w === currentWeek ? (
                    <span className="w-3.5 h-3.5 rounded-full" style={{ background: phase?.color || '#3B82F6', boxShadow: `0 0 6px ${phase?.color || '#3B82F6'}60` }} />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: 'var(--theme-border)' }} />
                  )}
                  <span>Tuần {w}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Week Tasks */}
        <div className="space-y-4">
          {/* Current phase info */}
          <div
            className="p-4 rounded-2xl border flex items-center gap-4"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${displayPhase.color}18` }}
            >
              {displayPhase.icon}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: displayPhase.color }}>
                Phase: {displayPhase.name}
              </div>
              <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                Tuần {activeWeek} — {displayPhase.nameEn}
              </div>
            </div>
          </div>

          {/* Today's tasks highlight */}
          {activeWeek === currentWeek && todayTasks.length > 0 && (
            <div
              className="p-4 rounded-2xl border"
              style={{ borderColor: 'rgba(59,130,246,.2)', background: 'rgba(59,130,246,.04)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#3B82F6' }}>
                  Hôm nay — {DAY_NAMES[today]}
                </div>
                {todayTasks.length > 0 && (
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{
                    backgroundColor: todayTasks.filter((t: WeeklyTask) => t.completed).length === todayTasks.length ? 'rgba(34,197,94,.1)' : 'var(--theme-bg-secondary)',
                    color: todayTasks.filter((t: WeeklyTask) => t.completed).length === todayTasks.length ? '#22C55E' : 'var(--theme-text-muted)',
                  }}>
                    {todayTasks.filter((t: WeeklyTask) => t.completed).length}/{todayTasks.length} nhiệm vụ
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {todayTasks.map((task: WeeklyTask, i: number) => (
                  <Link
                    key={i}
                    href={task.href}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                    style={{
                      backgroundColor: task.completed ? 'rgba(34,197,94,.04)' : 'var(--theme-bg-card)',
                      border: `1px solid ${task.completed ? 'rgba(34,197,94,.2)' : 'var(--theme-border)'}`,
                    }}
                  >
                    {task.completed ? (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-lg">{TASK_ICONS[task.type] || '\uD83D\uDCCC'}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold" style={{ color: task.completed ? '#22C55E' : 'var(--theme-text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.title}
                      </div>
                      <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                        {task.description}
                      </div>
                    </div>
                    {!task.completed && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--theme-text-muted)' }}>
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Full week grid */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Lịch tuần {activeWeek}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {displayTasks.map((task: WeeklyTask, i: number) => {
                const isToday = task.day === today && activeWeek === currentWeek;
                return (
                  <Link
                    key={i}
                    href={task.href}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors group"
                    style={{
                      backgroundColor: isToday ? 'rgba(59,130,246,.04)' : undefined,
                    }}
                  >
                    <span
                      className="text-[12px] font-bold w-8 text-center shrink-0"
                      style={{ color: isToday ? '#3B82F6' : 'var(--theme-text-muted)' }}
                    >
                      {DAY_NAMES[task.day] || 'ALL'}
                    </span>
                    <span className="text-base shrink-0">{TASK_ICONS[task.type] || '\uD83D\uDCCC'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                        {task.title}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                        {task.description}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--theme-text-muted)' }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDelete(false)}>
          <div
            className="p-6 rounded-2xl max-w-sm w-full mx-4"
            style={{ backgroundColor: 'var(--theme-bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              Xóa lịch học?
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--theme-text-muted)' }}>
              Bạn có chắc muốn xóa lịch học này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMut.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#EF4444' }}
              >
                {deleteMut.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
