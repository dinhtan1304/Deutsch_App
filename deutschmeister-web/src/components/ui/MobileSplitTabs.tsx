'use client';

import { ACCENT, GRADIENT } from '@/lib/tokens';

type AccentKey = 'writing' | 'examWriting' | 'reading';

export interface MobileSplitTabsProps {
  view: 'task' | 'editor';
  onChange: (v: 'task' | 'editor') => void;
  accent: AccentKey;
  taskLabel?: string;
  editorLabel?: string;
  taskBadge?: React.ReactNode;
  editorBadge?: React.ReactNode;
  topOffsetPx?: number;
}

export function MobileSplitTabs({
  view,
  onChange,
  accent,
  taskLabel = 'Aufgabe / Đề bài',
  editorLabel = 'Antwort / Trả lời',
  taskBadge,
  editorBadge,
  topOffsetPx = 64,
}: MobileSplitTabsProps) {
  const accentColor = ACCENT[accent];
  const gradient = GRADIENT[accent];

  const renderTab = (
    key: 'task' | 'editor',
    label: string,
    badge?: React.ReactNode,
  ) => {
    const active = view === key;
    return (
      <button
        type="button"
        onClick={() => onChange(key)}
        aria-pressed={active}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border min-w-0"
        style={
          active
            ? {
                background: gradient,
                color: 'white',
                borderColor: 'transparent',
                boxShadow: `0 4px 12px ${accentColor}40`,
              }
            : {
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-muted)',
                borderColor: 'var(--theme-border)',
              }
        }
      >
        <span className="truncate">{label}</span>
        {badge}
      </button>
    );
  };

  return (
    <div
      className="lg:hidden sticky z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2"
      style={{
        top: topOffsetPx,
        backgroundColor: 'color-mix(in srgb, var(--theme-bg-card) 88%, transparent)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex gap-1.5 max-w-2xl mx-auto">
        {renderTab('task', taskLabel, taskBadge)}
        {renderTab('editor', editorLabel, editorBadge)}
      </div>
    </div>
  );
}
