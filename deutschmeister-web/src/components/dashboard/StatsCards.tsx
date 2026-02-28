'use client';

import type { DashboardStats } from '@/types/dashboard';
import {
  IconFlame, IconBookOpen, IconTarget,
  IconClock, IconLayers, IconBrain, IconGraduationCap,
} from '@/components/ui/Icons';

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCardConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  getValue: (s: DashboardStats) => string | number;
  getSubValue: (s: DashboardStats) => string;
  gradient: string;
  iconBg: string;
  accent: string;
}

const cardConfigs: StatCardConfig[] = [
  {
    icon: IconFlame,
    label: 'Streak liên tiếp',
    getValue: s => s.streak,
    getSubValue: s => s.streak > 0 ? 'ngày liên tiếp 🔥' : 'Bắt đầu hôm nay!',
    gradient: 'linear-gradient(135deg, rgba(249,115,22,.12), rgba(251,191,36,.08))',
    iconBg: 'linear-gradient(135deg, #F97316, #FBBF24)',
    accent: '#F97316',
  },
  {
    icon: IconBookOpen,
    label: 'Từ đã học',
    getValue: s => s.totalWordsLearned,
    getSubValue: s => `/ ${s.totalWords} từ`,
    gradient: 'linear-gradient(135deg, rgba(59,130,246,.12), rgba(99,102,241,.08))',
    iconBg: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    accent: '#3B82F6',
  },
  {
    icon: IconTarget,
    label: 'Độ chính xác',
    getValue: s => `${s.accuracy}%`,
    getSubValue: s => `${s.gamesPlayed} game đã chơi`,
    gradient: 'linear-gradient(135deg, rgba(16,185,129,.12), rgba(52,211,153,.08))',
    iconBg: 'linear-gradient(135deg, #10B981, #34D399)',
    accent: '#10B981',
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
      const [y, m, d] = s.startedAt.split('-').map(Number);
      return `Từ ${new Date(y, m - 1, d).toLocaleDateString('vi-VN')}`;
    },
    gradient: 'linear-gradient(135deg, rgba(139,92,246,.12), rgba(168,85,247,.08))',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
    accent: '#8B5CF6',
  },
  {
    icon: IconLayers,
    label: 'Chủ đề hoàn thành',
    getValue: s => s.topicsCompleted,
    getSubValue: s => `/ ${s.totalTopics} chủ đề`,
    gradient: 'linear-gradient(135deg, rgba(236,72,153,.12), rgba(244,114,182,.08))',
    iconBg: 'linear-gradient(135deg, #EC4899, #F472B6)',
    accent: '#EC4899',
  },
  {
    icon: IconGraduationCap,
    label: 'Ngữ pháp',
    getValue: s => s.grammarCompleted ?? 0,
    getSubValue: s => `/ ${s.grammarTotal ?? 0} bài học`,
    gradient: 'linear-gradient(135deg, rgba(245,158,11,.12), rgba(252,211,77,.08))',
    iconBg: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
    accent: '#F59E0B',
  },
  {
    icon: IconBrain,
    label: 'Cần ôn tập',
    getValue: s => s.wordsToReview,
    getSubValue: s => s.wordsToReview > 0 ? 'từ hôm nay' : 'Tuyệt vời! 🎉',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,.12), rgba(34,211,238,.08))',
    iconBg: 'linear-gradient(135deg, #06B6D4, #22D3EE)',
    accent: '#06B6D4',
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cardConfigs.map((card, i) => {
        const Icon = card.icon;
        const value = card.getValue(stats);
        const sub = card.getSubValue(stats);

        return (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-lg cursor-default group"
            style={{ background: card.gradient }}
          >
            {/* Decorative orb */}
            <div
              className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-[0.07] transition-transform duration-500 group-hover:scale-125"
              style={{ backgroundColor: card.accent }}
            />

            {/* Icon container with gradient */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3
                shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{ background: card.iconBg }}
            >
              <Icon size={20} className="text-white" />
            </div>

            {/* Value */}
            <div className="text-2xl font-extrabold tracking-tight mb-0.5" style={{ color: card.accent }}>
              {value}
            </div>

            {/* Label */}
            <div className="text-[12.5px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
              {card.label}
            </div>

            {/* Sub value */}
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}