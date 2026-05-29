'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import type { TopicProgress } from '@/types/dashboard';
import { IconLayers, IconArrowRight } from '@/components/ui/Icons';

const monoGradientH = (color: string) => `linear-gradient(90deg, ${color}, ${color}aa)`;

interface TopicProgressListProps {
  data: TopicProgress[];
  limit?: number;
}

export function TopicProgressList({ data, limit }: TopicProgressListProps) {
  const t = useTranslations('dashboard.topicProgress');
  const sortedData = [...data].sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    return a.nameDe.localeCompare(b.nameDe);
  });
  const visibleData = limit ? sortedData.slice(0, limit) : sortedData;

  const completedCount = data.filter(t => t.percent >= 100).length;
  const overallProgress = data.length > 0
    ? Math.round(data.reduce((sum, t) => sum + t.percent, 0) / data.length)
    : 0;

  return (
    <div
      className="p-5 rounded-card border shadow-card"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title font-bold flex items-center gap-2"
          style={{ color: 'var(--theme-text-primary)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: GRADIENT.listeningIconBg }}>
            <IconLayers size={15} style={{ color: ACCENT.listening }} />
          </span>
          {t('title')}
        </h3>
        <Link
          href="/topics"
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: ACCENT.srs }}
        >
          {t('viewAll')}
          <IconArrowRight size={13} />
        </Link>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--theme-text-muted)' }}>{t('totalProgress')}</span>
            <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {overallProgress}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${overallProgress}%`,
                background: GRADIENT.progressBarEmerald,
              }}
            />
          </div>
        </div>
        <div className="text-center px-3">
          <div className="text-xl font-extrabold" style={{ color: ACCENT.emerald }}>{completedCount}</div>
          <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('completed')}</div>
        </div>
      </div>

      {/* Topic list */}
      <div className="space-y-1.5">
        {visibleData.map((topic) => {
          const isComplete = topic.percent >= 100;

          return (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-(--theme-bg-secondary) group"
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-body font-extrabold shrink-0
                  transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3"
                style={{ backgroundColor: `${topic.color}18`, color: topic.color }}
              >
                {topic.nameDe?.[0]?.toUpperCase() || 'T'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-body truncate"
                    style={{ color: 'var(--theme-text-primary)' }}>
                    {topic.nameDe}
                  </span>
                  {isComplete && (
                    <span className="text-caption px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: `${ACCENT.emerald}1f`, color: ACCENT.emerald }}>
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('wordsCount', { learned: topic.wordsLearned, total: topic.totalWords })}
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2.5">
                <div className="w-20 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${topic.percent}%`,
                      background: isComplete
                        ? GRADIENT.emeraldH
                        : monoGradientH(topic.color),
                    }}
                  />
                </div>
                <span className="text-xs font-semibold w-10 text-right"
                  style={{ color: isComplete ? ACCENT.emerald : topic.color }}>
                  {Math.round(topic.percent)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center py-8 px-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
            style={{ background: GRADIENT.listeningIconBg }}>
            <IconLayers size={28} style={{ color: ACCENT.listening }} />
          </div>
          <p className="text-body font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {t('emptyTitle')}
          </p>
          <p className="text-caption mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            {t('emptySubtitle')}
          </p>
          <Link
            href="/topics"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENT.listening }}
          >
            {t('emptyCta')}
            <IconArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}