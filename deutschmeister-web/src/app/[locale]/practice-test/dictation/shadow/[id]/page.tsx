'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  IconChevron, IconHeadphones, OptionToggle, SentenceNav, SpeedPicker, StepAction, StepLabel,
} from '@/components/dictation/PracticeKit';
import { PracticeShell } from '@/components/dictation/PracticeShell';
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



function IconEye({ off, size = 14 }: { off?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
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
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('settingsTitle')}</span>
        <span className="rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={transcriptSource === 'ai'
            ? { background: `${ACC}18`, color: ACC }
            : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
          {transcriptSource === 'ai' ? t('subtitleSourceAi') : t('subtitleSourceYoutube')}
        </span>
      </div>

      <div className="mb-3">
        <SpeedPicker label={t('speedLabel')} options={SPEED_OPTIONS} value={speed} onChange={onSpeed} accent={ACC} />
      </div>

      <div className="flex flex-wrap gap-2">
        <OptionToggle accent={ACC} on={autoPause} onClick={onAutoPause} label={t('autoPause')} />
        <OptionToggle accent={ACC} on={autoRecord} onClick={onAutoRecord} label={t('autoRecord')} title={t('autoRecordHint')} />
        <OptionToggle accent={ACC} on={hideText} onClick={onHideText} label={t('hideText')} title={t('hideTextHint')} icon={<IconEye off size={13} />} />
        <OptionToggle accent={ACC} on={showTranslation} onClick={onShowTranslation} label={t('showTranslation')} />
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

  // Redirect when submitted
  useEffect(() => {
    if (session?.status === 'SUBMITTED') {
      router.replace(`/practice-test/dictation/shadow/${id}/result`);
    }
  }, [session?.status, id, router]);

  // Keep the current row visible in the sentence list — scroll the list
  // container only (scrollIntoView would also scroll the page).
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = selectedSegmentId ?? activeSegmentId;
    const list = listRef.current;
    const row = target ? list?.querySelector<HTMLElement>(`[data-shadow-segment-id="${target}"]`) : null;
    if (list && row) list.scrollTo({ top: row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2, behavior: 'smooth' });
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
    <PracticeShell
      accent={ACC}
      backLabel={t('back')}
      onBack={() => router.push('/practice-test/dictation/shadow')}
      title={session.video.title}
      progressPct={completedPct}
      progressText={`${session.completedSegments}/${session.totalSegments}`}
      progressDone={allDone}
      submitLabel={isSubmitting ? t('submitting') : t('submit')}
      onSubmit={handleSubmit}
      submitDisabled={session.completedSegments === 0}
      submitBusy={isSubmitting}
      notice={submitWarning
        ? <p className="-mt-1 shrink-0 text-right text-caption font-bold" style={{ color: STATUS.warning }}>{submitWarning}</p>
        : undefined}
      guide={{
        title: t('guideTitle'),
        steps: [t('guideListen'), t('guideSpeak'), t('guideCompare')],
        footnote: t('headphoneTip'),
        dismissLabel: t('dismiss'),
        openLabel: t('guideTitle'),
        storageKey: GUIDE_DISMISS_KEY,
      }}
      settingsLabel={t('settingsTitle')}
      listLabel={t('sentenceList')}
      listCount={`${session.completedSegments}/${session.totalSegments}`}
      fallback={videoError ? <VideoUnavailableFallback sessionId={id} /> : undefined}
      video={
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
      }
      settings={settings}
      listRef={listRef}
      list={segments.map((seg, i) => (
        <SentenceRow key={seg.id} index={i} segment={seg}
          isCurrent={seg.id === currentSegment?.id}
          attempt={attemptBySegId.get(seg.id)}
          onClick={() => handleSelectSegment(seg)} />
      ))}
      cardHeader={
        <SentenceNav
          label={t('sentenceOf', { current: currentIndex + 1, total: segments.length })}
          index={currentIndex}
          total={segments.length}
          onGo={goToIndex}
          prevLabel={t('prevSegment')}
          nextLabel={t('nextSegment')}
        />
      }
      cardFooter={
        // Actions live in the footer so they stay visible on short screens.
        <div className="flex items-center gap-2">
          {currentTakeUrl && !isProcessing && (
            <button type="button" onClick={() => playTake(currentTakeUrl)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-caption font-bold transition-colors hover:bg-(--theme-bg-secondary)"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              <IconPlay size={11} />
              {t('playMine')}
            </button>
          )}
          <div className="hidden min-w-0 flex-1 justify-center sm:flex"><AiReviewCounter /></div>
          {currentIndex < segments.length - 1 && (
            <button type="button" onClick={() => goToIndex(currentIndex + 1)}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-caption font-bold transition-transform active:scale-95"
              style={currentAttempt
                ? { background: ACC, color: 'white' }
                : { border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              {t('nextSegment')}
              <IconChevron dir="right" size={14} />
            </button>
          )}
        </div>
      }
      cardBody={
        <>
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
                <p className="mt-1 text-body italic" style={{ color: 'var(--theme-text-muted)' }}>
                  {translations[currentSegment.id]}
                </p>
              )}
            </div>
          )}

          {/* Listen → speak → compare */}
          <div className="mx-auto mt-5 grid w-full max-w-md grid-cols-3 items-start gap-2">
            <StepAction accent={ACC} index={1} label={t('stepListen')} hotkey="L"
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
              <StepLabel accent={ACC} index={2} label={t('stepSpeak')} hotkey="R" highlight={nextStep === 'speak'} />
            </div>
            <StepAction accent={ACC} index={3} label={t('stepCompare')} hotkey="M"
              highlight={nextStep === 'compare'} disabled={!currentTakeUrl}
              onClick={handleCompare} icon={<IconCompare size={22} />} />
          </div>

          {/* Status / feedback */}
          <div className="mx-auto mt-4 w-full max-w-xl">
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
          </div>
        </>
      }
    />
  );
}
