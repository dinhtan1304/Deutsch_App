'use client';

import { useState, type ReactNode, type Ref } from 'react';
import { SHADOW, STATUS } from '@/lib/tokens';
import { FIT_VIEWPORT_HEIGHT, fitToViewport } from '@/lib/fitToViewport';
import { IconChevron, PracticeGuide, useGuideDismissed } from './PracticeKit';

function IconButton({ label, onClick, active, accent, children }: {
  label: string;
  onClick: () => void;
  active?: boolean;
  accent: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={active}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
      style={active
        ? { borderColor: accent, color: accent, background: `${accent}14` }
        : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
      {children}
    </button>
  );
}

function ProgressBar({ pct, done, accent, className }: { pct: number; done?: boolean; accent: string; className: string }) {
  return (
    <div className={`overflow-hidden rounded-full ${className}`} style={{ background: 'var(--theme-bg-secondary)' }}>
      <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: done ? STATUS.success : accent }} />
    </div>
  );
}

type MobilePanel = 'none' | 'settings' | 'list';

interface PracticeShellProps {
  accent: string;
  backLabel: string;
  onBack: () => void;
  title: string;
  /** 0–100 */
  progressPct: number;
  progressText: string;
  progressDone?: boolean;
  /** Small status next to the progress (e.g. autosave). */
  status?: ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
  submitBusy?: boolean;
  /** Banner under the top bar (submit warnings). */
  notice?: ReactNode;
  guide: { title: string; steps: string[]; footnote?: string; dismissLabel: string; openLabel: string; storageKey: string };
  settingsLabel: string;
  listLabel: string;
  listCount: string;
  video: ReactNode;
  /** Replaces the whole body (video unavailable). */
  fallback?: ReactNode;
  settings: ReactNode;
  /** Sentence list rows; `listRef` is their scroll container. */
  list: ReactNode;
  listRef: Ref<HTMLDivElement>;
  cardHeader: ReactNode;
  cardBody: ReactNode;
  cardFooter?: ReactNode;
}

/**
 * Dictation / shadowing practice in exactly one screen: a top bar (back,
 * title, progress, submit), then video + options + sentence list on the left
 * and the practice card on the right. Only the list and the card scroll, each
 * on its own — never the page. Phones stack a small video over the card and
 * open options / the list as sheets from the top bar.
 */
