'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDictationSession, useAutosaveDictation, useSubmitDictation } from '@/hooks/useDictation';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { DictationSegmentRow } from '@/components/dictation/DictationSegmentRow';
import { DictationHeader } from '@/components/dictation/DictationHeader';
import { VideoUnavailableFallback } from '@/components/dictation/VideoUnavailableFallback';
import { STATUS, ACCENT, GRADIENT } from '@/lib/tokens';

const AUTOSAVE_DEBOUNCE_MS = 3000;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;
const NAVBAR_HEIGHT = 64;

export default function DictationPlayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.dictation.session');
  const playerRef = useRef<YouTubeEmbedRef | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef(false);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading } = useDictationSession(id);
  const { mutate: autosave } = useAutosaveDictation();
  const { mutate: submit, isPending: isSubmitting } = useSubmitDictation();

  const [localAnswers, setLocalAnswers] = useState<Record<string, string> | null>(null);
  const userAnswers = localAnswers ?? (session?.userAnswers as Record<string, string> | undefined) ?? {};
  const [videoError, setVideoError] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [autoPause, setAutoPause] = useState(true);
  const [pausedAtSegmentId, setPausedAtSegmentId] = useState<string | null>(null);

  // Redirect if already graded
  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/dictation/${id}/result`);
    }
  }, [session?.status, id, router]);


  // Smart scroll
  useEffect(() => {
    if (!activeSegmentId) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-segment-id="${activeSegmentId}"]`) as HTMLElement | null;
      if (!el) return;

      const stickyHeight = stickyRef.current?.offsetHeight ?? 200;
      const topBarrier = NAVBAR_HEIGHT + stickyHeight + 12;
      const bottomBarrier = window.innerHeight - 40;
      const rect = el.getBoundingClientRect();

      if (rect.top < topBarrier || rect.bottom > bottomBarrier) {
        const targetY = el.getBoundingClientRect().top + window.scrollY - topBarrier;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeSegmentId]);

  // Debounced autosave
  const scheduleAutosave = useCallback((answers: Record<string, string>) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    pendingSave.current = true;
    autosaveTimer.current = setTimeout(() => {
      autosave({ id, userAnswers: answers });
      pendingSave.current = false;
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [id, autosave]);

  function handleTimeUpdate(currentSec: number) {
    if (!session?.segments) return;
    const currentMs = currentSec * 1000;
    const active = session.segments.find(s => currentMs >= s.start && currentMs <= s.end);
    setActiveSegmentId(active?.id ?? null);
  }

  function handleChange(blankId: string, value: string) {
    setLocalAnswers(prev => {
      const base = prev ?? (session?.userAnswers as Record<string, string> | undefined) ?? {};
      const next = { ...base, [blankId]: value };
      scheduleAutosave(next);
      return next;
    });
  }

  function handleSpeedChange(rate: number) {
    setSpeed(rate);
    playerRef.current?.setSpeed(rate);
  }

  function handlePlayNext() {
    if (!session?.segments) return;
    // Prefer the segment AFTER the one we paused at; fall back to the
    // current active, or the very first segment.
    const anchorId = pausedAtSegmentId ?? activeSegmentId;
    const idx = anchorId ? session.segments.findIndex(s => s.id === anchorId) : -1;
    const next = idx >= 0 ? session.segments[idx + 1] : session.segments[0];
    if (!next) return;
    setPausedAtSegmentId(null);
    playerRef.current?.playSegment(next.start / 1000, next.end / 1000);
  }

  function handleSubmit() {
    if (!session) return;
    const answeredCount = Object.values(userAnswers).filter(v => v?.trim()).length;
    const unanswered = (session.totalBlanks ?? 0) - answeredCount;
    if (unanswered > 0 && !showSubmitWarning) {
      setShowSubmitWarning(true);
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    submit({ id, userAnswers }, {
      onSuccess: () => router.push(`/practice-test/dictation/${id}/result`),
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
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

  return (
    <div className="max-w-360 mx-auto px-4 pb-24">
      {/* Header Container — sentinel for collapse */}
      <div ref={sentinelRef} className="pt-4 mb-5">
        <button onClick={() => router.push('/practice-test/dictation')} className="mb-3 inline-flex items-center gap-1 text-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          {t('back')}
        </button>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-muted)' }}>{t('eyebrow')}</p>
        <h1 className="text-h2 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{session.video.title}</h1>
        <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('subtitle')}</p>
      </div>

      {videoError ? (
        <VideoUnavailableFallback sessionId={id} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sticky Panel: Video + Controls */}
          <div ref={stickyRef} className="w-full lg:w-100 lg:sticky z-30"
            style={{ top: `${NAVBAR_HEIGHT + 16}px` }}>
            
            <div className="flex flex-col gap-4">
              {/* Video wrapper */}
              <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-white/5 w-full aspect-video">
                <YouTubeEmbed
                  ref={playerRef}
                  youtubeId={session.video.youtubeId}
                  onError={() => setVideoError(true)}
                  onTimeUpdate={handleTimeUpdate}
                  autoPauseSegments={autoPause ? session.segments : undefined}
                  onAutoPaused={(segId) => {
                    setPausedAtSegmentId(segId);
                    setActiveSegmentId(segId);
                  }}
                />
              </div>

              {/* Controls Card */}
              <div className="rounded-2xl border p-4 shadow-xl backdrop-blur-md relative overflow-hidden"
                style={{ 
                  borderColor: 'var(--theme-border)', 
                  backgroundColor: 'var(--theme-bg-card)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.02] blur-3xl -mr-16 -mt-16" style={{ backgroundColor: ACCENT.dictation }} />

                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{t('speedLabel')}</span>
                      {SPEED_OPTIONS.map(s => (
                        <button key={s} type="button" onClick={() => handleSpeedChange(s)}
                          className="mono rounded-[7px] px-2 py-1 text-[11px] font-bold transition-colors"
                          style={speed === s
                            ? { background: ACCENT.dictation, color: 'white', border: `1px solid ${ACCENT.dictation}` }
                            : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>{s}x</button>
                      ))}
                    </div>
                    <span className="mono rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--violet) 16%, transparent)', color: 'var(--violet)' }}>
                      {session.difficulty}
                    </span>
                  </div>

                  {/* Auto-pause + Next segment row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button type="button" onClick={() => setAutoPause(a => !a)} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm" style={autoPause ? { background: ACCENT.dictation, color: 'white' } : { background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                        {autoPause && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-secondary)' }}>{t('autoPause')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePlayNext}
                      className="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors"
                      style={{ background: `color-mix(in srgb, ${ACCENT.dictation} 14%, transparent)`, color: ACCENT.dictation, border: `1px solid color-mix(in srgb, ${ACCENT.dictation} 45%, transparent)` }}
                    >
                      {t('nextSegment')}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>

                  <DictationHeader
                    difficulty={session.difficulty}
                    answeredCount={answeredCount}
                    totalBlanks={session.totalBlanks}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content: Segments List */}
          <div className="flex-1 min-w-0 w-full">
            {showSubmitWarning && (
              <div className="mb-6 p-4 rounded-2xl border flex items-start gap-3 shadow-lg animate-in slide-in-from-top-4 duration-300"
                style={{ borderColor: `${STATUS.warning}44`, backgroundColor: `${STATUS.warning}0A` }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={STATUS.warning} strokeWidth="2.5" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-black" style={{ color: STATUS.warning }}>{t('warnUnansweredTitle', { count: unansweredCount })}</p>
                  <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--theme-text-primary)' }}>{t('warnUnansweredSubtitle')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setShowSubmitWarning(false)}
                    className="text-xs px-3 py-1.5 rounded-xl border font-bold transition-colors hover:bg-white/5"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{t('continueWriting')}</button>
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                    className="text-xs px-4 py-1.5 rounded-xl text-white font-black transition-all hover:scale-105 active:scale-95"
                    style={{ background: GRADIENT.dictation }}>{t('submitNow')}</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {session.segments.map(seg => (
                <DictationSegmentRow
                  key={seg.id}
                  segment={seg}
                  userAnswers={userAnswers}
                  onChange={handleChange}
                  playerRef={playerRef}
                  isActive={seg.id === activeSegmentId}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
