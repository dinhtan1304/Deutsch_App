'use client';

import { useTranslations } from 'next-intl';
import type { GradingInsights } from '@/lib/api/types/grading-insights';
import { WeaknessCard } from './WeaknessCard';
import { StrengthCard } from './StrengthCard';
import { StudyTipCard } from './StudyTipCard';

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
  const t = useTranslations('practice.grading');
  if (!insights) return null;
  const { weaknesses, strengths, overallSummaryVi } = insights;
  const studyTips = insights.studyTips ?? [];
  const hasAny =
    weaknesses.length > 0 ||
    strengths.length > 0 ||
    studyTips.length > 0 ||
    overallSummaryVi.length > 0;
  if (!hasAny) return null;

  return (
    <section
      className={`rounded-2xl border p-5 ${className ?? ''}`}
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
      }}
      aria-label={t('insightsAria')}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-xl">🎯</span>
        <h3 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {t('insightsTitle')}
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
            {t('improvements')}
          </h4>
          <div className="space-y-2">
            {weaknesses.map((w, i) => (
              <WeaknessCard key={i} weakness={w} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      )}

      {studyTips.length > 0 && (
        <div className="mt-5">
          <h4
            className="mb-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            {t('studyTips')}
          </h4>
          <div className="space-y-2">
            {studyTips.map((tip, i) => (
              <StudyTipCard key={i} tip={tip} />
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
            {t('strengths')}
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