export function PracticeShell({
  guide, onBack, backLabel, accent, title, progressPct, progressDone, progressText, status, settingsLabel, listLabel, onSubmit, submitDisabled, submitBusy, submitLabel, notice, fallback, video, settings, listCount, listRef, list, cardHeader, cardBody, cardFooter,
}: PracticeShellProps) {
  const [guideDismissed, dismissGuide] = useGuideDismissed(guide.storageKey);
  const [guideOpen, setGuideOpen] = useState(false);
  const [panel, setPanel] = useState<MobilePanel>('none');
  const showGuide = guideOpen || !guideDismissed;
  const togglePanel = (next: MobilePanel) => setPanel((cur) => (cur === next ? 'none' : next));
  const surface = { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' };

  // Phones: an open panel is a sheet over the body. Desktop: always in the left column.
  const sheet = (which: MobilePanel) => (panel === which ? 'absolute inset-x-0 bottom-0 top-12 z-40 flex' : 'hidden');

  return (
    <div ref={fitToViewport}
      className={`relative mx-auto flex max-w-360 flex-col gap-3 min-h-115 ${FIT_VIEWPORT_HEIGHT}`}>
      {/* Top bar */}
      <div className="flex h-10 shrink-0 items-center gap-2">
        <button type="button" onClick={onBack} aria-label={backLabel}
          className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-1.5 text-caption font-semibold transition-opacity hover:opacity-70"
          style={{ color: accent }}>
          <IconChevron dir="left" size={16} />
          <span className="hidden sm:inline">{backLabel}</span>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-body font-bold sm:text-lead" style={{ color: 'var(--theme-text-primary)' }} title={title}>
          {title}
        </h1>
        <div className="hidden items-center gap-2 md:flex">
          <ProgressBar pct={progressPct} done={progressDone} accent={accent} className="h-1.5 w-28 lg:w-40" />
          <span className="mono text-caption font-bold" style={{ color: 'var(--theme-text-secondary)' }}>{progressText}</span>
        </div>
        {status && <div className="hidden sm:flex">{status}</div>}
        <div className="flex items-center gap-1.5 lg:hidden">
          <IconButton label={settingsLabel} onClick={() => togglePanel('settings')} active={panel === 'settings'} accent={accent}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
          </IconButton>
          <IconButton label={listLabel} onClick={() => togglePanel('list')} active={panel === 'list'} accent={accent}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
          </IconButton>
        </div>
        <IconButton label={guide.openLabel} onClick={() => setGuideOpen((o) => !o)} active={showGuide} accent={accent}>
          <span className="text-caption font-bold">?</span>
        </IconButton>
        <button type="button" onClick={onSubmit} disabled={submitDisabled || submitBusy}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-caption font-bold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: accent }}>
          {submitBusy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          {submitLabel}
        </button>
      </div>

      {/* Progress line on phones (no room in the top bar) */}
      <ProgressBar pct={progressPct} done={progressDone} accent={accent} className="-mt-2 h-1 shrink-0 md:hidden" />

      {notice}

      {showGuide && (
        <div className="absolute inset-x-0 top-12 z-50 rounded-2xl" style={{ background: 'var(--theme-bg-card)', boxShadow: SHADOW.lifted }}>
          <PracticeGuide
            title={guide.title}
            steps={guide.steps}
            footnote={guide.footnote}
            dismissLabel={guide.dismissLabel}
            onDismiss={() => { dismissGuide(); setGuideOpen(false); }}
            accent={accent}
            className=""
          />
        </div>
      )}

      {fallback ? (
        <div className="min-h-0 flex-1 overflow-y-auto">{fallback}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-6">
          <aside className="flex shrink-0 flex-col gap-3 lg:min-h-0 lg:w-100">
            {/* Phones: cap the video at ~22% of the screen height */}
            <div className="mx-auto w-full max-w-[calc(22dvh*16/9)] overflow-hidden rounded-2xl border lg:max-w-none" style={{ borderColor: 'var(--theme-border)' }}>
              {video}
            </div>

            <div className={`${sheet('settings')} flex-col overflow-y-auto rounded-2xl border lg:static lg:z-auto lg:flex lg:shrink-0`}
              style={{ ...surface, boxShadow: panel === 'settings' ? SHADOW.lifted : undefined }}>
              {settings}
            </div>

            <div className={`${sheet('list')} min-h-0 flex-col overflow-hidden rounded-2xl border lg:static lg:z-auto lg:flex lg:flex-1`}
              style={{ ...surface, boxShadow: panel === 'list' ? SHADOW.lifted : undefined }}>
              <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5" style={{ borderColor: 'var(--theme-border)' }}>
                <span className="text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{listLabel}</span>
                <span className="mono text-caption font-bold" style={{ color: 'var(--theme-text-secondary)' }}>{listCount}</span>
              </div>
              {/* Picking a sentence on a phone closes the sheet */}
              <div ref={listRef} onClick={() => setPanel('none')}
                className="relative min-h-0 flex-1 divide-y overflow-y-auto" style={{ borderColor: 'var(--theme-border)' }}>
                {list}
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border" style={surface}>
            <div className="shrink-0">{cardHeader}</div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex min-h-full flex-col justify-center px-4 py-4 sm:px-8">
                {cardBody}
              </div>
            </div>
            {cardFooter && (
              // pr-16 keeps the footer actions clear of the global feedback FAB
              <div className="shrink-0 border-t py-2 pl-4 pr-16" style={{ borderColor: 'var(--theme-border)' }}>{cardFooter}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
