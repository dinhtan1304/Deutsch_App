'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';

export type ShellMaxWidth = '4xl' | '5xl' | '6xl' | '7xl' | 'wide';

export interface AppPageShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  accent?: AccentKey;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidth?: ShellMaxWidth;
  backHref?: string;
  onBack?: () => void;
}

const MAX_WIDTH_CLASS: Record<ShellMaxWidth, string> = {
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  'wide': 'max-w-360', // = dashboard content width (1440px)
};

function BackChevron() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function AppPageShell({
  title,
  subtitle,
  icon,
  accent = 'brand',
  right,
  children,
  className,
  maxWidth = '7xl',
  backHref,
  onBack,
}: AppPageShellProps) {
  const gradient = accent in GRADIENT ? GRADIENT[accent as keyof typeof GRADIENT] : GRADIENT.brand;
  const showBack = Boolean(backHref || onBack);
  const backColor = accent && accent in ACCENT ? ACCENT[accent as AccentKey] : 'var(--theme-text-muted)';

  const backButton = showBack ? (
    <span
      className="inline-flex items-center gap-1 text-body font-medium transition-opacity hover:opacity-70"
      style={{ color: backColor }}
      aria-label="Quay lại"
    >
      <BackChevron />
      Quay lại
    </span>
  ) : null;

  return (
    <div className={cn('mx-auto px-4 pb-10 pt-5', MAX_WIDTH_CLASS[maxWidth], className)}>
      {showBack && (
        <div className="mb-2">
          {backHref ? (
            <Link href={backHref}>{backButton}</Link>
          ) : (
            <button type="button" onClick={onBack}>{backButton}</button>
          )}
        </div>
      )}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-soft"
              style={{ background: gradient }}
              aria-hidden
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-h1 font-extrabold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 max-w-3xl text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      {children}
    </div>
  );
}
