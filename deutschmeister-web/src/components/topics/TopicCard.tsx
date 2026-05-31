'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ACCENT } from '@/lib/tokens';
import { IconCheck, IconArrowRight } from '@/components/ui/Icons';
import type { Topic, TopicWithProgress } from '@/types/topic';

// Progress ring with an emoji/icon centered (v2 topic card).
function ProgressRing({ pct, size, color, icon, isDone }: {
  pct: number; size: number; color: string; icon: React.ReactNode; isDone: boolean;
}) {
  const thickness = size >= 60 ? 4 : 3;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, pct) / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--theme-bg-secondary)" strokeWidth={thickness} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={thickness} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: size * 0.4, lineHeight: 1 }}>
        {isDone ? <span style={{ color }}><IconCheck size={Math.round(size * 0.42)} /></span> : icon}
      </div>
    </div>
  );
}

interface TopicCardProps {
  topic: Topic | TopicWithProgress;
  showProgress?: boolean;
  large?: boolean;
}

export function TopicCard({ topic, showProgress = false, large = false }: TopicCardProps) {
  const t = useTranslations('vocabulary.topicCard');
  const masteryPct = 'masteryPercent' in topic ? topic.masteryPercent : 0;
  const wordsLearned = 'wordsLearned' in topic ? topic.wordsLearned : 0;
  const isCompleted = masteryPct >= 100;
  const isInProgress = masteryPct > 0 && masteryPct < 100;
  const status = isCompleted ? 'done' : isInProgress ? 'active' : 'new';
  const topicColor = topic.color || ACCENT.srs;

  // Ring + status color: done=green, active=amber, new=topic color.
  const statusColor = isCompleted ? 'var(--m-learned)' : isInProgress ? 'var(--m-learning)' : 'var(--m-new)';
  const ringColor = isCompleted ? 'var(--m-learned)' : isInProgress ? 'var(--m-learning)' : topicColor;
  const statusLabel = isCompleted ? t('statusCompleted') : isInProgress ? t('statusInProgress') : t('statusNotStarted');
  const cta = isCompleted ? t('ctaReview') : isInProgress ? t('ctaContinue') : t('ctaStart');

  return (
    <Link href={`/topics/${topic.slug}`} className="block outline-none">
      <article
        className="word-card-v2 group relative overflow-hidden flex flex-col rounded-[14px] cursor-pointer"
        style={{
          background: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
          padding: large ? 22 : 16,
          gap: large ? 14 : 10,
          minHeight: large ? 176 : 140,
          ['--card-accent' as string]: topicColor,
        } as React.CSSProperties}
      >
        {/* decorative blob */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"
          style={{ background: `${topicColor}10`, filter: 'blur(20px)' }} />

        <header className="relative z-10 flex items-center gap-3">
          <ProgressRing pct={status === 'new' ? 0 : masteryPct} size={large ? 64 : 52} color={ringColor}
            icon={topic.icon || '📚'} isDone={isCompleted} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="mono text-caption font-bold px-1.5 py-px rounded"
                style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                {topic.level}
              </span>
              <span className="mono text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                {wordsLearned}/{topic.wordCount}
              </span>
            </div>
            <h3 className="font-bold truncate" style={{ fontSize: large ? 17 : 15, letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>
              {topic.nameDe}
            </h3>
            <p className="text-caption truncate mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{topic.nameVi}</p>
          </div>
        </header>

        <div className="flex-1" />

        <footer className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-caption font-semibold" style={{ color: statusColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            {statusLabel}
            {showProgress && isInProgress && <span className="mono font-medium" style={{ color: 'var(--theme-text-muted)' }}> · {Math.round(masteryPct)}%</span>}
          </span>
          <span className="inline-flex items-center gap-1 text-caption font-semibold transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}>
            {cta}
            <IconArrowRight size={12} />
          </span>
        </footer>
      </article>
    </Link>
  );
}
