'use client';

import { GrammarLesson } from '@/types/grammar';
import Link from 'next/link';
import { ACCENT, STATUS } from '@/lib/tokens';
import { IconCheck, IconLock } from '@/components/ui/Icons';

interface GrammarLessonCardProps {
  lesson: GrammarLesson;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score?: number;
  };
  locked?: boolean;
  lockedReason?: string;
}

const LEVEL_STYLE = {
  A1: { bg: `${ACCENT.reading}1A`, color: ACCENT.reading, gradient: `linear-gradient(135deg, ${ACCENT.reading}, #16A34A)`, glow: `${ACCENT.reading}40` },
  A2: { bg: `${ACCENT.srs}1A`,     color: ACCENT.srs,     gradient: `linear-gradient(135deg, ${ACCENT.srs}, #2563EB)`,     glow: `${ACCENT.srs}40` },
  B1: { bg: `${ACCENT.xp}1A`,      color: ACCENT.xp,      gradient: `linear-gradient(135deg, ${ACCENT.xp}, #D97706)`,      glow: `${ACCENT.xp}40` },
  B2: { bg: `${ACCENT.vocab}1A`,   color: ACCENT.vocab,   gradient: `linear-gradient(135deg, ${ACCENT.vocab}, #7C3AED)`,   glow: `${ACCENT.vocab}40` },
};

const GrammarLessonCard = ({ lesson, progress, locked, lockedReason }: GrammarLessonCardProps) => {
  const isLocked = locked || lesson.isActive === false;
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const ls = (LEVEL_STYLE as unknown as Record<string, typeof LEVEL_STYLE.A1>)[lesson.level] ?? LEVEL_STYLE.A1;

  const exerciseDone = progress?.score ?? 0;
  const exerciseTotal = lesson.exerciseCount ?? 0;
  const exercisePct = exerciseTotal > 0 ? Math.round((exerciseDone / exerciseTotal) * 100) : 0;

  // The circular node design
  const nodeContent = (
    <div className={`relative flex flex-col items-center group transition-all duration-300 ${isLocked ? 'opacity-60 grayscale' : 'hover:-translate-y-2'}`}>
      
      {/* Outer Ring (Progress or Glow) */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-2"
        style={{
          background: isCompleted ? STATUS.success : isInProgress ? `conic-gradient(${ls.color} ${exercisePct}%, var(--theme-bg-secondary) 0)` : 'var(--theme-bg-secondary)',
          boxShadow: !isLocked ? `0 10px 30px ${ls.glow}` : 'none'
        }}>
        
        {/* Inner Node */}
        <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden bg-white dark:bg-black border-4"
          style={{ borderColor: 'var(--theme-bg-card)' }}>
          <div className="absolute inset-0 opacity-20" style={{ background: ls.gradient }} />
          
          <div className="relative z-10">
            {isLocked ? (
              <IconLock size={28} style={{ color: 'var(--theme-text-muted)' }} />
            ) : isCompleted ? (
              <IconCheck size={36} style={{ color: STATUS.success }} />
            ) : (
              <span className="text-xl font-black" style={{ color: ls.color }}>{lesson.lessonNumber}</span>
            )}
          </div>
        </div>

        {/* Floating badge for score/status */}
        {(!isLocked && (isCompleted || isInProgress)) && (
          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-black rounded-full px-2 py-1 text-[10px] font-black border-2 shadow-lg"
            style={{ borderColor: 'var(--theme-bg-card)', color: isCompleted ? STATUS.success : ls.color }}>
            {isCompleted && progress?.score !== undefined ? `${progress.score}đ` : `${exercisePct}%`}
          </div>
        )}
      </div>

      {/* Label (Title) */}
      <div className="mt-4 text-center max-w-35 sm:max-w-40">
        <h3 className="text-sm sm:text-base font-bold leading-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {lesson.titleVi}
        </h3>
        <p className="text-[10px] sm:text-xs font-medium italic opacity-70" style={{ color: ls.color }}>
          {lesson.titleDe}
        </p>
      </div>
      
      {/* Tooltip for locked reason (visible on hover) */}
      {isLocked && lockedReason && (
        <div className="absolute top-full mt-2 w-48 p-2 rounded-xl text-xs text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg"
          style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
          <IconLock size={12} className="inline mr-1" /> {lockedReason}
        </div>
      )}
    </div>
  );

  if (isLocked) {
    return (
      <div className="cursor-not-allowed">
        {nodeContent}
      </div>
    );
  }

  return (
    <Link href={`/grammar/${lesson.slug}`} className="block outline-none">
      {nodeContent}
    </Link>
  );
};

export default GrammarLessonCard;
