'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useShadowingSession,
  useGradeShadowingAttempt,
  useSubmitShadowing,
} from '@/hooks/useShadowing';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { VideoUnavailableFallback } from '@/components/dictation/VideoUnavailableFallback';
import { RecordButton } from '@/components/shadowing/RecordButton';
import { PhraseScoreBadge } from '@/components/shadowing/PhraseScoreBadge';
import { AiReviewCounter } from '@/components/shadowing/AiReviewCounter';
import { ACCENT, STATUS } from '@/lib/tokens';
import type { GradeAttemptResponse, ShadowingAttempt, ShadowingSegment } from '@/lib/api/shadowing';

type WordScore = GradeAttemptResponse['wordScores'][number];

const SPEED_OPTIONS = [0.75, 1, 1.25] as const;
const TIP_DISMISS_KEY = 'shadowing-tip-dismissed-v1';

function formatTimestamp(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function IconHeadphones({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
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

// ─── Tip banner ────────────────────────────────────────────────────────────
function TipBanner({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations('practice.dictation.shadow.session');
  return (
    <div
      className="rounded-md border px-4 py-3 mb-5 flex items-start gap-3"
      style={{
        backgroundColor: `${STATUS.warning}12`,
        borderColor: `${STATUS.warning}33`,
      }}
    >
      <span className="text-base shrink-0">💡</span>
      <p className="flex-1 text-caption font-medium leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
        {t('tip')}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('dismiss')}
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <IconClose />
      </button>
    </div>
  );
}

// ─── Segment list row ──────────────────────────────────────────────────────
function SegmentListRow({
  segment,
  isActive,
  isCurrent,
  attempt,
  onClick,
}: {
  segment: ShadowingSegment;
  isActive: boolean;
  isCurrent: boolean;
  attempt?: ShadowingAttempt;
  onClick: () => void;
}) {
  const score = attempt?.pronunciationScore ?? null;
  const highlightBg = isCurrent
    ? `${ACCENT.reading}22`
    : isActive
      ? `${ACCENT.reading}12`
      : 'transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      data-shadow-segment-id={segment.id}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all border-l-2"
      style={{
        backgroundColor: highlightBg,
        borderLeftColor: isCurrent ? ACCENT.reading : 'transparent',
      }}
    >
      <span
        className="shrink-0 w-6.5 h-6.5 rounded-[7px] flex items-center justify-center"
        style={{
          color: isCurrent ? 'white' : ACCENT.reading,
          backgroundColor: isCurrent ? ACCENT.reading : `${ACCENT.reading}15`,
        }}
      >
        <IconHeadphones size={13} />
      </span>
      <span
        className="flex-1 min-w-0 text-sm font-medium truncate"
        style={{
          color: isCurrent ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
          fontWeight: isCurrent ? 700 : 500,
        }}
      >
        {segment.text}
      </span>
      {score !== null ? (
        <PhraseScoreBadge score={score} size="sm" />
      ) : (
        <span
          className="shrink-0 text-[11px] font-mono opacity-50 tabular-nums"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {formatTimestamp(segment.start)}
        </span>
      )}
    </button>
  );
}

// ─── Per-word pronunciation chips (S1) ──────────────────────────────────────
// Colours each word by its score; words flagged with an `issue` carry a dot
// and surface the explanation on hover (title).
function WordScoreChips({ words }: { words: WordScore[] }) {
  if (!words.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {words.map((w, i) => {
        const color = w.score >= 80 ? STATUS.success : w.score >= 60 ? STATUS.warning : STATUS.danger;
        return (
          <span
            key={i}
            title={w.issue ?? undefined}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold"
            style={{ color, background: `${color}1A`, border: `1px solid ${color}33`, cursor: w.issue ? 'help' : 'default' }}
          >
            {w.word}
            {w.issue && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
          </span>
        );
      })}
    </div>
  );
}

// ─── Score / feedback panel shown after grading ─────────────────────────────
function ScoreFeedback({ attempt, wordScores }: { attempt: ShadowingAttempt; wordScores?: WordScore[] }) {
  const t = useTranslations('practice.dictation.shadow.session');
  const score = attempt.pronunciationScore ?? 0;
  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-3 mt-4">
      <PhraseScoreBadge score={score} />
      {wordScores && wordScores.length > 0 && <WordScoreChips words={wordScores} />}
      {attempt.userTranscript && (
        <div
          className="w-full px-4 py-2.5 rounded-xl text-sm italic text-center"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            color: 'var(--theme-text-secondary)',
          }}
        >
          &ldquo;{attempt.userTranscript}&rdquo;
        </div>
      )}
      {attempt.feedback && (
        <div
          className="w-full px-4 py-2.5 rounded-xl text-sm flex items-start gap-2"
          style={{
            backgroundColor: `${ACCENT.reading}10`,
            color: 'var(--theme-text-secondary)',
            border: `1px solid ${ACCENT.reading}22`,
          }}
        >
          <span className="shrink-0">{t('feedbackTipPrefix')}</span>
          <span>{attempt.feedback}</span>
        </div>
      )}
      {attempt.attemptCount > 1 && (
        <span
          className="text-caption font-semibold uppercase tracking-wide opacity-60"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('attemptCount', { count: attempt.attemptCount })}
        </span>
      )}
    </div>
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
  const [pausedAtSegmentId, setPausedAtSegmentId] = useState<string | null>(null);
  const [tipDismissed, setTipDismissed] = useState(false);
  // Per-word scores are only returned by the grade mutation (not persisted on
  // the attempt), so keep the latest set per segment for this session view.
  const [wordScoresBySeg, setWordScoresBySeg] = useState<Record<string, WordScore[]>>({});

  // Read tip banner state from localStorage (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setTipDismissed(window.localStorage.getItem(TIP_DISMISS_KEY) === '1');
  }, []);

  const dismissTip = () => {
    setTipDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TIP_DISMISS_KEY, '1');
    }
  };

  // Redirect when submitted
  useEffect(() => {
    if (session?.status === 'SUBMITTED') {
      router.replace(`/practice-test/dictation/shadow/${id}/result`);
    }
  }, [session?.status, id, router]);

  // Auto-scroll the segment list to keep the current row visible
  useEffect(() => {
    const target = selectedSegmentId ?? activeSegmentId;
    if (!target) return;
    const el = document.querySelector(`[data-shadow-segment-id="${target}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedSegmentId, activeSegmentId]);

  function handleTimeUpdate(currentSec: number) {
    if (!session?.segments) return;
    const currentMs = currentSec * 1000;
    const active = session.segments.find((s) => currentMs >= s.start && currentMs <= s.end);
    setActiveSegmentId(active?.id ?? null);
  }

  function handleSpeedChange(rate: number) {
    setSpeed(rate);
    playerRef.current?.setSpeed(rate);
  }

  function handleSelectSegment(seg: ShadowingSegment) {
    setSelectedSegmentId(seg.id);
    setActiveSegmentId(seg.id);
    setPausedAtSegmentId(null);
    setRecordError('');
    playerRef.current?.playSegment(seg.start / 1000, seg.end / 1000);
  }

  function handleReplayCurrent() {
    if (!currentSegment) return;
    setRecordError('');
    playerRef.current?.playSegment(currentSegment.start / 1000, currentSegment.end / 1000);
  }

  function handlePlayNext() {
    if (!session?.segments) return;
    const anchorId = pausedAtSegmentId ?? selectedSegmentId ?? activeSegmentId;
    const idx = anchorId ? session.segments.findIndex((s) => s.id === anchorId) : -1;
    const next = idx >= 0 ? session.segments[idx + 1] : session.segments[0];
    if (!next) return;
    handleSelectSegment(next);
  }

  async function handleRecord(audioBase64: string, mimeType: string) {
    if (!currentSegment) return;
    setRecordError('');
    setIsProcessing(true);
    try {
      const res = await gradeAttempt({
        sessionId: id,
        segmentId: currentSegment.id,
        audioBase64,
        mimeType,
      });
      setWordScoresBySeg(prev => ({ ...prev, [res.segmentId]: res.wordScores }));
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

  // Derived state
  const attemptByStmtId = useMemo(
    () => new Map((session?.attempts ?? []).map((a) => [a.segmentId, a])),
    [session?.attempts],
  );

  const segments = session?.segments ?? [];
  const currentSegmentId =
    selectedSegmentId ?? activeSegmentId ?? segments[0]?.id ?? null;
  const currentSegment =
    segments.find((s) => s.id === currentSegmentId) ?? null;
  const currentAttempt = currentSegment
    ? attemptByStmtId.get(currentSegment.id)
    : undefined;

  const completedPct = session && session.totalSegments > 0
    ? (session.completedSegments / session.totalSegments) * 100
    : 0;

  // Render
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{
            borderColor: `${ACCENT.reading}33`,
            borderTopColor: ACCENT.reading,
          }}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
          {t('notFound')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-4 sm:px-6 pb-28">
      {/* Back link + title */}
      <div className="pt-4 mb-4">
        <button
          type="button"
          onClick={() => router.push('/practice-test/dictation/shadow')}
          className="mb-3 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70"
          style={{ color: ACCENT.reading }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          {t('back')}
        </button>
        <h1 className="text-h2 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h1>
      </div>

      {!tipDismissed && <TipBanner onDismiss={dismissTip} />}

      {videoError ? (
        <VideoUnavailableFallback sessionId={id} />
      ) : (
        <>
          {/* Top: video + controls | segment list ─────────────────── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr] mb-5">
            {/* Video + controls column */}
            <div className="flex flex-col gap-2.5">
              <div className="rounded-md overflow-hidden border aspect-video bg-black/40" style={{ borderColor: 'var(--theme-border)' }}>
                <YouTubeEmbed
                  ref={playerRef}
                  youtubeId={session.video.youtubeId}
                  onError={() => setVideoError(true)}
                  onTimeUpdate={handleTimeUpdate}
                  autoPauseSegments={autoPause ? session.segments : undefined}
                  onAutoPaused={(segId) => setPausedAtSegmentId(segId)}
                />
              </div>
              {/* Controls card */}
              <div className="rounded-[11px] border p-3" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('subtitleSourceLabel')}</span>
                  <span className="rounded-[5px] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                    style={session.video.transcriptSource === 'ai'
                      ? { background: `${ACCENT.reading}18`, color: ACCENT.reading }
                      : { background: `${STATUS.danger}18`, color: STATUS.danger }}>
                    {session.video.transcriptSource === 'ai' ? t('subtitleSourceAi') : t('subtitleSourceYoutube')}
                  </span>
                </div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  {SPEED_OPTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => handleSpeedChange(s)}
                      className="mono rounded-[6px] px-2 py-1 text-[11px] font-bold transition-colors"
                      style={speed === s
                        ? { background: ACCENT.reading, color: 'white', border: `1px solid ${ACCENT.reading}` }
                        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                      {s}x
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setAutoPause((a) => !a)} className="flex items-center gap-2">
                  <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px]"
                    style={autoPause ? { background: ACCENT.reading, color: 'white' } : { background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                    {autoPause && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>{t('autoPause')}</span>
                </button>
              </div>
            </div>

            {/* Segment list */}
            <div className="rounded-md border overflow-hidden flex flex-col" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', maxHeight: 240 }}>
              <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                {segments.map((seg) => (
                  <SegmentListRow
                    key={seg.id}
                    segment={seg}
                    isActive={seg.id === activeSegmentId}
                    isCurrent={seg.id === currentSegmentId}
                    attempt={attemptByStmtId.get(seg.id)}
                    onClick={() => handleSelectSegment(seg)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Active segment text — big bold centered ────────────── */}
          {currentSegment && (
            <div key={currentSegment.id} className="text-center my-6 px-2">
              <p className="text-2xl md:text-[32px] font-extrabold leading-snug" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>
                {currentSegment.text}
              </p>
            </div>
          )}

          {/* Recording card ───────────────────────────────────────── */}
          <div className="rounded-[18px] border py-8 px-5 flex flex-col items-center"
            style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
            {currentSegment && (
              <button type="button" onClick={handleReplayCurrent}
                className="mb-5 flex items-center gap-2 text-caption font-bold px-4 py-2 rounded-[10px] border transition-colors"
                style={{ borderColor: `${ACCENT.reading}55`, color: ACCENT.reading }}>
                <IconHeadphones size={15} />
                {t('replaySample')}
              </button>
            )}

            <RecordButton
              maxDurationMs={Math.min(20000, currentSegment ? Math.round((currentSegment.end - currentSegment.start) * 1.5 + 1500) : 8000)}
              disabled={isProcessing || !currentSegment}
              onRecorded={handleRecord}
              onError={setRecordError}
              size={88}
              accentColor={ACCENT.reading}
              countdownMs={3000}
            />

            <div className="mt-5 text-center">
              {isProcessing ? (
                <p className="text-base font-extrabold" style={{ color: ACCENT.reading }}>{t('grading')}</p>
              ) : currentAttempt ? (
                <ScoreFeedback attempt={currentAttempt} wordScores={wordScoresBySeg[currentAttempt.segmentId]} />
              ) : (
                <>
                  <p className="text-[15px] font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{t('ready')}</p>
                  <p className="text-caption font-medium" style={{ color: 'var(--theme-text-secondary)' }}>{t('readyHint')}</p>
                  <p className="text-[11px] mt-2 italic" style={{ color: 'var(--theme-text-muted)' }}>{t('headphoneTip')}</p>
                </>
              )}
              {recordError && <p className="mt-3 text-xs font-bold" style={{ color: STATUS.danger }}>{recordError}</p>}
            </div>

            {currentAttempt && !isProcessing && (
              <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--theme-text-muted)' }}>{t('retryHint')}</span>
                <button type="button" onClick={handlePlayNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-caption font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-95"
                  style={{ background: ACCENT.reading }}>
                  {t('nextSegment')}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}

            <div className="mt-6 pt-4 w-full flex justify-center border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <AiReviewCounter />
            </div>
          </div>
        </>
      )}

      {/* Sticky bottom progress + submit ─────────────────────────── */}
      {!videoError && (
        <div className="sticky bottom-4 z-10 mt-6">
          <div className="flex items-center gap-4 rounded-[14px] border px-4 py-3 backdrop-blur"
            style={{ background: 'color-mix(in srgb, var(--theme-bg-card) 92%, transparent)', borderColor: 'var(--theme-border)', boxShadow: '0 -4px 20px rgba(0,0,0,.18)' }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('progress')}</span>
                <span className="mono text-caption font-bold" style={{ color: session.completedSegments === session.totalSegments ? STATUS.success : 'var(--theme-text-primary)' }}>
                  {session.completedSegments}/{session.totalSegments}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden max-w-90" style={{ background: 'var(--theme-bg-secondary)' }}>
                <div className="h-full transition-all duration-500" style={{ width: `${completedPct}%`, background: session.completedSegments === session.totalSegments ? STATUS.success : ACCENT.reading }} />
              </div>
            </div>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting || session.completedSegments === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-[11px] text-sm font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: ACCENT.reading }}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                <>
                  {t('submit')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </>
              )}
            </button>
          </div>
          {submitWarning && <p className="mt-2 text-xs font-bold text-right" style={{ color: STATUS.warning }}>{submitWarning}</p>}
        </div>
      )}
    </div>
  );
}
