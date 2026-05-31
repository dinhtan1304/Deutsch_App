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
  /** Last lesson in its group → no connecting line below the node. */
  isLast?: boolean;
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

const GrammarLessonCard = ({ lesson, progress, locked, lockedReason, isLast }: GrammarLessonCardProps) => {
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

  const statusConfig = (() => {
    if (isLocked)      return { label: t('statusLocked'),     bg: `${STATUS.danger}15`,   color: STATUS.danger };
    if (isCompleted)   return { label: t('statusCompleted'),  bg: `${STATUS.success}15`, color: STATUS.success };
    if (isInProgress)  return { label: t('statusInProgress'), bg: `${ACCENT.srs}15`,     color: ACCENT.srs };
    return               { label: t('statusNotStarted'), bg: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' };
  })();

  const nodeColor = isCompleted ? 'var(--m-learned)' : isInProgress ? 'var(--m-learning)' : isLocked ? 'var(--theme-text-muted)' : levelColor;
  const cta = isCompleted ? t('ctaReview') : isInProgress ? t('ctaContinue') : t('ctaStart');
  // Objectives → preview chips (locale-aware, 3 max).
  const objectives = (lesson.objectives?.[locale as 'vi' | 'en' | 'de'] ?? lesson.objectives?.vi ?? []).slice(0, 3);

  // Left rail: status node + connecting line (path metaphor).
  const rail = (
    <div className="flex flex-col items-center shrink-0 pt-0.5">
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center ${isCompleted ? 'v2-node-done' : ''}`}
        style={{
          background: isCompleted ? undefined : isLocked ? 'var(--theme-bg-secondary)' : `color-mix(in srgb, ${nodeColor} 16%, transparent)`,
          color: isCompleted ? 'white' : nodeColor,
          border: isLocked ? '1px dashed var(--theme-border)' : undefined,
        }}
      >
        {isLocked ? <IconLock size={18} /> : isCompleted ? <IconCheck size={20} /> : <span className="mono text-base font-bold">{lesson.lessonNumber}</span>}
      </div>
      {!isLast && (
        <div className="w-0.5 flex-1 mt-1.5 rounded-full" style={{ minHeight: 48, background: isCompleted || isInProgress ? nodeColor : 'var(--theme-border)', opacity: isCompleted || isInProgress ? 0.7 : 0.5 }} />
      )}
    </div>
  );

  const card = (
    <div
      className={`word-card-v2 flex-1 min-w-0 rounded-[14px] p-4 mb-3 ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
        ['--card-accent' as string]: isLocked ? 'var(--theme-border)' : levelColor,
      } as React.CSSProperties}
    >
      {/* Top: badges + title + CTA */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: levelColor }}>{lesson.level}</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: statusConfig.bg, color: statusConfig.color, letterSpacing: '.04em' }}>{statusConfig.label}</span>
            {isCompleted && progress?.score !== undefined && (
              <span className="mono text-[10px] font-bold" style={{ color: getScoreColor(progress.score) }}>{Math.round(progress.score)}{t('scoreSuffix')}</span>
            )}
            {isInProgress && exercisePct > 0 && (
              <span className="mono text-[10px] font-bold" style={{ color: 'var(--m-learning)' }}>{exercisePct}%</span>
            )}
          </div>
          <h3 className="font-bold truncate" style={{ fontSize: 16, letterSpacing: '-.01em', color: isLocked ? 'var(--theme-text-secondary)' : 'var(--theme-text-primary)' }}>
            {pickField(lesson, 'title', locale)}
          </h3>
          <p className="text-caption italic truncate mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{lesson.titleDe}</p>
        </div>
        {!isLocked && (
          <span className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-caption font-semibold shrink-0"
            style={isInProgress
              ? { background: 'var(--accent)', color: 'var(--accent-on)' }
              : { background: 'transparent', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            {cta}
            <IconChevronRight size={12} />
          </span>
        )}
      </div>

      {/* Preview chips (objectives) */}
      {!isLocked && objectives.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {objectives.map((o, i) => (
            <span key={i} className="text-[10.5px] px-1.5 py-0.5 rounded line-clamp-1 max-w-50"
              style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
              {o}
            </span>
          ))}
        </div>
      )}

      {/* Meta + lock reason */}
      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
        <span className="inline-flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5v5l3 2M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" /></svg>
          {t('minutesShortCard', { min: lesson.estimatedMinutes })}
        </span>
        {lesson.exerciseCount != null && lesson.exerciseCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m10 3 7 4-7 4-7-4 7-4Zm-7 7 7 4 7-4M3 13l7 4 7-4" /></svg>
            {t('exerciseCount', { count: lesson.exerciseCount })}
          </span>
        )}
        {isLocked && lockedReason && <span className="ml-auto" style={{ color: 'var(--m-learning)' }}>🔒 {lockedReason}</span>}
      </div>

      {isInProgress && exercisePct > 0 && (
        <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${exercisePct}%`, background: 'var(--m-learning)' }} />
        </div>
      )}
    </div>
  );

  const row = (
    <div className="flex gap-4">
      {rail}
      {card}
    </div>
  );

  if (isLocked) return row;
  return <Link href={`/grammar/${lesson.slug}`} className="block outline-none">{row}</Link>;
};

export default GrammarLessonCard;
