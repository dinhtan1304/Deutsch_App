'use client';

import type { RecentActivity } from '@/types/dashboard';
import { IconGamepad, IconPencil, IconLayers, IconBrain, IconClock } from '@/components/ui/Icons';

interface RecentActivityFeedProps {
  data: RecentActivity[];
}

const TYPE_CONFIG: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  accent: string;
  label: string;
}> = {
  game:   { icon: IconGamepad, gradient: 'linear-gradient(135deg, #3B82F6, #6366F1)', accent: '#3B82F6', label: 'Game' },
  word:   { icon: IconPencil,  gradient: 'linear-gradient(135deg, #10B981, #34D399)', accent: '#10B981', label: 'Từ vựng' },
  topic:  { icon: IconLayers,  gradient: 'linear-gradient(135deg, #8B5CF6, #A855F7)', accent: '#8B5CF6', label: 'Chủ đề' },
  review: { icon: IconBrain,   gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', accent: '#F59E0B', label: 'Ôn tập' },
};

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hrs < 24) return `${hrs} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

export function RecentActivityFeed({ data }: RecentActivityFeedProps) {
  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.15), rgba(168,85,247,.1))' }}>
          <IconClock size={15} style={{ color: '#8B5CF6' }} />
        </div>
        <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Hoạt động gần đây
        </h3>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
            Chưa có hoạt động nào
          </p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Bắt đầu học để thấy tiến độ!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((activity, i) => {
            const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.word;
            const Icon = config.icon;

            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200
                  hover:bg-(--theme-bg-secondary) group"
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    transition-transform duration-200 group-hover:scale-110"
                  style={{ background: config.gradient }}
                >
                  <Icon size={15} className="text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                    {activity.description}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>

                {/* Badge */}
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                  style={{ backgroundColor: `${config.accent}15`, color: config.accent }}
                >
                  {config.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}