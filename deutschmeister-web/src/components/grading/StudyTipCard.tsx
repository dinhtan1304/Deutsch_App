'use client';

import type { StudyTip } from '@/lib/api/types/grading-insights';

/**
 * Single "how to study next" tip. Indigo-tinted to read as guidance (distinct
 * from red weaknesses and green strengths): a heading of WHAT to practise, the
 * memorable rule/mnemonic, and one correct German example chip to anchor it.
 */
export function StudyTipCard({ tip }: { tip: StudyTip }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.35)' }}
    >
      <div className="flex items-start gap-2">
        <span aria-hidden className="text-lg leading-none">💡</span>
        <div className="flex-1">
          <div className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {tip.titleVi}
          </div>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            {tip.tipVi}
          </p>
          {tip.exampleDe && (
            <div className="mt-2">
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-mono"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#4338CA' }}
              >
                {tip.exampleDe}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
