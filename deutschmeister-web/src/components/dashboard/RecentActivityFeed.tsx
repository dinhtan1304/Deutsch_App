'use client';

import { useState } from 'react';
import type { RecentActivity } from '@/types/dashboard';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { IconGamepad, IconPencil, IconLayers, IconBrain, IconClock, IconGraduationCap, IconPenLine, IconBookOpen, IconHeadphones, IconMic, IconMessageCircle } from '@/components/ui/Icons';

interface RecentActivityFeedProps {
  data: RecentActivity[];
  /** Number of items visible when collapsed (default: 5) */
  initialCount?: number;
}

const TYPE_CONFIG = {
  game:           { icon: IconGamepad,       gradient: GRADIENT.action,                                                  accent: ACCENT.srs,         label: 'Game' },
  // eslint-disable-next-line no-restricted-syntax
  word:           { icon: IconPencil,        gradient: 'linear-gradient(135deg, #10B981, #34D399)',                      accent: ACCENT.reading,     label: 'Từ vựng' },
  topic:          { icon: IconLayers,        gradient: GRADIENT.vocab,                                                   accent: ACCENT.vocab,       label: 'Chủ đề' },
  // eslint-disable-next-line no-restricted-syntax
  review:         { icon: IconBrain,         gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',                      accent: ACCENT.xp,          label: 'Ôn tập' },
  grammar:        { icon: IconGraduationCap, gradient: GRADIENT.speaking,                                                accent: ACCENT.xp,          label: 'Ngữ pháp' },
  writing:        { icon: IconPenLine,       gradient: GRADIENT.writing,                                                 accent: ACCENT.writing,     label: 'Luyện viết' },
  reading:        { icon: IconBookOpen,      gradient: GRADIENT.reading,                                                 accent: ACCENT.reading,     label: 'Luyện đọc' },
  // eslint-disable-next-line no-restricted-syntax
  listening:      { icon: IconHeadphones,    gradient: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',                      accent: ACCENT.cyan,        label: 'Luyện nghe' },
  // eslint-disable-next-line no-restricted-syntax
  exam_reading:   { icon: IconBookOpen,      gradient: 'linear-gradient(135deg, #22C55E, #10B981)',                      accent: ACCENT.reading,     label: 'Thi đọc' },
  exam_writing:   { icon: IconPenLine,       gradient: GRADIENT.examWriting,                                             accent: ACCENT.examWriting, label: 'Thi viết' },
  // eslint-disable-next-line no-restricted-syntax
  exam_listening: { icon: IconHeadphones,    gradient: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',                      accent: ACCENT.cyan,        label: 'Thi nghe' },
  exam_speaking:  { icon: IconMic,           gradient: GRADIENT.speaking,                                                accent: ACCENT.xp,          label: 'Thi nói' },
  // eslint-disable-next-line no-restricted-syntax
  free_speaking:  { icon: IconMic,           gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',                      accent: ACCENT.xp,          label: 'Luyện nói' },
  // eslint-disable-next-line no-restricted-syntax
  roleplay:       { icon: IconMessageCircle, gradient: 'linear-gradient(135deg, #EC4899, #F43F5E)',                      accent: ACCENT.listening,   label: 'Roleplay' },
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
      className="p-5 rounded-card border shadow-card"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${ACCENT.vocab}26, ${ACCENT.examWriting}1A)` }}>
            <IconClock size={15} style={{ color: ACCENT.vocab }} />
          </div>
          <h3 className="text-title font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Hoạt động gần đây
          </h3>
        </div>
        {data.length > 0 && (
          <span className="text-caption font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {data.length}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT.reading}1F, ${ACCENT.teal}14)` }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={ACCENT.reading} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M7 20h10" /><path d="M10 20c5.5-2.5 .8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" /></svg>
          </div>
          <p className="text-body font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
            Chưa có hoạt động nào
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Bắt đầu học để thấy tiến độ!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visibleData.map((activity, i) => {
              const config = (TYPE_CONFIG as unknown as Record<string, typeof TYPE_CONFIG.word>)[activity.type] ?? TYPE_CONFIG.word;
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
                    <p className="text-body font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                      {activity.description}
                    </p>
                    <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>

                  {/* Badge */}
                  <div
                    className="px-2 py-0.5 rounded-full text-caption font-semibold shrink-0"
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
              className="w-full mt-3 py-2 rounded-xl text-xs font-semibold
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