import { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeeklyChallenges, useChallengeHistory } from '@/hooks/useChallenges';
import type { ChallengeProgress } from '@/lib/api/challenges';

const ACCENT = '#6366F1';

const CHALLENGE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  words_learned: 'book',
  games_played: 'game-controller',
  streak: 'flame',
  accuracy: 'checkmark-circle',
  xp_earned: 'star',
  writing: 'pencil',
  reading: 'reader',
  practice: 'barbell',
  default: 'flag',
};

function getChallengeIcon(challengeKey: string): React.ComponentProps<typeof Ionicons>['name'] {
  const key = Object.keys(CHALLENGE_ICONS).find((k) =>
    challengeKey.toLowerCase().includes(k)
  );
  return key ? CHALLENGE_ICONS[key] : CHALLENGE_ICONS.default;
}

function ChallengeCard({ challenge }: { challenge: ChallengeProgress }) {
  const iconName = getChallengeIcon(challenge.challengeKey);
  const progress = challenge.target > 0 ? Math.min(challenge.current / challenge.target, 1) : 0;
  const percent = Math.round(progress * 100);
  const isCompleted = challenge.completed;

  return (
    <View className="mb-3 rounded-2xl bg-dark-card p-4">
      <View className="flex-row items-start">
        {/* Icon */}
        <View
          className="h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: isCompleted ? '#22C55E20' : `${ACCENT}20` }}
        >
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          ) : (
            <Ionicons name={iconName} size={22} color={ACCENT} />
          )}
        </View>

        {/* Info */}
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className="flex-1 text-base font-semibold text-white"
              numberOfLines={1}
            >
              {challenge.titleVi || challenge.title}
            </Text>
            <View className="ml-2 flex-row items-center rounded-lg bg-dark-secondary px-2 py-0.5">
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text className="ml-1 text-xs font-medium text-yellow-500">
                +{challenge.xpReward} XP
              </Text>
            </View>
          </View>

          {/* Progress Text */}
          <Text className="mt-1 text-sm text-gray-400">
            {challenge.current}/{challenge.target}
            {isCompleted ? ' - Hoan thanh!' : ''}
          </Text>

          {/* Progress Bar */}
          <View className="mt-2.5 h-2 overflow-hidden rounded-full bg-dark-border">
            {isCompleted ? (
              <LinearGradient
                colors={['#22C55E', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 999,
                }}
              />
            ) : (
              <View
                className="h-full rounded-full"
                style={{
                  width: `${percent}%`,
                  backgroundColor: ACCENT,
                }}
              />
            )}
          </View>

          {/* Percentage */}
          <Text className="mt-1 text-right text-xs text-gray-500">
            {percent}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ChallengesScreen() {
  const router = useRouter();
  const {
    data: weeklyChallenges,
    isLoading: weeklyLoading,
    refetch: refetchWeekly,
    isRefetching: weeklyRefetching,
  } = useWeeklyChallenges();
  const {
    data: historyChallenges,
    isLoading: historyLoading,
    refetch: refetchHistory,
    isRefetching: historyRefetching,
  } = useChallengeHistory();

  const isLoading = weeklyLoading || historyLoading;
  const isRefetching = weeklyRefetching || historyRefetching;

  const { active, completedThisWeek } = useMemo(() => {
    if (!weeklyChallenges) return { active: [], completedThisWeek: [] };
    const act = weeklyChallenges.filter((c) => !c.completed);
    const comp = weeklyChallenges.filter((c) => c.completed);
    return { active: act, completedThisWeek: comp };
  }, [weeklyChallenges]);

  const stats = useMemo(() => {
    const total = weeklyChallenges?.length ?? 0;
    const done = completedThisWeek.length;
    const totalXp = completedThisWeek.reduce((sum, c) => sum + c.xpReward, 0);
    return { total, done, totalXp };
  }, [weeklyChallenges, completedThisWeek]);

  const onRefresh = useCallback(() => {
    refetchWeekly();
    refetchHistory();
  }, [refetchWeekly, refetchHistory]);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">Thach thuc</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
      >
        {/* Weekly Summary */}
        <View className="mb-4 rounded-2xl bg-dark-card p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
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
                <Ionicons name="flag" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View className="ml-3">
                <Text className="text-lg font-bold text-white">
                  Thach thuc hang tuan
                </Text>
                <Text className="text-sm text-gray-400">
                  {stats.done}/{stats.total} hoan thanh
                </Text>
              </View>
            </View>

            {stats.totalXp > 0 && (
              <View className="items-center">
                <Text className="text-lg font-bold" style={{ color: '#F59E0B' }}>
                  +{stats.totalXp}
                </Text>
                <Text className="text-xs text-gray-500">XP</Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-dark-border">
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%`,
                height: '100%',
                borderRadius: 999,
              }}
            />
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : (
          <>
            {/* Active Challenges */}
            {active.length > 0 && (
              <View className="mb-2">
                <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Dang thuc hien
                </Text>
                {active.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </View>
            )}

            {/* Completed This Week */}
            {completedThisWeek.length > 0 && (
              <View className="mb-2">
                <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Da hoan thanh tuan nay
                </Text>
                {completedThisWeek.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </View>
            )}

            {/* Past Completed (from history) */}
            {historyChallenges && historyChallenges.length > 0 && (
              <View className="mb-2">
                <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Lich su thach thuc
                </Text>
                {historyChallenges.slice(0, 10).map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </View>
            )}

            {/* Empty state */}
            {active.length === 0 &&
              completedThisWeek.length === 0 &&
              (!historyChallenges || historyChallenges.length === 0) && (
                <View className="items-center py-20">
                  <Ionicons name="flag-outline" size={48} color="#4B5563" />
                  <Text className="mt-3 text-base text-gray-500">
                    Chua co thach thuc nao
                  </Text>
                </View>
              )}
          </>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
