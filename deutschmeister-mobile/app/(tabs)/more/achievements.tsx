import { useMemo, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAchievements } from '@/hooks/useAchievements';
import type { Achievement } from '@/lib/api/achievements';

const GOLD = '#F59E0B';
const GOLD_DIM = '#92711920';

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  vocabulary: 'book',
  games: 'game-controller',
  streak: 'flame',
  social: 'people',
  writing: 'pencil',
  reading: 'reader',
  grammar: 'school',
  level: 'trending-up',
  default: 'trophy',
};

function getAchievementIcon(achievement: Achievement): React.ComponentProps<typeof Ionicons>['name'] {
  // Use the icon field if it maps to an Ionicons name, otherwise fall back to category
  if (achievement.icon && CATEGORY_ICONS[achievement.icon]) {
    return CATEGORY_ICONS[achievement.icon];
  }
  if (achievement.category && CATEGORY_ICONS[achievement.category]) {
    return CATEGORY_ICONS[achievement.category];
  }
  return CATEGORY_ICONS.default;
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const iconName = getAchievementIcon(achievement);
  const isUnlocked = achievement.unlocked;

  return (
    <View
      className="mb-3 flex-1 items-center rounded-2xl bg-dark-card p-4"
      style={{ opacity: isUnlocked ? 1 : 0.45 }}
    >
      {/* Badge Circle */}
      <View className="mb-3 items-center justify-center">
        {isUnlocked ? (
          <LinearGradient
            colors={['#F59E0B', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={iconName} size={26} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-dark-border">
            <Ionicons name="lock-closed" size={22} color="#4B5563" />
          </View>
        )}
      </View>

      {/* Name */}
      <Text
        className="mb-1 text-center text-sm font-semibold text-white"
        numberOfLines={2}
      >
        {achievement.nameVi || achievement.name}
      </Text>

      {/* Description */}
      <Text
        className="mb-2 text-center text-xs text-gray-500"
        numberOfLines={2}
      >
        {achievement.descriptionVi || achievement.description}
      </Text>

      {/* XP Reward */}
      <View className="flex-row items-center">
        <Ionicons name="star" size={12} color={GOLD} />
        <Text className="ml-1 text-xs font-medium" style={{ color: GOLD }}>
          +{achievement.xpReward} XP
        </Text>
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { data: achievements, isLoading, refetch, isRefetching } = useAchievements();

  const stats = useMemo(() => {
    if (!achievements) return { unlocked: 0, total: 0 };
    const unlocked = achievements.filter((a) => a.unlocked).length;
    return { unlocked, total: achievements.length };
  }, [achievements]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Build pairs for 2-column grid
  const rows = useMemo(() => {
    if (!achievements) return [];
    const sorted = [...achievements].sort((a, b) => {
      // Unlocked first, then by name
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return (a.nameVi || a.name).localeCompare(b.nameVi || b.name);
    });
    const result: Achievement[][] = [];
    for (let i = 0; i < sorted.length; i += 2) {
      result.push(sorted.slice(i, i + 2));
    }
    return result;
  }, [achievements]);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">Thanh tuu</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={GOLD}
            colors={[GOLD]}
          />
        }
      >
        {/* Stats Summary */}
        <View className="mb-4 rounded-2xl bg-dark-card p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <LinearGradient
                colors={['#F59E0B', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="trophy" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View className="ml-3">
                <Text className="text-2xl font-bold text-white">
                  {stats.unlocked}/{stats.total}
                </Text>
                <Text className="text-sm text-gray-400">Da mo khoa</Text>
              </View>
            </View>

            {/* Progress ring approximation */}
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: GOLD }}>
                {stats.total > 0
                  ? Math.round((stats.unlocked / stats.total) * 100)
                  : 0}
                %
              </Text>
              <Text className="text-xs text-gray-500">Hoan thanh</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-dark-border">
            <View
              className="h-full rounded-full"
              style={{
                width: `${stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}%`,
                backgroundColor: GOLD,
              }}
            />
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color={GOLD} />
          </View>
        ) : !achievements || achievements.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="trophy-outline" size={48} color="#4B5563" />
            <Text className="mt-3 text-base text-gray-500">
              Chua co thanh tuu nao
            </Text>
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} className="flex-row gap-3">
              {row.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
              {/* Spacer if odd number of items in last row */}
              {row.length === 1 && <View className="flex-1" />}
            </View>
          ))
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
