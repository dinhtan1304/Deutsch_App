'use client';

import type { FC, CSSProperties } from 'react';

export function ProfileStatCard({
  label, value, color, icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: FC<{ size?: number; style?: CSSProperties; className?: string }>;
}) {
  return (
    <div
      className="word-card-v2 relative flex items-center gap-3.5 overflow-hidden rounded-md border p-4"
      style={{
        ...({ '--card-accent': color } as CSSProperties),
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      <div className="pointer-events-none absolute -right-7 -top-7 h-22 w-22 rounded-full" style={{ background: `${color}18`, filter: 'blur(18px)' }} />
      <div
        className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: `${color}1A`, color }}
      >
        <Icon size={21} />
      </div>
      <div className="relative z-10 min-w-0">
        <div className="mono text-2xl font-bold leading-none tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
          {value}
        </div>
        <div className="mt-1.5 text-[11.5px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
