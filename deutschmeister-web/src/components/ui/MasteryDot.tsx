'use client';

/**
 * MasteryDot — learning-state indicator (v2 redesign).
 *   learned → green · learning → amber · new → muted gray
 * Colors come from CSS vars --m-learned/--m-learning/--m-new (globals.css).
 */
export type Mastery = 'learned' | 'learning' | 'new';

const MASTERY_VAR: Record<Mastery, string> = {
  learned: 'var(--m-learned)',
  learning: 'var(--m-learning)',
  new: 'var(--m-new)',
};

interface MasteryDotProps {
  state: Mastery;
  size?: number;
  className?: string;
  title?: string;
}

export function MasteryDot({ state, size = 8, className = '', title }: MasteryDotProps) {
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size, background: MASTERY_VAR[state] }}
      title={title}
      aria-hidden
    />
  );
}
