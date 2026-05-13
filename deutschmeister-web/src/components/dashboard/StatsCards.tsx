'use client';

import type { DashboardStats } from '@/types/dashboard';
import {
  IconFlame, IconBookOpen, IconTarget,
  IconClock, IconLayers, IconBrain, IconGraduationCap,
} from '@/components/ui/Icons';
import { SurfaceCard } from '@/components/ui';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCardConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  getValue: (s: DashboardStats) => string | number;
  getSubValue: (s: DashboardStats) => string;
  accent: AccentKey;
}

const cardConfigs: StatCardConfig[] = [
  {
    icon: IconFlame,
    label: 'Streak liên tiếp',
    getValue: s => s.streak,
    getSubValue: s => s.streak > 0 ? 'ngày liên tiếp' : 'Bắt đầu hôm nay!',
    accent: 'games',
  },
  {
    icon: IconBookOpen,
    label: 'Từ đã học',
    getValue: s => s.totalWordsLearned,
    getSubValue: s => `/ ${s.totalWords} từ`,
    accent: 'srs',
  },
  {
    icon: IconTarget,
    label: 'Độ chính xác',
    getValue: s => `${s.accuracy}%`,
    getSubValue: s => `${s.gamesPlayed} game đã chơi`,
    accent: 'emerald',
  },
  {
    icon: IconClock,
    label: 'Thời gian học',
    getValue: s => {
      if (s.totalMinutes < 60) return `${s.totalMinutes}m`;
      const h = Math.floor(s.totalMinutes / 60);
      const m = s.totalMinutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    },
    getSubValue: s => {
      // Parse YYYY-MM-DD safely (avoid UTC timezone shift with new Date())
      const parts = s.startedAt.split('-').map(Number);
      return `Từ ${new Date(parts[0]!, parts[1]! - 1, parts[2]!).toLocaleDateString('vi-VN')}`;
    },
    accent: 'vocab',
  },
  {
    icon: IconLayers,
    label: 'Chủ đề hoàn thành',
    getValue: s => s.topicsCompleted,
    getSubValue: s => `/ ${s.totalTopics} chủ đề`,
    accent: 'listening',
  },
  {
    icon: IconGraduationCap,
    label: 'Ngữ pháp',
    getValue: s => s.grammarCompleted ?? 0,
    getSubValue: s => `/ ${s.grammarTotal ?? 0} bài học`,
    accent: 'xp',
  },
  {
    icon: IconBrain,
    label: 'Cần ôn tập',
    getValue: s => s.wordsToReview,
    getSubValue: s => s.wordsToReview > 0 ? 'từ hôm nay' : 'Tuyệt vời!',
    accent: 'cyan',
  },
];

const statGradient: Partial<Record<AccentKey, string>> = {
  brand: GRADIENT.brand,
  games: GRADIENT.xp,
  srs: GRADIENT.action,
  emerald: GRADIENT.emerald,
  vocab: GRADIENT.vocab,
  listening: GRADIENT.listening,
  xp: GRADIENT.xp,
  cyan: GRADIENT.dictation,
};

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {cardConfigs.map((card, i) => {
        const Icon = card.icon;
        const value = card.getValue(stats);
        const sub = card.getSubValue(stats);
        const isStreakCard = card.label === 'Streak liên tiếp';
        const isReviewCard = card.label === 'Cần ôn tập';

        // Balance the 7-item grid:
        // md & xl (4 cols): Streak takes 2 cols, others 1 col (2+1+1 + 1+1+1+1 = 8 slots = 2 rows)
        // sm & lg (3 cols): Review takes 3 cols, others 1 col (1+1+1 + 1+1+1 + 3 = 9 slots = 3 rows)
        // mobile (2 cols): Review takes 2 cols
        const colSpanClass = isStreakCard
          ? 'col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2'
          : isReviewCard
            ? 'col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-3 xl:col-span-1'
            : 'col-span-1';

        return (
          <SurfaceCard
            key={i}
            variant="featured"
            accent={card.accent}
            className={`relative overflow-hidden cursor-default ${colSpanClass}`}
          >
            {/* Streak freeze badge — only on streak card */}
            {isStreakCard && stats.streakFreezesAvailable > 0 && (
              <div
                className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black z-10 shadow-sm"
                style={{
                  background: 'rgba(59,130,246,.15)',
                  color: ACCENT.srs,
                  border: '1px solid rgba(59,130,246,.3)',
                  backdropFilter: 'blur(4px)'
                }}
                title={`${stats.streakFreezesAvailable} streak freeze — bảo vệ streak nếu bạn lỡ 1 ngày`}
              >
                ❄️ {stats.streakFreezesAvailable}
              </div>
            )}

            {/* Decorative orb */}
            <div
              className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-[0.05]"
              style={{ backgroundColor: ACCENT[card.accent] }}
            />

            {/* Icon container with gradient */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
              style={{ background: statGradient[card.accent] ?? GRADIENT.brand }}
            >
              <Icon size={20} className="text-white" />
            </div>

            {/* Value */}
            <div className="text-2xl font-extrabold tracking-tight mb-0.5" style={{ color: ACCENT[card.accent] }}>
              {value}
            </div>

            {/* Label */}
            <div className="text-body font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
              {card.label}
            </div>

            {/* Sub value */}
            <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {sub}
            </div>
          </SurfaceCard>
        );
      })}
    </div>
  );
}
