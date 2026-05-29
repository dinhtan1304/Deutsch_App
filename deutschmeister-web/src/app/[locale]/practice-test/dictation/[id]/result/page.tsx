'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useDictationSession, useStartDictation } from '@/hooks/useDictation';
import { useStartShadowing } from '@/hooks/useShadowing';
import { DictationSessionGraded, Part } from '@/lib/api/dictation';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { ScoreRing, PageHeader } from '@/components/ui';
import { GRADIENT, ACCENT } from '@/lib/tokens';

type GradingDetail = DictationSessionGraded['gradingDetails'][number];
type GradingMap = Map<string, GradingDetail>;

type GradeKey = 'excellent' | 'veryGood' | 'good' | 'needsWork' | 'keepPracticing';
function getGradeInfo(score: number): { emoji: string; key: GradeKey; color: string } {
  if (score >= 90) return { emoji: '🏆', key: 'excellent',      color: 'var(--color-status-success)' };
  if (score >= 75) return { emoji: '🌟', key: 'veryGood',       color: 'var(--color-status-success)' };
  if (score >= 60) return { emoji: '✓',  key: 'good',           color: 'var(--color-accent-xp)' };
  if (score >= 40) return { emoji: '📖', key: 'needsWork',      color: ACCENT.games };
  return              { emoji: '💪', key: 'keepPracticing', color: 'var(--color-status-danger)' };
}

function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

// Resolve grading data for a blank part — first from the part itself, then from gradingMap fallback
function resolveBlank(part: Part & { type: 'blank' }, gradingMap: GradingMap) {
  if ('isCorrect' in part) {
    return { isCorrect: part.isCorrect, userAnswer: part.userAnswer, correctWord: part.correctWord };
  }
  const d = gradingMap.get(part.blankId);
  if (d) return { isCorrect: d.isCorrect, userAnswer: d.userAnswer, correctWord: d.correctWord };
  return null;
}

function getSegmentStats(
  seg: DictationSessionGraded['segments'][number],
  gradingMap: GradingMap
): { correct: number; total: number; hasWrong: boolean } {
  let correct = 0, total = 0;
  for (const p of seg.parts) {
    if (p.type !== 'blank') continue;
    total++;
    const info = resolveBlank(p as Part & { type: 'blank' }, gradingMap);
    if (info?.isCorrect) correct++;
  }
  return { correct, total, hasWrong: total > 0 && correct < total };
}

