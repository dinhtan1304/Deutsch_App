'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { useIsExamUnlocked } from '@/hooks/useSubscription';
import { UpgradeModal } from './UpgradeModal';

interface Props {
  title?: string;
  description?: string;
  children: React.ReactNode;
  featureContext?: string;
}

/**
 * Hard-gate paywall for Premium-only features (e.g. "đề chuẩn" exam sections).
 * Renders children when the user has access (Premium OR BETA_OPEN=true on backend);
 * otherwise shows an upgrade card with an UpgradeModal trigger.
 */
export function PremiumPaywall({
  title: titleProp,
  description: descriptionProp,
  children,
  featureContext,
}: Props) {
  const t = useTranslations('subscription.paywall');
  const unlocked = useIsExamUnlocked();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (unlocked) {
    return <>{children}</>;
  }

  const title = titleProp ?? t('defaultTitle');
  const description = descriptionProp ?? t('defaultDescription');

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="max-w-md mx-auto px-4 py-16">
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: GRADIENT.vocabDeepBg,
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={ACCENT.vocab}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div
            className="inline-block px-2.5 py-1 rounded-full text-caption font-extrabold text-white mb-3"
            style={{ background: GRADIENT.speaking }}
          >
            PREMIUM
          </div>

          <h3
            className="text-[17px] font-bold mb-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {title}
          </h3>
          <p
            className="text-body mb-6 leading-relaxed"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {description}
          </p>

          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="w-full py-3 rounded-xl text-sm font-bold text-white mb-3 transition-transform hover:scale-[1.01]"
            style={{ background: GRADIENT.writing }}
          >
            {t('upgrade')}
          </button>

          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {t('footnote')}
          </p>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="yearly"
        featureContext={featureContext}
      />
    </div>
  );
}
