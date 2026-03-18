import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTopics, useUserTopicsProgress } from '@/hooks/useTopics';

const LEVELS = ['All', 'A1', 'A2', 'B1'] as const;

const TOPIC_ICONS: Record<string, string> = {
  family: 'people',
  food: 'fast-food',
  home: 'home',
  travel: 'airplane',
  weather: 'cloud',
  clothing: 'shirt',
  body: 'body',
  animals: 'paw',
  education: 'school',
  work: 'briefcase',
  health: 'medkit',
  sports: 'football',
  nature: 'leaf',
  technology: 'laptop',
  numbers: 'calculator',
  colors: 'color-palette',
  time: 'time',
  transport: 'car',
  places: 'location',
  default: 'library',
};

function getTopicIcon(slug: string): string {
  const key = Object.keys(TOPIC_ICONS).find((k) => slug.toLowerCase().includes(k));
  return key ? TOPIC_ICONS[key] : TOPIC_ICONS.default;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22C55E',
  A2: '#F59E0B',
  B1: '#6366F1',
  B2: '#EF4444',
};

export default function TopicsScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const { data: topicsData, isLoading, refetch, isRefetching } = useTopics({
    level: selectedLevel === 'All' ? undefined : selectedLevel,
    limit: 100,
  });
  const { data: progressData } = useUserTopicsProgress();

  const progressMap = useMemo(() => {
    const map: Record<string, { wordsLearned: number; wordsTotal: number; masteryPercent: number }> = {};
    if (progressData) {
      for (const p of progressData) {
        map[p.id] = {
          wordsLearned: p.wordsLearned,
          wordsTotal: p.wordsTotal,
          masteryPercent: p.masteryPercent,
        };
      }
    }
    return map;
  }, [progressData]);

  const topics = topicsData?.data ?? [];

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">Chu de</Text>
        <View className="rounded-lg bg-dark-card px-2.5 py-1">
          <Text className="text-xs font-medium text-gray-400">
            {topics.length} chu de
          </Text>
        </View>
      </View>

      {/* Level Filter Chips */}
      <View className="flex-row gap-2 px-4 pb-3">
        {LEVELS.map((level) => {
          const isActive = selectedLevel === level;
          return (
            <Pressable
              key={level}
              onPress={() => setSelectedLevel(level)}
              className={`rounded-full px-4 py-2 ${
                isActive ? 'bg-primary-500' : 'bg-dark-card'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Topics List */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : topics.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="library-outline" size={48} color="#4B5563" />
            <Text className="mt-3 text-base text-gray-500">
              Khong co chu de nao
            </Text>
          </View>
        ) : (
          topics.map((topic) => {
            const progress = progressMap[topic.id];
            const percent = progress?.masteryPercent ?? 0;
            const learned = progress?.wordsLearned ?? 0;
            const total = progress?.wordsTotal ?? topic.wordCount;
            const levelColor = LEVEL_COLORS[topic.level] ?? '#9CA3AF';
            const iconName = getTopicIcon(topic.slug) as any;

            return (
              <Pressable
                key={topic.id}
                className="mb-3 overflow-hidden rounded-2xl bg-dark-card p-4 active:opacity-80"
                onPress={() => {
                  // Navigate to topic detail if needed
                }}
              >
                <View className="flex-row items-center">
                  {/* Icon */}
                  <View
                    className="h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${topic.color || levelColor}20` }}
                  >
                    <Ionicons
                      name={iconName}
                      size={22}
                      color={topic.color || levelColor}
                    />
                  </View>

                  {/* Info */}
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center">
                      <Text className="flex-1 text-base font-semibold text-white">
                        {topic.nameVi || topic.nameEn}
                      </Text>
                      <View
                        className="rounded-md px-2 py-0.5"
                        style={{ backgroundColor: `${levelColor}20` }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: levelColor }}
                        >
                          {topic.level}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-0.5 text-sm text-gray-500">
                      {topic.nameDe}
                    </Text>

                    {/* Progress Bar */}
                    <View className="mt-2.5 flex-row items-center">
                      <View className="h-2 flex-1 overflow-hidden rounded-full bg-dark-border">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(percent, 100)}%`,
                            backgroundColor: topic.color || levelColor,
                          }}
                        />
                      </View>
                      <Text className="ml-2 text-xs text-gray-500">
                        {learned}/{total}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
