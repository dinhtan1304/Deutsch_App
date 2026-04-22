'use client';

import { ReactNode } from 'react';
import { ACCENT, type AccentKey } from '@/lib/tokens';

export interface StatItem {
  icon?: ReactNode;
  label: string;
  value: string | number;
  accent?: AccentKey;
  sublabel?: string;
}

interface StatGridProps {
  items: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const COL_CLASS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

export function StatGrid({ items, columns = 4, className }: StatGridProps) {
  return (
    <div className={`grid ${COL_CLASS[columns]} gap-3 ${className ?? ''}`}>
      {items.map((it, i) => {
        const color = it.accent ? ACCENT[it.accent] : 'var(--theme-text-primary)';
        return (
          <div
            key={i}
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              border: '1px solid var(--theme-border)',
            }}
          >
            {it.icon && (
              <div className="mx-auto mb-1.5" style={{ color, display: 'flex', justifyContent: 'center' }}>
                {it.icon}
              </div>
            )}
            <div className="text-h2 font-extrabold tabular-nums leading-tight" style={{ color }}>
              {it.value}
            </div>
            <div className="text-caption font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              {it.label}
            </div>
            {it.sublabel && (
              <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                {it.sublabel}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
