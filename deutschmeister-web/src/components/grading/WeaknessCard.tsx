'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { InsightWeakness, WeaknessSeverity } from '@/lib/api/types/grading-insights';

/**
 * Single weakness row. Severity drives the accent color (matching the
 * 3-level scale used by WritingError elsewhere in the app), title is the
 * scannable summary, and the explanation + example quotes expand on click.
 */
export function WeaknessCard({ weakness, defaultOpen = false }: { weakness: InsightWeakness; defaultOpen?: boolean }) {
  const t = useTranslations('practice.grading');
  const [open, setOpen] = useState(defaultOpen);
  const accent = severityAccent(weakness.severity);
  const hasDetails =
    weakness.explanationVi.length > 0 ||
    (weakness.howToFixVi?.length ?? 0) > 0 ||
    weakness.examples.length > 0;

  return (
    <div
      className="rounded-xl border p-4 transition-shadow hover:shadow-sm"
      style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: accent.border }}
    >
      <button
        type="button"
        onClick={() => hasDetails && setOpen((v) => !v)}
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={open}
      >
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: accent.bg, color: accent.fg }}
        >
          {severityLabel(weakness.severity)}
        </span>
        <div className="flex-1">
          <div className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {weakness.titleVi}
          </div>
          {weakness.titleDe && (
            <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              {weakness.titleDe}
            </div>
          )}
        </div>
        {hasDetails && (
          <span
            className="ml-2 text-xs"
            style={{ color: 'var(--theme-text-secondary)' }}
            aria-hidden
          >
            {open ? '▾' : '▸'}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {weakness.explanationVi && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              {weakness.explanationVi}
            </p>
          )}
          {weakness.howToFixVi && (
            <div
              className="flex items-start gap-2 rounded-lg p-2.5"
              style={{ backgroundColor: 'var(--theme-bg-subtle)' }}
            >
              <span aria-hidden className="text-sm">🔧</span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
                <span className="font-semibold">{t('howToFix')}: </span>
                {weakness.howToFixVi}
              </p>
            </div>
          )}
          {weakness.examples.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {weakness.examples.map((ex, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-mono"
                  style={{ backgroundColor: 'var(--theme-bg-subtle)', color: 'var(--theme-text-primary)' }}
                >
                  “{ex.quote}”
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function severityLabel(s: WeaknessSeverity): string {
  if (s === 'error') return 'Lỗi';
  if (s === 'warning') return 'Cảnh báo';
  return 'Gợi ý';
}

function severityAccent(s: WeaknessSeverity): { bg: string; fg: string; border: string } {
  if (s === 'error') return { bg: '#FEE2E2', fg: '#B91C1C', border: '#FCA5A5' };
  if (s === 'warning') return { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D' };
  return { bg: '#DBEAFE', fg: '#1E40AF', border: '#93C5FD' };
}
