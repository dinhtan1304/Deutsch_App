'use client';
/* eslint-disable no-restricted-syntax */

import { useState } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStudyPlan, useStudyPlanWeek, usePauseStudyPlan, useResumeStudyPlan, useDeleteStudyPlan } from '@/hooks/useStudyPlan';
import type { PhaseInfo, WeeklyTask } from '@/lib/api/studyPlan';

import { 
  IconVocab, IconGrammar, IconReading, IconWriting, 
  IconListening, IconSpeaking, IconReview, IconGame, 
  IconExam, IconRocket, IconCalendar 
} from './icons';

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const TASK_ICONS: Record<string, any> = {
  vocab: <IconVocab size={18} />,
  grammar: <IconGrammar size={18} />,
  reading: <IconReading size={18} />,
  writing: <IconWriting size={18} />,
  listening: <IconListening size={18} />,
  speaking: <IconSpeaking size={18} />,
  review: <IconReview size={18} />,
  game: <IconGame size={18} />,
  exam: <IconExam size={18} />,
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
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
            <IconRocket size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {plan.examFormat} {plan.targetLevel}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              <IconCalendar size={14} />
              <span>Tuần {currentWeek}/{plan.totalWeeks}</span>
              <span className="opacity-30">•</span>
              <span style={{ color: daysUntilExam < 14 ? STATUS.danger : 'inherit' }}>
                Còn {daysUntilExam} ngày đến kỳ thi
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isPaused ? (
            <button
              onClick={() => resumeMut.mutate()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)' }}
            >
              Tiếp tục học
            </button>
          ) : (
            <button
              onClick={() => pauseMut.mutate()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-black/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
            >
              Tạm dừng
            </button>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
            style={{ color: STATUS.danger }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
          </button>
        </div>
      </div>

      {isPaused && (
        <div
          className="p-4 rounded-xl border text-sm font-medium"
          style={{ borderColor: 'rgba(249,115,22,.3)', background: 'rgba(249,115,22,.06)', color: ACCENT.games }}
        >
          Lịch học đang tạm dừng. Nhấn &quot;Tiếp tục&quot; để học lại.
        </div>
      )}

      {/* ── Overall Progress & Journey ── */}
      <div
        className="p-6 rounded-3xl border shadow-sm relative overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="relative z-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] opacity-50 mb-1 block" style={{ color: 'var(--theme-text-primary)' }}>
                Progress
              </span>
              <span className="text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>
                {overallProgress}% <span className="text-sm font-medium opacity-50 ml-1">hoàn thành</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                Lộ trình {plan.totalWeeks} tuần
              </span>
            </div>
          </div>
          
          <div className="h-4 rounded-2xl overflow-hidden relative" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <div
              className="h-full rounded-2xl transition-all duration-1000 ease-out relative"
              style={{ width: `${overallProgress}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)' }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
            </div>
          </div>

          {/* Phase Journey Map */}
          <div className="flex mt-8 gap-2 relative">
            {/* Connecting line background */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 -z-1" />
            
            {phases.map((phase: PhaseInfo, i: number) => {
              const widthPct = ((phase.weekEnd - phase.weekStart + 1) / plan.totalWeeks) * 100;
              const isCurrent = currentWeek >= phase.weekStart && currentWeek <= phase.weekEnd;
              const isPast = currentWeek > phase.weekEnd;
              
              return (
                <div key={i} className="relative group" style={{ width: `${widthPct}%` }}>
                  <div
                    className={`h-9 rounded-2xl flex items-center justify-center text-xs font-black text-white transition-all duration-500 transform ${isCurrent ? 'scale-105 shadow-lg' : 'opacity-40 hover:opacity-70'}`}
                    style={{
                      background: isCurrent || isPast ? phase.color : 'var(--theme-bg-secondary)',
                      color: isCurrent || isPast ? 'white' : 'var(--theme-text-muted)',
                      boxShadow: isCurrent ? `0 8px 20px ${phase.color}40` : 'none',
                    }}
                  >
                    <span className="mr-1.5">{phase.icon}</span>
                    <span className="hidden sm:inline">{phase.name}</span>
                  </div>
                  <div className="text-[10px] font-bold text-center mt-2.5 uppercase tracking-wider" 
                    style={{ color: isCurrent ? phase.color : 'var(--theme-text-muted)' }}>
                    W{phase.weekStart}-{phase.weekEnd}
                  </div>
                  {isCurrent && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full opacity-[0.03] pointer-events-none" 
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }} />
      </div>

      {/* ── Main Content ── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0, 200px) minmax(0, 1fr)' }}>

        {/* Week Selector Sidebar */}
        <div
          className="rounded-3xl border p-4 overflow-y-auto backdrop-blur-md"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            maxHeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <div className="text-[11px] font-black uppercase tracking-[0.15em] mb-4 px-2 opacity-50" style={{ color: 'var(--theme-text-primary)' }}>
            Lộ trình học
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: plan.totalWeeks }, (_, i) => {
              const w = i + 1;
              const isSelected = activeWeek === w;
              const isPast = w < currentWeek;
              const isCurrent = w === currentWeek;
              const phase = phases.find((p: PhaseInfo) => w >= p.weekStart && w <= p.weekEnd);
              
              return (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all relative group ${isSelected ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                  style={{
                    backgroundColor: isSelected ? `${phase?.color || ACCENT.srs}12` : undefined,
                    color: isSelected ? phase?.color || ACCENT.srs : isPast ? 'var(--theme-text-muted)' : 'var(--theme-text-secondary)',
                  }}
                >
                  <div className="relative shrink-0">
                    {isPast ? (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-current' : 'border-gray-200'}`}>
                        {isCurrent && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: phase?.color }} />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${isSelected ? 'font-black' : 'font-bold'}`}>Tuần {w}</div>
                    {isSelected && (
                      <div className="text-[10px] font-medium opacity-70 truncate">{phase?.name}</div>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ background: phase?.color }} />
                  )}
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
              <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Tuần {activeWeek} — {displayPhase.nameEn}
              </div>
            </div>
          </div>

          {/* Today's tasks highlight */}
          {activeWeek === currentWeek && todayTasks.length > 0 && (
            <div
              className="p-6 rounded-3xl border relative overflow-hidden shadow-sm"
              style={{ borderColor: 'rgba(59,130,246,.2)', background: 'rgba(59,130,246,.02)' }}
            >
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <div className="text-xs font-black uppercase tracking-widest text-blue-600">
                    Nhiệm vụ hôm nay · {DAY_NAMES[today]}
                  </div>
                </div>
                {todayTasks.length > 0 && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider" style={{
                    backgroundColor: todayTasks.filter((t: WeeklyTask) => t.completed).length === todayTasks.length ? 'rgba(34,197,94,.1)' : 'rgba(59,130,246,.1)',
                    color: todayTasks.filter((t: WeeklyTask) => t.completed).length === todayTasks.length ? STATUS.success : ACCENT.srs,
                  }}>
                    {todayTasks.filter((t: WeeklyTask) => t.completed).length}/{todayTasks.length} Done
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
                      <div className="text-sm font-semibold" style={{ color: task.completed ? STATUS.success : 'var(--theme-text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.title}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
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
            className="rounded-3xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              <span className="text-sm font-black tracking-tight uppercase opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
                Chi tiết tuần {activeWeek}
              </span>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />)}
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {displayTasks.map((task: WeeklyTask, i: number) => {
                const isToday = task.day === today && activeWeek === currentWeek;
                return (
                  <Link
                    key={i}
                    href={task.href}
                    className="flex items-center gap-5 px-6 py-4.5 transition-all group relative hover:bg-gray-50/50"
                  >
                    <div className="w-10 text-center shrink-0">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600' : 'opacity-40'}`}>
                        {DAY_NAMES[task.day] || 'ALL'}
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isToday ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}
                      style={{ border: isToday ? '1px solid rgba(59,130,246,0.1)' : '1px solid transparent' }}>
                      {TASK_ICONS[task.type] || <IconRocket size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[15px] font-bold ${isToday ? 'text-blue-600' : 'var(--theme-text-primary)'}`}>
                        {task.title}
                      </div>
                      <div className="text-xs font-medium mt-0.5 opacity-60 truncate" style={{ color: 'var(--theme-text-muted)' }}>
                        {task.description}
                      </div>
                    </div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border shadow-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--theme-text-muted)' }}>
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
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
                style={{ background: STATUS.danger }}
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
