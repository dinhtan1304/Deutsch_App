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
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import type { ShadowingAttempt, ShadowingSegment } from '@/lib/api/shadowing';

const SPEED_OPTIONS = [0.75, 1, 1.25] as const;
const TIP_DISMISS_KEY = 'shadowing-tip-dismissed-v1';

const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab,
};

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
      className="rounded-xl border px-4 py-3 mb-5 flex items-start gap-3"
      style={{
        backgroundColor: `${ACCENT.reading}10`,
        borderColor: `${ACCENT.reading}33`,
      }}
    >
      <span className="text-base shrink-0">💡</span>
      <p className="flex-1 text-sm font-medium leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
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
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{
          color: isCurrent ? 'white' : ACCENT.reading,
          backgroundColor: isCurrent ? ACCENT.reading : `${ACCENT.reading}15`,
        }}
      >
        <IconHeadphones size={14} />
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

// ─── Score / feedback panel shown after grading ─────────────────────────────
function ScoreFeedback({ attempt }: { attempt: ShadowingAttempt }) {
  const t = useTranslations('practice.dictation.shadow.session');
  const score = attempt.pronunciationScore ?? 0;
  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-3 mt-4">
      <PhraseScoreBadge score={score} />
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
          className="text-[10px] font-black uppercase tracking-widest opacity-50"
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
      await gradeAttempt({
        sessionId: id,
        segmentId: currentSegment.id,
        audioBase64,
        mimeType,
      });
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
    <div className="max-w-5xl mx-auto px-4 pb-24">
      <div className="pt-2">
        <PageHeader
          backHref="/practice-test/dictation/shadow"
          title={t('title')}
          accent="reading"
          right={
            <span
              className="text-[11px] font-black px-3 py-1 rounded-md border"
              style={{
                color: CEFR_COLORS[session.difficulty],
                borderColor: 'var(--theme-border)',
              }}
            >
              {session.difficulty}
            </span>
          }
        />
      </div>

      {!tipDismissed && <TipBanner onDismiss={dismissTip} />}

      {videoError ? (
        <VideoUnavailableFallback sessionId={id} />
      ) : (
        <div
          className="rounded-3xl border p-5 md:p-6 relative overflow-hidden"
          style={{
            backgroundColor: `${ACCENT.reading}0D`,
            borderColor: `${ACCENT.reading}2A`,
          }}
        >
          {/* Top: video + segment list ────────────────────────────── */}
          <div className="flex flex-col md:flex-row gap-5 mb-6">
            {/* Video + meta controls */}
            <div className="md:w-72 lg:w-80 shrink-0">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-white/5 aspect-video bg-black/40">
                <YouTubeEmbed
                  ref={playerRef}
                  youtubeId={session.video.youtubeId}
                  onError={() => setVideoError(true)}
                  onTimeUpdate={handleTimeUpdate}
                  autoPauseSegments={autoPause ? session.segments : undefined}
                  onAutoPaused={(segId) => setPausedAtSegmentId(segId)}
                />
              </div>
              {/* Subtitle source chip */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="text-[10px] font-black uppercase tracking-widest opacity-50"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  {t('subtitleSourceLabel')}
                </span>
                <span
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border"
                  style={
                    session.video.transcriptSource === 'ai'
                      ? {
                          backgroundColor: `${ACCENT.reading}15`,
                          borderColor: `${ACCENT.reading}33`,
                          color: ACCENT.reading,
                        }
                      : {
                          backgroundColor: 'var(--theme-bg-secondary)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text-secondary)',
                        }
                  }
                >
                  {session.video.transcriptSource === 'ai' ? t('subtitleSourceAi') : t('subtitleSourceYoutube')}
                </span>
              </div>
              {/* Speed + auto-pause */}
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpeedChange(s)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-black transition-all"
                      style={{
                        backgroundColor: speed === s ? ACCENT.reading : 'transparent',
                        color: speed === s ? 'white' : 'var(--theme-text-secondary)',
                        border: speed === s ? 'none' : '1px solid var(--theme-border)',
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoPause}
                    onChange={(e) => setAutoPause(e.target.checked)}
                    className="w-3.5 h-3.5 rounded"
                    style={{ accentColor: ACCENT.reading }}
                  />
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    {t('autoPause')}
                  </span>
                </label>
              </div>
            </div>

            {/* Segment list */}
            <div
              className="flex-1 min-w-0 rounded-2xl border overflow-hidden flex flex-col"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
                maxHeight: 240,
              }}
            >
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
            <div className="text-center my-6 md:my-8 px-2">
              <p
                className="text-xl md:text-2xl lg:text-3xl font-black leading-snug"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {currentSegment.text}
              </p>
            </div>
          )}

          {/* Recording panel ──────────────────────────────────────── */}
          <div
            className="rounded-2xl py-8 md:py-10 px-5 flex flex-col items-center"
            style={{
              backgroundColor: `${ACCENT.reading}08`,
              border: `1px solid ${ACCENT.reading}1A`,
            }}
          >
            {/* Replay current sample (above mic for affordance) */}
            {currentSegment && (
              <button
                type="button"
                onClick={handleReplayCurrent}
                className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all hover:bg-black/3 dark:hover:bg-white/5"
                style={{
                  borderColor: `${ACCENT.reading}33`,
                  color: ACCENT.reading,
                }}
              >
                <IconHeadphones size={13} />
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
            />

            <div className="mt-5 text-center">
              {isProcessing ? (
                <p className="text-base font-black" style={{ color: ACCENT.reading }}>
                  {t('grading')}
                </p>
              ) : currentAttempt ? (
                <ScoreFeedback attempt={currentAttempt} />
              ) : (
                <>
                  <p
                    className="text-base font-black mb-1"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    {t('ready')}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    {t('readyHint')}
                  </p>
                  <p
                    className="text-xs mt-3 italic opacity-60"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {t('headphoneTip')}
                  </p>
                </>
              )}

              {recordError && (
                <p
                  className="mt-3 text-xs font-bold"
                  style={{ color: STATUS.danger }}
                >
                  {recordError}
                </p>
              )}
            </div>

            {/* Bottom actions: retry + next */}
            {currentAttempt && !isProcessing && (
              <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
                <span
                  className="text-[11px] font-black uppercase tracking-widest opacity-50"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {t('retryHint')}
                </span>
                <button
                  type="button"
                  onClick={handlePlayNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background: GRADIENT.reading }}
                >
                  {t('nextSegment')}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}
          </div>

          {/* AI review quota counter ──────────────────────────────── */}
          <div className="mt-5 text-center">
            <AiReviewCounter />
          </div>

          {/* Bottom: progress + Submit ─────────────────────────────── */}
          <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] font-black mb-1.5">
                <span style={{ color: 'var(--theme-text-secondary)' }}>{t('progress')}</span>
                <span style={{ color: ACCENT.reading }}>
                  {session.completedSegments} / {session.totalSegments}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${completedPct}%`,
                    background: GRADIENT.reading,
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || session.completedSegments === 0}
              className="px-6 py-3 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ background: GRADIENT.reading }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submit')
              )}
            </button>
          </div>

          {submitWarning && (
            <p
              className="mt-3 text-xs font-bold text-right"
              style={{ color: STATUS.warning }}
            >
              {submitWarning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
