'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ACCENT, type AccentKey } from '@/lib/tokens';

export type StatusPillType = 'streak' | 'xp' | 'level' | 'custom';

export interface StatusPillProps {
  type: StatusPillType;
  value: number | string;
  label?: string;
  size?: 'sm' | 'md';
  accent?: AccentKey;        // only honored when type='custom'
  icon?: ReactNode;          // overrides default icon for type='custom'
  className?: string;
}

function defaultIcon(type: StatusPillType): ReactNode {
  const size = 14;
  switch (type) {
    case 'streak':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
        </svg>
      );
    case 'xp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
        </svg>
      );
    case 'level':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      );
    default:
      return null;
  }
}

function typeAccent(type: StatusPillType, fallback?: AccentKey): string {
  switch (type) {
    case 'streak': return ACCENT.games;      // orange — fire tone
    case 'xp':     return ACCENT.xp;          // amber
    case 'level':  return ACCENT.brand;       // indigo
    case 'custom': return ACCENT[fallback ?? 'brand'];
  }
}

/**
 * Status pill — unified display for streak / XP / level / custom stat.
 * Used in Header, dashboard StatusPills row, profile page.
 */
export function StatusPill({
  type,
  value,
  label,
  size = 'md',
  accent,
  icon,
  className,
}: StatusPillProps) {
  const color = typeAccent(type, accent);
  const displayIcon = icon ?? defaultIcon(type);
  const paddingClass = size === 'sm' ? 'px-2.5 py-1 text-caption' : 'px-3 py-1.5 text-body';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill font-semibold',
        paddingClass,
        className,
      )}
      style={{
        background: `${color}1A`,
        color,
      }}
    >
      {displayIcon && <span className="inline-flex items-center" style={{ color }}>{displayIcon}</span>}
      <span>{value}</span>
      {label && <span className="opacity-70">{label}</span>}
    </span>
  );
}
