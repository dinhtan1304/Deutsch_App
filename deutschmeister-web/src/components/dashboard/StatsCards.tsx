'use client';

import type { DashboardStats } from '@/types/dashboard';

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon, label, value, subValue, color, bgColor }: StatCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{ backgroundColor: bgColor }}
    >
      {/* Background decoration */}
      <div
        className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20"
        style={{ backgroundColor: color }}
      />
      
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>

      {/* Value */}
      <div className="text-3xl font-bold mb-1" style={{ color }}>
        {value}
      </div>

      {/* Label */}
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </div>

      {/* Sub value */}
      {subValue && (
        <div className="text-xs text-gray-500 mt-1">{subValue}</div>
      )}
    </div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  };

  const cards = [
    {
      icon: '🔥',
      label: 'Streak liên tiếp',
      value: stats.streak,
      subValue: stats.streak > 0 ? 'ngày' : 'Bắt đầu hôm nay!',
      color: '#F97316',
      bgColor: 'rgba(249, 115, 22, 0.08)',
    },
    {
      icon: '📚',
      label: 'Từ đã học',
      value: stats.totalWordsLearned,
      subValue: `/ ${stats.totalWords} từ`,
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.08)',
    },
    {
      icon: '🎯',
      label: 'Độ chính xác',
      value: `${stats.accuracy}%`,
      subValue: `${stats.gamesPlayed} game đã chơi`,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.08)',
    },
    {
      icon: '⏱️',
      label: 'Thời gian học',
      value: formatMinutes(stats.totalMinutes),
      subValue: `Từ ${new Date(stats.startedAt).toLocaleDateString('vi-VN')}`,
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.08)',
    },
    {
      icon: '📖',
      label: 'Chủ đề hoàn thành',
      value: stats.topicsCompleted,
      subValue: `/ ${stats.totalTopics} chủ đề`,
      color: '#EC4899',
      bgColor: 'rgba(236, 72, 153, 0.08)',
    },
    {
      icon: '🧠',
      label: 'Cần ôn tập',
      value: stats.wordsToReview,
      subValue: stats.wordsToReview > 0 ? 'từ hôm nay' : 'Tuyệt vời! 🎉',
      color: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.08)',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
}