'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDictationSession, useAutosaveDictation, useSubmitDictation } from '@/hooks/useDictation';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { DictationSegmentRow } from '@/components/dictation/DictationSegmentRow';
import { DictationHeader } from '@/components/dictation/DictationHeader';
import { VideoUnavailableFallback } from '@/components/dictation/VideoUnavailableFallback';
import { STATUS, ACCENT, GRADIENT } from '@/lib/tokens';
import { PageHeader } from '@/components/ui';

const AUTOSAVE_DEBOUNCE_MS = 3000;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;
const NAVBAR_HEIGHT = 64;

const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab,
};

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

  const [localAnswers, setLocalAnswers] = useState<Record<string, string> | null>(null);
  const userAnswers = localAnswers ?? (session?.userAnswers as Record<string, string> | undefined) ?? {};
  const [videoError, setVideoError] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);

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
        <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy phiên làm bài.</p>
      </div>
    );
  }

  const answeredCount = Object.values(userAnswers).filter(v => v?.trim()).length;
  const unansweredCount = session.totalBlanks - answeredCount;

  return (
    <div className="pb-24">
      {/* Header Container — sentinel for collapse */}
      <div ref={sentinelRef} className="pt-2">
        <PageHeader
          backHref="/practice-test/dictation"
          title={session.video.title}
          subtitle="Nghe video và điền các từ còn thiếu trong phụ đề"
          accent="listening"
        />
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
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest mr-1 opacity-50" style={{ color: 'var(--theme-text-primary)' }}>Tốc độ</span>
                      {SPEED_OPTIONS.map(s => (
                        <button key={s} type="button" onClick={() => handleSpeedChange(s)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${speed === s ? 'text-white' : 'hover:bg-white/5'}`}
                          style={{
                            backgroundColor: speed === s ? ACCENT.dictation : 'transparent',
                            color: speed === s ? 'white' : 'var(--theme-text-secondary)',
                          }}>{s}x</button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white/5 border border-white/10" style={{ color: CEFR_COLORS[session.difficulty] }}>
                         {session.difficulty}
                       </span>
                    </div>
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
                  <p className="text-sm font-black" style={{ color: STATUS.warning }}>Còn {unansweredCount} ô chưa hoàn thành</p>
                  <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--theme-text-primary)' }}>Những ô này sẽ tính là không chính xác. Bạn có muốn nộp bài?</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setShowSubmitWarning(false)}
                    className="text-xs px-3 py-1.5 rounded-xl border font-bold transition-colors hover:bg-white/5"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>Tiếp tục viết</button>
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                    className="text-xs px-4 py-1.5 rounded-xl text-white font-black transition-all hover:scale-105 active:scale-95"
                    style={{ background: GRADIENT.dictation }}>Nộp ngay</button>
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
