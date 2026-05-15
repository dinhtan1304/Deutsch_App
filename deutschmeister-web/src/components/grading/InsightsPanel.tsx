'use client';

import type { GradingInsights } from '@/lib/api/types/grading-insights';
import { WeaknessCard } from './WeaknessCard';
import { StrengthCard } from './StrengthCard';

/**
 * Wrapper panel for AI grading insights. Layout:
 *
 *   ┌───────────────────────────────────────────┐
 *   │  Tóm tắt (overallSummaryVi)               │
 *   │                                           │
 *   │  ━━ Cần cải thiện ━━                      │
 *   │  [WeaknessCard] [WeaknessCard] …          │
 *   │                                           │
 *   │  ━━ Điểm mạnh ━━                          │
 *   │  [StrengthCard] [StrengthCard] …          │
 *   └───────────────────────────────────────────┘
 *
 * Renders nothing when insights is null/empty so callers can drop it into
 * existing pages without conditional wrappers. The first weakness opens
 * by default since users typically scroll-and-stop on the most pressing
 * issue.
 */
export function InsightsPanel({
  insights,
  className,
}: {
  insights: GradingInsights | null;
  className?: string;
}) {
  if (!insights) return null;
  const { weaknesses, strengths, overallSummaryVi } = insights;
  const hasAny = weaknesses.length > 0 || strengths.length > 0 || overallSummaryVi.length > 0;
  if (!hasAny) return null;

  return (
    <section
      className={`rounded-2xl border p-5 ${className ?? ''}`}
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
      }}
      aria-label="Chi tiết chấm bài"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-xl">🎯</span>
        <h3 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Chi tiết nhận xét
        </h3>
      </div>

      {overallSummaryVi && (
        <p
          className="mt-3 leading-relaxed"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          {overallSummaryVi}
        </p>
      )}

      {weaknesses.length > 0 && (
        <div className="mt-5">
          <h4
            className="mb-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Cần cải thiện
          </h4>
          <div className="space-y-2">
            {weaknesses.map((w, i) => (
              <WeaknessCard key={i} weakness={w} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      )}

      {strengths.length > 0 && (
        <div className="mt-5">
          <h4
            className="mb-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Điểm mạnh
          </h4>
          <div className="space-y-2">
            {strengths.map((s, i) => (
              <StrengthCard key={i} strength={s} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
