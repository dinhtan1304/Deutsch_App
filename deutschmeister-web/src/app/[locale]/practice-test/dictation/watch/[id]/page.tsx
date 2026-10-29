'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { SubtitleText } from '@/components/dictation/SubtitleText';
import { VideoQuiz } from '@/components/dictation/VideoQuiz';
import { Card, useToast } from '@/components/ui';
import {
  useWatchVideo,
  useSavedSentences,
  useSaveSentence,
  useDeleteSavedSentence,
} from '@/hooks/useDictation';
import { useSegmentTranslations } from '@/hooks/useSegmentTranslations';
import { ACCENT, STATUS } from '@/lib/tokens';
import type { TranscriptSegment } from '@/lib/api/dictation';

const SPEEDS = [0.5, 0.75, 1, 1.25] as const;
// Current-sentence text size steps (design-system type scale).
const FONT_STEPS = ['text-body', 'text-lead', 'text-h3', 'text-h2', 'text-h1'] as const;
const DEFAULT_FONT_STEP = 2;
const FONT_KEY = 'dm-watch-font';
const VI_KEY = 'dm-watch-vi';
const HINT_KEY = 'dm-watch-hint-closed';

function readPref(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writePref(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

function formatTimestamp(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

/** Index of the segment playing at `ms`, or the last one that started before it. */
function findSegmentIndex(segments: TranscriptSegment[], ms: number): number {
  let lo = 0, hi = segments.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid]!.start <= ms) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

// ─── Icons ─────────────────────────────────────────────────────────────────

const svgProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const IconPrev = () => <svg {...svgProps}><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" /></svg>;
const IconNext = () => <svg {...svgProps}><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>;
const IconPlay = () => <svg {...svgProps}><polygon points="6 3 20 12 6 21 6 3" /></svg>;
const IconPause = () => <svg {...svgProps}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
const IconBookmark = ({ filled }: { filled: boolean }) => (
  <svg {...svgProps} fill={filled ? 'currentColor' : 'none'}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
);
const IconClose = () => <svg {...svgProps} width={14} height={14} strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

function ControlButton({ label, onClick, active, children }: {
  label: string; onClick: () => void; active?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-md border px-2 text-caption font-semibold transition-colors hover:bg-(--theme-bg-secondary)"
      style={active
        ? { background: ACCENT.listening, borderColor: ACCENT.listening, color: 'white' }
        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
    >
      {children}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function DictationWatchPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const t = useTranslations('practice.dictation.watch');
  const toast = useToast();

  const { data: video, isLoading } = useWatchVideo(id);
  const segments = useMemo(() => video?.segments ?? [], [video?.segments]);

  const startSec = useMemo(() => {
    const raw = Number(searchParams.get('t'));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }, [searchParams]);

  const playerRef = useRef<YouTubeEmbedRef | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  // -1 until the player reports a time; before that a ?t= deep link
  // (from saved sentences) decides which segment is highlighted.
  const [playerIndex, setActiveIndex] = useState(-1);
  const activeIndex = playerIndex >= 0 || !startSec || !segments.length
    ? playerIndex
    : findSegmentIndex(segments, startSec * 1000);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [fontStep, setFontStep] = useState(DEFAULT_FONT_STEP);
  const [showVi, setShowVi] = useState(true);
  const [hintClosed, setHintClosed] = useState(true);
  const [asrClosed, setAsrClosed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Per-viewer preferences — read after mount to keep SSR markup stable.
  useEffect(() => {
    const f = Number(readPref(FONT_KEY));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage read on mount
    if (Number.isInteger(f) && f >= 0 && f < FONT_STEPS.length) setFontStep(f);
    setShowVi(readPref(VI_KEY) !== '0');
    setHintClosed(readPref(HINT_KEY) === '1');
  }, []);

  const viMap = useSegmentTranslations(id, segments, Math.max(activeIndex, 0), showVi);

  const { data: savedData } = useSavedSentences({ videoId: id, limit: 100 });
  const savedBySegment = useMemo(
    () => new Map((savedData?.items ?? []).map(s => [s.segmentId, s.id])),
    [savedData?.items],
  );
  const { mutate: saveSentence } = useSaveSentence();
  const { mutate: deleteSaved } = useDeleteSavedSentence();

  const current = activeIndex >= 0 ? segments[activeIndex] : undefined;
  const nearEnd = segments.length > 0 && activeIndex >= segments.length - 2;

  const handleTimeUpdate = useCallback((sec: number) => {
    const idx = findSegmentIndex(segments, sec * 1000);
    setActiveIndex(prev => (prev === idx ? prev : idx));
  }, [segments]);

  const goTo = useCallback((idx: number) => {
    const seg = segments[idx];
    if (!seg) return;
    setActiveIndex(idx);
    playerRef.current?.seekTo(seg.start / 1000);
  }, [segments]);

  const step = useCallback((delta: number) => {
    goTo(Math.min(segments.length - 1, Math.max(0, (activeIndex < 0 ? 0 : activeIndex) + delta)));
  }, [activeIndex, goTo, segments.length]);

  const toggleSave = useCallback(() => {
    const seg = current ?? segments[0];
    if (!seg) return;
    const savedId = savedBySegment.get(seg.id);
    const onError = () => toast.show({ title: t('saveError'), kind: 'danger' });
    if (savedId) deleteSaved(savedId, { onError });
    else saveSentence({ videoId: id, segmentId: seg.id, textVi: viMap[seg.id] || undefined }, { onError });
  }, [current, segments, savedBySegment, deleteSaved, saveSentence, id, viMap, toast, t]);

  const changeFont = useCallback((delta: number) => {
    setFontStep(prev => {
      const next = Math.min(FONT_STEPS.length - 1, Math.max(0, prev + delta));
      writePref(FONT_KEY, String(next));
      return next;
    });
  }, []);

  const cycleSpeed = useCallback(() => {
    const next = SPEEDS[(SPEEDS.indexOf(speed as typeof SPEEDS[number]) + 1) % SPEEDS.length] ?? 1;
    setSpeed(next);
    playerRef.current?.setSpeed(next);
  }, [speed]);

  function toggleVi() {
    setShowVi(v => { writePref(VI_KEY, v ? '0' : '1'); return !v; });
  }

  function closeHint() {
    setHintClosed(true);
    writePref(HINT_KEY, '1');
  }

  // Keyboard shortcuts — A/S/D/R, −/+ (ignored while typing or with modifiers).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target) || quizOpen) return;
      const key = e.key.toLowerCase();
      if (key === 'a') step(-1);
      else if (key === 'd') step(1);
      else if (key === 's') playerRef.current?.togglePlay();
      else if (key === 'r') toggleSave();
      else if (key === '-' || key === '_') changeFont(-1);
      else if (key === '+' || key === '=') changeFont(1);
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, toggleSave, changeFont, quizOpen]);

  // Keep the active row visible inside the transcript list (not the page).
  useEffect(() => {
    const list = listRef.current;
    if (!list || activeIndex < 0) return;
    const row = list.querySelector<HTMLElement>(`[data-seg-index="${activeIndex}"]`);
    if (!row) return;
    const top = row.offsetTop; // list is `relative`, so this is list-relative
    if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3), behavior: 'smooth' });
    }
  }, [activeIndex]);

  // Clicking a word opens the dictionary popup — pause so the learner can read.
  const pauseOnWordClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.wh-word')) playerRef.current?.pause();
  }, []);

  function replayFromQuiz(segmentId: string) {
    const seg = segments.find(s => s.id === segmentId);
    if (!seg) return;
    setQuizOpen(false);
    playerRef.current?.playSegment(seg.start / 1000, seg.end / 1000);
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4"
          style={{ borderColor: `${ACCENT.listening}33`, borderTopColor: ACCENT.listening }} />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-body font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{t('notFound')}</p>
        <Link href="/practice-test/dictation/library?mode=watch" className="text-body font-semibold" style={{ color: ACCENT.listening }}>
          {t('chooseOther')}
        </Link>
      </div>
    );
  }

  const currentSaved = current ? savedBySegment.has(current.id) : false;

  return (
    <div className="mx-auto max-w-360 px-4 pb-28 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 pt-4 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link href="/practice-test/dictation/library?mode=watch"
            className="mb-2 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70"
            style={{ color: ACCENT.listening }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            {t('back')}
          </Link>
          <h1 className="text-h2 font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>{video.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="mono rounded-sm px-1.5 py-0.5 font-bold text-white" style={{ background: ACCENT.listening }}>{video.cefrLevel}</span>
            {video.channelName && <span>{video.channelName}</span>}
            {video.topic && <span>· {video.topic}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/practice-test/dictation/saved"
            className="inline-flex h-10 items-center rounded-md border px-3 text-caption font-semibold"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', background: 'var(--theme-bg-card)' }}>
            {t('savedCount', { count: savedBySegment.size })}
          </Link>
          <button type="button" onClick={() => setQuizOpen(true)} disabled={!segments.length}
            className="inline-flex h-10 items-center rounded-md px-4 text-caption font-semibold text-white disabled:opacity-40"
            style={{ background: ACCENT.listening }}>
            {t('quizCta')}
          </button>
        </div>
      </div>

      {!hintClosed && (
        <div className="mb-4 flex items-start gap-3 rounded-md border px-4 py-3"
          style={{ background: `${STATUS.info}12`, borderColor: `${STATUS.info}33` }}>
          <p className="flex-1 text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            <span className="hidden lg:inline">{t('shortcutsHint')}</span>
            <span className="lg:hidden">{t('shortcutsHintTouch')}</span>
          </p>
          <button type="button" onClick={closeHint} aria-label={t('dismiss')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-(--theme-bg-secondary)"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconClose />
          </button>
        </div>
      )}

      {video.transcriptSource === 'ai' && !asrClosed && (
        <div className="mb-4 flex items-start gap-3 rounded-md border px-4 py-3"
          style={{ background: `${STATUS.warning}12`, borderColor: `${STATUS.warning}33` }}>
          <div className="flex-1">
            <p className="text-caption font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t('asrTitle')}</p>
            <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{t('asrText')}</p>
          </div>
          <button type="button" onClick={() => setAsrClosed(true)} aria-label={t('dismiss')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-(--theme-bg-secondary)"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconClose />
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: video + current sentence + controls */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-20">
          <div className="aspect-video overflow-hidden rounded-md border bg-black/40" style={{ borderColor: 'var(--theme-border)' }}>
            {videoError ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('videoUnavailable')}</p>
                <Link href="/practice-test/dictation/library?mode=watch" className="text-body font-semibold" style={{ color: ACCENT.listening }}>
                  {t('chooseOther')}
                </Link>
              </div>
            ) : (
              <YouTubeEmbed
                ref={playerRef}
                youtubeId={video.youtubeId}
                startSec={startSec}
                onError={() => setVideoError(true)}
                onTimeUpdate={handleTimeUpdate}
                onPlayingChange={setPlaying}
              />
            )}
          </div>

          <Card variant="bordered" className="p-4">
            <div className="min-h-20" onClickCapture={pauseOnWordClick}>
              {current ? (
                <>
                  <p className={`${FONT_STEPS[fontStep]} font-semibold leading-snug`} style={{ color: 'var(--theme-text-primary)' }}>
                    <SubtitleText text={current.text} />
                  </p>
                  {showVi && viMap[current.id] && (
                    <p className="mt-2 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{viMap[current.id]}</p>
                  )}
                </>
              ) : (
                <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
                  {segments.length ? t('waiting') : t('emptyTranscript')}
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ControlButton label={t('prev')} onClick={() => step(-1)}><IconPrev /></ControlButton>
              <ControlButton label={t('playPause')} onClick={() => playerRef.current?.togglePlay()} active={playing}>
                {playing ? <IconPause /> : <IconPlay />}
              </ControlButton>
              <ControlButton label={t('next')} onClick={() => step(1)}><IconNext /></ControlButton>
              <ControlButton label={t('save')} onClick={toggleSave} active={currentSaved}>
                <IconBookmark filled={currentSaved} />
                <span>{currentSaved ? t('savedShort') : t('saveShort')}</span>
              </ControlButton>
              <span className="mx-1 h-6 w-px" style={{ background: 'var(--theme-border)' }} />
              <ControlButton label={t('speed')} onClick={cycleSpeed}><span className="mono">{speed}x</span></ControlButton>
              <ControlButton label={t('fontDown')} onClick={() => changeFont(-1)}>A−</ControlButton>
              <ControlButton label={t('fontUp')} onClick={() => changeFont(1)}>A+</ControlButton>
              <ControlButton label={showVi ? t('hideVi') : t('showVi')} onClick={toggleVi} active={showVi}>VI</ControlButton>
            </div>
          </Card>

          {nearEnd && !quizOpen && (
            <Card variant="bordered" className="flex items-center justify-between gap-3 p-4" style={{ borderColor: ACCENT.listening }}>
              <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('quizHint')}</p>
              <button type="button" onClick={() => setQuizOpen(true)}
                className="inline-flex h-10 shrink-0 items-center rounded-md px-4 text-caption font-semibold text-white"
                style={{ background: ACCENT.listening }}>
                {t('quizCta')}
              </button>
            </Card>
          )}
        </div>

        {/* Right: full transcript */}
        <Card variant="bordered" className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--theme-border)' }}>
            <h2 className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t('transcriptTitle')}</h2>
            <button type="button" onClick={() => setShowAll(v => !v)} className="text-caption font-semibold lg:hidden" style={{ color: ACCENT.listening }}>
              {showAll ? t('hideAll') : t('showAll')}
            </button>
          </div>
          <div ref={listRef} onClickCapture={pauseOnWordClick}
            className={`relative overflow-y-auto ${showAll ? 'max-h-none' : 'max-h-80'} lg:max-h-150`}>
            {segments.map((seg, i) => {
              const isActive = i === activeIndex;
              return (
                <div
                  key={seg.id}
                  data-seg-index={i}
                  role="button"
                  tabIndex={0}
                  onClick={e => { if (!(e.target as HTMLElement).closest('.wh-word')) goTo(i); }}
                  onKeyDown={e => { if (e.key === 'Enter') goTo(i); }}
                  className="flex cursor-pointer gap-3 border-l-2 px-4 py-2.5 transition-colors hover:bg-(--theme-bg-secondary)"
                  style={{
                    borderLeftColor: isActive ? ACCENT.listening : 'transparent',
                    background: isActive ? `${ACCENT.listening}14` : undefined,
                  }}
                >
                  <span className="mono w-10 shrink-0 pt-0.5 text-caption" style={{ color: isActive ? ACCENT.listening : 'var(--theme-text-muted)' }}>
                    {formatTimestamp(seg.start)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body leading-relaxed" style={{ color: isActive ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)' }}>
                      <SubtitleText text={seg.text} />
                    </p>
                    {showVi && viMap[seg.id] && (
                      <p className="mt-0.5 text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{viMap[seg.id]}</p>
                    )}
                  </div>
                  {savedBySegment.has(seg.id) && (
                    <span className="shrink-0 pt-0.5" style={{ color: ACCENT.listening }}><IconBookmark filled /></span>
                  )}
                </div>
              );
            })}
          </div>
          {showVi && (
            <p className="border-t px-4 py-2 text-caption" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              {t('viNotice')}
            </p>
          )}
        </Card>
      </div>

      <VideoQuiz videoId={id} open={quizOpen} onClose={() => setQuizOpen(false)} onReplay={replayFromQuiz} />
    </div>
  );
}
