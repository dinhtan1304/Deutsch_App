'use client';

import { useEffect, useRef, useState } from 'react';

interface RoundTimerRingProps {
  roundStartedAt: number;     // server epoch ms
  durationMs: number;
  serverClockSkewMs: number;  // client - server
  size?: number;
}

const STROKE = 7;

/**
 * Server-synced circular countdown. The ring sweeps via rAF + direct DOM
 * writes (no React re-render per frame); only the seconds label re-renders,
 * once per second. Cyan → amber (<10s) → red (<5s, heartbeat).
 */
export function RoundTimerRing({ roundStartedAt, durationMs, serverClockSkewMs, size = 84 }: RoundTimerRingProps) {
  const arcRef = useRef<SVGCircleElement | null>(null);
  const [shownSec, setShownSec] = useState(Math.ceil(durationMs / 1000));
  const r = (size - STROKE) / 2;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    let raf = 0;
    let lastSec = -1;
    const tick = () => {
      const now = Date.now() - serverClockSkewMs;
      const remaining = Math.max(0, durationMs - (now - roundStartedAt));
      const arc = arcRef.current;
      if (arc) {
        arc.style.strokeDashoffset = String(c * (1 - remaining / durationMs));
        arc.style.stroke = remaining < 5_000 ? 'var(--ag-lose)' : remaining < 10_000 ? 'var(--ag-gold)' : 'var(--ag-me)';
      }
      const sec = Math.ceil(remaining / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        setShownSec(sec);
      }
      if (remaining > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [roundStartedAt, durationMs, serverClockSkewMs, c]);

  const critical = shownSec <= 5;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="timer" aria-label={`${shownSec}s`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(8,10,30,.55)" stroke="rgba(255,255,255,.1)" strokeWidth={STROKE} />
        <circle ref={arcRef} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={STROKE}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={0}
          style={{ stroke: 'var(--ag-me)', filter: 'drop-shadow(0 0 6px currentColor)', transition: 'stroke .3s' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="mono font-black tabular-nums"
          style={{
            fontSize: size * 0.34,
            color: critical ? 'var(--ag-lose)' : 'var(--ag-text)',
            animation: critical ? 'arenaHeartbeat 0.55s ease-in-out infinite' : 'none',
          }}>
          {shownSec}
        </span>
      </div>
    </div>
  );
}
