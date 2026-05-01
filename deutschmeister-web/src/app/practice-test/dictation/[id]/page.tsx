'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDictationSession, useAutosaveDictation, useSubmitDictation } from '@/hooks/useDictation';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { DictationSegmentRow } from '@/components/dictation/DictationSegmentRow';
import { DictationHeader } from '@/components/dictation/DictationHeader';
import { VideoUnavailableFallback } from '@/components/dictation/VideoUnavailableFallback';

const AUTOSAVE_DEBOUNCE_MS = 3000;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;
const NAVBAR_HEIGHT = 64;

export default function DictationPlayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const playerRef = useRef<YouTubeEmbedRef | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef(false);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading } = useDictationSession(id);
  const { mutate: autosave } = useAutosaveDictation();
  const { mutate: submit, isPending: isSubmitting } = useSubmitDictation();

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [videoError, setVideoError] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [videoCollapsed, setVideoCollapsed] = useState(false);

  // Hydrate answers from session on load
  useEffect(() => {
    if (session?.userAnswers && Object.keys(userAnswers).length === 0) {
      setUserAnswers(session.userAnswers as Record<string, string>);
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if already graded
  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/dictation/${id}/result`);
    }
  }, [session?.status, id, router]);

  // ── Auto-collapse video when user scrolls past the title sentinel ──
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setVideoCollapsed(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: `-${NAVBAR_HEIGHT}px 0px 0px 0px` },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [session]); // re-attach when session loads

  // ── Smart scroll: scroll active segment into visible area below sticky header ──
  useEffect(() => {
    if (!activeSegmentId) return;

    // Small delay to let the DOM render the highlight first
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-segment-id="${activeSegmentId}"]`) as HTMLElement | null;
      if (!el) return;

      const stickyHeight = stickyRef.current?.offsetHeight ?? 200;
      const topBarrier = NAVBAR_HEIGHT + stickyHeight + 12; // top edge of visible content
      const bottomBarrier = window.innerHeight - 40;        // bottom edge with padding

      const rect = el.getBoundingClientRect();

      // Only scroll if segment is not fully visible in the "content zone"
      if (rect.top < topBarrier || rect.bottom > bottomBarrier) {
        // Scroll so the segment sits just below the sticky header
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
    setUserAnswers(prev => {
      const next = { ...prev, [blankId]: value };
      scheduleAutosave(next);
      return next;
    });
  }

  function handleSpeedChange(rate: number) {
    setSpeed(rate);
    playerRef.current?.setSpeed(rate);
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
      <div className="flex justify-center items-center min-h-64">
        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy phiên làm bài.</p>
      </div>
    );
  }

  const answeredCount = Object.values(userAnswers).filter(v => v?.trim()).length;
  const unanswered = session.totalBlanks - answeredCount;

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Back + title — scrolls away; also acts as sentinel for collapse */}
      <div ref={sentinelRef} className="pt-4 pb-2">
        <button type="button" onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-3"
          style={{ color: 'var(--theme-text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Quay lại
        </button>
        <h1 className="text-base font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
          {session.video.title}
        </h1>
      </div>

      {videoError ? (
        <VideoUnavailableFallback sessionId={id} />
      ) : (
        <>
          {/* ── Sticky panel: video + controls ── */}
          <div
            ref={stickyRef}
            className="sticky z-20 -mx-4 px-4 pb-3"
            style={{ top: `${NAVBAR_HEIGHT}px`, backgroundColor: 'var(--theme-bg-body)' }}
          >
            {/* Video + controls layout: side-by-side when collapsed */}
            <div style={{
              display: 'flex',
              flexDirection: videoCollapsed ? 'row' : 'column',
              gap: videoCollapsed ? '12px' : '0',
              alignItems: videoCollapsed ? 'flex-start' : 'stretch',
              transition: 'gap 0.3s ease',
            }}>
              {/* Video wrapper — shrinks when collapsed */}
              <div
                style={{
                  width: videoCollapsed ? '240px' : '100%',
                  minWidth: videoCollapsed ? '240px' : 'auto',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'width 0.4s ease, min-width 0.4s ease',
                }}
              >
                <YouTubeEmbed
                  ref={playerRef}
                  youtubeId={session.video.youtubeId}
                  onError={() => setVideoError(true)}
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>

              {/* Control bar — expands to fill remaining space when collapsed */}
              <div
                className="rounded-2xl border"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-card)',
                  flex: videoCollapsed ? '1' : 'unset',
                  marginTop: videoCollapsed ? '0' : '8px',
                  padding: '12px',
                  transition: 'margin-top 0.3s ease',
                }}
              >
                {/* Speed buttons */}
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide mr-1"
                    style={{ color: 'var(--theme-text-muted)' }}>
                    Tốc độ
                  </span>
                  {SPEED_OPTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpeedChange(s)}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all"
                      style={{
                        backgroundColor: speed === s ? '#06B6D4' : 'var(--theme-bg-secondary)',
                        color: speed === s ? '#fff' : 'var(--theme-text-secondary)',
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                {/* Progress + submit */}
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

          {/* ── Scrollable content ── */}
          <div className="pb-8">
            {/* Submit warning */}
            {showSubmitWarning && (
              <div className="mb-4 mt-4 p-4 rounded-2xl border flex items-start gap-3"
                style={{ borderColor: '#F59E0B44', backgroundColor: '#F59E0B0D' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
                    Còn {unanswered} chỗ trống chưa điền
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    Các ô trống sẽ tính là sai. Bạn có muốn nộp bài không?
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setShowSubmitWarning(false)}
                    className="text-xs px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                    Tiếp tục
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                    className="text-xs px-3 py-1.5 rounded-lg text-white font-bold disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}>
                    Nộp bài
                  </button>
                </div>
              </div>
            )}

            {/* Segments list */}
            <div className="mt-6 flex flex-col gap-2">
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
        </>
      )}
    </div>
  );
}
