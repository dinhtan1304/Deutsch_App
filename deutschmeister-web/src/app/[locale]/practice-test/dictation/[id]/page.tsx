'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDictationSession, useAutosaveDictation, useSubmitDictation, useCheckDictation, useDictationHint } from '@/hooks/useDictation';
import { UMLAUT_TRIGGER_HINT } from '@/hooks/useUmlautTrigger';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { DictationSentence } from '@/components/dictation/DictationSentence';
import { VideoUnavailableFallback } from '@/components/dictation/VideoUnavailableFallback';
import { UmlautToolbar } from '@/components/dictation/UmlautToolbar';
import {
  IconChevron, IconHeadphones, OptionToggle, SentenceNav, SpeedPicker, StepAction,
} from '@/components/dictation/PracticeKit';
import { PracticeShell } from '@/components/dictation/PracticeShell';
import { BlankCheckStatus, SegmentWithParts } from '@/lib/api/dictation';
import { ACCENT, STATUS } from '@/lib/tokens';

const ACC = ACCENT.dictation;
const AUTOSAVE_DEBOUNCE_MS = 3000;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;
const GUIDE_DISMISS_KEY = 'dictation-guide-dismissed-v1';
const EMPTY_BLANK = '＿＿＿';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type Step = 'listen' | 'type' | 'check' | 'next';
type RowStatus = 'none' | 'empty' | 'partial' | 'filled' | 'correct';

// Subtle autosave status (D4) — reassures the learner their answers are kept.
function SaveIndicator({ state }: { state: SaveState }) {
  const t = useTranslations('practice.dictation.session');
  if (state === 'idle') return null;
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: STATUS.warning }}>
        {t('saveFailed')}
      </span>
    );
  }
  const saved = state === 'saved';
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: saved ? STATUS.success : 'var(--theme-text-muted)' }}>
      {saved ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
      )}
      {saved ? t('saveSaved') : t('saveSaving')}
    </span>
  );
}

