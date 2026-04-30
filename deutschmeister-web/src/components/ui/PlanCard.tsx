'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ACCENT } from '@/lib/tokens';

export type PlanTier = 'free' | 'premium' | 'lifetime';

export interface PlanCardProps {
  name: string;
  price: string;              // formatted e.g. "99.000đ / tháng" or "Miễn phí"
  subtitle?: string;
  features: string[];
  cta: { label: string; href?: string; onClick?: () => void; disabled?: boolean; tone?: 'primary' | 'muted' | 'success' };
  recommended?: boolean;
  highlight?: string;         // e.g. "42 suất còn lại"
  bestFor?: string;           // e.g. "Cho người học chăm chỉ mỗi ngày"
  tier: PlanTier;
  footnote?: ReactNode;
  className?: string;
}

const TIER_ACCENT: Record<PlanTier, string> = {
  free: ACCENT.brand,
  premium: ACCENT.brand,
  lifetime: ACCENT.premium,
};

/**
 * Pricing tier card — data-driven. Replaces the 3 hardcoded JSX blocks
 * (Free/Premium/Lifetime) currently in pricing/page.tsx.
 *
 * `recommended` bumps the card size (via margin) and adds a visible badge;
 * hierarchy through size, not just color.
 */
export function PlanCard({
  name,
  price,
  subtitle,
  features,
  cta,
  recommended,
  highlight,
  bestFor,
  tier,
  footnote,
  className,
}: PlanCardProps) {
  const tierColor = TIER_ACCENT[tier];

  const body = (
    <div
      className={cn(
        'relative flex flex-col rounded-lg border p-6',
        recommended ? '-mt-2 pt-7 shadow-lifted' : '',
        className,
      )}
      style={{
        borderColor: recommended ? tierColor : 'var(--theme-border)',
        borderWidth: recommended ? 2 : 1,
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {recommended && (
        <span
          className="absolute -top-3 left-6 rounded-pill px-3 py-1 text-caption font-semibold text-white"
          style={{ background: tierColor }}
        >
          Phù hợp nhất
        </span>
      )}
      {highlight && !recommended && (
        <span
          className="absolute -top-3 left-6 rounded-pill px-3 py-1 text-caption font-semibold"
          style={{ background: `${tierColor}1A`, color: tierColor }}
        >
          {highlight}
        </span>
      )}

      <div className="mb-5">
        <div
          className="text-body font-semibold uppercase tracking-wide"
          style={{ color: tierColor }}
        >
          {name}
        </div>
        <div
          className="mt-2 text-h1 font-bold"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          {price}
        </div>
        {subtitle && (
          <div className="mt-1 text-body" style={{ color: 'var(--theme-text-muted)' }}>
            {subtitle}
          </div>
        )}
        {bestFor && (
          <div
            className="mt-3 rounded-md px-3 py-2 text-caption font-medium"
            style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}
          >
            {bestFor}
          </div>
        )}
      </div>

      <ul className="mb-6 flex flex-1 flex-col gap-2.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-body" style={{ color: 'var(--theme-text-primary)' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={tierColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {(() => {
        const tone = cta.tone ?? (cta.disabled ? 'muted' : 'primary');
        const ctaStyle =
          tone === 'muted' ? {
            background: 'var(--theme-bg-secondary)',
            color: 'var(--theme-text-muted)',
            cursor: 'not-allowed' as const,
          } :
          tone === 'success' ? {
            background: 'rgba(34,197,94,0.12)',
            color: 'var(--color-status-success, #22C55E)',
          } : {
            background: tierColor,
            color: 'white',
          };
        const ctaClass = 'w-full rounded-md px-5 py-3 text-body font-semibold text-center transition-all' +
          (cta.disabled || tone !== 'primary' ? '' : ' hover:-translate-y-0.5');
        return (
          <button
            type="button"
            onClick={cta.disabled ? undefined : cta.onClick}
            disabled={cta.disabled}
            className={ctaClass}
            style={ctaStyle}
          >
            {cta.label}
          </button>
        );
      })()}

      {footnote && (
        <div className="mt-3 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
          {footnote}
        </div>
      )}
    </div>
  );

  if (cta.href) {
    return (
      <Link href={cta.href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}
