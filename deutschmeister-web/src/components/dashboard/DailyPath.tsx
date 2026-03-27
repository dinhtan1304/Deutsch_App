'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDailyPath } from '@/hooks/useDashboard';

// ─── Inline SVG Icons ───
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconStar({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block' }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const TASK_ICONS: Record<string, string> = {
  learn_words: '\uD83D\uDCDA',
  quiz: '\uD83C\uDFAE',
  review: '\uD83D\uDD04',
  reading: '\uD83D\uDCD6',
};

export function DailyPath() {
  const { data, isLoading } = useDailyPath();
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl border overflow-hidden animate-pulse"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="h-14" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }} />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { tasks, completedCount, totalCount } = data;
  const allDone = completedCount === totalCount;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

      {/* Header with gradient — clickable to toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left relative px-5 py-4"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
      >
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white opacity-[0.06]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <IconStar size={16} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white">B&#224;i h&#7885;c h&#244;m nay</h3>
              <p className="text-[11px] text-white/70">{completedCount}/{totalCount} ho&#224;n th&#224;nh</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Progress circle */}
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="white" strokeWidth="3"
                  strokeDasharray={`${progressPct * 0.94} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
                {Math.round(progressPct)}%
              </div>
            </div>

            {/* Collapse chevron */}
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="shrink-0 transition-transform duration-300"
              style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%`, backgroundColor: 'white' }} />
        </div>
      </button>

      {/* Task list — collapsible */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: collapsed ? 0 : 500,
          opacity: collapsed ? 0 : 1,
        }}
      >
        <div className="p-3 space-y-2">
          {allDone ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.06))' }}>
                <IconCheck size={28} />
              </div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Tuy&#7879;t v&#7901;i! B&#7841;n &#273;&#227; ho&#224;n th&#224;nh b&#224;i h&#7885;c h&#244;m nay!
              </p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                H&#7865;n g&#7863;p b&#7841;n ng&#224;y mai nh&#233;
              </p>
            </div>
          ) : (
            tasks.map((task, i) => (
              <Link key={i} href={task.href}
                className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                style={{
                  backgroundColor: task.completed ? 'rgba(34,197,94,0.06)' : 'var(--theme-bg-secondary)',
                  border: `1px solid ${task.completed ? 'rgba(34,197,94,0.15)' : 'transparent'}`,
                }}>
                {/* Check circle */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    backgroundColor: task.completed ? '#22C55E' : 'var(--theme-bg-primary)',
                    border: task.completed ? 'none' : '2px solid var(--theme-border)',
                  }}>
                  {task.completed ? (
                    <IconCheck size={14} />
                  ) : (
                    <span className="text-[14px]">{TASK_ICONS[task.type] || '\u2728'}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate"
                    style={{
                      color: task.completed ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)',
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}>
                    {task.title}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--theme-text-muted)' }}>
                    {task.description}
                  </div>
                </div>

                {/* Arrow */}
                {!task.completed && (
                  <div className="shrink-0 opacity-40 group-hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--theme-text-muted)' }}>
                    <IconChevronRight size={16} />
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
