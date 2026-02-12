'use client';

import { useState } from 'react';
import type { RecentActivity } from '@/types/dashboard';
import { IconGamepad, IconPencil, IconLayers, IconBrain, IconClock, IconGraduationCap } from '@/components/ui/Icons';

interface RecentActivityFeedProps {
  data: RecentActivity[];
  /** Number of items visible when collapsed (default: 5) */
  initialCount?: number;
}

const TYPE_CONFIG: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  accent: string;
  label: string;
}> = {
  game:    { icon: IconGamepad,       gradient: 'linear-gradient(135deg, #3B82F6, #6366F1)', accent: '#3B82F6', label: 'Game' },
  word:    { icon: IconPencil,        gradient: 'linear-gradient(135deg, #10B981, #34D399)', accent: '#10B981', label: 'Từ vựng' },
  topic:   { icon: IconLayers,        gradient: 'linear-gradient(135deg, #8B5CF6, #A855F7)', accent: '#8B5CF6', label: 'Chủ đề' },
  review:  { icon: IconBrain,         gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', accent: '#F59E0B', label: 'Ôn tập' },
  grammar: { icon: IconGraduationCap, gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', accent: '#F59E0B', label: 'Ngữ pháp' },
};

// ─── Inline chevron icon ───
function IconChevronDown({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ display: 'block', ...style }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

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

export function RecentActivityFeed({ data, initialCount = 2 }: RecentActivityFeedProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMore = data.length > initialCount;
  const visibleData = expanded ? data : data.slice(0, initialCount);
  const hiddenCount = data.length - initialCount;

  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.15), rgba(168,85,247,.1))' }}>
            <IconClock size={15} style={{ color: '#8B5CF6' }} />
          </div>
          <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Hoạt động gần đây
          </h3>
        </div>
        {data.length > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {data.length}
          </span>
        )}
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
        <>
          <div className="space-y-2">
            {visibleData.map((activity, i) => {
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

          {/* Expand / Collapse toggle */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 py-2 rounded-xl text-[12px] font-semibold
                flex items-center justify-center gap-1.5 transition-all duration-200
                hover:bg-(--theme-bg-secondary)"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {expanded ? (
                <>
                  Thu gọn
                  <IconChevronDown size={14} style={{ transform: 'rotate(180deg)', transition: 'transform 200ms' }} />
                </>
              ) : (
                <>
                  Xem thêm {hiddenCount} hoạt động
                  <IconChevronDown size={14} style={{ transition: 'transform 200ms' }} />
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}