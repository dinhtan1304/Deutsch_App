'use client';

import Link from 'next/link';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import type { Topic, TopicWithProgress } from '@/types/topic';

function IconChevronRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconCheck({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const LEVEL_COLOR: Record<string, string> = {
  A1: ACCENT.reading,
  A2: ACCENT.srs,
  B1: ACCENT.xp,
  B2: STATUS.danger,
};

function getScoreColor(pct: number) {
  if (pct >= 80) return STATUS.success;
  if (pct >= 50) return STATUS.warning;
  return ACCENT.srs;
}

interface TopicCardProps {
  topic: Topic | TopicWithProgress;
  showProgress?: boolean;
}

export function TopicCard({ topic, showProgress = false }: TopicCardProps) {
  const masteryPct  = 'masteryPercent' in topic ? topic.masteryPercent : 0;
  const wordsLearned = 'wordsLearned' in topic ? topic.wordsLearned : 0;
  const isCompleted = masteryPct >= 100;
  const isInProgress = masteryPct > 0 && masteryPct < 100;
  const topicColor = topic.color || ACCENT.srs;
  const levelColor = LEVEL_COLOR[topic.level] ?? ACCENT.vocab;

  // Status badge
  const statusConfig = (() => {
    if (isCompleted)   return { label: 'Hoàn thành', bg: `${STATUS.success}15`,  color: STATUS.success };
    if (isInProgress)  return { label: 'Đang học',   bg: `${ACCENT.srs}15`,      color: ACCENT.srs };
    return               { label: 'Chưa học',   bg: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' };
  })();

  return (
    <Link href={`/topics/${topic.slug}`} className="block outline-none">
      <div
        className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl border border-transparent"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.05)',
          // dynamic hover border via CSS not easily doable with inline — use Tailwind class below
        }}
      >
        {/* Hover border overlay via pseudo element isn't possible inline, use a wrapper div */}
        <div className="absolute inset-0 rounded-[2.5rem] border border-transparent group-hover:border-[color]/20 transition-colors duration-500 pointer-events-none"
          style={{ borderColor: `${topicColor}30` }}
        />

        {/* Hover aura */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-700 pointer-events-none rounded-[2.5rem]"
          style={{ backgroundColor: topicColor }}
        />

        <div className="relative z-10 flex items-center gap-4">
          {/* Icon badge */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl shadow-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: isCompleted
                ? `linear-gradient(135deg, ${topicColor}, ${topicColor}cc)`
                : `${topicColor}18`,
              boxShadow: isCompleted ? `0 10px 20px ${topicColor}30` : 'none',
            }}
          >
            {isCompleted
              ? <span className="text-white"><IconCheck size={28} /></span>
              : (topic.icon || '📚')}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg text-white shadow-sm"
                style={{ backgroundColor: levelColor }}
              >
                {topic.level}
              </span>
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
              >
                {statusConfig.label}
              </span>
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                {topic.wordCount} từ
              </span>
            </div>

            {/* Title */}
            <p className="text-base font-black tracking-tight mb-0.5 truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {topic.nameDe}
            </p>

            {/* Vietnamese name */}
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--theme-text-primary)', opacity: 0.4 }}>
              <span className="normal-case">{topic.nameVi}</span>
            </div>

            {/* Progress bar (in_progress) */}
            {showProgress && isInProgress && (
              <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(masteryPct)}%`, backgroundColor: topicColor }} />
              </div>
            )}
          </div>

          {/* Right: mastery % or chevron */}
          {showProgress && masteryPct > 0 ? (
            <div className="text-right shrink-0">
              <div className="text-2xl font-black tracking-tight"
                style={{ color: getScoreColor(masteryPct) }}>
                {Math.round(masteryPct)}<span className="text-sm ml-0.5">%</span>
              </div>
              {isInProgress && (
                <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                  style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>
                  {wordsLearned}/{topic.wordCount}
                </div>
              )}
            </div>
          ) : (
            <div className="shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
              <IconChevronRight size={18} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
