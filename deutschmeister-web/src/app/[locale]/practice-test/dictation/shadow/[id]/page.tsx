'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useShadowingSession,
  useGradeShadowingAttempt,
  useSubmitShadowing,
} from '@/hooks/useShadowing';
import { useSegmentTranslations } from '@/hooks/useSegmentTranslations';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { VideoUnavailableFallback } from '@/components/dictation/VideoUnavailableFallback';
import { RecordButton, type RecordButtonRef } from '@/components/shadowing/RecordButton';
import { PhraseScoreBadge } from '@/components/shadowing/PhraseScoreBadge';
import { AiReviewCounter } from '@/components/shadowing/AiReviewCounter';
import { ACCENT, STATUS } from '@/lib/tokens';
import type { GradeAttemptResponse, ShadowingAttempt, ShadowingSegment } from '@/lib/api/shadowing';

type WordScore = GradeAttemptResponse['wordScores'][number];
type Step = 'listen' | 'speak' | 'compare';

const ACC = ACCENT.reading;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25] as const;
const GUIDE_DISMISS_KEY = 'shadowing-guide-dismissed-v2';
const WEAK_WORD_SCORE = 70;

const WORD_RE = /^[a-zA-ZäöüÄÖÜß]+$/;
const TOKEN_RE = /[a-zA-ZäöüÄÖÜß]+|[^a-zA-ZäöüÄÖÜß]+/g;

function scoreColor(score: number) {
  if (score >= 80) return STATUS.success;
  if (score >= 60) return STATUS.warning;
  return STATUS.danger;
}

const normWord = (s: string) => s.toLowerCase().replace(/[^a-zäöüß]/g, '');

/**
 * Pair each word token of the sentence with Gemini's per-word score. The
 * model's word list follows the sentence order but may skip or merge words,
 * so match greedily within a small look-ahead window.
 */
function alignWordScores(tokens: string[], words: WordScore[]): Array<WordScore | undefined> {
  let cursor = 0;
  return tokens.map((tok) => {
    if (!WORD_RE.test(tok)) return undefined;
    const n = normWord(tok);
    for (let j = cursor; j < Math.min(words.length, cursor + 4); j++) {
      if (normWord(words[j]!.word) === n) {
        cursor = j + 1;
        return words[j];
      }
    }
    return undefined;
  });
}