function GradedPart({ part, gradingMap }: { part: Part; gradingMap: GradingMap }) {
  if (part.type === 'text') {
    return <span style={{ color: 'var(--theme-text-primary)', opacity: 0.85 }}>{part.text}</span>;
  }

  const info = resolveBlank(part as Part & { type: 'blank' }, gradingMap);

  if (!info) {
    return (
      <span className="inline-block font-bold px-2 py-0.5 rounded-lg text-sm opacity-30"
        style={{ color: 'var(--theme-text-secondary)' }}>—</span>
    );
  }

  if (info.isCorrect) {
    return (
      <span className="inline-block font-bold px-2 py-0.5 rounded-lg text-sm"
        style={{ color: 'var(--color-status-success)', background: 'rgba(34,197,94,0.12)' }}>
        {info.userAnswer}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      <span className="inline-block font-bold px-2 py-0.5 rounded-lg text-sm line-through"
        style={{ color: 'var(--color-status-danger)', background: 'rgba(239,68,68,0.10)' }}>
        {info.userAnswer || '—'}
      </span>
      <span className="text-[10px] opacity-40" style={{ color: 'var(--theme-text-muted)' }}>→</span>
      <span className="inline-block font-bold px-2 py-0.5 rounded-lg text-sm"
        style={{ color: 'var(--color-status-success)', background: 'rgba(34,197,94,0.12)' }}>
        {info.correctWord}
      </span>
    </span>
  );
}

export default function DictationResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.dictation.result');
  const playerRef = useRef<YouTubeEmbedRef | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'wrong'>('all');

  const { data: session, isLoading, isFetching } = useDictationSession(id);
  const { mutate: startSession } = useStartDictation();
  const { mutate: startShadowing } = useStartShadowing();

  // Only redirect when fetch is settled (not mid-flight to avoid DRAFT→GRADED race)
  useEffect(() => {
    if (!isFetching && session && session.status !== 'GRADED') {
      router.replace(`/practice-test/dictation/${id}`);
    }
  }, [session, id, router, isFetching]);

  const handleRetry = () => {
    if (!session) return;
    setIsRetrying(true);
    startSession({ videoId: session.video.id }, {
      onSuccess: (newSession) => router.push(`/practice-test/dictation/${newSession.id}`),
      onSettled: () => setIsRetrying(false),
    });
  };

  const handleShadow = () => {
    if (!session) return;
    startShadowing({ videoId: session.video.id }, {
      onSuccess: (s) => router.push(`/practice-test/dictation/shadow/${s.id}`),
    });
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || session.status !== 'GRADED') return null;

  const graded = session as DictationSessionGraded;
  const { emoji, key: gradeKey, color } = getGradeInfo(graded.score ?? 0);
  const label = t(`grades.${gradeKey}` as 'grades.excellent');

  // Build lookup map once — used as fallback when backend doesn't embed grading into parts
  const gradingMap: GradingMap = new Map(
    (graded.gradingDetails ?? []).map(d => [d.blankId, d])
  );

  const wrongItems = (graded.gradingDetails ?? []).filter(d => !d.isCorrect);
  const hasMistakes = wrongItems.length > 0;
  const wrongSegmentCount = graded.segments.filter(
    seg => getSegmentStats(seg, gradingMap).hasWrong
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20">
      <PageHeader
        backHref="/practice-test/dictation"
        title={t('title')}
        subtitle={graded.video.title}
        accent="listening"
      />

      {/* ── Top row: video | score (50/50) ── */}
      <div className="mt-6 flex flex-col sm:flex-row gap-5">
        <div className="sm:w-1/2 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/20">
          <YouTubeEmbed ref={playerRef} youtubeId={graded.video.youtubeId} />
        </div>
        <div className="sm:w-1/2">
          <ScoreCard graded={graded} emoji={emoji} label={label} color={color}
            onRetry={handleRetry} isRetrying={isRetrying} onShadow={handleShadow} />
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {hasMistakes && <MistakesSummary items={wrongItems} />}
        <div className="space-y-3">
          <h3 className="text-body font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--theme-text-muted)' }}>
            {t('reviewTitle')}
          </h3>
          <SegmentList
            segments={graded.segments}
            gradingMap={gradingMap}
            onPlay={(s, e) => playerRef.current?.playSegment(s, e)}
            filter={segmentFilter}
            onFilterChange={setSegmentFilter}
            wrongSegmentCount={wrongSegmentCount}
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreCard({ graded, emoji, label, color, onRetry, isRetrying, onShadow }: {
  graded: DictationSessionGraded;
  emoji: string; label: string; color: string;
  onRetry: () => void; isRetrying: boolean; onShadow: () => void;
}) {
  const t = useTranslations('practice.dictation.result');
  return (
    <div className="rounded-3xl border p-8 flex flex-col items-center relative overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
      <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: GRADIENT.listening }} />
      <ScoreRing value={graded.score ?? 0} accent="listening" variant="exam" size={150}
        label={`${Math.round(graded.score ?? 0)}%`}
        sublabel={`${graded.correctBlanks ?? 0}/${graded.totalBlanks ?? 0}`} />
      <div className="text-center mt-6">
        <h2 className="text-2xl font-black tracking-tight" style={{ color }}>{emoji} {label}</h2>
      </div>
      <div className="grid grid-cols-1 gap-2 w-full mt-8">
        <button onClick={onRetry} disabled={isRetrying}
          className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/5 transition-all hover:bg-white/10 disabled:opacity-50">
          <IconRetry size={18} />
          <span className="text-xs font-black uppercase tracking-widest">{t('retry')}</span>
        </button>
        <Link href="/practice-test/dictation/library"
          className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/5 transition-all hover:bg-white/10">
          <IconLibrary size={18} />
          <span className="text-xs font-black uppercase tracking-widest">{t('library')}</span>
        </Link>
        <button onClick={onShadow}
          className="flex items-center justify-center gap-3 p-4 rounded-2xl text-white transition-all hover:brightness-110 active:scale-95"
          style={{ background: GRADIENT.reading, boxShadow: '0 8px 20px rgba(34,197,94,0.25)' }}>
          🎤
          <span className="text-xs font-black uppercase tracking-widest">{t('shadowVideo')}</span>
        </button>
      </div>
    </div>
  );
}

