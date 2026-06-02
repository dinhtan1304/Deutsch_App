'use client';

import type { ReactNode } from 'react';

export interface MiniStat {
  label: string;
  value: ReactNode;
  /** Dot color — a token/CSS var, e.g. var(--accent) or STATUS.danger. */
  color: string;
}

/**
 * v2 eyebrow stat tile row: color dot + uppercase label + mono value.
 * Extracted from the inline pattern in learn/ipa + the ipa.js / speaking-rooms.js
 * prototypes; shared by the pronunciation and roleplay landings.
 */
export function MiniStats({ stats, className = '' }: { stats: MiniStat[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex flex-col gap-0.5 rounded-[10px] px-3.5 py-2.5"
          style={{ minWidth: 92, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
            <span className="text-caption uppercase font-medium" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>
              {s.label}
            </span>
          </div>
          <span className="mono font-bold" style={{ fontSize: 20, color: 'var(--theme-text-primary)' }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}
