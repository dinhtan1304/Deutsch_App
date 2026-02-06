'use client';

import Link from 'next/link';
import type { TopicProgress } from '@/types/dashboard';
import { IconLayers, IconArrowRight } from '@/components/ui/Icons';

interface TopicProgressListProps {
  data: TopicProgress[];
}

export function TopicProgressList({ data }: TopicProgressListProps) {
  const sortedData = [...data].sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    return a.nameDe.localeCompare(b.nameDe);
  });

  const completedCount = data.filter(t => t.percent >= 100).length;
  const overallProgress = data.length > 0
    ? Math.round(data.reduce((sum, t) => sum + t.percent, 0) / data.length)
    : 0;

  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold flex items-center gap-2"
          style={{ color: 'var(--theme-text-primary)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,.15), rgba(244,114,182,.1))' }}>
            <IconLayers size={15} style={{ color: '#EC4899' }} />
          </span>
          Tiến độ theo chủ đề
        </h3>
        <Link
          href="/topics"
          className="flex items-center gap-1 text-[12px] font-medium transition-colors hover:opacity-80"
          style={{ color: '#3B82F6' }}
        >
          Xem tất cả
          <IconArrowRight size={13} />
        </Link>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex-1">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span style={{ color: 'var(--theme-text-muted)' }}>Tổng tiến độ</span>
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
                background: 'linear-gradient(90deg, #3B82F6, #10B981)',
              }}
            />
          </div>
        </div>
        <div className="text-center px-3">
          <div className="text-xl font-extrabold" style={{ color: '#10B981' }}>{completedCount}</div>
          <div className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Hoàn thành</div>
        </div>
      </div>

      {/* Topic list */}
      <div className="space-y-1.5 max-h-100 overflow-y-auto pr-1">
        {sortedData.map((topic) => {
          const isComplete = topic.percent >= 100;

          return (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                hover:bg-var(--theme-bg-secondary) group"
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0
                  transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3"
                style={{ backgroundColor: `${topic.color}18` }}
              >
                {topic.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-[13px] truncate"
                    style={{ color: 'var(--theme-text-primary)' }}>
                    {topic.nameDe}
                  </span>
                  {isComplete && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: 'rgba(16,185,129,.12)', color: '#10B981' }}>
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                  {topic.wordsLearned}/{topic.totalWords} từ
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
                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                        : `linear-gradient(90deg, ${topic.color}, ${topic.color}aa)`,
                    }}
                  />
                </div>
                <span className="text-[12px] font-semibold w-10 text-right"
                  style={{ color: isComplete ? '#10B981' : topic.color }}>
                  {Math.round(topic.percent)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
            Chưa có chủ đề nào
          </p>
          <Link href="/topics" className="text-[12px] font-medium mt-1 inline-block"
            style={{ color: '#3B82F6' }}>
            Bắt đầu học ngay →
          </Link>
        </div>
      )}
    </div>
  );
}