function MistakesSummary({
  items,
}: {
  items: Array<{ blankId: string; userAnswer: string; correctWord: string }>;
}) {
  const t = useTranslations('practice.dictation.result');
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border mb-5 overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
        style={{ color: 'var(--theme-text-primary)' }}>
        <div className="flex items-center gap-2">
          <IconAlertTriangle size={16} />
          <span className="text-sm font-bold">{t('mistakesTitle')}</span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--color-status-danger)' }}>
            {items.length}
          </span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="shrink-0 transition-transform"
          style={{ color: 'var(--theme-text-muted)', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
            {items.map(({ blankId, userAnswer, correctWord }) => (
              <div key={blankId}
                className="rounded-xl px-3 py-2.5 flex items-center gap-1.5 min-w-0"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                {userAnswer ? (
                  <span className="font-bold text-sm line-through shrink min-w-0 truncate"
                    style={{ color: 'var(--color-status-danger)' }} title={userAnswer}>
                    {userAnswer}
                  </span>
                ) : (
                  <span className="text-xs italic shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
                    {t('skipped')}
                  </span>
                )}
                <span className="text-[10px] shrink-0 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>→</span>
                <span className="font-bold text-sm px-1.5 py-0.5 rounded-lg shrink-0 truncate max-w-[50%]"
                  style={{ color: 'var(--color-status-success)', background: 'rgba(34,197,94,0.12)' }} title={correctWord}>
                  {correctWord}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentList({ segments, gradingMap, onPlay, filter, onFilterChange, wrongSegmentCount }: {
  segments: DictationSessionGraded['segments'];
  gradingMap: GradingMap;
  onPlay: (startSec: number, endSec: number) => void;
  filter: 'all' | 'wrong';
  onFilterChange: (f: 'all' | 'wrong') => void;
  wrongSegmentCount: number;
}) {
  const t = useTranslations('practice.dictation.result');
  if (!segments || segments.length === 0) {
    return (
      <div className="rounded-2xl border p-8 text-center"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
        <p className="text-sm opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
          {t('noDetail')}
        </p>
      </div>
    );
  }

  const visibleSegments = filter === 'wrong'
    ? segments.filter(seg => getSegmentStats(seg, gradingMap).hasWrong)
    : segments;

  const TABS: { key: 'all' | 'wrong'; label: string }[] = [
    { key: 'all',   label: t('filterAll', { count: segments.length }) },
    { key: 'wrong', label: t('filterWrong', { count: wrongSegmentCount }) },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-4"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => onFilterChange(tab.key)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={filter === tab.key
              ? { background: GRADIENT.listening, color: 'white', boxShadow: '0 2px 8px rgba(236,72,153,0.35)' }
              : { color: 'var(--theme-text-muted)' }
            }>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty filter state */}
      {visibleSegments.length === 0 && (
        <div className="rounded-2xl border p-8 text-center"
          style={{ borderColor: 'rgba(34,197,94,0.25)', backgroundColor: 'rgba(34,197,94,0.05)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-status-success)' }}>
            {t('noErrors')}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visibleSegments.map((seg) => {
          const { correct, total, hasWrong } = getSegmentStats(seg, gradingMap);

          const badgeColor = !hasWrong
            ? 'var(--color-status-success)'
            : correct === 0
            ? 'var(--color-status-danger)'
            : ACCENT.games;
          const badgeBg = !hasWrong
            ? 'rgba(34,197,94,0.12)'
            : correct === 0
            ? 'rgba(239,68,68,0.10)'
            : 'rgba(249,115,22,0.12)';

          return (
            <div key={seg.id}
              className="rounded-2xl border p-4 shadow-sm"
              style={{
                borderColor: hasWrong ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.20)',
                backgroundColor: 'var(--theme-bg-secondary)',
              }}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onPlay(seg.start / 1000, seg.end / 1000)}
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                  style={{ background: 'rgba(236,72,153,0.12)', color: ACCENT.listening }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-0.5 gap-y-2 text-[15px] leading-loose">
                    {seg.parts.map((part, i) => (
                      <GradedPart key={i} part={part} gradingMap={gradingMap} />
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1 pt-1">
                  {total > 0 && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
                      style={{ color: badgeColor, background: badgeBg }}>
                      {t('segmentCorrect', { correct, total })}
                    </span>
                  )}
                  <span className="text-[10px] font-mono opacity-40"
                    style={{ color: 'var(--theme-text-muted)' }}>
                    {formatTimestamp(seg.start)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Icons
function IconRetry({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>;
}
function IconLibrary({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>;
}
function IconAlertTriangle({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 3 22h18a2 2 0 0 0 .73-4Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
