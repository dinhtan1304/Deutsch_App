import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DashboardStats } from '@/types/dashboard';

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

function buildCards(stats: DashboardStats): StatCard[] {
  return [
    {
      label: 'Chuỗi ngày',
      value: stats.streak,
      icon: 'flame',
      color: '#F97316',
      bgColor: 'rgba(249,115,22,0.15)',
    },
    {
      label: 'Từ đã học',
      value: `${stats.totalWordsLearned}/${stats.totalWords}`,
      icon: 'book',
      color: '#3B82F6',
      bgColor: 'rgba(59,130,246,0.15)',
    },
    {
      label: 'Chính xác',
      value: `${stats.accuracy}%`,
      icon: 'checkmark-circle',
      color: '#22C55E',
      bgColor: 'rgba(34,197,94,0.15)',
    },
    {
      label: 'Phút học',
      value: stats.totalMinutes,
      icon: 'time',
      color: '#A855F7',
      bgColor: 'rgba(168,85,247,0.15)',
    },
    {
      label: 'Games',
      value: stats.gamesPlayed,
      icon: 'game-controller',
      color: '#6366F1',
      bgColor: 'rgba(99,102,241,0.15)',
    },
    {
      label: 'Chủ đề',
      value: `${stats.topicsCompleted}/${stats.totalTopics}`,
      icon: 'layers',
      color: '#14B8A6',
      bgColor: 'rgba(20,184,166,0.15)',
    },
    {
      label: 'Cần ôn tập',
      value: stats.wordsToReview,
      icon: 'refresh-circle',
      color: '#EF4444',
      bgColor: 'rgba(239,68,68,0.15)',
    },
  ];
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = buildCards(stats);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {cards.map((card) => (
        <View
          key={card.label}
          className="rounded-2xl bg-dark-card p-4"
          style={{ width: 130 }}
        >
          <View
            className="mb-3 h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: card.bgColor }}
          >
            <Ionicons name={card.icon} size={20} color={card.color} />
          </View>
          <Text
            className="text-xl font-bold"
            style={{ color: card.color }}
          >
            {card.value}
          </Text>
          <Text className="mt-1 text-xs text-gray-400">{card.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export function StatsCardsSkeleton() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          className="rounded-2xl bg-dark-card p-4"
          style={{ width: 130, height: 120 }}
        >
          <View className="mb-3 h-10 w-10 rounded-xl bg-dark-secondary" />
          <View className="h-6 w-16 rounded bg-dark-secondary" />
          <View className="mt-2 h-3 w-12 rounded bg-dark-secondary" />
        </View>
      ))}
    </ScrollView>
  );
}
