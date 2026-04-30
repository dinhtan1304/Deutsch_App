'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface MarketingAuthShellProps {
  children: ReactNode;
  /** Max content width (default 440px — good for single-column auth flows). */
  maxWidth?: number | string;
  /** Center-align text (default true for status pages like verify-email). */
  centered?: boolean;
  className?: string;
  /** Override orb color when the screen has its own accent (e.g. success=green). */
  orbAccent?: 'indigo' | 'green';
}

/**
 * Dark navy marketing backdrop + centered content container for secondary auth
 * flows (verify-email, forgot-password, reset-password, confirm).
 *
 * Uses `--marketing-*` tokens + `marketingFloat1/2` + `marketingFadeUp` keyframes
 * from globals.css — no inline keyframes, no hardcoded colors.
 */
export function MarketingAuthShell({
  children,
  maxWidth = 440,
  centered = true,
  className,
  orbAccent = 'indigo',
}: MarketingAuthShellProps) {
  const orb1 = orbAccent === 'green'
    ? 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 70%)'
    : 'var(--marketing-orb-1)';
  const orb2 = orbAccent === 'green'
    ? 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)'
    : 'var(--marketing-orb-2)';

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: 'var(--marketing-bg)' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute"
          style={{
            top: '-15%', right: '-5%', width: 600, height: 600, borderRadius: '50%',
            background: orb1,
            animation: 'marketingFloat1 9s ease-in-out infinite',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '-20%', left: '-8%', width: 500, height: 500, borderRadius: '50%',
            background: orb2,
            animation: 'marketingFloat2 11s ease-in-out infinite',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'var(--marketing-grid)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div
          className={cn('w-full', centered && 'text-center', className)}
          style={{
            maxWidth: typeof maxWidth === 'number' ? `min(${maxWidth}px, 100%)` : maxWidth,
            animation: 'marketingFadeUp 0.5s ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
