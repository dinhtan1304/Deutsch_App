'use client';

import Link from 'next/link';
import { useNextAction } from '@/hooks/useDashboard';

// Inline SVG icon map — replaces emoji from backend `icon` field
function HeroIcon({ name, size = 24 }: { name: string; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'white', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'flame':
      return <svg {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
    case 'pencil':
      return <svg {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
    case 'book':
      return <svg {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
    case 'zap':
      return <svg {...props} fill="white" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'target':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case 'check-circle':
      return <svg {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
  }
}

function HeroSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 animate-pulse"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', minHeight: 100 }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl shrink-0"
          style={{ backgroundColor: 'var(--theme-border)' }}
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-48 rounded" style={{ backgroundColor: 'var(--theme-border)' }} />
          <div className="h-3 w-64 rounded" style={{ backgroundColor: 'var(--theme-border)' }} />
        </div>
      </div>
    </div>
  );
}

export function HeroActionCard() {
  const { data, isLoading } = useNextAction();

  if (isLoading) return <HeroSkeleton />;
  if (!data) return null;

  const isUrgent = data.priority === 'srs_urgent';

  return (
    <Link
      href={data.href}
      className="block rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group"
      style={{
        background: data.gradient,
        boxShadow: '0 8px 24px rgba(0,0,0,.12)',
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-15"
        style={{ backgroundColor: 'white' }}
      />
      <div
        className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10"
        style={{ backgroundColor: 'white' }}
      />

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'rgba(255,255,255,.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <HeroIcon name={data.icon} size={26} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {data.priority === 'weak_skill' && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-0.5">
              Kỹ năng cần cải thiện
            </p>
          )}
          <div className="flex items-center gap-2 mb-0.5">
            <h2
              className="text-[18px] font-extrabold text-white leading-tight truncate"
            >
              {data.title}
            </h2>
            {data.badge && (
              <span
                className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: 'rgba(255,255,255,.25)',
                  color: 'white',
                  animation: isUrgent ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : undefined,
                }}
              >
                {data.badge}
              </span>
            )}
          </div>
          <p className="text-[13px] text-white/80 leading-snug">
            {data.subtitle}
          </p>
        </div>

        {/* CTA button */}
        <div
          className="shrink-0 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all group-hover:scale-105"
          style={{
            backgroundColor: 'rgba(255,255,255,.25)',
            color: 'white',
            backdropFilter: 'blur(8px)',
          }}
        >
          {data.ctaText}
          <span className="ml-1.5">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
