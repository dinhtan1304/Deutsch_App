'use client';

import { GrammarLesson } from '@/types/grammar';
import Link from 'next/link';
import { IconCheck, IconLock, IconArrowRight, IconRotateCcw } from '@/components/ui/Icons';

interface GrammarLessonCardProps {
  lesson: GrammarLesson;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score?: number;
  };
}

const LEVEL_STYLE: Record<string, { bg: string; color: string; gradient: string }> = {
  A1: { bg: 'rgba(34,197,94,.12)',  color: '#16A34A', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)' },
  A2: { bg: 'rgba(59,130,246,.12)', color: '#2563EB', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
  B1: { bg: 'rgba(245,158,11,.12)', color: '#D97706', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  B2: { bg: 'rgba(139,92,246,.12)', color: '#7C3AED', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
};

export const GrammarLessonCard = ({ lesson, progress }: GrammarLessonCardProps) => {
  const isLocked = lesson.isActive === false;
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const levelStyle = LEVEL_STYLE[lesson.level] || LEVEL_STYLE.A1;

  return (
    <div
      className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        borderColor: isCompleted ? 'rgba(34,197,94,.25)' : 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Colored top bar */}
      <div className="h-1 w-full" style={{ background: levelStyle.gradient }} />

      {/* Card body */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Level + number badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
              style={{ backgroundColor: levelStyle.bg, color: levelStyle.color }}>
              {lesson.level}
            </span>
            <span className="text-[12px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              Bài {lesson.lessonNumber}
            </span>
          </div>

          {/* Status indicator */}
          {isCompleted && (
            <div className="flex items-center gap-1.5 shrink-0">
              {progress?.score !== undefined && (
                <span className="text-[11px] font-bold" style={{ color: '#22C55E' }}>
                  {progress.score} điểm
                </span>
              )}
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(34,197,94,.12)', color: '#22C55E' }}>
                <IconCheck size={13} />
              </span>
            </div>
          )}
          {isInProgress && !isCompleted && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(59,130,246,.12)', color: '#2563EB' }}>
              Đang học
            </span>
          )}
        </div>

        {/* Titles */}
        <h3 className="text-[15px] font-bold mb-0.5" style={{ color: 'var(--theme-text-primary)' }}>
          {lesson.titleVi}
        </h3>
        <p className="text-[12px] mb-3 font-medium italic" style={{ color: levelStyle.color }}>
          {lesson.titleDe}
        </p>

        {/* Objectives */}
        {lesson.objectives?.vi?.length > 0 && (
          <ul className="space-y-1">
            {lesson.objectives.vi.slice(0, 2).map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]"
                style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: levelStyle.color }} />
                {obj}
              </li>
            ))}
            {lesson.objectives.vi.length > 2 && (
              <li className="text-[11px] italic pl-3.5" style={{ color: 'var(--theme-text-muted)' }}>
                + {lesson.objectives.vi.length - 2} mục tiêu khác
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
        {isLocked ? (
          <div className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            <IconLock size={14} /> Đang khóa
          </div>
        ) : (
          <Link href={`/grammar/${lesson.slug}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={isCompleted ? {
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-secondary)',
              border: '1.5px solid var(--theme-border)',
            } : {
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139,92,246,.25)',
            }}>
            {isCompleted
              ? <><IconRotateCcw size={14} /> Ôn tập lại</>
              : isInProgress
              ? <>Tiếp tục <IconArrowRight size={14} /></>
              : <>Bắt đầu học <IconArrowRight size={14} /></>
            }
          </Link>
        )}
      </div>
    </div>
  );
};
