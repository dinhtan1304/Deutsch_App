'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStudyPlan, useStudyPlanWeek, usePauseStudyPlan, useResumeStudyPlan, useDeleteStudyPlan } from '@/hooks/useStudyPlan';
import type { WeeklyTask } from '@/lib/api/studyPlan';

import {
  IconVocab, IconGrammar, IconReading, IconWriting,
  IconListening, IconSpeaking, IconReview, IconGame,
  IconExam, IconRocket, IconCalendar,
} from './icons';
import { IconCheck } from '@/components/ui/Icons';

const DAY_NAME_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = (typeof DAY_NAME_KEYS)[number];

const TASK_ICONS: Record<string, React.ReactNode> = {
  vocab: <IconVocab size={17} />,
  grammar: <IconGrammar size={17} />,
  reading: <IconReading size={17} />,
  writing: <IconWriting size={17} />,
  listening: <IconListening size={17} />,
  speaking: <IconSpeaking size={17} />,
  review: <IconReview size={17} />,
  game: <IconGame size={17} />,
  exam: <IconExam size={17} />,
};

// Per-skill accent (CSS vars → theme-correct; mirrors design's per-task colours)
const SKILL_COLOR: Record<string, string> = {
  vocab: 'var(--der)',
  grammar: 'var(--violet)',
  reading: 'var(--success)',
  writing: 'var(--pink)',
  listening: 'var(--cyan)',
  speaking: 'var(--warn)',
  review: 'var(--accent)',
  game: 'var(--violet)',
  exam: 'var(--streak)',
};
const skillOf = (type: string) => SKILL_COLOR[type] ?? 'var(--accent)';
const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

// done / current / upcoming → status colour
const statusColor = (s: 'done' | 'current' | 'upcoming') =>
  s === 'done' ? 'var(--success)' : s === 'current' ? 'var(--accent)' : 'var(--theme-text-muted)';

function StudyPlanSkeleton() {
  return (
    <div className="mx-auto max-w-360 animate-pulse space-y-5 px-4 py-6 sm:px-6">
      <div className="h-13 w-72 rounded-lg" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      <div className="h-52 rounded-lg" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      <div className="h-64 rounded-lg" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
    </div>
  );
}

