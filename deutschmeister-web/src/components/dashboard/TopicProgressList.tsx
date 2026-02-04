'use client';

import Link from 'next/link';
import type { TopicProgress } from '@/types/dashboard';

interface TopicProgressListProps {
  data: TopicProgress[];
}

export function TopicProgressList({ data }: TopicProgressListProps) {
  // Sort by progress (highest first), then by name
  const sortedData = [...data].sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    return a.nameDe.localeCompare(b.nameDe);
  });

  const completedCount = data.filter((t) => t.percent >= 100).length;
  const overallProgress =
    data.length > 0
      ? Math.round(
          data.reduce((sum, t) => sum + t.percent, 0) / data.length
        )
      : 0;

  return (
    <div
      className="p-6 rounded-2xl border"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          📚 Tiến độ theo chủ đề
        </h3>
        <Link
          href="/topics"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Tổng tiến độ</span>
            <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {overallProgress}%
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        <div className="text-center px-4">
          <div className="text-2xl font-bold text-green-500">{completedCount}</div>
          <div className="text-xs text-gray-500">Hoàn thành</div>
        </div>
      </div>

      {/* Topic list */}
      <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
        {sortedData.map((topic) => {
          const isComplete = topic.percent >= 100;

          return (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800 group"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${topic.color}20` }}
              >
                {topic.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium truncate"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    {topic.nameDe}
                  </span>
                  {isComplete && (
                    <span className="text-green-500 text-xs">✓</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {topic.wordsLearned}/{topic.totalWords} từ
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2">
                <div
                  className="w-20 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${topic.percent}%`,
                      backgroundColor: isComplete ? '#10B981' : topic.color,
                    }}
                  />
                </div>
                <span
                  className="text-sm font-medium w-12 text-right"
                  style={{ color: isComplete ? '#10B981' : topic.color }}
                >
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
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-500">Chưa có chủ đề nào</p>
          <Link href="/topics" className="text-blue-600 hover:underline text-sm">
            Bắt đầu học ngay
          </Link>
        </div>
      )}
    </div>
  );
}