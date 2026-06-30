'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSmartReviewPlan } from '@/hooks/useSmartReview';
import type { ReviewBlock, ReviewBlockKind } from '@/lib/api/smartReview';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import { IconChevronLeft } from '@/components/ui/Icons';

// ── Per-kind accent + gradient (token-driven, no raw hex in JSX) ──
const KIND_ACCENT: Record<ReviewBlockKind, { color: string; gradient: string }> = {
  srs: { color: ACCENT.srs, gradient: GRADIENT.srsVocab },
  remediation: { color: STATUS.warning, gradient: GRADIENT.xp },
  skill: { color: ACCENT.brand, gradient: GRADIENT.action },
  explore: { color: ACCENT.reading, gradient: GRADIENT.reading },
};

// ── Inline-SVG icon map (icon names mirror SmartReviewService block icons) ──
function BlockIcon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'flame':
      return <svg {...common}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
    case 'target':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case 'book-open':
      return <svg {...common}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
    case 'pencil':
      return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;
    case 'headphones':
      return <svg {...common}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
    case 'mic':
      return <svg {...common}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
    case 'check-square':
      return <svg {...common}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    case 'compass':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}

function SmartReviewCard({ block, step, ctaLabel, minutesUnit, stepLabel }: {
  block: ReviewBlock;
  step: number;
  ctaLabel: string;
  minutesUnit: string;
  stepLabel: string;
}) {
  const accent = KIND_ACCENT[block.kind];
  return (
    <Link
      href={block.href}
      className="group flex items-center gap-4 rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
      style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
    >
      {/* Step + icon */}
      <div className="relative shrink-0">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
          style={{ background: accent.gradient }}
        >
          <BlockIcon name={block.icon} size={22} />
        </div>
        <span
          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}
        >
          {step}
        </span>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {block.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
          {block.reason}
        </p>
        <div className="mt-1.5 flex items-center gap-2.5 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="font-medium" style={{ color: accent.color }}>
            {stepLabel} {step}
          </span>
          <span>·</span>
          <span>~{block.estMinutes} {minutesUnit}</span>
          {block.xpReward ? (
            <>
              <span>·</span>
              <span className="font-semibold" style={{ color: ACCENT.xp }}>+{block.xpReward} XP</span>
            </>
          ) : null}
        </div>
      </div>

      {/* CTA */}
      <span
        className="shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-bold text-white transition-opacity group-hover:opacity-90"
        style={{ background: accent.color }}
      >
        {ctaLabel}
      </span>
    </Link>
  );
}

export default function SmartReviewPage() {
  const t = useTranslations('progress.smartReview');
  const { data: plan, isLoading, isError, refetch } = useSmartReviewPlan();

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      {/* Back to dashboard — matches achievements/challenges/leaderboard */}
      <Link
        href="/dashboard"
        className="mb-3 inline-flex items-center gap-1 text-body font-medium transition-opacity hover:opacity-70"
        style={{ color: ACCENT.brand }}
      >
        <IconChevronLeft size={15} /> {t('back')}
      </Link>

      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
            {t('title')}
          </h1>
          <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-muted)' }}>
            {t('subtitle')}
          </p>
        </div>
        {plan && (
          <div className="flex shrink-0 gap-2">
            <div className="flex min-w-22 flex-col gap-0.5 rounded-[10px] px-3.5 py-2" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT.brand }} />
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('totalTimeLabel')}</span>
              </div>
              <span className="mono text-[18px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>~{plan.totalEstMinutes} {t('minutesUnit')}</span>
            </div>
          </div>
        )}
      </header>

      {/* Content column — focused width for the ordered checklist */}
      <div className="max-w-3xl">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl"
                style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
          >
            <p className="mb-4 text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
              {t('errorTitle')}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-lg px-4 py-2 text-body font-bold text-white"
              style={{ background: ACCENT.brand }}
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* Blocks */}
        {plan && (
          <div className="space-y-3">
            {plan.blocks.map((block, i) => (
              <SmartReviewCard
                key={block.id}
                block={block}
                step={i + 1}
                ctaLabel={t('start')}
                minutesUnit={t('minutesUnit')}
                stepLabel={t('stepLabel')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
