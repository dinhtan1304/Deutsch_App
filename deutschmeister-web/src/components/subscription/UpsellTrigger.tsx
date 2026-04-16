'use client';

import Link from 'next/link';
import { useIsPremium, useBetaOpen } from '@/hooks/useSubscription';

interface Props {
  /** Variant controls the size/style of the card. `compact` is one-liner banner. */
  variant?: 'compact' | 'card';
  /** Headline — override for context-specific messaging (e.g. "Đề chuẩn Goethe đang chờ"). */
  title?: string;
  /** Sub-text under the headline. */
  description?: string;
  /** CTA button label. */
  ctaLabel?: string;
  /** Destination for the CTA — defaults to /pricing. */
  href?: string;
  /**
   * Source tag for analytics/tracking — appended as query param so we can
   * measure which surface drove the upgrade (dashboard/game_result/sidebar).
   */
  source?: string;
}

/**
 * Non-blocking upsell card. Renders nothing if user is already Premium or
 * BETA_OPEN is true (in beta we don't nag anyone). Soft-sell surface —
 * contrast with PremiumPaywall which hard-gates children.
 */
export function UpsellTrigger({
  variant = 'card',
  title = 'Mở khóa toàn bộ tính năng Premium',
  description = 'Đề chuẩn Goethe & TELC, không giới hạn AI chấm bài, ôn tập cá nhân hóa.',
  ctaLabel = 'Nâng cấp',
  href = '/pricing',
  source,
}: Props) {
  const isPremium = useIsPremium();
  const betaOpen = useBetaOpen();

  if (isPremium || betaOpen) return null;

  const fullHref = source ? `${href}?src=${encodeURIComponent(source)}` : href;

  if (variant === 'compact') {
    return (
      <Link
        href={fullHref}
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-transform hover:scale-[1.01]"
        style={{
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.10))',
          border: '1px solid rgba(139,92,246,0.25)',
        }}
      >
        <CrownIcon />
        <div className="flex-1 min-w-0">
          <div
            className="font-bold text-[13px] truncate"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {title}
          </div>
          <div
            className="text-[11px] truncate"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {description}
          </div>
        </div>
        <span
          className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          }}
        >
          {ctaLabel}
        </span>
      </Link>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background:
          'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(99,102,241,0.10))',
        border: '1px solid rgba(139,92,246,0.25)',
      }}
    >
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.6), transparent 70%)',
        }}
      />
      <div className="relative flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            boxShadow: '0 8px 20px -6px rgba(139,92,246,0.5)',
          }}
        >
          <CrownIcon size={22} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-extrabold text-[15px] mb-1"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {title}
          </div>
          <div
            className="text-[12.5px] leading-snug mb-3"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {description}
          </div>
          <Link
            href={fullHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 4px 12px -2px rgba(139,92,246,0.4)',
            }}
          >
            {ctaLabel}
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CrownIcon({ size = 18, color = '#8B5CF6' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M2 18h20" />
      <path d="M5 18l-2-9 5 3 4-7 4 7 5-3-2 9" />
    </svg>
  );
}

/**
 * Small inline crown badge — used by sidebar to mark premium-only nav items.
 * Hidden when the user is Premium or BETA_OPEN.
 */
export function PremiumLockIcon({ size = 12 }: { size?: number }) {
  const isPremium = useIsPremium();
  const betaOpen = useBetaOpen();
  if (isPremium || betaOpen) return null;
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center"
      title="Premium only"
      style={{ color: '#8B5CF6' }}
    >
      <CrownIcon size={size} color="#8B5CF6" />
    </span>
  );
}
