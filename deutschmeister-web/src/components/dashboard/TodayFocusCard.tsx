'use client';

import Link from 'next/link';
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
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#22C55E', color: 'white' }}>
        <CheckIcon />
      </div>
    );
  }

  const iconMap: Record<string, { bg: string; svg: React.ReactNode }> = {
    learn_words: {
      bg: 'linear-gradient(135deg, #3B82F6, #6366F1)',
      svg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>,
    },
    review: {
      bg: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
      svg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
    },
    quiz: {
      bg: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      svg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    },
    reading: {
      bg: 'linear-gradient(135deg, #22C55E, #14B8A6)',
      svg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    },
  };

  const icon = iconMap[type] || iconMap.learn_words;

  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: icon.bg }}>
      {icon.svg}
    </div>
  );
}

export function TodayFocusCard() {
  const { data, isLoading } = useDailyPath();

  if (isLoading || !data) return null;

  const { tasks, completedCount, totalCount, srsDueCount } = data;
  const allDone = completedCount === totalCount;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextTask = tasks.find((t) => !t.completed);

  return (
    <div
      className="rounded-2xl border p-4 transition-all"
      style={{
        borderColor: allDone ? 'rgba(34,197,94,0.2)' : 'var(--theme-border)',
        background: allDone
          ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(20,184,166,0.03))'
          : 'var(--theme-bg-secondary)',
      }}
    >
      {/* Top row: title + progress + CTA */}
      <div className="flex items-center gap-4 mb-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-lg"
          style={{ background: allDone ? 'linear-gradient(135deg, #22C55E, #14B8A6)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
        >
          {allDone
            ? <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            : <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
          }
        </div>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Mục tiêu hôm nay
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {allDone
              ? 'Hoàn thành tất cả! Hẹn ngày mai'
              : `${completedCount}/${totalCount} nhiệm vụ${srsDueCount > 0 ? ` · ${srsDueCount} thẻ cần ôn` : ''}`
            }
          </div>
        </div>

        {/* CTA button */}
        {nextTask ? (
          <Link
            href={nextTask.href}
            className="shrink-0 text-[12px] font-bold px-3.5 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            Tiếp tục →
          </Link>
        ) : srsDueCount > 0 ? (
          <Link
            href="/review"
            className="shrink-0 text-[12px] font-bold px-3.5 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
            }}
          >
            Ôn {srsDueCount} thẻ →
          </Link>
        ) : null}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'rgba(148,163,184,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: allDone ? 'linear-gradient(90deg, #22C55E, #14B8A6)' : 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
          }}
        />
      </div>

      {/* Task chips */}
      <div className="flex gap-2 flex-wrap">
        {tasks.map((t, i) => (
          <Link
            key={i}
            href={t.href}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all hover:scale-[1.02]"
            style={{
              background: t.completed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${t.completed ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)'}`,
              color: t.completed ? '#4ADE80' : 'var(--theme-text-secondary)',
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
