'use client';

import { GrammarLesson } from '@/types/grammar';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { pickField } from '@/i18n/pickLocale';
import { ACCENT, STATUS } from '@/lib/tokens';

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

  const nodeColor = isCompleted ? 'var(--m-learned)' : isInProgress ? 'var(--m-learning)' : isLocked ? 'var(--theme-text-muted)' : levelColor;

  const cardContent = (
    <div
      className={`word-card-v2 group relative rounded-[14px] p-4 ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
        ['--card-accent' as string]: isLocked ? 'var(--theme-border)' : levelColor,
      } as React.CSSProperties}
    >
      <div className="relative z-10 flex items-center gap-4">
        {/* Status node */}
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'v2-node-done' : ''}`}
          style={{
            background: isCompleted ? undefined : isLocked ? 'var(--theme-bg-secondary)' : `color-mix(in srgb, ${nodeColor} 16%, transparent)`,
            color: isCompleted ? 'white' : nodeColor,
            border: isLocked ? '1px dashed var(--theme-border)' : undefined,
          }}
        >
          {isLocked ? <IconLock size={18} /> : isCompleted ? <IconCheck size={20} /> : <span className="mono text-base font-bold">{lesson.lessonNumber}</span>}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: levelColor }}>{lesson.level}</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: statusConfig.bg, color: statusConfig.color, letterSpacing: '.04em' }}>{statusConfig.label}</span>
            {lesson.estimatedMinutes && (
              <span className="mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                {t('minutesShortCard', { min: lesson.estimatedMinutes })}
              </span>
            )}
          </div>

          <p className="font-bold truncate" style={{ fontSize: 16, letterSpacing: '-.01em', color: isLocked ? 'var(--theme-text-secondary)' : 'var(--theme-text-primary)' }}>
            {pickField(lesson, 'title', locale)}
          </p>
          <div className="flex items-center gap-2 text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="italic truncate">{lesson.titleDe}</span>
            {lesson.exerciseCount != null && lesson.exerciseCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                <span className="shrink-0">{t('exerciseCount', { count: lesson.exerciseCount })}</span>
              </>
            )}
          </div>

          {isLocked && lockedReason && (
            <p className="text-caption mt-1.5 font-medium" style={{ color: 'var(--m-learning)' }}>🔒 {lockedReason}</p>
          )}

          {isInProgress && exercisePct > 0 && (
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${exercisePct}%`, background: 'var(--m-learning)' }} />
            </div>
          )}
        </div>

        {/* Score or chevron */}
        {isCompleted && progress?.score !== undefined ? (
          <div className="text-right shrink-0">
            <div className="mono text-2xl font-bold tracking-tight" style={{ color: getScoreColor(progress.score) }}>
              {Math.round(progress.score)}<span className="text-caption ml-0.5">{t('scoreSuffix')}</span>
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
