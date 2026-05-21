'use client';

import { ReactNode } from 'react';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  /** Extra ReactNode rendered after the standard badge (e.g. a PREMIUM chip). */
  extraBadge?: ReactNode;
  icon?: ReactNode;
  accent?: AccentKey;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  extraBadge,
  icon,
  accent = 'brand',
  className,
}: SectionHeaderProps) {
  const accentColor = ACCENT[accent];
  const gradient = accent in GRADIENT ? GRADIENT[accent as keyof typeof GRADIENT] : GRADIENT.brand;

  return (
    <div className={className ?? 'mb-4 flex items-start justify-between gap-3'}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: gradient }}
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-h3 font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {title}
            </h2>
            {badge && (
              <span
                className="rounded-full px-2.5 py-1 text-caption font-bold"
                style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
              >
                {badge}
              </span>
            )}
            {extraBadge}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