// ─── Icons ─────────────────────────────────────────────────────────────────
function IconHeadphones({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function IconCompare({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
    </svg>
  );
}

function IconPlay({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function IconChevron({ dir, size = 16 }: { dir: 'left' | 'right'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

function IconClose({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconEye({ off, size = 14 }: { off?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden lg:inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-sm border px-1 font-mono text-[10px] font-bold"
      style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', background: 'var(--theme-bg-secondary)' }}>
      {children}
    </kbd>
  );
}

// ─── How-it-works guide (replaces the old tip banner) ──────────────────────
function PracticeGuide({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations('practice.dictation.shadow.session');
  const steps = [t('guideListen'), t('guideSpeak'), t('guideCompare')];
  return (
    <div className="relative mb-5 rounded-2xl border p-4 pr-11"
      style={{ background: `${ACC}0D`, borderColor: `${ACC}33` }}>
      <p className="mb-3 text-caption font-bold uppercase tracking-wider" style={{ color: ACC }}>{t('guideTitle')}</p>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((text, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-bold text-white" style={{ background: ACC }}>{i + 1}</span>
            <span className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] italic" style={{ color: 'var(--theme-text-muted)' }}>{t('headphoneTip')}</p>
      <button type="button" onClick={onDismiss} aria-label={t('dismiss')}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: 'var(--theme-text-muted)' }}>
        <IconClose />
      </button>
    </div>
  );
}

// ─── Sentence with per-word score underline ────────────────────────────────
// Every word is a `.wh-word` (click → dictionary popup). After grading, each
// word gets a colored underline by its score; words with an `issue` explain
// it on hover.
function ScoredSentence({ text, wordScores }: { text: string; wordScores?: WordScore[] }) {
  const tokens = useMemo(() => text.match(TOKEN_RE) ?? [text], [text]);
  const scores = useMemo(() => alignWordScores(tokens, wordScores ?? []), [tokens, wordScores]);
  return (
    <>
      {tokens.map((tok, i) => {
        if (!WORD_RE.test(tok) || tok.length < 2) return <span key={i}>{tok}</span>;
        const ws = scores[i];
        const color = ws ? scoreColor(ws.score) : undefined;
        return (
          <span key={i} title={ws?.issue ?? undefined}
            className="wh-word cursor-pointer rounded-sm transition-colors hover:bg-(--theme-bg-secondary)"
            style={color ? {
              textDecorationLine: 'underline',
              textDecorationColor: color,
              textDecorationThickness: 3,
              textUnderlineOffset: 8,
            } : undefined}>
            {tok}
          </span>
        );
      })}
    </>
  );
}

// ─── One step of the listen → speak → compare loop ─────────────────────────
function StepAction({ index, label, hotkey, highlight, disabled, onClick, icon }: {
  index: number;
  label: string;
  hotkey: string;
  highlight: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Same height as the record button so the three labels line up */}
      <div className="flex h-19 items-center">
        <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
          style={highlight
            ? { borderColor: ACC, color: ACC, background: `${ACC}14`, boxShadow: `0 0 0 4px ${ACC}22` }
            : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', background: 'var(--theme-bg-card)' }}>
          {icon}
        </button>
      </div>
      <StepLabel index={index} label={label} hotkey={hotkey} highlight={highlight} />
    </div>
  );
}

function StepLabel({ index, label, hotkey, highlight }: { index: number; label: string; hotkey: string; highlight: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-caption font-bold"
      style={{ color: highlight ? ACC : 'var(--theme-text-secondary)' }}>
      {index}. {label} <Kbd>{hotkey}</Kbd>
    </span>
  );
}

// ─── Feedback after grading ────────────────────────────────────────────────
function AttemptFeedback({ attempt, wordScores }: { attempt: ShadowingAttempt; wordScores?: WordScore[] }) {
  const t = useTranslations('practice.dictation.shadow.session');
  const weak = (wordScores ?? [])
    .filter((w) => w.score < WEAK_WORD_SCORE)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
  return (
    <div className="w-full rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-secondary)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <PhraseScoreBadge score={attempt.pronunciationScore ?? 0} />
        {attempt.attemptCount > 1 && (
          <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
            {t('attemptCount', { count: attempt.attemptCount })}
          </span>
        )}
      </div>

      {attempt.userTranscript && (
        <p className="mt-3 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
          <span className="mr-1.5 text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('youSaid')}</span>
          <span className="italic">&ldquo;{attempt.userTranscript}&rdquo;</span>
        </p>
      )}

      {weak.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('weakWords')}</p>
          <ul className="space-y-1">
            {weak.map((w, i) => (
              <li key={i} className="flex items-baseline gap-2 text-body">
                <span className="wh-word cursor-pointer font-bold" style={{ color: scoreColor(w.score) }}>{w.word}</span>
                <span className="mono text-caption" style={{ color: scoreColor(w.score) }}>{Math.round(w.score)}</span>
                {w.issue && <span className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>— {w.issue}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {attempt.feedback && (
        <p className="mt-3 flex items-start gap-2 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
          <span className="shrink-0">{t('feedbackTipPrefix')}</span>
          <span>{attempt.feedback}</span>
        </p>
      )}
    </div>
  );
}

// ─── Settings (speed + toggles) ────────────────────────────────────────────
function Toggle({ on, onClick, label, title, icon }: { on: boolean; onClick: () => void; label: string; title?: string; icon?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} title={title}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-caption font-semibold transition-colors"
      style={on
        ? { background: `${ACC}18`, color: ACC, borderColor: `${ACC}66` }
        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}>
      {icon}
      {label}
    </button>
  );
}

function PracticeSettings({ speed, onSpeed, autoPause, onAutoPause, autoRecord, onAutoRecord, hideText, onHideText, showTranslation, onShowTranslation, transcriptSource }: {
  speed: number; onSpeed: (s: number) => void;
  autoPause: boolean; onAutoPause: () => void;
  autoRecord: boolean; onAutoRecord: () => void;
  hideText: boolean; onHideText: () => void;
  showTranslation: boolean; onShowTranslation: () => void;
  transcriptSource?: string | null;
}) {
  const t = useTranslations('practice.dictation.shadow.session');
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('settingsTitle')}</span>
        <span className="rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={transcriptSource === 'ai'
            ? { background: `${ACC}18`, color: ACC }
            : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
          {transcriptSource === 'ai' ? t('subtitleSourceAi') : t('subtitleSourceYoutube')}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{t('speedLabel')}</span>
        <div className="flex gap-1 rounded-lg p-0.5" style={{ background: 'var(--theme-bg-secondary)' }}>
          {SPEED_OPTIONS.map((s) => (
            <button key={s} type="button" onClick={() => onSpeed(s)} aria-pressed={speed === s}
              className="mono rounded-md px-2 py-1 text-[11px] font-bold transition-colors"
              style={speed === s
                ? { background: ACC, color: 'white' }
                : { color: 'var(--theme-text-secondary)' }}>
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Toggle on={autoPause} onClick={onAutoPause} label={t('autoPause')} />
        <Toggle on={autoRecord} onClick={onAutoRecord} label={t('autoRecord')} title={t('autoRecordHint')} />
        <Toggle on={hideText} onClick={onHideText} label={t('hideText')} title={t('hideTextHint')} icon={<IconEye off size={13} />} />
        <Toggle on={showTranslation} onClick={onShowTranslation} label={t('showTranslation')} />
      </div>

      <p className="mt-3 hidden text-[11px] leading-relaxed lg:block" style={{ color: 'var(--theme-text-muted)' }}>
        {t('hotkeysLegend')}
      </p>
    </div>
  );
}

// ─── Sentence list row ─────────────────────────────────────────────────────
function SentenceRow({ index, segment, isCurrent, attempt, onClick }: {
  index: number;
  segment: ShadowingSegment;
  isCurrent: boolean;
  attempt?: ShadowingAttempt;
  onClick: () => void;
}) {
  const score = attempt?.pronunciationScore ?? null;
  return (
    <button type="button" onClick={onClick} data-shadow-segment-id={segment.id}
      className="flex w-full items-start gap-3 border-l-4 px-3 py-2.5 text-left transition-colors hover:bg-(--theme-bg-secondary)"
      style={{ borderLeftColor: isCurrent ? ACC : 'transparent', background: isCurrent ? `${ACC}12` : undefined }}>
      <span className="mono mt-0.5 w-6 shrink-0 text-right text-caption font-bold" style={{ color: isCurrent ? ACC : 'var(--theme-text-muted)' }}>
        {index + 1}
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 text-body"
        style={{ color: isCurrent ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)', fontWeight: isCurrent ? 600 : 400 }}>
        {segment.text}
      </span>
      {score !== null && <PhraseScoreBadge score={score} size="sm" />}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════

export default function ShadowingPlayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.dictation.shadow.session');
  const playerRef = useRef<YouTubeEmbedRef | null>(null);

  const { data: session, isLoading } = useShadowingSession(id);
  const { mutateAsync: gradeAttempt } = useGradeShadowingAttempt();
  const { mutate: submit, isPending: isSubmitting } = useSubmitShadowing();

  const [videoError, setVideoError] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [speed, setSpeed] = useState(1);
  const [submitWarning, setSubmitWarning] = useState('');
  const [autoPause, setAutoPause] = useState(true);
  const [guideDismissed, setGuideDismissed] = useState(true);
  // Blind shadowing: hide the sentence until the learner asks (or is graded).
  const [hideText, setHideText] = useState(false);
  const [revealedSegId, setRevealedSegId] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  // Segments whose sample was played — drives the "next step" highlight.
  const [listened, setListened] = useState<Record<string, true>>({});
  // Per-word scores are only returned by the grade mutation (not persisted on
  // the attempt), so keep the latest set per segment for this session view.
  const [wordScoresBySeg, setWordScoresBySeg] = useState<Record<string, WordScore[]>>({});
  // Latest local take per segment (object URL) so the learner can hear
  // themselves and compare against the original.
  const recordRef = useRef<RecordButtonRef | null>(null);
  const takeAudioRef = useRef<HTMLAudioElement | null>(null);
  const takeUrlSet = useRef(new Set<string>());
  const [takeUrls, setTakeUrls] = useState<Record<string, string>>({});
  // Listen → speak loop: start recording as soon as the sample finishes.
  const [autoRecord, setAutoRecord] = useState(false);
  const autoRecordRef = useRef(autoRecord);
  useEffect(() => { autoRecordRef.current = autoRecord; }, [autoRecord]);

  useEffect(() => {
    const urls = takeUrlSet.current;
    return () => {
      takeAudioRef.current?.pause();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // Guide visibility lives in localStorage (client-only)
  useEffect(() => {
    try {
      setGuideDismissed(window.localStorage.getItem(GUIDE_DISMISS_KEY) === '1');
    } catch {
      setGuideDismissed(false);
    }
  }, []);

  const dismissGuide = () => {
    setGuideDismissed(true);
    try { window.localStorage.setItem(GUIDE_DISMISS_KEY, '1'); } catch {}
  };

  // Redirect when submitted
  useEffect(() => {
    if (session?.status === 'SUBMITTED') {
      router.replace(`/practice-test/dictation/shadow/${id}/result`);
    }
  }, [session?.status, id, router]);

  // Keep the current row visible in the sentence list
  useEffect(() => {
    const target = selectedSegmentId ?? activeSegmentId;
    if (!target) return;
    const el = document.querySelector(`[data-shadow-segment-id="${target}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedSegmentId, activeSegmentId]);

  function handleTimeUpdate(currentSec: number) {
    if (!session?.segments) return;
    const currentMs = currentSec * 1000;
    const active = session.segments.find((s) => currentMs >= s.start && currentMs <= s.end);
    // Keep the last sentence during gaps between captions so the card
    // doesn't jump back to sentence 1.
    if (active) setActiveSegmentId(active.id);
  }

  function handleSpeedChange(rate: number) {
    setSpeed(rate);
    playerRef.current?.setSpeed(rate);
  }

  function maybeAutoRecord() {
    // start() is a no-op unless the button is idle and enabled.
    if (autoRecordRef.current) recordRef.current?.start();
  }

  // Play the original phrase; by default the auto-record loop follows it.
  function playSample(seg: ShadowingSegment, onEnd: () => void = maybeAutoRecord) {
    takeAudioRef.current?.pause();
    setListened((prev) => (prev[seg.id] ? prev : { ...prev, [seg.id]: true }));
    playerRef.current?.playSegment(seg.start / 1000, seg.end / 1000, onEnd);
  }

  function handleSelectSegment(seg: ShadowingSegment) {
    setSelectedSegmentId(seg.id);
    setActiveSegmentId(seg.id);
    setRecordError('');
    playSample(seg);
  }

  function handleReplayCurrent() {
    if (!currentSegment) return;
    setRecordError('');
    playSample(currentSegment);
  }

  function storeTake(segmentId: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    takeUrlSet.current.add(url);
    const old = takeUrls[segmentId];
    if (old) {
      URL.revokeObjectURL(old);
      takeUrlSet.current.delete(old);
    }
    setTakeUrls((prev) => ({ ...prev, [segmentId]: url }));
  }

  function playTake(url: string | undefined) {
    if (!url) return;
    playerRef.current?.pause();
    takeAudioRef.current?.pause();
    const audio = new Audio(url);
    takeAudioRef.current = audio;
    audio.play().catch(() => {});
  }

  // Original phrase first, then the learner's take right after it.
  function handleCompare() {
    if (!currentSegment || !currentTakeUrl) return;
    const url = currentTakeUrl;
    playSample(currentSegment, () => playTake(url));
  }

  function goToIndex(index: number) {
    const seg = segments[index];
    if (seg) handleSelectSegment(seg);
  }

  async function handleRecord(audioBase64: string, mimeType: string, blob: Blob) {
    if (!currentSegment) return;
    const segmentId = currentSegment.id;
    storeTake(segmentId, blob);
    setRecordError('');
    setIsProcessing(true);
    try {
      const res = await gradeAttempt({ sessionId: id, segmentId, audioBase64, mimeType });
      setWordScoresBySeg((prev) => ({ ...prev, [res.segmentId]: res.wordScores }));
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : t('grading'));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSubmit() {
    if (!session) return;
    if (session.completedSegments === 0) {
      setSubmitWarning(t('warnNoAttempts'));
      return;
    }
    setSubmitWarning('');
    submit(id, {
      onSuccess: () => router.push(`/practice-test/dictation/shadow/${id}/result`),
      onError: (err: Error) => setSubmitWarning(err.message || t('warnSubmitError')),
    });
  }

  // Single-key hotkeys (the page has no text inputs) — listener bound once;
  // handlers read via ref so the effect never needs re-binding.
  const hotkeysRef = useRef({ record: () => {}, sample: () => {}, compare: () => {}, next: () => {}, prev: () => {} });
  useEffect(() => {
    hotkeysRef.current = {
      record: () => recordRef.current?.toggle(),
      sample: handleReplayCurrent,
      compare: handleCompare,
      next: () => goToIndex(currentIndex + 1),
      prev: () => goToIndex(currentIndex - 1),
    };
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const key = e.key.toLowerCase();
      const action = key === 'r' ? 'record'
        : key === 'l' ? 'sample'
        : key === 'm' ? 'compare'
        : key === 'n' || e.key === 'ArrowRight' ? 'next'
        : key === 'p' || e.key === 'ArrowLeft' ? 'prev'
        : null;
      if (!action) return;
      e.preventDefault();
      hotkeysRef.current[action]();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Derived state
  const attemptBySegId = useMemo(
    () => new Map((session?.attempts ?? []).map((a) => [a.segmentId, a])),
    [session?.attempts],
  );

  const segments = useMemo(() => session?.segments ?? [], [session?.segments]);
  const currentSegmentId = selectedSegmentId ?? activeSegmentId ?? segments[0]?.id ?? null;
  const currentIndex = Math.max(0, segments.findIndex((s) => s.id === currentSegmentId));
  const currentSegment = segments[currentIndex] ?? null;
  const currentAttempt = currentSegment ? attemptBySegId.get(currentSegment.id) : undefined;
  const currentTakeUrl = currentSegment ? takeUrls[currentSegment.id] : undefined;
  const currentWordScores = currentSegment ? wordScoresBySeg[currentSegment.id] : undefined;

  const translations = useSegmentTranslations(session?.video.id ?? '', segments, currentIndex, showTranslation);

  // Suggested next step for the current sentence.
  const nextStep: Step = !currentSegment || !listened[currentSegment.id]
    ? 'listen'
    : !currentTakeUrl ? 'speak' : 'compare';
  const textHidden = hideText && !!currentSegment && revealedSegId !== currentSegment.id && !currentAttempt;

  const completedPct = session && session.totalSegments > 0
    ? (session.completedSegments / session.totalSegments) * 100
    : 0;
  const allDone = !!session && session.completedSegments === session.totalSegments;

  // Render
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: `${ACC}33`, borderTopColor: ACC }} />
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

  const settings = (
    <PracticeSettings
      speed={speed} onSpeed={handleSpeedChange}
      autoPause={autoPause} onAutoPause={() => setAutoPause((a) => !a)}
      autoRecord={autoRecord} onAutoRecord={() => setAutoRecord((a) => !a)}
      hideText={hideText} onHideText={() => setHideText((h) => !h)}
      showTranslation={showTranslation} onShowTranslation={() => setShowTranslation((s) => !s)}
      transcriptSource={session.video.transcriptSource}
    />
  );

  return (
    <div className="max-w-360 mx-auto px-4 sm:px-6 pb-28">
      {/* Back link + title */}
      <div className="pt-4 mb-4">
        <button type="button" onClick={() => router.push('/practice-test/dictation/shadow')}
          className="mb-3 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70"
          style={{ color: ACC }}>
          <IconChevron dir="left" size={15} />
          {t('back')}
        </button>
        <h1 className="text-h2 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h1>
        <p className="mt-1 truncate text-body" style={{ color: 'var(--theme-text-secondary)' }}>{session.video.title}</p>
      </div>

      {!guideDismissed && <PracticeGuide onDismiss={dismissGuide} />}

      {videoError ? (
        <VideoUnavailableFallback sessionId={id} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
          {/* Left: video + settings, pinned on desktop. On phones the video
              scrolls away so it never covers the sentence and feedback —
              playback (the audio source) keeps working off-screen. */}
          <div className="w-full lg:w-100 lg:sticky lg:top-20 lg:z-30">
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl overflow-hidden border aspect-video bg-black/40" style={{ borderColor: 'var(--theme-border)' }}>
                <YouTubeEmbed
                  ref={playerRef}
                  youtubeId={session.video.youtubeId}
                  onError={() => setVideoError(true)}
                  onTimeUpdate={handleTimeUpdate}
                  autoPauseSegments={autoPause ? session.segments : undefined}
                  onAutoPaused={(segId) => {
                    // The segment that just finished is the one to record next.
                    setSelectedSegmentId(segId);
                    setActiveSegmentId(segId);
                    setListened((prev) => (prev[segId] ? prev : { ...prev, [segId]: true }));
                    maybeAutoRecord();
                  }}
                />
              </div>
              <div className="hidden lg:block">{settings}</div>
            </div>
          </div>

          {/* Right: practice card + sentence list */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            <section className="rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              {/* Sentence navigation */}
              <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--theme-border)' }}>
                <button type="button" onClick={() => goToIndex(currentIndex - 1)} disabled={currentIndex === 0}
                  aria-label={t('prevSegment')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-35"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                  <IconChevron dir="left" />
                </button>
                <span className="mono text-caption font-bold" style={{ color: 'var(--theme-text-secondary)' }}>
                  {t('sentenceOf', { current: currentIndex + 1, total: segments.length })}
                </span>
                <button type="button" onClick={() => goToIndex(currentIndex + 1)} disabled={currentIndex >= segments.length - 1}
                  aria-label={t('nextSegment')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-35"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                  <IconChevron dir="right" />
                </button>
              </div>

              <div className="px-4 py-6 sm:px-8">
                {/* The sentence */}
                {currentSegment && (
                  <div className="text-center">
                    <div className="relative">
                      <p className="text-2xl md:text-[30px] font-extrabold leading-relaxed transition-[filter]"
                        style={{
                          letterSpacing: '-.01em',
                          color: 'var(--theme-text-primary)',
                          filter: textHidden ? 'blur(9px)' : undefined,
                          userSelect: textHidden ? 'none' : undefined,
                        }}
                        aria-hidden={textHidden}>
                        <ScoredSentence text={currentSegment.text} wordScores={currentWordScores} />
                      </p>
                      {textHidden && (
                        <button type="button" onClick={() => setRevealedSegId(currentSegment.id)}
                          className="absolute inset-0 m-auto flex h-9 w-fit items-center gap-1.5 rounded-full border px-4 text-caption font-bold shadow-sm"
                          style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                          <IconEye size={14} />
                          {t('revealText')}
                        </button>
                      )}
                    </div>
                    {showTranslation && !textHidden && translations[currentSegment.id] && (
                      <p className="mt-2 text-body italic" style={{ color: 'var(--theme-text-muted)' }}>
                        {translations[currentSegment.id]}
                      </p>
                    )}
                  </div>
                )}

                {/* Listen → speak → compare */}
                <div className="mx-auto mt-8 grid max-w-md grid-cols-3 items-start gap-2">
                  <StepAction index={1} label={t('stepListen')} hotkey="L"
                    highlight={nextStep === 'listen'} disabled={!currentSegment}
                    onClick={handleReplayCurrent} icon={<IconHeadphones size={22} />} />
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex min-h-19 items-center">
                      <RecordButton
                        ref={recordRef}
                        maxDurationMs={40000}
                        disabled={isProcessing || !currentSegment}
                        onRecorded={handleRecord}
                        onError={setRecordError}
                        size={76}
                        accentColor={ACC}
                        countdownMs={3000}
                        layout="column"
                      />
                    </div>
                    <StepLabel index={2} label={t('stepSpeak')} hotkey="R" highlight={nextStep === 'speak'} />
                  </div>
                  <StepAction index={3} label={t('stepCompare')} hotkey="M"
                    highlight={nextStep === 'compare'} disabled={!currentTakeUrl}
                    onClick={handleCompare} icon={<IconCompare size={22} />} />
                </div>

                {/* Status / feedback */}
                <div className="mx-auto mt-6 max-w-xl">
                  {isProcessing ? (
                    <p className="text-center text-body font-bold" style={{ color: ACC }}>{t('grading')}</p>
                  ) : currentAttempt ? (
                    <AttemptFeedback attempt={currentAttempt} wordScores={currentWordScores} />
                  ) : (
                    <p className="text-center text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
                      {t(nextStep === 'listen' ? 'hintListen' : 'hintSpeak')}
                    </p>
                  )}
                  {recordError && <p className="mt-3 text-center text-caption font-bold" style={{ color: STATUS.danger }}>{recordError}</p>}

                  {(currentTakeUrl || currentAttempt) && !isProcessing && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {currentTakeUrl && (
                        <button type="button" onClick={() => playTake(currentTakeUrl)}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-caption font-bold transition-colors hover:bg-(--theme-bg-secondary)"
                          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                          <IconPlay size={11} />
                          {t('playMine')}
                        </button>
                      )}
                      {currentIndex < segments.length - 1 && (
                        <button type="button" onClick={() => goToIndex(currentIndex + 1)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-caption font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-95"
                          style={{ background: ACC }}>
                          {t('nextSegment')}
                          <IconChevron dir="right" size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center border-t px-4 py-3" style={{ borderColor: 'var(--theme-border)' }}>
                <AiReviewCounter />
              </div>
            </section>

            <div className="lg:hidden">{settings}</div>

            {/* Sentence list */}
            <section className="overflow-hidden rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--theme-border)' }}>
                <span className="text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('sentenceList')}</span>
                <span className="mono text-caption font-bold" style={{ color: 'var(--theme-text-secondary)' }}>
                  {session.completedSegments}/{session.totalSegments}
                </span>
              </div>
              <div className="max-h-90 divide-y overflow-y-auto" style={{ borderColor: 'var(--theme-border)' }}>
                {segments.map((seg, i) => (
                  <SentenceRow key={seg.id} index={i} segment={seg}
                    isCurrent={seg.id === currentSegment?.id}
                    attempt={attemptBySegId.get(seg.id)}
                    onClick={() => handleSelectSegment(seg)} />
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Sticky bottom progress + submit — on phones it sits above the
          BottomTabBar (64px + safe area, md:hidden) instead of behind it */}
      {!videoError && (
        <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-4 z-10 mt-6">
          {/* mr-16 on phones leaves room for the global feedback FAB */}
          <div className="mr-16 md:mr-0 flex items-center gap-4 rounded-2xl border px-4 py-3 backdrop-blur"
            style={{ background: 'color-mix(in srgb, var(--theme-bg-card) 92%, transparent)', borderColor: 'var(--theme-border)', boxShadow: '0 -4px 20px rgba(0,0,0,.18)' }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('progress')}</span>
                <span className="mono text-caption font-bold" style={{ color: allDone ? STATUS.success : 'var(--theme-text-primary)' }}>
                  {session.completedSegments}/{session.totalSegments}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden max-w-90" style={{ background: 'var(--theme-bg-secondary)' }}>
                <div className="h-full transition-all duration-500" style={{ width: `${completedPct}%`, background: allDone ? STATUS.success : ACC }} />
              </div>
            </div>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting || session.completedSegments === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: ACC }}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('submitting')}
                </>
              ) : t('submit')}
            </button>
          </div>
          {submitWarning && <p className="mt-2 text-xs font-bold text-right" style={{ color: STATUS.warning }}>{submitWarning}</p>}
        </div>
      )}
    </div>
  );
}
