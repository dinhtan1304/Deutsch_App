'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UpgradeModal } from './UpgradeModal';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';

interface Props {
  /** Current item count. */
  used: number;
  /** Max for free users. Pass -1 for unlimited/paid. */
  limit: number;
  /** True when user is on any paid plan. Banner hides entirely when true. */
  isPaid: boolean;
  /** Vietnamese resource label, e.g. "Word Bank", "bộ chủ đề". */
  label: string;
  /** Passed to UpgradeModal for analytics. */
  featureContext?: string;
}

/**
 * Size-limit counter for FREE features that have a hard cap (not a weekly
 * quota). Shows X/Y with progress bar; escalates color (green → amber → red);
 * surfaces an upgrade CTA when near or over the cap.
 *
 * Renders nothing for paid users — they don't have a cap.
 */
export function CapacityBanner({ used, limit, isPaid, label, featureContext }: Props) {
  const t = useTranslations('subscription.capacity');
  const tc = useTranslations('subscription.common');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (isPaid || limit < 0) return null;

  const capped = Math.min(used, limit);
  const remaining = Math.max(0, limit - capped);
  const percent = (capped / limit) * 100;
  const depleted = remaining === 0;
  const lastFew = remaining > 0 && remaining <= 2;

  const accent = depleted ? STATUS.danger : lastFew ? STATUS.warning : ACCENT.reading;

  return (
    <>
      <div
        className="rounded-xl border px-4 py-3 mb-4 flex items-center gap-3 flex-wrap"
        style={{
          borderColor: depleted || lastFew ? `${accent}55` : 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)',
        }}
        role="status"
        aria-live="polite"
      >
        <div className="flex-1 min-w-50">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
              {label}: <strong style={{ color: accent }}>{capped}/{limit}</strong>
              {depleted && <span className="ml-2" style={{ color: STATUS.danger }}>{t('full')}</span>}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              {t('freeUpgradeHint')}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percent}%`,
                background: depleted
                  ? GRADIENT.dangerSolidH
                  : lastFew
                  ? GRADIENT.xpGoldH
                  : GRADIENT.readingGreenH,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-transform hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          style={{ background: GRADIENT.premium }}
        >
          {depleted ? tc('upgradeNow') : tc('premiumFrom')}
        </button>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="lite_monthly"
        featureContext={featureContext ?? label}
      />
    </>
  );
}
