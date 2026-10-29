'use client';

import { useTranslations } from 'next-intl';
import { GRADIENT } from '@/lib/tokens';

/**
 * Display-only rank tiers derived from the Elo-style arena rating (players
 * start at 1000). Purely cosmetic — matchmaking still uses the raw rating.
 */
export type ArenaTierKey = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

const TIERS: ReadonlyArray<{ key: ArenaTierKey; min: number; gradient: string }> = [
  { key: 'bronze', min: 0, gradient: GRADIENT.bronze },
  { key: 'silver', min: 1100, gradient: GRADIENT.silver },
  { key: 'gold', min: 1250, gradient: GRADIENT.xpGold },
  { key: 'platinum', min: 1400, gradient: GRADIENT.cyanSky },
  { key: 'diamond', min: 1600, gradient: GRADIENT.vocab },
];

export interface ArenaTierInfo {
  key: ArenaTierKey;
  gradient: string;
  /** Next tier, or null at the top. */
  next: { key: ArenaTierKey; min: number } | null;
  /** 0–100 progress from this tier's floor to the next tier. */
  progress: number;
  pointsToNext: number;
}

export function tierFor(rating: number): ArenaTierInfo {
  let i = 0;
  while (i + 1 < TIERS.length && rating >= TIERS[i + 1]!.min) i++;
  const tier = TIERS[i]!;
  const next = TIERS[i + 1] ?? null;
  const progress = next ? Math.max(0, Math.min(100, ((rating - tier.min) / (next.min - tier.min)) * 100)) : 100;
  return {
    key: tier.key,
    gradient: tier.gradient,
    next: next ? { key: next.key, min: next.min } : null,
    progress,
    pointsToNext: next ? Math.max(0, next.min - rating) : 0,
  };
}

/** Shield-shaped rank badge. */
export function TierBadge({ rating, size = 72 }: { rating: number; size?: number }) {
  const t = useTranslations('arena.tiers');
  const tier = tierFor(rating);
  const stars = TIERS.findIndex((x) => x.key === tier.key) + 1;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size * 1.12 }} title={t(tier.key)}>
      <div
        className="absolute inset-0"
        style={{
          background: tier.gradient,
          clipPath: 'polygon(50% 0, 100% 14%, 100% 58%, 50% 100%, 0 58%, 0 14%)',
          filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.45))',
        }}
      />
      <div
        className="absolute"
        style={{
          inset: size * 0.07,
          background: 'rgba(255,255,255,.14)',
          clipPath: 'polygon(50% 0, 100% 14%, 100% 58%, 50% 100%, 0 58%, 0 14%)',
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-[12%] text-white">
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7z" />
        </svg>
        <span className="mt-0.5 font-black leading-none tracking-tighter" style={{ fontSize: size * 0.14 }}>
          {'★'.repeat(stars)}
        </span>
      </div>
    </div>
  );
}
