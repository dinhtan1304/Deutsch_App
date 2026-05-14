'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ACCENT, THEME_VAR, type AccentKey } from '@/lib/tokens';

export type SurfaceCardVariant = 'default' | 'subtle' | 'interactive' | 'featured' | 'locked';

export interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceCardVariant;
  accent?: AccentKey;
  interactive?: boolean;
}

export const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ className, variant = 'default', accent = 'brand', interactive, style, children, ...props }, ref) => {
    const accentColor = ACCENT[accent];
    const isInteractive = interactive || variant === 'interactive';

    const variantStyle: React.CSSProperties = {
      default: {
        backgroundColor: THEME_VAR.bgCard,
        borderColor: THEME_VAR.border,
      },
      subtle: {
        backgroundColor: THEME_VAR.bgSecondary,
        borderColor: THEME_VAR.border,
      },
      interactive: {
        backgroundColor: THEME_VAR.bgCard,
        borderColor: THEME_VAR.border,
      },
      featured: {
        background: `linear-gradient(135deg, ${accentColor}14, ${accentColor}06)`,
        borderColor: `${accentColor}33`,
      },
      locked: {
        backgroundColor: THEME_VAR.bgCard,
        borderColor: THEME_VAR.border,
        opacity: 0.82,
      },
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border p-5 shadow-soft',
          isInteractive && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted focus-within:ring-2 focus-within:ring-offset-2',
          className,
        )}
        style={{
          ...variantStyle,
          ...(isInteractive ? { '--tw-ring-color': accentColor } : undefined),
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    );
  },
);

SurfaceCard.displayName = 'SurfaceCard';
