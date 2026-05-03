'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useDailyPath } from '@/hooks/useDashboard';

function IconStar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block' }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function DailyPath() {
  const { data, isLoading } = useDailyPath();

  if (isLoading || !data) return null;

  const { tasks, completedCount, totalCount } = data;
  const allDone = completedCount === totalCount;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const nextTask = tasks.find((t) => !t.completed);

  const Wrapper = (allDone ? 'div' : Link) as React.ElementType;
  const wrapperProps = allDone ? {} : { href: nextTask?.href || '/topics' };

  return (
    <Wrapper
      {...wrapperProps}
      className="flex flex-col gap-2 p-3 rounded-xl border overflow-hidden transition-all group hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--theme-border)',
        background: allDone
          ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(20,184,166,0.04))'
          : 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
          style={{ background: allDone ? 'linear-gradient(135deg, #22C55E, #14B8A6)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
        >
          {allDone ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <IconStar size={14} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
            Bài học hôm nay
          </div>
          <div className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
            {allDone ? 'Hoàn thành! Hẹn ngày mai' : `${completedCount}/${totalCount} hoàn thành`}
          </div>
        </div>
        <div className="relative w-8 h-8 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke={allDone ? STATUS.success : ACCENT.vocab} strokeWidth="3"
              strokeDasharray={`${progressPct * 0.94} 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: allDone ? STATUS.success : 'var(--theme-text-muted)' }}>
            {Math.round(progressPct)}%
          </div>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(148,163,184,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: allDone ? 'linear-gradient(90deg, #22C55E, #14B8A6)' : 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
          }}
        />
      </div>
    </Wrapper>
  );
}
