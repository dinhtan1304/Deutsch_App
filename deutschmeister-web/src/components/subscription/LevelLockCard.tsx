'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { IconLock } from '@/components/ui/Icons';
import { UpgradeModal } from './UpgradeModal';

interface Props {
  /** CEFR level of the locked content (e.g. "B1"), shown in the copy. */
  level?: string;
  /** Layout: full-page panel (topic detail) or compact inline card. */
  variant?: 'page' | 'inline';
  featureContext?: string;
}

/**
 * Show-but-locked gate for level-restricted content (free users = A1 only).
 * Renders a lock card with an UpgradeModal trigger. Unlike PremiumPaywall this
 * is driven by the backend `locked` flag, so it doesn't decide access itself —
 * mount it only when the content is actually locked for the caller.
 */
export function LevelLockCard({ level, variant = 'page', featureContext }: Props) {
  const t = useTranslations('subscription.levelLock');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const card = (
    <div
      className="rounded-2xl border p-8 text-center"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: GRADIENT.vocabDeepBg }}
      >
        <IconLock size={28} style={{ color: ACCENT.vocab }} />
      </div>

      <div
        className="inline-block px-2.5 py-1 rounded-full text-caption font-extrabold text-white mb-3"
        style={{ background: GRADIENT.speaking }}
      >
        PREMIUM
      </div>

      <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        {t('title', { level: level ?? '' })}
      </h3>
      <p className="text-body mb-6 leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
        {t('description')}
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
  );

  return (
    <>
      {variant === 'page' ? (
        <div className="max-w-md mx-auto px-4 py-16">{card}</div>
      ) : (
        <div className="max-w-md mx-auto">{card}</div>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="yearly"
        featureContext={featureContext}
      />
    </>
  );
}