function IconPencil({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconCheck({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const blankIdsOf = (seg: SegmentWithParts) =>
  seg.parts.flatMap(p => (p.type === 'blank' ? [p.blankId] : []));

// ─── Whole-transcript row ──────────────────────────────────────────────────
// Memoized on primitive props: typing only re-renders the row whose preview
// actually changed, not the whole list.
const SentenceListRow = memo(function SentenceListRow({ index, preview, status, filled, total, isCurrent, isPlaying, onSelect }: {
  index: number;
  preview: string;
  status: RowStatus;
  filled: number;
  total: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onSelect: (index: number) => void;
}) {
  const badgeColor = status === 'correct' ? STATUS.success : status === 'filled' ? ACC : 'var(--theme-text-muted)';
  return (
    <button type="button" onClick={() => onSelect(index)} data-dict-row={index}
      className="flex w-full items-start gap-3 border-l-4 px-3 py-2.5 text-left transition-colors hover:bg-(--theme-bg-secondary)"
      style={{ borderLeftColor: isCurrent ? ACC : 'transparent', background: isCurrent ? `${ACC}12` : undefined }}>
      <span className="mono mt-0.5 w-6 shrink-0 text-right text-caption font-bold" style={{ color: isCurrent || isPlaying ? ACC : 'var(--theme-text-muted)' }}>
        {index + 1}
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 text-body"
        style={{ color: isCurrent ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)', fontWeight: isCurrent ? 600 : 400 }}>
        {preview}
      </span>
      {status !== 'none' && (
        <span className="mono mt-0.5 shrink-0 text-caption font-bold" style={{ color: badgeColor }}>
          {status === 'correct' ? '✓' : `${filled}/${total}`}
        </span>
      )}
    </button>
  );
});

export default function DictationPlayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.dictation.session');
  const playerRef = useRef<YouTubeEmbedRef | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Answers typed since the last save; flushed on debounce, tab hide and unmount.
  const pendingAnswers = useRef<Record<string, string> | null>(null);
  const focusedBlankRef = useRef<HTMLInputElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Set by navigation so the effect below can focus the new sentence's first blank.
  const focusOnNav = useRef(false);

  const { data: session, isLoading } = useDictationSession(id);
  const { mutate: autosave } = useAutosaveDictation();
  const { mutate: submit, isPending: isSubmitting } = useSubmitDictation();
  const { mutate: checkAnswers, isPending: isChecking } = useCheckDictation();
  const { mutate: fetchHint } = useDictationHint();

  const [localAnswers, setLocalAnswers] = useState<Record<string, string> | null>(null);
  const userAnswers = useMemo(
    () => localAnswers ?? (session?.userAnswers as Record<string, string> | undefined) ?? {},
    [localAnswers, session?.userAnswers],
  );
  const [videoError, setVideoError] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [autoPause, setAutoPause] = useState(true);
  const [autoPlayOnNav, setAutoPlayOnNav] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [blankStatus, setBlankStatus] = useState<Record<string, BlankCheckStatus>>({});
  const [listened, setListened] = useState<Record<string, true>>({});

  // Redirect if already graded
  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/dictation/${id}/result`);
    }
  }, [session?.status, id, router]);

  // Auto-clear the "saved" badge shortly after it appears.
  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = setTimeout(() => setSaveState('idle'), 1500);
    return () => clearTimeout(timer);
  }, [saveState]);

  // Debounced autosave
  const flushAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = null;
    const answers = pendingAnswers.current;
    if (!answers) return;
    pendingAnswers.current = null;
    autosave({ id, userAnswers: answers }, {
      onSuccess: () => setSaveState('saved'),
      onError: () => setSaveState('error'),
    });
  }, [id, autosave]);

  const scheduleAutosave = useCallback((answers: Record<string, string>) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    pendingAnswers.current = answers;
    setSaveState('saving');
    autosaveTimer.current = setTimeout(flushAutosave, AUTOSAVE_DEBOUNCE_MS);
  }, [flushAutosave]);

  // Don't drop the last few seconds of typing when the learner leaves the
  // page, switches tabs or backgrounds the app before the debounce fires.
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'hidden') flushAutosave(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flushAutosave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flushAutosave);
      flushAutosave();
    };
  }, [flushAutosave]);

  // ─── Derived per-sentence data ───────────────────────────────────────────
  const segments = useMemo(() => session?.segments ?? [], [session?.segments]);
  const segBlankIds = useMemo(() => segments.map(blankIdsOf), [segments]);

  // Resume at the first sentence that still has an empty blank.
  const resumeIndex = useMemo(() => {
    const saved = (session?.userAnswers as Record<string, string> | undefined) ?? {};
    const i = segBlankIds.findIndex(ids => ids.some(b => !saved[b]?.trim()));
    return i < 0 ? 0 : i;
  }, [segBlankIds, session?.userAnswers]);

  const currentIndex = Math.min(selectedIndex ?? resumeIndex, Math.max(0, segments.length - 1));
  const current = segments[currentIndex] ?? null;
  const currentBlanks = segBlankIds[currentIndex] ?? [];
  const filledCount = currentBlanks.filter(b => userAnswers[b]?.trim()).length;
  const correctCount = currentBlanks.filter(b => blankStatus[b] === 'correct').length;
  const nearCount = currentBlanks.filter(b => blankStatus[b] === 'near').length;
  const checkedAny = currentBlanks.some(b => blankStatus[b]);
  const allCorrect = currentBlanks.length > 0 && correctCount === currentBlanks.length;

  const nextStep: Step = !current || currentBlanks.length === 0 || allCorrect
    ? 'next'
    : !listened[current.id] && filledCount === 0 ? 'listen'
    : filledCount < currentBlanks.length ? 'type'
    : 'check';

  const rows = useMemo(() => segments.map((seg, i) => {
    const ids = segBlankIds[i]!;
    const filled = ids.filter(b => userAnswers[b]?.trim()).length;
    const correct = ids.length > 0 && ids.every(b => blankStatus[b] === 'correct');
    const preview = seg.parts
      .map(p => (p.type === 'text' ? p.text : userAnswers[p.blankId]?.trim() || EMPTY_BLANK))
      .join(' ')
      .replace(/\s+([.,!?;:])/g, '$1');
    const status: RowStatus = ids.length === 0 ? 'none'
      : correct ? 'correct'
      : filled === 0 ? 'empty'
      : filled < ids.length ? 'partial'
      : 'filled';
    return { id: seg.id, preview, status, filled, total: ids.length };
  }), [segments, segBlankIds, userAnswers, blankStatus]);

  // ─── Navigation + playback ───────────────────────────────────────────────
  function markListened(segId: string) {
    setListened(prev => (prev[segId] ? prev : { ...prev, [segId]: true }));
  }

  function playSeg(seg: SegmentWithParts) {
    markListened(seg.id);
    playerRef.current?.playSegment(seg.start / 1000, seg.end / 1000);
  }

  function goTo(index: number) {
    const seg = segments[index];
    if (!seg) return;
    setSelectedIndex(index);
    setShowSubmitWarning(false);
    focusOnNav.current = true;
    if (autoPlayOnNav) playSeg(seg);
  }

  // Stable handle for the memoized list rows.
  const goToRef = useRef(goTo);
  useEffect(() => { goToRef.current = goTo; });
  const selectRow = useCallback((index: number) => goToRef.current(index), []);

  function focusFirstOpenBlank() {
    const inputs = Array.from(cardRef.current?.querySelectorAll<HTMLInputElement>('input[data-dictation-blank]') ?? []);
    const target = inputs.find(el => !el.readOnly && !el.value.trim()) ?? inputs.find(el => !el.readOnly);
    target?.focus();
  }

  // After navigating: focus the first open blank and keep the list row in view
  // (scrolling the list container only, never the page).
  useEffect(() => {
    if (focusOnNav.current) {
      focusOnNav.current = false;
      focusFirstOpenBlank();
    }
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-dict-row="${currentIndex}"]`);
    if (list && row) list.scrollTop = row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2;
  }, [currentIndex]);

  function handleTimeUpdate(currentSec: number) {
    const ms = currentSec * 1000;
    const active = segments.find(s => ms >= s.start && ms <= s.end);
    if (active) setPlayingSegmentId(active.id);
  }

  function handleAutoPaused(segId: string) {
    // The sentence that just finished is the one to type.
    const index = segments.findIndex(s => s.id === segId);
    if (index < 0) return;
    markListened(segId);
    if (index !== currentIndex) {
      setSelectedIndex(index);
      focusOnNav.current = true;
    }
  }

  function handleReplay() {
    if (current) playSeg(current);
  }

  function handleSpeedChange(rate: number) {
    setSpeed(rate);
    playerRef.current?.setSpeed(rate);
  }

  // ─── Answers ─────────────────────────────────────────────────────────────
  function handleChange(blankId: string, value: string) {
    // Editing a checked blank resets its check status
    setBlankStatus(prev => {
      if (!(blankId in prev)) return prev;
      const next = { ...prev };
      delete next[blankId];
      return next;
    });
    setLocalAnswers(prev => {
      const base = prev ?? (session?.userAnswers as Record<string, string> | undefined) ?? {};
      const next = { ...base, [blankId]: value };
      scheduleAutosave(next);
      return next;
    });
  }

  function handleCheck() {
    if (!current) return;
    const answers: Record<string, string> = {};
    for (const b of currentBlanks) {
      const v = userAnswers[b];
      if (v?.trim()) answers[b] = v;
    }
    if (!Object.keys(answers).length) {
      focusFirstOpenBlank();
      return;
    }
    checkAnswers({ id, answers }, {
      onSuccess: (data) => {
        setBlankStatus(prev => {
          const next = { ...prev };
          for (const r of data.results) next[r.blankId] = r.status;
          return next;
        });
        // Put the caret on the first blank that still needs work.
        requestAnimationFrame(focusFirstOpenBlank);
      },
    });
  }

  // Enter in the last blank / Ctrl+Enter: check, or move on once all correct.
  function handleCheckOrNext() {
    if (allCorrect || currentBlanks.length === 0) goTo(currentIndex + 1);
    else handleCheck();
  }

  function handleHint(blankId: string) {
    fetchHint({ id, blankId }, {
      onSuccess: (data) => {
        if (!(userAnswers[blankId] ?? '').trim()) {
          handleChange(blankId, data.firstLetter);
          // Put the caret after the revealed letter
          requestAnimationFrame(() => {
            const el = document.querySelector<HTMLInputElement>(`input[data-blank-id="${blankId}"]`);
            if (el) { el.focus(); el.setSelectionRange(1, 1); }
          });
        }
      },
    });
  }

  function handleUmlautInsert(ch: string) {
    const el = focusedBlankRef.current;
    const blankId = el?.dataset.blankId;
    if (!el || !blankId || el.readOnly || !el.isConnected) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = el.value.slice(0, start) + ch + el.value.slice(end);
    handleChange(blankId, next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  }

  function handleSubmit() {
    if (!session) return;
    const answeredCount = Object.values(userAnswers).filter(v => v?.trim()).length;
    const unanswered = (session.totalBlanks ?? 0) - answeredCount;
    if (unanswered > 0 && !showSubmitWarning) {
      setShowSubmitWarning(true);
      return;
    }
    // Submit carries the answers itself; a later draft save would hit a graded session.
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    pendingAnswers.current = null;
    submit({ id, userAnswers }, {
      onSuccess: () => router.push(`/practice-test/dictation/${id}/result`),
    });
  }

  // Hotkeys (Ctrl/⌘ so they work while typing) — listener bound once;
  // handlers read via ref so the effect never needs re-binding.
  const hotkeysRef = useRef({ replay: () => {}, check: () => {}, next: () => {}, prev: () => {} });
  useEffect(() => {
    hotkeysRef.current = {
      replay: handleReplay,
      check: handleCheckOrNext,
      next: () => goTo(currentIndex + 1),
      prev: () => goTo(currentIndex - 1),
    };
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const action = e.code === 'Space' ? 'replay'
        : e.key === 'Enter' ? 'check'
        : e.key === 'ArrowRight' ? 'next'
        : e.key === 'ArrowLeft' ? 'prev'
        : null;
      if (!action) return;
      e.preventDefault();
      hotkeysRef.current[action]();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--theme-border)', borderTopColor: ACC }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>{t('notFound')}</p>
      </div>
    );
  }

  const answeredCount = Object.values(userAnswers).filter(v => v?.trim()).length;
  const unansweredCount = session.totalBlanks - answeredCount;
  const answeredPct = session.totalBlanks > 0 ? (answeredCount / session.totalBlanks) * 100 : 0;

  const settings = (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('settingsTitle')}</span>
        <span className="mono rounded-sm px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${ACC}18`, color: ACC }}>
          {session.difficulty}
        </span>
      </div>
      <div className="mb-3">
        <SpeedPicker label={t('speedLabel')} options={SPEED_OPTIONS} value={speed} onChange={handleSpeedChange} accent={ACC} />
      </div>
      <div className="flex flex-wrap gap-2">
        <OptionToggle on={autoPause} onClick={() => setAutoPause(a => !a)} label={t('autoPause')} accent={ACC} />
        <OptionToggle on={autoPlayOnNav} onClick={() => setAutoPlayOnNav(a => !a)} label={t('autoPlayOnNav')} accent={ACC} />
      </div>
      <p className="mt-3 hidden text-[11px] leading-relaxed lg:block" style={{ color: 'var(--theme-text-muted)' }}>
        {t('hotkeysLegend')}
      </p>
    </div>
  );

  return (
    <PracticeShell
      accent={ACC}
      backLabel={t('back')}
      onBack={() => router.push('/practice-test/dictation')}
      title={session.video.title}
      progressPct={answeredPct}
      progressText={`${answeredCount}/${session.totalBlanks}`}
      status={<SaveIndicator state={saveState} />}
      submitLabel={t('submit')}
      onSubmit={handleSubmit}
      submitBusy={isSubmitting}
      notice={showSubmitWarning ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-2xl border px-4 py-2.5"
          style={{ borderColor: `color-mix(in srgb, ${STATUS.warning} 30%, transparent)`, background: 'var(--theme-bg-card)' }}>
          <div className="min-w-0 flex-1">
            <p className="text-body font-bold" style={{ color: STATUS.warning }}>{t('warnUnansweredTitle', { count: unansweredCount })}</p>
            <p className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{t('warnUnansweredSubtitle')}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setShowSubmitWarning(false)}
              className="rounded-md border px-3 py-1.5 text-caption font-semibold transition-colors hover:bg-(--theme-bg-secondary)"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{t('continueWriting')}</button>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting}
              className="rounded-md px-4 py-1.5 text-caption font-semibold text-white disabled:opacity-60"
              style={{ background: STATUS.warning }}>{t('submitNow')}</button>
          </div>
        </div>
      ) : undefined}
      guide={{
        title: t('guideTitle'),
        steps: [t('guideListen'), t('guideType'), t('guideCheck')],
        footnote: t('umlautTip', { hint: UMLAUT_TRIGGER_HINT }),
        dismissLabel: t('dismiss'),
        openLabel: t('guideTitle'),
        storageKey: GUIDE_DISMISS_KEY,
      }}
      settingsLabel={t('settingsTitle')}
      listLabel={t('sentenceList')}
      listCount={`${answeredCount}/${session.totalBlanks}`}
      fallback={videoError ? <VideoUnavailableFallback sessionId={id} /> : undefined}
      video={
        <YouTubeEmbed
          ref={playerRef}
          youtubeId={session.video.youtubeId}
          onError={() => setVideoError(true)}
          onTimeUpdate={handleTimeUpdate}
          autoPauseSegments={autoPause ? session.segments : undefined}
          onAutoPaused={handleAutoPaused}
        />
      }
      settings={settings}
      listRef={listRef}
      list={rows.map((row, i) => (
        <SentenceListRow key={row.id} index={i} preview={row.preview} status={row.status}
          filled={row.filled} total={row.total}
          isCurrent={i === currentIndex}
          isPlaying={row.id === playingSegmentId}
          onSelect={selectRow} />
      ))}
      cardHeader={
        <SentenceNav
          label={t('sentenceOf', { current: currentIndex + 1, total: segments.length })}
          index={currentIndex}
          total={segments.length}
          onGo={goTo}
          prevLabel={t('prevSegment')}
          nextLabel={t('nextSegment')}
        >
          {currentBlanks.length > 0 && (
            <span className="mono text-caption font-bold" style={{ color: allCorrect ? STATUS.success : 'var(--theme-text-muted)' }}>
              {t('blanksFilled', { filled: filledCount, total: currentBlanks.length })}
            </span>
          )}
        </SentenceNav>
      }
      cardFooter={currentIndex < segments.length - 1 ? (
        // Kept in the footer so it stays visible on short screens.
        <div className="flex justify-end">
          <button type="button" onClick={() => goTo(currentIndex + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-caption font-bold transition-transform active:scale-95"
            style={nextStep === 'next'
              ? { background: ACC, color: 'white' }
              : { border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            {t('nextSegment')}
            <IconChevron dir="right" size={14} />
          </button>
        </div>
      ) : undefined}
      cardBody={
        <div ref={cardRef}>
          {current && (
            <DictationSentence
              parts={current.parts}
              userAnswers={userAnswers}
              onChange={handleChange}
              blankStatus={blankStatus}
              onHint={handleHint}
              onBlankFocus={el => { focusedBlankRef.current = el; }}
              onLastEnter={handleCheckOrNext}
            />
          )}

          {currentBlanks.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{t('umlautLabel')}</span>
              <UmlautToolbar onInsert={handleUmlautInsert} />
            </div>
          )}

          {/* Listen → type → check */}
          <div className="mx-auto mt-4 grid max-w-md grid-cols-3 items-start gap-2">
            <StepAction index={1} label={t('stepListen')} hotkey="Ctrl+␣" accent={ACC}
              highlight={nextStep === 'listen'} disabled={!current}
              onClick={handleReplay} icon={<IconHeadphones size={22} />} />
            <StepAction index={2} label={t('stepType')} accent={ACC}
              highlight={nextStep === 'type'} disabled={currentBlanks.length === 0}
              onClick={focusFirstOpenBlank} icon={<IconPencil size={20} />} />
            <StepAction index={3} label={t('stepCheck')} hotkey="Ctrl+↵" accent={ACC}
              highlight={nextStep === 'check'} disabled={filledCount === 0 || isChecking || allCorrect}
              onClick={handleCheck} icon={<IconCheck size={20} />} />
          </div>

          {/* Feedback */}
          <div className="mx-auto mt-4 max-w-xl text-center">
            {currentBlanks.length === 0 ? (
              <p className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{t('noBlanks')}</p>
            ) : allCorrect ? (
              <p className="rounded-xl px-4 py-2.5 text-body font-bold" style={{ background: `${STATUS.success}14`, color: STATUS.success }}>
                {t('allCorrect')}
              </p>
            ) : checkedAny ? (
              <div className="rounded-xl px-4 py-2.5" style={{ background: 'var(--theme-bg-secondary)' }}>
                <p className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {t('checkSummary', { correct: correctCount, total: currentBlanks.length })}
                </p>
                <p className="mt-0.5 text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
                  {nearCount > 0 ? t('nearCount', { count: nearCount }) : t('fixAndRecheck')}
                </p>
              </div>
            ) : (
              <p className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
                {t(nextStep === 'listen' ? 'hintListen' : nextStep === 'type' ? 'hintType' : 'hintCheck')}
              </p>
            )}
          </div>
        </div>
      }
    />
  );
}
