import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecentActivity as RecentActivityType } from '@/types/dashboard';

interface RecentActivityProps {
  activities: RecentActivityType[];
}

const ACTIVITY_CONFIG: Record<
  RecentActivityType['type'],
  { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
> = {
  game: {
    icon: 'game-controller',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.15)',
  },
  word: {
    icon: 'book',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.15)',
  },
  topic: {
    icon: 'layers',
    color: '#6366F1',
    bgColor: 'rgba(99,102,241,0.15)',
  },
  review: {
    icon: 'refresh-circle',
    color: '#F97316',
    bgColor: 'rgba(249,115,22,0.15)',
  },
  grammar: {
    icon: 'create',
    color: '#A855F7',
    bgColor: 'rgba(168,85,247,0.15)',
  },
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities.length) {
    return (
      <View className="mx-4 rounded-2xl bg-dark-card p-4">
        <Text className="mb-3 text-sm font-bold text-white">
          Hoạt động gần đây
        </Text>
        <View className="items-center py-6">
          <Ionicons name="time-outline" size={32} color="#6B7280" />
          <Text className="mt-2 text-sm text-gray-500">
            Chưa có hoạt động nào
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mx-4 rounded-2xl bg-dark-card p-4">
      <Text className="mb-3 text-sm font-bold text-white">
        Hoạt động gần đây
      </Text>
      {activities.slice(0, 5).map((activity, index) => {
        const config = ACTIVITY_CONFIG[activity.type];
        return (
          <View
            key={`${activity.type}-${activity.timestamp}-${index}`}
            className={`flex-row items-center gap-3 py-3 ${
              index < Math.min(activities.length, 5) - 1
                ? 'border-b border-dark-border'
                : ''
            }`}
          >
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: config.bgColor }}
            >
              <Ionicons name={config.icon} size={16} color={config.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-200" numberOfLines={1}>
                {activity.description}
              </Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                {formatTimestamp(activity.timestamp)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function RecentActivitySkeleton() {
  return (
    <View className="mx-4 rounded-2xl bg-dark-card p-4">
      <View className="mb-3 h-5 w-36 rounded bg-dark-secondary" />
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} className="flex-row items-center gap-3 py-3">
          <View className="h-9 w-9 rounded-xl bg-dark-secondary" />
          <View className="flex-1">
            <View className="h-4 w-48 rounded bg-dark-secondary" />
            <View className="mt-1 h-3 w-20 rounded bg-dark-secondary" />
          </View>
        </View>
      ))}
    </View>
  );
}
