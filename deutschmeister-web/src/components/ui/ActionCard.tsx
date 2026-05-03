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
        'group relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl',
        className,
      )}
      style={{ background: gradient }}
    >
      {/* Decorative 3D orbs & glassmorphic blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full opacity-20 mix-blend-overlay transition-transform duration-700 group-hover:scale-125"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)' }}
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl backdrop-blur-md shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-xl font-bold leading-tight tracking-tight drop-shadow-sm">{title}</h3>
            {badge && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm animate-pulse"
                style={{
                  background: badge.tone === 'urgent' ? 'rgba(239,68,68,0.95)' : 'rgba(255,255,255,0.25)',
                  color: 'white',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
             <p className="mt-0.5 text-sm font-medium opacity-90 drop-shadow-sm max-w-xl">{subtitle}</p>
          )}
        </div>
      </div>

      {progress && (
        <div className="relative mt-5 max-w-xl">
          <div className="flex items-center justify-between text-xs font-bold opacity-90 mb-1.5">
            <span>{progress.label ?? 'Tiến độ'}</span>
            <span>
              {progress.current} / {progress.total}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full shadow-inner"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progressPct}%`, background: 'white' }}
            >
               <div className="absolute inset-0 bg-white opacity-50 blur-sm animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <ul className="relative mt-5 flex flex-wrap gap-2 max-w-2xl">
          {tasks.map((task, i) => {
            const content = (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm',
                  task.done ? 'opacity-50' : 'hover:-translate-y-0.5 hover:shadow-md',
                )}
                style={{
                  background: task.done ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center bg-white/20 rounded-full">{task.icon}</span>
                <span style={{ textDecoration: task.done ? 'line-through' : 'none' }}>{task.label}</span>
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

      <div className="relative mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wider transition-all hover:scale-105 shadow-md hover:shadow-lg"
          style={{ background: 'white', color: ACCENT[accent] }}
        >
          {cta.label}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-1 transition-transform">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="px-4 py-3 rounded-xl text-xs font-bold text-white opacity-80 hover:opacity-100 hover:bg-white/10 transition-colors"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
