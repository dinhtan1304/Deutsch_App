'use client';

import type { ReactNode } from 'react';

export type RecordState = 'idle' | 'recording' | 'done' | 'scoring';

function IconMic({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

interface RecordPanelProps {
  state: RecordState;
  /** seconds elapsed while recording */
  elapsed?: number;
  maxSecs?: number;
  /** object URL of the just-recorded clip (shown when state === 'done') */
  audioUrl?: string | null;
  /** status eyebrow labels keyed by state */
  labels: { idle: string; recording: string; done: string; scoring?: string };
  /** extra content rendered below (e.g. suggestions list) */
  children?: ReactNode;
}

/**
 * Calm v2 recording panel: status eyebrow + mic circle with ripple glow while
 * recording, live timer, and playback of the recorded clip. Presentational only —
 * all MediaRecorder logic stays in the page. Drives its accent from --accent.
 */
export function RecordPanel({ state, elapsed = 0, maxSecs, audioUrl, labels, children }: RecordPanelProps) {
  const recording = state === 'recording';
  const statusLabel = recording ? labels.recording
    : state === 'done' ? labels.done
    : state === 'scoring' ? (labels.scoring ?? labels.recording)
    : labels.idle;

  return (
    <div
      className="rounded-[14px] border p-8 text-center relative overflow-hidden transition-shadow"
      style={{
        borderColor: recording ? 'var(--accent)' : 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: recording ? '0 12px 40px color-mix(in srgb, var(--accent) 14%, transparent)' : 'none',
      }}
    >
      <p className="text-caption font-semibold uppercase tracking-widest mb-8" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.12em' }}>
        {statusLabel}
      </p>

      {/* Mic circle + ripple glow */}
      <div className="relative flex justify-center mb-8" style={{ height: 96 }}>
        {recording && (
          <>
            <span className="absolute top-0 h-24 w-24 rounded-full animate-ping" style={{ background: 'color-mix(in srgb, var(--accent) 26%, transparent)' }} />
            <span className="absolute top-0 h-24 w-24 rounded-full animate-pulse" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', transform: 'scale(1.25)' }} />
          </>
        )}
        <div
          className="relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500"
          style={{
            background: recording ? 'var(--accent)' : 'var(--theme-bg-secondary)',
            color: recording ? 'var(--accent-on)' : 'var(--theme-text-muted)',
            boxShadow: recording ? '0 0 44px color-mix(in srgb, var(--accent) 45%, transparent)' : 'none',
          }}
        >
          <IconMic />
        </div>
      </div>

      {recording && (
        <div className="mono font-bold mb-6" style={{ fontSize: 28, color: 'var(--accent)' }}>
          {elapsed}s{maxSecs ? <span className="text-base opacity-40"> / {maxSecs}s</span> : null}
        </div>
      )}

      {state === 'done' && audioUrl && (
        <div className="px-2 mb-2">
          <audio src={audioUrl} controls className="w-full h-10" />
        </div>
      )}

      {children && (
        <div className="text-left pt-6 mt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
