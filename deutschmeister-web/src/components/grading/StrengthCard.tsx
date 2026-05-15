'use client';

import type { InsightStrength } from '@/lib/api/types/grading-insights';

/**
 * Single strength row. Always green-tinted; evidence quotes from the
 * learner's work render as inline chips so they see exactly which lines
 * earned the praise.
 */
export function StrengthCard({ strength }: { strength: InsightStrength }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.35)' }}
    >
      <div className="flex items-start gap-2">
        <span aria-hidden className="text-lg leading-none">✓</span>
        <div className="flex-1">
          <div className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {strength.titleVi}
          </div>
          {strength.evidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {strength.evidence.map((ev, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-mono"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803D' }}
                >
                  “{ev}”
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
