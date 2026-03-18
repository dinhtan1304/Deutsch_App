import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TopicProgress as TopicProgressType } from '@/types/dashboard';

interface TopicProgressProps {
  topics: TopicProgressType[];
}

export function TopicProgress({ topics }: TopicProgressProps) {
  if (!topics.length) {
    return null;
  }

  return (
    <View>
      <Text className="mb-3 px-4 text-sm font-bold text-white">
        Tiến độ chủ đề
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {topics.map((topic) => {
          const progressWidth = Math.max(topic.percent, 2);
          return (
            <View
              key={topic.id}
              className="rounded-2xl bg-dark-card p-4"
              style={{ width: 160 }}
            >
              {/* Icon + Name */}
              <View className="mb-3 flex-row items-center gap-2">
                <View
                  className="h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: topic.color
                      ? `${topic.color}22`
                      : 'rgba(99,102,241,0.15)',
                  }}
                >
                  <Text className="text-base">{topic.icon || '📖'}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xs font-semibold text-white"
                    numberOfLines={1}
                  >
                    {topic.nameVi}
                  </Text>
                  <Text
                    className="text-xs text-gray-500"
                    numberOfLines={1}
                  >
                    {topic.nameDe}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View className="mb-2 h-2 overflow-hidden rounded-full bg-dark-secondary">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progressWidth}%`,
                    backgroundColor: topic.color || '#6366F1',
                  }}
                />
              </View>

              {/* Stats */}
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-400">
                  {topic.wordsLearned}/{topic.totalWords} từ
                </Text>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: topic.color || '#6366F1' }}
                >
                  {topic.percent}%
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TopicProgressSkeleton() {
  return (
    <View>
      <View className="mb-3 px-4">
        <View className="h-5 w-32 rounded bg-dark-secondary" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={i}
            className="rounded-2xl bg-dark-card p-4"
            style={{ width: 160, height: 120 }}
          >
            <View className="mb-3 flex-row items-center gap-2">
              <View className="h-8 w-8 rounded-lg bg-dark-secondary" />
              <View className="flex-1">
                <View className="h-3 w-16 rounded bg-dark-secondary" />
                <View className="mt-1 h-3 w-12 rounded bg-dark-secondary" />
              </View>
            </View>
            <View className="mb-2 h-2 rounded-full bg-dark-secondary" />
            <View className="h-3 w-20 rounded bg-dark-secondary" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
