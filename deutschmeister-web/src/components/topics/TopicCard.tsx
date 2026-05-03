'use client';

import Link from 'next/link';
import { ACCENT, GRADIENT } from '@/lib/tokens';

const monoGradientSoftBg = (color: string) => `linear-gradient(135deg, ${color}08, ${color}03)`;
const monoGradientBg = (color: string) => `linear-gradient(135deg, ${color}20, ${color}10)`;
const monoGradientH = (color: string) => `linear-gradient(90deg, ${color}, ${color}cc)`;
import type { Topic, TopicWithProgress } from '@/types/topic';

// ─── Inline SVG icons ───
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

interface TopicCardProps {
  topic: Topic | TopicWithProgress;
  showProgress?: boolean;
}

export function TopicCard({ topic, showProgress = false }: TopicCardProps) {
  const progress = 'masteryPercent' in topic ? topic.masteryPercent : 0;
  const wordsLearned = 'wordsLearned' in topic ? topic.wordsLearned : 0;
  const isCompleted = progress >= 100;
  const topicColor = topic.color || ACCENT.srs;

  return (
    <Link href={`/topics/${topic.slug}`}>
      <div className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300
        hover:-translate-y-1 hover:shadow-lg cursor-pointer"
        style={{
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)',
        }}>
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: monoGradientSoftBg(topicColor) }} />

        {/* Decorative circle */}
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: topicColor, opacity: 0.04 }} />

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg text-caption font-bold"
            style={{ background: GRADIENT.readingGreen, color: 'white' }}>
            <IconCheck size={10} /> Hoàn thành
          </div>
        )}

        {/* Icon */}
        <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3
          transition-transform duration-300 group-hover:scale-110"
          style={{ background: monoGradientBg(topicColor) }}>
          {topic.icon || '📚'}
        </div>

        {/* Content */}
        <div className="relative space-y-0.5">
          <h3 className="font-bold text-base leading-tight"
            style={{ color: 'var(--theme-text-primary)' }}>
            {topic.nameDe}
          </h3>
          <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{topic.nameVi}</p>
        </div>

        {/* Stats row */}
        <div className="relative mt-3 flex items-center justify-between">
          <span className="text-caption font-semibold px-2 py-0.5 rounded-md"
            style={{ background: `${topicColor}12`, color: topicColor }}>
            {topic.wordCount} từ
          </span>
          <span className="text-caption font-medium px-2 py-0.5 rounded-md"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {topic.level}
          </span>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="relative mt-3">
            <div className="flex items-center justify-between text-caption mb-1">
              <span style={{ color: 'var(--theme-text-muted)' }}>
                {wordsLearned}/{topic.wordCount} từ
              </span>
              <span className="font-semibold"
                style={{ color: progress > 0 ? topicColor : 'var(--theme-text-muted)' }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: isCompleted
                    ? GRADIENT.readingGreenH
                    : monoGradientH(topicColor),
                }} />
            </div>
          </div>
        )}

        {/* Hover arrow hint */}
        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-60 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
          style={{ color: topicColor }}>
          <IconArrowRight size={16} />
        </div>
      </div>
    </Link>
  );
}