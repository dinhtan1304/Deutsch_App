'use client';

import type { RecentActivity } from '@/types/dashboard';

interface RecentActivityFeedProps {
  data: RecentActivity[];
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  game: { icon: '🎮', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  word: { icon: '📝', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  topic: { icon: '📚', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  review: { icon: '🧠', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' },
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString('vi-VN');
}

export function RecentActivityFeed({ data }: RecentActivityFeedProps) {
  if (data.length === 0) {
    return (
      <div
        className="p-6 rounded-2xl border"
        style={{
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)',
        }}
      >
        <h3
          className="text-lg font-bold mb-4"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          ⏰ Hoạt động gần đây
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🌱</div>
          <p className="text-gray-500">Chưa có hoạt động nào</p>
          <p className="text-sm text-gray-400 mt-1">Bắt đầu học để thấy tiến độ!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 rounded-2xl border"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Header */}
      <h3
        className="text-lg font-bold mb-4"
        style={{ color: 'var(--theme-text-primary)' }}
      >
        ⏰ Hoạt động gần đây
      </h3>

      {/* Activity list */}
      <div className="space-y-3">
        {data.map((activity, index) => {
          const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.word;

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: config.bgColor }}
              >
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>

              {/* Type badge */}
              <div
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: config.bgColor, color: config.color }}
              >
                {activity.type === 'game' && 'Game'}
                {activity.type === 'word' && 'Từ vựng'}
                {activity.type === 'topic' && 'Chủ đề'}
                {activity.type === 'review' && 'Ôn tập'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}