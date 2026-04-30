'use client';

import { GrammarLesson } from '@/types/grammar';
import Link from 'next/link';
import { ACCENT, STATUS } from '@/lib/tokens';
import { IconCheck, IconLock, IconArrowRight, IconRotateCcw } from '@/components/ui/Icons';

interface GrammarLessonCardProps {
  lesson: GrammarLesson;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score?: number;
  };
  locked?: boolean;
  lockedReason?: string;
}

const LEVEL_STYLE: Record<string, { bg: string; color: string; gradient: string; glow: string }> = {
  A1: { bg: `${ACCENT.reading}1A`, color: ACCENT.reading, gradient: `linear-gradient(135deg, ${ACCENT.reading}, #16A34A)`, glow: `${ACCENT.reading}40` },
  A2: { bg: `${ACCENT.srs}1A`,     color: ACCENT.srs,     gradient: `linear-gradient(135deg, ${ACCENT.srs}, #2563EB)`,     glow: `${ACCENT.srs}40` },
  B1: { bg: `${ACCENT.xp}1A`,      color: ACCENT.xp,      gradient: `linear-gradient(135deg, ${ACCENT.xp}, #D97706)`,      glow: `${ACCENT.xp}40` },
  B2: { bg: `${ACCENT.vocab}1A`,   color: ACCENT.vocab,   gradient: `linear-gradient(135deg, ${ACCENT.vocab}, #7C3AED)`,   glow: `${ACCENT.vocab}40` },
};

export const GrammarLessonCard = ({ lesson, progress, locked, lockedReason }: GrammarLessonCardProps) => {
  const isLocked = locked || lesson.isActive === false;
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const ls = LEVEL_STYLE[lesson.level] || LEVEL_STYLE.A1;

  const exerciseDone = progress?.score ?? 0;
  const exerciseTotal = lesson.exerciseCount ?? 0;
  const exercisePct = exerciseTotal > 0 ? Math.round((exerciseDone / exerciseTotal) * 100) : 0;

  const cardContent = (
    <div
      className="group flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300"
      style={{
        borderColor: isCompleted ? `${STATUS.success}4D` : 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        ...(isLocked ? { opacity: 0.7 } : {}),
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ background: ls.gradient }} />

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Meta row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: ls.bg, color: ls.color }}>
              {lesson.level}
            </span>
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              · Bài {lesson.lessonNumber}
            </span>
          </div>

          {isLocked ? (
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              <IconLock size={12} />
            </span>
          ) : isCompleted ? (
            <div className="flex items-center gap-1 shrink-0">
              {progress?.score !== undefined && (
                <span className="text-[10px] font-bold" style={{ color: STATUS.success }}>{progress.score}đ</span>
              )}
              <span className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${STATUS.success}1F`, color: STATUS.success }}>
                <IconCheck size={12} />
              </span>
            </div>
          ) : isInProgress ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${ACCENT.srs}1F`, color: ACCENT.srs }}>
              Đang học
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold leading-snug mb-0.5 transition-colors duration-200"
          style={{ color: 'var(--theme-text-primary)' }}>
          {lesson.titleVi}
        </h3>
        <p className="text-xs font-medium italic mb-3" style={{ color: ls.color }}>
          {lesson.titleDe}
        </p>

        {/* Objectives */}
        {lesson.objectives?.vi?.length > 0 && (
          <ul className="space-y-1 flex-1">
            {lesson.objectives.vi.slice(0, 2).map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-xs"
                style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="w-1 h-1 rounded-full mt-[5px] shrink-0" style={{ backgroundColor: ls.color }} />
                {obj}
              </li>
            ))}
            {lesson.objectives.vi.length > 2 && (
              <li className="text-[10px] italic pl-3" style={{ color: 'var(--theme-text-muted)' }}>
                +{lesson.objectives.vi.length - 2} mục tiêu khác
              </li>
            )}
          </ul>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t"
          style={{ borderColor: 'var(--theme-border)' }}>
          {isLocked ? (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
              <IconLock size={11} />
              {lockedReason
                ? <span className="truncate max-w-[180px]">{lockedReason}</span>
                : 'Hoàn thành bài trước'}
            </span>
          ) : (
            <>
              {/* Mini exercise progress */}
              {exerciseTotal > 0 && (
                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${exercisePct}%`, background: isCompleted ? STATUS.success : ls.gradient }} />
                  </div>
                  <span>{exerciseDone}/{exerciseTotal}</span>
                </div>
              )}

              {/* CTA badge */}
              <span className="flex items-center gap-1 text-xs font-semibold shrink-0 ml-auto transition-transform duration-200 group-hover:translate-x-0.5"
                style={{ color: isCompleted ? 'var(--theme-text-muted)' : ls.color }}>
                {isCompleted ? <><IconRotateCcw size={12} /> Ôn tập</> : isInProgress ? <>Tiếp tục <IconArrowRight size={12} /></> : <>Bắt đầu <IconArrowRight size={12} /></>}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return (
      <div className="cursor-not-allowed" title={lockedReason}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/grammar/${lesson.slug}`}
      className="block group outline-none rounded-2xl"
      style={{ '--glow': ls.glow } as React.CSSProperties}
    >
      <style>{`
        a[href*="/grammar/"]:hover > div {
          border-color: var(--glow);
          box-shadow: 0 4px 20px var(--glow);
          transform: translateY(-2px);
        }
      `}</style>
      {cardContent}
    </Link>
  );
};
