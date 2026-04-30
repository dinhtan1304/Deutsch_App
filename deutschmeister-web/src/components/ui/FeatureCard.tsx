'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  accent?: AccentKey;
  badge?: string;
  points?: string[];
  hover?: boolean;
  className?: string;
}

/**
 * Feature showcase card — used on landing sections and dashboard skill highlights.
 * Consolidates the inline pattern duplicated across Core Features, AI Features,
 * and Exam Formats sections in app/page.tsx.
 */
export function FeatureCard({
  icon,
  title,
  description,
  accent = 'brand',
  badge,
  points,
  hover = true,
  className,
}: FeatureCardProps) {
  const accentColor = ACCENT[accent];
  const gradient = accent in GRADIENT ? GRADIENT[accent as keyof typeof GRADIENT] : GRADIENT.brand;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg border p-6 transition-all duration-200',
        hover && 'hover:-translate-y-1 hover:shadow-lifted',
        className,
      )}
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-white"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        {badge && (
          <span
            className="ml-auto rounded-pill px-2.5 py-1 text-caption font-semibold"
            style={{ background: `${accentColor}1A`, color: accentColor }}
          >
            {badge}
          </span>
        )}
      </div>

      <h3
        className="mt-4 text-h3 font-semibold"
        style={{ color: 'var(--theme-text-primary)' }}
      >
        {title}
      </h3>
      <p
        className="mt-1.5 text-body leading-relaxed"
        style={{ color: 'var(--theme-text-secondary)' }}
      >
        {description}
      </p>

      {points && points.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {points.map((pt, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-body"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
                aria-hidden
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
