'use client';

import { useEffect, useState } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';

const COLORS = [STATUS.success, ACCENT.xp, ACCENT.vocab, ACCENT.srs, STATUS.danger];

interface ConfettiBurstProps {
  count?: number;
  durationMs?: number;
  onDone?: () => void;
}

export function ConfettiBurst({ count = 28, durationMs = 2000, onDone }: ConfettiBurstProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setActive(false);
      onDone?.();
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDone]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9500 }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const left = ((i * 9) + 7) % 100;
        const delay = (i % 8) * 70;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${left}%`,
              width: 8,
              height: 8,
              borderRadius: 2,
              background: COLORS[i % COLORS.length],
              animation: `arenaConfettiFall ${durationMs}ms ease-in forwards`,
              animationDelay: `${delay}ms`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}
