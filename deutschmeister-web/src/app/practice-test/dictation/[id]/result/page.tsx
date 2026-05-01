'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDictationSession, useStartDictation } from '@/hooks/useDictation';
import { DictationSessionGraded, Part } from '@/lib/api/dictation';
import { YouTubeEmbed, YouTubeEmbedRef } from '@/components/dictation/YouTubeEmbed';
import { ScoreRing } from '@/components/ui';
import { STATUS, GRADIENT, ACCENT } from '@/lib/tokens';

const GRADIENT_STR = GRADIENT.dictation;
const COLOR = ACCENT.dictation;

function getGradeInfo(score: number): { emoji: string; label: string; color: string } {
  if (score >= 90) return { emoji: '🏆', label: 'Xuất sắc!',         color: STATUS.success };
  if (score >= 75) return { emoji: '🌟', label: 'Rất tốt!',          color: STATUS.success };
  if (score >= 60) return { emoji: '✓',  label: 'Bestanden! 💪',      color: STATUS.warning };
  if (score >= 40) return { emoji: '📖', label: 'Cần cố gắng thêm',   color: ACCENT.games };
  return              { emoji: '💪', label: 'Hãy ôn luyện thêm',  color: STATUS.danger };
}

function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function GradedPart({ part }: { part: Part }) {
  if (part.type === 'text') {
    return <span>{part.text}</span>;
  }

  if ('isCorrect' in part) {
    const color = part.isCorrect ? STATUS.success : STATUS.danger;
    return (
      <span className="inline-flex flex-col items-center gap-0.5 mx-0.5">
        <span
          className="inline-block text-center font-semibold border-b-2 px-1 leading-tight"
          style={{ color, borderColor: color, minWidth: `${(part.displayLength || 6) + 1}ch` }}
        >
          {part.userAnswer || '—'}
        </span>
        {!part.isCorrect && (
          <span className="text-[11px]" style={{ color: STATUS.success }}>{part.correctWord}</span>
        )}
      </span>
    );
  }

  // Blank without grading info (shouldn't happen in GRADED, but safe fallback)
  return (
    <span className="inline-block px-1 font-semibold border-b-2"
      style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
      —
    </span>
  );
}

export default function DictationResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const playerRef = useRef<YouTubeEmbedRef | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const { data: session, isLoading } = useDictationSession(id);
  const { mutate: startSession } = useStartDictation();

  useEffect(() => {
    if (session && session.status !== 'GRADED') {
      router.replace(`/practice-test/dictation/${id}`);
    }
  }, [session, id, router]);

  function handleRetry() {
    if (!session) return;
    setIsRetrying(true);
    startSession({ videoId: session.video.id }, {
      onSuccess: (newSession) => router.push(`/practice-test/dictation/${newSession.id}`),
      onSettled: () => setIsRetrying(false),
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (!session || session.status !== 'GRADED') return null;

  const graded = session as DictationSessionGraded;
  const { emoji, label, color } = getGradeInfo(graded.score);

  return (
    <div className="py-6 max-w-3xl mx-auto px-4">
      {/* Back */}
      <button type="button" onClick={() => router.replace('/practice-test/dictation')}
        className="flex items-center gap-1.5 text-sm mb-5"
        style={{ color: 'var(--theme-text-muted)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Chép chính tả
      </button>

      {/* Score card */}
      <div className="rounded-2xl border p-6 flex flex-col items-center gap-4 mb-6"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

        <ScoreRing value={graded.score} accent="dictation" variant="exam" size={140}
          label={`${graded.score.toFixed(1)}%`}
          sublabel={`${graded.correctBlanks}/${graded.totalBlanks}`} />

        <div className="text-center">
          <p className="text-2xl font-black" style={{ color }}>{emoji} {label}</p>
          <p className="text-sm mt-1 truncate max-w-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {graded.video.title}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          {[
            { label: 'Đúng',    value: `${graded.correctBlanks}/${graded.totalBlanks}` },
            { label: 'Cấp độ',  value: graded.difficulty },
            { label: 'XP',      value: '+25' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center border"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              <p className="text-base font-bold" style={{ color: COLOR }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-center border transition-colors disabled:opacity-60"
          style={{ borderColor: COLOR, color: COLOR }}>
          {isRetrying ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Đang tạo...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Làm lại bài này
            </span>
          )}
        </button>
        <Link
          href="/practice-test/dictation/library"
          className="flex-1 py-3 rounded-xl text-sm font-bold text-center border transition-colors"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          Chọn video khác
        </Link>
        <button
          type="button"
          onClick={() => router.push('/practice-test/dictation')}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: GRADIENT_STR }}>
          Về trang chính
        </button>
      </div>

      {/* YouTube player for replay */}
      <div className="mb-6">
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wide"
          style={{ color: 'var(--theme-text-muted)' }}>
          Nghe lại video
        </h2>
        <YouTubeEmbed
          ref={playerRef}
          youtubeId={graded.video.youtubeId}
        />
      </div>

      {/* Segment review */}
      <h2 className="text-sm font-bold mb-3 uppercase tracking-wide"
        style={{ color: 'var(--theme-text-muted)' }}>
        Xem lại từng câu
      </h2>

      <div className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        {graded.segments.map((seg) => {
          const hasWrong = seg.parts.some(p => p.type === 'blank' && 'isCorrect' in p && !p.isCorrect);
          return (
            <div key={seg.id}
              className="px-4 py-3 border-b last:border-b-0 flex items-start gap-3 group"
              style={{ borderColor: 'var(--theme-border)' }}>
              {/* Play button — click to replay segment */}
              <button
                type="button"
                title="Nghe lại câu này"
                onClick={() => playerRef.current?.playSegment(seg.start / 1000, seg.end / 1000)}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors mt-0.5"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: COLOR }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#06B6D41A')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </button>

              {/* Status icon */}
              <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white mt-0.5"
                style={{ background: hasWrong ? STATUS.danger : STATUS.success }}>
                {hasWrong ? '✗' : '✓'}
              </span>

              {/* Sentence */}
              <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-1 gap-y-1 text-sm leading-loose">
                {seg.parts.map((part, i) => (
                  <GradedPart key={i} part={part} />
                ))}
              </div>

              {/* Timestamp */}
              <button
                type="button"
                title="Nhảy tới vị trí này"
                onClick={() => playerRef.current?.seekTo(seg.start / 1000)}
                className="shrink-0 text-[11px] font-mono mt-1 transition-colors"
                style={{ color: 'var(--theme-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = COLOR)}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--theme-text-muted)')}
              >
                {formatTimestamp(seg.start)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
