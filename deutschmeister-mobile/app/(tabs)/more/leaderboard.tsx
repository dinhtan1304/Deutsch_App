import { useState, useCallback } from 'react';
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
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthStore } from '@/stores/authStore';
import type { LeaderboardEntry } from '@/lib/api/leaderboard';

const GOLD = '#F59E0B';
const SILVER = '#9CA3AF';
const BRONZE = '#CD7F32';

const PERIODS = [
  { key: 'weekly' as const, label: 'Tuan' },
  { key: 'monthly' as const, label: 'Thang' },
  { key: 'all-time' as const, label: 'Tat ca' },
];

function getMedalColor(rank: number): string {
  if (rank === 1) return GOLD;
  if (rank === 2) return SILVER;
  if (rank === 3) return BRONZE;
  return '#4B5563';
}

function getMedalIcon(rank: number): React.ComponentProps<typeof Ionicons>['name'] {
  if (rank <= 3) return 'medal';
  return 'person';
}

function PodiumUser({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  const medalColor = getMedalColor(rank);
  // Heights: 1st = tallest, 2nd = medium, 3rd = shorter
  const podiumHeight = rank === 1 ? 80 : rank === 2 ? 60 : 48;
  const avatarSize = rank === 1 ? 64 : 52;
  const gradientColors =
    rank === 1
      ? (['#F59E0B', '#F97316'] as const)
      : rank === 2
        ? (['#9CA3AF', '#6B7280'] as const)
        : (['#CD7F32', '#A0522D'] as const);

  return (
    <View className="flex-1 items-center" style={{ marginTop: rank === 1 ? 0 : 20 }}>
      {/* Avatar */}
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: avatarSize,
          height: avatarSize,
          borderWidth: 3,
          borderColor: medalColor,
          backgroundColor: `${medalColor}20`,
        }}
      >
        {entry.avatar ? (
          <Text style={{ fontSize: rank === 1 ? 28 : 22 }}>{entry.avatar}</Text>
        ) : (
          <Ionicons name="person" size={rank === 1 ? 28 : 22} color={medalColor} />
        )}
      </View>

      {/* Name */}
      <Text
        className="mt-1.5 text-center text-xs font-semibold text-white"
        numberOfLines={1}
        style={isCurrentUser ? { color: '#6366F1' } : undefined}
      >
        {entry.name || 'Nguoi dung'}
      </Text>

      {/* XP */}
      <Text className="text-xs font-medium" style={{ color: medalColor }}>
        {entry.xp.toLocaleString()} XP
      </Text>

      {/* Podium block */}
      <LinearGradient
        colors={[gradientColors[0], gradientColors[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          width: '80%',
          height: podiumHeight,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          marginTop: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text className="text-xl font-bold text-white">{rank}</Text>
      </LinearGradient>
    </View>
  );
}

function RankRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  return (
    <View
      className={`mb-2 flex-row items-center rounded-2xl p-3 ${
        isCurrentUser ? '' : 'bg-dark-card'
      }`}
      style={isCurrentUser ? { backgroundColor: '#6366F115' } : undefined}
    >
      {/* Rank */}
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-dark-border">
        <Text className="text-sm font-bold text-gray-400">{entry.rank}</Text>
      </View>

      {/* Avatar */}
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-dark-secondary">
        {entry.avatar ? (
          <Text className="text-lg">{entry.avatar}</Text>
        ) : (
          <Ionicons name="person" size={18} color="#9CA3AF" />
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text
          className="text-base font-semibold"
          style={{ color: isCurrentUser ? '#6366F1' : '#FFFFFF' }}
        >
          {entry.name || 'Nguoi dung'}
          {isCurrentUser ? ' (Ban)' : ''}
        </Text>
        <Text className="text-xs text-gray-500">
          Level {entry.level} - {entry.levelName}
        </Text>
      </View>

      {/* XP */}
      <Text className="text-base font-bold" style={{ color: GOLD }}>
        {entry.xp.toLocaleString()}
      </Text>
      <Text className="ml-1 text-xs text-gray-500">XP</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const { data: entries, isLoading, refetch, isRefetching } = useLeaderboard(period, 50);
  const currentUser = useAuthStore((s) => s.user);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];

  // Reorder top3 for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">Bang xep hang</Text>
      </View>

      {/* Period Tabs */}
      <View className="flex-row gap-2 px-4 pb-3">
        {PERIODS.map((p) => {
          const isActive = period === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              className={`flex-1 items-center rounded-full py-2 ${
                isActive ? 'bg-primary-500' : 'bg-dark-card'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
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
        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color={GOLD} />
          </View>
        ) : !entries || entries.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="podium-outline" size={48} color="#4B5563" />
            <Text className="mt-3 text-base text-gray-500">
              Chua co du lieu xep hang
            </Text>
          </View>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <View className="mb-4 rounded-2xl bg-dark-card p-4 pb-0">
                <View className="flex-row items-end">
                  {podiumOrder.map((entry, idx) => {
                    const rank = entry.rank;
                    return (
                      <PodiumUser
                        key={entry.userId ?? `rank-${rank}`}
                        entry={entry}
                        rank={rank}
                        isCurrentUser={!!currentUser && entry.userId === currentUser.id}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            {/* If less than 3, show them as rows */}
            {top3.length < 3 &&
              top3.map((entry) => (
                <RankRow
                  key={entry.userId ?? `rank-${entry.rank}`}
                  entry={entry}
                  isCurrentUser={!!currentUser && entry.userId === currentUser.id}
                />
              ))}

            {/* Remaining Rows */}
            {rest.length > 0 && (
              <View className="mt-2">
                {rest.map((entry) => (
                  <RankRow
                    key={entry.userId ?? `rank-${entry.rank}`}
                    entry={entry}
                    isCurrentUser={!!currentUser && entry.userId === currentUser.id}
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
