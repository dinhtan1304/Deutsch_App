'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';

export interface ActionCardTask {
  icon: ReactNode;
  label: string;
  done: boolean;
  href?: string;
}

export interface ActionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accent?: AccentKey;
  badge?: { label: string; tone?: 'default' | 'urgent' };
  progress?: { current: number; total: number; label?: string };
  tasks?: ActionCardTask[];
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
}

/**
 * Hero "do this next" card for the dashboard. Consolidates the patterns from
 * HeroActionCard and TodayFocusCard — one primitive that can show any of:
 * - single action with CTA (default)
 * - action + progress bar
 * - action + task checklist
 *
 * Phase 3 will migrate dashboard usages to this primitive.
 */
export function ActionCard({
  icon,
  title,
  subtitle,
  accent = 'brand',
  badge,
  progress,
  tasks,
  cta,
  secondary,
  className,
}: ActionCardProps) {
  const gradient = accent in GRADIENT ? GRADIENT[accent as keyof typeof GRADIENT] : GRADIENT.brand;
  const progressPct = progress ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg p-6 text-white',
        className,
      )}
      style={{ background: gradient }}
    >
      {/* Decorative bloom — subtle, not an orb farm */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.4)' }}
      />

      <div className="relative flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-h3 font-semibold leading-tight">{title}</h3>
            {badge && (
              <span
                className="rounded-pill px-2 py-0.5 text-caption font-semibold"
                style={{
                  background: badge.tone === 'urgent' ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              >
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-body opacity-90">{subtitle}</p>
          )}
        </div>
      </div>

      {progress && (
        <div className="relative mt-5">
          <div className="flex items-center justify-between text-caption opacity-90">
            <span>{progress.label ?? 'Tiến độ'}</span>
            <span className="font-semibold">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-pill"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <div
              className="h-full rounded-pill transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'white' }}
            />
          </div>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {tasks.map((task, i) => {
            const content = (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-caption font-semibold transition-all',
                  task.done ? 'opacity-70' : 'hover:-translate-y-0.5',
                )}
                style={{
                  background: task.done ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)',
                  color: 'white',
                  textDecoration: task.done ? 'line-through' : 'none',
                }}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">{task.icon}</span>
                {task.label}
              </span>
            );
            return (
              <li key={i}>
                {task.href ? <Link href={task.href}>{content}</Link> : content}
              </li>
            );
          })}
        </ul>
      )}

      <div className="relative mt-6 flex items-center gap-3">
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-body font-semibold transition-all hover:-translate-y-0.5"
          style={{ background: 'white', color: ACCENT[accent] }}
        >
          {cta.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="text-caption font-semibold opacity-90 hover:opacity-100"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
