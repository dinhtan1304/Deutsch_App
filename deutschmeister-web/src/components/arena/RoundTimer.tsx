'use client';

import { useEffect, useRef, useState } from 'react';
import { STATUS } from '@/lib/tokens';

interface RoundTimerProps {
  roundStartedAt: number;     // server epoch ms
  durationMs: number;
  serverClockSkewMs: number;  // client - server
}

/**
 * Server-synced countdown. The progress bar updates via rAF + direct DOM
 * (no React re-render). The numeric seconds label re-renders 1Hz.
 */
export function RoundTimer({ roundStartedAt, durationMs, serverClockSkewMs }: RoundTimerProps) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastUrgencyRef = useRef<'none' | 'warn' | 'crit'>('none');
  const [shownSec, setShownSec] = useState(Math.ceil(durationMs / 1000));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastSec = -1;
    lastUrgencyRef.current = 'none';
    const tick = () => {
      const now = Date.now() - serverClockSkewMs;
      const remaining = Math.max(0, durationMs - (now - roundStartedAt));
      const pct = (remaining / durationMs) * 100;
      if (barRef.current) {
        barRef.current.style.width = `${pct}%`;
        if (remaining < 5_000) barRef.current.style.background = STATUS.danger;
        else if (remaining < 10_000) barRef.current.style.background = STATUS.warning;
        else barRef.current.style.background = STATUS.info;
      }
      // Container urgency glow — toggled only when crossing thresholds to
      // avoid restarting the animation every frame.
      if (containerRef.current) {
        const urgency: 'none' | 'warn' | 'crit' =
          remaining < 5_000 ? 'crit' : remaining < 10_000 ? 'warn' : 'none';
        if (urgency !== lastUrgencyRef.current) {
          lastUrgencyRef.current = urgency;
          containerRef.current.style.animation =
            urgency === 'none' ? 'none' : 'arenaTimerGlow 1.2s ease-in-out infinite';
        }
      }
      const newSec = Math.ceil(remaining / 1000);
      if (newSec !== lastSec) {
        lastSec = newSec;
        setShownSec(newSec);
      }
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (containerRef.current) containerRef.current.style.animation = 'none';
    };
  }, [roundStartedAt, durationMs, serverClockSkewMs]);

  const isCritical = shownSec <= 5;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
          Thời gian còn lại
        </span>
        <span
          className="text-lead font-mono font-bold tabular-nums"
          style={{
            color: isCritical ? STATUS.danger : 'var(--theme-text-primary)',
            display: 'inline-block',
            animation: isCritical ? 'arenaHeartbeat 0.55s ease-in-out infinite' : 'none',
          }}
        >
          {shownSec}s
        </span>
      </div>
      <div
        ref={containerRef}
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,.08)' }}
      >
        <div
          ref={barRef}
          className="h-full transition-colors duration-300"
          style={{ width: '100%', background: STATUS.info }}
        />
      </div>
    </div>
  );
}
