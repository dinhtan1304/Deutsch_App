'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { ACCENT, GRADIENT, MOTION, type AccentKey } from '@/lib/tokens';

interface ScoreRingProps {
  /** 0..100 */
  value: number;
  /** center main text (defaults to rounded value) */
  label?: string;
  /** smaller text below main label */
  sublabel?: string;
  /** 'free' = solid accent stroke; 'exam' = gradient stroke */
  variant?: 'free' | 'exam';
  accent?: AccentKey;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreRing({
  value,
  label,
  sublabel,
  variant = 'free',
  accent = 'reading',
  size = 140,
  strokeWidth = 10,
  className,
}: ScoreRingProps) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradientId = `score-ring-grad-${accent}`;
  const useGradient = variant === 'exam';
  const stroke = useGradient ? `url(#${gradientId})` : ACCENT[accent];

  const gradStr = GRADIENT[accent in GRADIENT ? (accent as keyof typeof GRADIENT) : 'reading'];
  const hexMatches = gradStr.match(/#[0-9A-Fa-f]{6}/g) || [ACCENT[accent], ACCENT[accent]];
  const [fromColor, toColor] = [hexMatches[0], hexMatches[1] ?? hexMatches[0]];

  const reduce = useReducedMotion();
  const progress = useMotionValue(reduce ? safe / 100 : 0);
  const [animatedNumber, setAnimatedNumber] = useState<number>(0);
  const dashOffset = useTransform(progress, (p) => circumference - p * circumference);

  useEffect(() => {
    if (reduce) {
      progress.set(safe / 100);
      return;
    }
    const c1 = animate(progress, safe / 100, {
      duration: MOTION.duration.celebrate,
      ease: MOTION.ease.standard,
    });
    const c2 = animate(0, safe, {
      duration: MOTION.duration.celebrate,
      ease: MOTION.ease.standard,
      onUpdate: (v) => setAnimatedNumber(Math.round(v)),
    });
    return () => {
      c1.stop();
      c2.stop();
    };
  }, [safe, reduce, progress]);

  const displayNumber = reduce ? Math.round(safe) : animatedNumber;

  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ display: 'block' }} aria-hidden="true">
        {useGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={fromColor} />
              <stop offset="100%" stopColor={toColor} />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--theme-border)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-extrabold tabular-nums leading-none"
          style={{
            color: 'var(--theme-text-primary)',
            fontSize: Math.round(size * 0.26),
          }}
        >
          {label ?? displayNumber}
        </div>
        {sublabel && (
          <div className="text-caption font-semibold mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
