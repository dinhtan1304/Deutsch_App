'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { ACCENT, type AccentKey } from '@/lib/tokens';

interface PageHeaderProps {
  backHref?: string;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  accent?: AccentKey;
  right?: ReactNode;
}

function BackIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function PageHeader({ backHref, onBack, title, subtitle, accent, right }: PageHeaderProps) {
  const accentColor = accent ? ACCENT[accent] : 'var(--theme-text-muted)';
  const showBack = Boolean(backHref || onBack);

  const backButton = (
    <span
      className="inline-flex items-center gap-1 text-body font-medium transition-opacity hover:opacity-70"
      style={{ color: accentColor }}
      aria-label="Quay lại"
    >
      <BackIcon />
      Quay lại
    </span>
  );

  return (
    <header className="flex items-start justify-between gap-4 mb-5">
      <div className="min-w-0 flex-1">
        {showBack && (
          <div className="mb-2">
            {backHref ? (
              <Link href={backHref}>{backButton}</Link>
            ) : (
              <button type="button" onClick={onBack}>{backButton}</button>
            )}
          </div>
        )}
        <h1 className="text-h1 font-extrabold leading-tight truncate" style={{ color: 'var(--theme-text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