export default function StudyPlanPage() {
  const t = useTranslations('studyPlan');
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

  // No plan — invite to setup
  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mb-4 text-5xl">{'📋'}</div>
        <h1 className="mb-2 text-h3 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
          {t('empty.title')}
        </h1>
        <p className="mb-6 text-body" style={{ color: 'var(--theme-text-muted)' }}>
          {t('empty.subtitle')}
        </p>
        <Link
          href="/study-plan/setup"
          className="v2-match-grad inline-block rounded-[11px] px-6 py-3 text-body font-bold text-white"
        >
          {t('empty.create')}
        </Link>
      </div>
    );
  }

  const { plan, currentWeek, currentPhase, phases, overallProgress, daysUntilExam, todayTasks, weekTasks } = data;
  const isPaused = plan.status === 'paused';
  const displayTasks = weekData?.tasks ?? weekTasks;
  const displayPhase = weekData?.phase ?? currentPhase;
  const today = new Date().getDay();

  // current-week completion (only week we can count cheaply, from getActive())
  const weekDone = weekTasks.filter((task) => task.completed).length;
  const weekTotal = weekTasks.length;
  const currentPct = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  const todayDone = todayTasks.filter((task) => task.completed).length;
  const todayAllDone = todayTasks.length > 0 && todayDone === todayTasks.length;

  const stepCols = Math.min(plan.totalWeeks, 6);

  const detailDone = displayTasks.filter((task) => task.completed).length;
  const activeStatus: 'done' | 'current' | 'upcoming' =
    activeWeek < currentWeek ? 'done' : activeWeek === currentWeek ? 'current' : 'upcoming';

  const handleDelete = async () => {
    await deleteMut.mutateAsync();
    router.push('/dashboard');
  };

  return (
    <div className="mx-auto max-w-360 space-y-5 px-4 py-5 sm:px-6">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-center gap-4">
        <div
          className="v2-match-grad flex h-13 w-13 shrink-0 items-center justify-center rounded-[14px] text-white"
          style={{ boxShadow: `0 8px 20px ${mix('var(--accent)', 27)}` }}
        >
          <IconRocket size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {plan.examFormat} {plan.targetLevel}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
            <span className="flex items-center gap-1.5">
              <IconCalendar size={13} />
              {t('header.weekProgress', { current: currentWeek, total: plan.totalWeeks })}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--streak)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
              {t('header.daysUntilExam', { days: daysUntilExam })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={() => resumeMut.mutate()}
              className="v2-match-grad h-9.5 rounded-[9px] px-4 text-caption font-bold text-white"
            >
              {t('header.resume')}
            </button>
          ) : (
            <button
              onClick={() => pauseMut.mutate()}
              className="h-9.5 rounded-[9px] border px-4 text-caption font-medium transition-colors"
              style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
            >
              {t('header.pause')}
            </button>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-[9px] border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
          </button>
        </div>
      </header>

      {isPaused && (
        <div
          className="rounded-md border p-3.5 text-caption font-medium"
          style={{ borderColor: mix('var(--streak)', 30), background: mix('var(--streak)', 8), color: 'var(--streak)' }}
        >
          {t('header.pausedBanner')}
        </div>
      )}

      {/* ── Progress + week timeline ── */}
      <section className="rounded-lg border p-5" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>
              {t('progress.label')}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="mono text-[30px] font-bold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{overallProgress}%</span>
              <span className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{t('progress.completed')}</span>
            </div>
          </div>
          <span
            className="rounded-[7px] border px-2.5 py-1 text-caption font-semibold"
            style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
          >
            {t('progress.totalWeeks', { weeks: plan.totalWeeks })}
          </span>
        </div>

        {/* overall bar */}
        <div className="mb-4.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
          <div className="v2-match-grad h-full rounded-full transition-all duration-700" style={{ width: `${overallProgress}%` }} />
        </div>

        {/* week steps */}
        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${stepCols}, minmax(0,1fr))` }}>
          {Array.from({ length: plan.totalWeeks }, (_, i) => {
            const w = i + 1;
            const status: 'done' | 'current' | 'upcoming' = w < currentWeek ? 'done' : w === currentWeek ? 'current' : 'upcoming';
            const color = statusColor(status);
            const phase = phases.find((p) => w >= p.weekStart && w <= p.weekEnd);
            const isActive = activeWeek === w;
            const pct = status === 'done' ? 100 : status === 'current' ? currentPct : 0;
            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className="rounded-[11px] p-3 text-left transition-colors"
                style={{
                  background: isActive ? mix(color, 12) : 'var(--theme-bg-secondary)',
                  border: `1.5px solid ${isActive ? color : 'var(--theme-border)'}`,
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-[7px] text-[13px] leading-none"
                    style={status === 'done' ? { background: color, color: 'white' } : { background: mix(color, 16), color }}
                  >
                    {status === 'done' ? <IconCheck size={13} /> : (phase?.icon ?? '•')}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{phase?.name}</div>
                    <div className="mono text-[9.5px]" style={{ color: 'var(--theme-text-muted)' }}>W{w} · {phase?.nameEn}</div>
                  </div>
                </div>
                <div className="h-[3px] overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-tertiary)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold" style={{ color }}>{t(`stepStatus.${status}` as 'stepStatus.done')}</span>
                  {status === 'current' && <span className="mono text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{weekDone}/{weekTotal}</span>}
                  {status === 'done' && <IconCheck size={11} style={{ color }} />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Today's tasks hero ── */}
      {activeWeek === currentWeek && todayTasks.length > 0 && (
        <section className="v2-plan-hero relative overflow-hidden rounded-lg border p-5" style={{ borderColor: mix('var(--accent)', 33) }}>
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full" style={{ background: mix('var(--accent)', 12), filter: 'blur(40px)' }} />

          <div className="relative z-10 mb-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
              <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                {t('today.title', { day: t(`dayNames.${DAY_NAME_KEYS[today]!}` as 'dayNames.sun') })}
              </h2>
            </div>
            <span className="mono text-caption font-bold" style={{ color: todayAllDone ? 'var(--success)' : 'var(--theme-text-secondary)' }}>
              {t('today.doneBadge', { done: todayDone, total: todayTasks.length })}
            </span>
          </div>

          <div className="relative z-10 space-y-2.5">
            {todayTasks.map((task: WeeklyTask, i: number) => {
              const skill = skillOf(task.type);
              return (
                <Link
                  key={i}
                  href={task.href}
                  className="flex items-center gap-3.5 rounded-md border p-4 transition-colors hover:opacity-95"
                  style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
                >
                  <span
                    className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-[8px] border-2"
                    style={task.completed
                      ? { background: 'var(--success)', borderColor: 'var(--success)', color: 'white' }
                      : { borderColor: 'var(--theme-border)' }}
                  >
                    {task.completed && <IconCheck size={14} />}
                  </span>
                  <span className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-[11px]" style={{ background: mix(skill, 16), color: skill }}>
                    {TASK_ICONS[task.type] ?? <IconRocket size={20} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-[15px] font-bold ${task.completed ? 'line-through' : ''}`}
                      style={{ color: task.completed ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)' }}
                    >
                      {task.title}
                    </div>
                    <div className="truncate text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{task.description}</div>
                  </div>
                  {!task.completed && (
                    <span
                      className="hidden shrink-0 items-center gap-1.5 rounded-[9px] px-4 py-2 text-caption font-semibold text-white sm:inline-flex"
                      style={{ background: 'var(--accent)', boxShadow: `0 4px 12px ${mix('var(--accent)', 40)}` }}
                    >
                      {t('today.start')}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Selected week detail ── */}
      <section className="rounded-lg border p-5" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-lg"
              style={{ background: mix(statusColor(activeStatus), 16), color: statusColor(activeStatus) }}
            >
              {displayPhase.icon}
            </span>
            <div>
              <h3 className="text-h3 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                {t('week.heading', { week: activeWeek, phase: displayPhase.name })}
              </h3>
              <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                {displayPhase.nameEn} · {t('week.taskCount', { done: detailDone, total: displayTasks.length })}
              </p>
            </div>
          </div>
        </div>

        {displayTasks.length === 0 ? (
          <div className="rounded-[11px] border border-dashed py-8 text-center text-caption" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {t('week.noTasks')}
          </div>
        ) : (
          <div className="relative">
            {displayTasks.map((task: WeeklyTask, i: number) => {
              const isToday = task.day === today && activeWeek === currentWeek;
              const st: 'done' | 'current' | 'upcoming' = task.completed ? 'done' : isToday ? 'current' : 'upcoming';
              const sc = statusColor(st);
              const skill = skillOf(task.type);
              const isLast = i === displayTasks.length - 1;
              const dayLabel = DAY_NAME_KEYS[task.day]
                ? t(`dayNames.${DAY_NAME_KEYS[task.day] as DayKey}` as 'dayNames.sun')
                : t('week.allDays');
              return (
                <div key={i} className="flex gap-3.5">
                  {/* timeline rail */}
                  <div className="flex w-11 shrink-0 flex-col items-center">
                    <div className="flex flex-col items-center pt-1">
                      <span className="mono mb-1 text-[10px] font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{dayLabel}</span>
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={st === 'done'
                          ? { background: sc, color: 'white' }
                          : st === 'current'
                            ? { background: mix(sc, 22), border: `2px solid ${sc}`, color: sc }
                            : { background: 'var(--theme-bg-secondary)', border: '1px dashed var(--theme-border)' }}
                      >
                        {st === 'done'
                          ? <IconCheck size={13} />
                          : <span className="h-1.5 w-1.5 rounded-full" style={{ background: st === 'current' ? sc : 'var(--theme-text-muted)' }} />}
                      </div>
                    </div>
                    {!isLast && (
                      <div
                        className="mt-1 w-0.5 flex-1"
                        style={{ minHeight: 30, background: st === 'done' ? sc : 'var(--theme-border)', opacity: st === 'done' ? 0.6 : 0.4 }}
                      />
                    )}
                  </div>

                  {/* task card */}
                  <div className="mb-2.5 flex-1">
                    <Link
                      href={task.href}
                      className="flex items-center gap-3 rounded-[11px] border p-3.5 transition-colors hover:opacity-95"
                      style={st === 'current'
                        ? { background: mix(skill, 9), borderColor: mix(skill, 27) }
                        : { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]" style={{ background: mix(skill, 16), color: skill }}>
                        {TASK_ICONS[task.type] ?? <IconRocket size={17} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[14px] font-semibold ${task.completed ? 'line-through' : ''}`}
                            style={{ color: task.completed ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)' }}
                          >
                            {task.title}
                          </span>
                          {st === 'current' && (
                            <span className="rounded-[3px] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide" style={{ background: mix(skill, 18), color: skill }}>
                              {t('week.todayBadge')}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-caption" style={{ color: 'var(--theme-text-muted)' }}>{task.description}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: 'var(--theme-text-muted)' }}><path d="M9 18l6-6-6-6" /></svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Delete confirmation ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowDelete(false)}>
          <div
            className="w-full max-w-sm rounded-lg border p-6"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {t('delete.title')}
            </h3>
            <p className="mb-5 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {t('delete.confirm')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 rounded-[9px] border py-2.5 text-caption font-medium"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
              >
                {t('delete.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMut.isPending}
                className="flex-1 rounded-[9px] py-2.5 text-caption font-bold text-white"
                style={{ background: 'var(--danger)' }}
              >
                {deleteMut.isPending ? t('delete.deleting') : t('delete.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
