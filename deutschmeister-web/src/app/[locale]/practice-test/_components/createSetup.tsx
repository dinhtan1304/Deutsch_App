'use client';

import type { ReactNode } from 'react';

/**
 * Shared primitives for the v2 "create with AI" setup screens
 * (reading / writing / listening / speaking). Keeps the numbered-section
 * header and the live prompt-sentence chip visually identical across features.
 * Colors come from CSS vars / route accent — no raw hex here.
 */

export function SetupSection({ n, label, children }: { n: number; label: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="mono flex h-5.5 w-5.5 items-center justify-center rounded-[7px] text-[11px] font-bold"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{n}</span>
        <span className="text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
      </div>
      {children}
    </section>
  );
}

/** Prompt-sentence token chip — tinted in `color` when chosen, neutral as a placeholder. */
export function PromptToken({ label, color, on, mono }: { label: string; color?: string; on: boolean; mono?: boolean }) {
  return (
    <span className={`mx-0.5 inline-flex items-center rounded-[7px] px-2.5 py-0.5 font-bold ${mono ? 'mono text-[13px]' : 'text-body'}`}
      style={on
        ? { background: `color-mix(in srgb, ${color} 16%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 45%, transparent)` }
        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
      {label}
    </span>
  );
}
