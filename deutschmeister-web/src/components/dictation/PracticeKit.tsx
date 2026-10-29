'use client';

import { useCallback, useSyncExternalStore, type ReactNode } from 'react';

/**
 * Shared building blocks of the per-sentence practice pages (dictation and
 * shadowing): numbered step buttons, the how-it-works guide, option toggles
 * and the speed picker. Every piece takes the feature accent color.
 */

// ─── Dismissible guide state (localStorage) ────────────────────────────────
const guideListeners = new Set<() => void>();

function readDismissed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

/**
 * `[dismissed, dismiss]` for a guide box. Hidden during SSR so it never
 * flashes for learners who already closed it.
 */
export function useGuideDismissed(key: string): [boolean, () => void] {
  const subscribe = useCallback((cb: () => void) => {
    guideListeners.add(cb);
    return () => { guideListeners.delete(cb); };
  }, []);
  const dismissed = useSyncExternalStore(subscribe, () => readDismissed(key), () => true);
  const dismiss = useCallback(() => {
    try { window.localStorage.setItem(key, '1'); } catch {}
    guideListeners.forEach((cb) => cb());
  }, [key]);
  return [dismissed, dismiss];
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden lg:inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-sm border px-1 font-mono text-[10px] font-bold"
      style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', background: 'var(--theme-bg-secondary)' }}>
      {children}
    </kbd>
  );
}

export function StepLabel({ index, label, hotkey, highlight, accent }: {
  index: number;
  label: string;
  hotkey?: string;
  highlight: boolean;
  accent: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-caption font-bold"
      style={{ color: highlight ? accent : 'var(--theme-text-secondary)' }}>
      {index}. {label} {hotkey && <Kbd>{hotkey}</Kbd>}
    </span>
  );
}

/** Round step button; `highlight` marks the suggested next step. */
export function StepAction({ index, label, hotkey, highlight, disabled, onClick, icon, accent }: {
  index: number;
  label: string;
  hotkey?: string;
  highlight: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Same height as the shadowing record button so labels line up */}
      <div className="flex h-19 items-center">
        <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
          onPointerDown={e => e.preventDefault()}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
          style={highlight
            ? { borderColor: accent, color: accent, background: `${accent}14`, boxShadow: `0 0 0 4px ${accent}22` }
            : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', background: 'var(--theme-bg-card)' }}>
          {icon}
        </button>
      </div>
      <StepLabel index={index} label={label} hotkey={hotkey} highlight={highlight} accent={accent} />
    </div>
  );
}

export function PracticeGuide({ title, steps, footnote, dismissLabel, onDismiss, accent }: {
  title: string;
  steps: string[];
  footnote?: string;
  dismissLabel: string;
  onDismiss: () => void;
  accent: string;
}) {
  return (
    <div className="relative mb-5 rounded-2xl border p-4 pr-11"
      style={{ background: `${accent}0D`, borderColor: `${accent}33` }}>
      <p className="mb-3 text-caption font-bold uppercase tracking-wider" style={{ color: accent }}>{title}</p>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((text, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-bold text-white" style={{ background: accent }}>{i + 1}</span>
            <span className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{text}</span>
          </li>
        ))}
      </ol>
      {footnote && <p className="mt-3 text-[11px] italic" style={{ color: 'var(--theme-text-muted)' }}>{footnote}</p>}
      <button type="button" onClick={onDismiss} aria-label={dismissLabel}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: 'var(--theme-text-muted)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function OptionToggle({ on, onClick, label, title, icon, accent }: {
  on: boolean;
  onClick: () => void;
  label: string;
  title?: string;
  icon?: ReactNode;
  accent: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} title={title}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-caption font-semibold transition-colors"
      style={on
        ? { background: `${accent}18`, color: accent, borderColor: `${accent}66` }
        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}>
      {icon}
      {label}
    </button>
  );
}

export function SpeedPicker({ label, options, value, onChange, accent }: {
  label: string;
  options: readonly number[];
  value: number;
  onChange: (rate: number) => void;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{label}</span>
      <div className="flex flex-wrap gap-1 rounded-lg p-0.5" style={{ background: 'var(--theme-bg-secondary)' }}>
        {options.map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)} aria-pressed={value === s}
            className="mono rounded-md px-2 py-1 text-[11px] font-bold transition-colors"
            style={value === s ? { background: accent, color: 'white' } : { color: 'var(--theme-text-secondary)' }}>
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

export function IconChevron({ dir, size = 16 }: { dir: 'left' | 'right'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

export function IconHeadphones({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

/** Prev / "n of N" / next header of a practice card. */
export function SentenceNav({ label, index, total, onGo, prevLabel, nextLabel, children }: {
  label: string;
  index: number;
  total: number;
  onGo: (index: number) => void;
  prevLabel: string;
  nextLabel: string;
  children?: ReactNode;
}) {
  const btn = 'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-35';
  const btnStyle = { borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' };
  return (
    <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--theme-border)' }}>
      <button type="button" onClick={() => onGo(index - 1)} disabled={index === 0} aria-label={prevLabel} className={btn} style={btnStyle}>
        <IconChevron dir="left" />
      </button>
      <span className="mono text-caption font-bold" style={{ color: 'var(--theme-text-secondary)' }}>{label}</span>
      <button type="button" onClick={() => onGo(index + 1)} disabled={index >= total - 1} aria-label={nextLabel} className={btn} style={btnStyle}>
        <IconChevron dir="right" />
      </button>
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
