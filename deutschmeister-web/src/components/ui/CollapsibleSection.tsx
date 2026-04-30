'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

export interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  /** Default open state when user has not yet toggled. */
  defaultOpen?: boolean;
  /** If true, section is hidden on mobile (<768px) by default via CSS, until user toggles. */
  collapseOnMobile?: boolean;
  className?: string;
}

/**
 * Collapsible section with a click-to-toggle header. To avoid SSR hydration
 * mismatch, the "collapse on mobile" behavior is implemented via CSS media
 * query (Tailwind `md:` prefix) while the section is in its initial state.
 * Once the user toggles, explicit state takes over.
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  collapseOnMobile = false,
  className,
}: CollapsibleSectionProps) {
  // null = untouched (CSS-driven); boolean = user-explicit
  const [explicit, setExplicit] = useState<boolean | null>(null);
  const open = explicit ?? defaultOpen;

  // When untouched and collapseOnMobile=true, hide children on <md via CSS.
  const hideMobileViaCSS = explicit === null && collapseOnMobile;
  const childrenVisible = hideMobileViaCSS ? true : open;

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <button
        type="button"
        onClick={() => setExplicit(!open)}
        className="flex items-center gap-2 text-left transition-colors"
        style={{ color: 'var(--theme-text-secondary)' }}
        aria-expanded={open}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-body font-semibold uppercase tracking-wide">{title}</span>
      </button>
      {childrenVisible && (
        <div className={cn('flex flex-col gap-4', hideMobileViaCSS && 'hidden md:flex')}>
          {children}
        </div>
      )}
    </section>
  );
}
