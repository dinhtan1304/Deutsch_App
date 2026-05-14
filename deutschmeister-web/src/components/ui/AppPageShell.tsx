'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GRADIENT, type AccentKey } from '@/lib/tokens';

interface AppPageShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  accent?: AccentKey;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppPageShell({
  title,
  subtitle,
  icon,
  accent = 'brand',
  right,
  children,
  className,
}: AppPageShellProps) {
  const gradient = accent in GRADIENT ? GRADIENT[accent as keyof typeof GRADIENT] : GRADIENT.brand;

  return (
    <div className={cn('mx-auto max-w-7xl px-4 pb-10 pt-5', className)}>
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
