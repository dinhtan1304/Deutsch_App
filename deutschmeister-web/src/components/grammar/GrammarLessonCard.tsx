'use client';

import { GrammarLesson } from '@/types/grammar';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { pickField } from '@/i18n/pickLocale';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

interface GrammarLessonCardProps {
  lesson: GrammarLesson;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score?: number;
  };
  locked?: boolean;
  lockedReason?: string;
}

const LEVEL_COLOR: Record<string, string> = {
  A1: ACCENT.reading,
  A2: ACCENT.srs,
  B1: ACCENT.xp,
  B2: ACCENT.vocab,
};

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  return STATUS.danger;
}

function IconCheck({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconLock({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconChevronRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

const GrammarLessonCard = ({ lesson, progress, locked, lockedReason }: GrammarLessonCardProps) => {
  const t = useTranslations('vocabulary.grammar');
  const locale = useLocale();
  const isLocked = locked || lesson.isActive === false;
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const levelColor = LEVEL_COLOR[lesson.level] ?? ACCENT.vocab;

  const exercisePct = (() => {
    if (!isInProgress || !progress?.score) return 0;
    return Math.min(Math.round(progress.score), 100);
  })();

  // Status badge config
  const statusConfig = (() => {
    if (isLocked)      return { label: t('statusLocked'),     bg: `${STATUS.danger}15`,   color: STATUS.danger };
    if (isCompleted)   return { label: t('statusCompleted'),  bg: `${STATUS.success}15`, color: STATUS.success };
    if (isInProgress)  return { label: t('statusInProgress'), bg: `${ACCENT.srs}15`,     color: ACCENT.srs };
    return               { label: t('statusNotStarted'), bg: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' };
  })();

  const cardContent = (
    <div
      className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-500 border border-transparent
        ${isLocked ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl hover:border-violet-500/20'}`}
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      {/* Hover aura */}
      {!isLocked && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none"
          style={{ background: GRADIENT.writing }} />
      )}

      <div className="relative z-10 flex items-center gap-4">
        {/* Icon badge */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: isCompleted ? GRADIENT.writing : isLocked ? 'var(--theme-bg-secondary)' : `${levelColor}18`,
            color: isCompleted ? 'white' : isLocked ? 'var(--theme-text-muted)' : levelColor,
            boxShadow: isCompleted ? '0 6px 14px rgba(99,102,241,0.25)' : 'none',
          }}
        >
          {isLocked
            ? <IconLock size={22} />
            : isCompleted
              ? <IconCheck size={22} />
              : <span className="text-lg font-black">{lesson.lessonNumber}</span>
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg text-white shadow-sm"
              style={{ backgroundColor: levelColor }}
            >
              {lesson.level}
            </span>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
            {lesson.estimatedMinutes && (
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                {t('minutesShortCard', { min: lesson.estimatedMinutes })}
              </span>
            )}
          </div>

          {/* Title */}
          <p className="text-base font-black tracking-tight mb-0.5 truncate" style={{ color: 'var(--theme-text-primary)' }}>
            {pickField(lesson, 'title', locale)}
          </p>

          {/* German subtitle + exercise count */}
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--theme-text-primary)', opacity: 0.4 }}>
            <span className="italic normal-case">{lesson.titleDe}</span>
            {lesson.exerciseCount != null && lesson.exerciseCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                <span>{t('exerciseCount', { count: lesson.exerciseCount })}</span>
              </>
            )}
          </div>

          {/* Lock reason — always visible, no hover needed */}
          {isLocked && lockedReason && (
            <p className="text-xs mt-2 font-semibold" style={{ color: STATUS.danger }}>
              🔒 {lockedReason}
            </p>
          )}

          {/* Progress bar if in_progress */}
          {isInProgress && exercisePct > 0 && (
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${exercisePct}%`, background: GRADIENT.writing }} />
            </div>
          )}
        </div>

        {/* Score or chevron */}
        {isCompleted && progress?.score !== undefined ? (
          <div className="text-right shrink-0">
            <div className="text-2xl font-black tracking-tight" style={{ color: getScoreColor(progress.score) }}>
              {Math.round(progress.score)}<span className="text-xs ml-0.5">{t('scoreSuffix')}</span>
            </div>
          </div>
        ) : !isLocked ? (
          <div className="shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
            <IconChevronRight size={18} />
          </div>
        ) : null}
      </div>
    </div>
  );

  if (isLocked) {
    return <div>{cardContent}</div>;
  }

  return (
    <Link href={`/grammar/${lesson.slug}`} className="block outline-none">
      {cardContent}
    </Link>
  );
};

export default GrammarLessonCard;
