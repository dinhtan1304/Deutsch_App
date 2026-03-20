import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthStore } from '@/stores/authStore';
import type { LeaderboardEntry } from '@/lib/api/leaderboard';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

const PERIODS = [
  { key: 'weekly' as const, label: 'Tuần' },
  { key: 'monthly' as const, label: 'Tháng' },
  { key: 'all-time' as const, label: 'Tất cả' },
];

function getMedalColor(rank: number, colors: ThemeColors): string {
  if (rank === 1) return colors.pastel.peach.base;
  if (rank === 2) return colors.pastel.sky.base;
  if (rank === 3) return colors.pastel.peach.base;
  return colors.text.tertiary;
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
  const colors = useThemeStore((s) => s.colors);
  const ps = useMemo(() => createPs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  const medalColor = getMedalColor(rank, colors);
  const podiumHeight = rank === 1 ? 80 : rank === 2 ? 60 : 48;
  const avatarSize = rank === 1 ? 64 : 52;
  const gradientColors =
    rank === 1
      ? (colors.gradient.warning as readonly [string, string])
      : rank === 2
        ? ([colors.pastel.sky.base, '#6B9FCF'] as const)
        : ([colors.pastel.peach.base, '#D4956A'] as const);

  return (
    <View style={[ps.column, { marginTop: rank === 1 ? 0 : 20 }]}>
      {/* Avatar */}
      <View
        style={[
          ps.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderColor: medalColor,
            backgroundColor: `${medalColor}20`,
          },
        ]}
      >
        {entry.avatar ? (
          <Text style={{ fontSize: rank === 1 ? 28 : 22, fontFamily: typography.fontFamily.body }}>{entry.avatar}</Text>
        ) : (
          <Ionicons name="person" size={rank === 1 ? 28 : 22} color={medalColor} />
        )}
      </View>

      {/* Name */}
      <Text
        style={[
          ps.name,
          isCurrentUser ? { color: colors.pastel.lavender.base } : undefined,
        ]}
        numberOfLines={1}
      >
        {entry.name || 'Người dùng'}
      </Text>

      {/* XP */}
      <Text style={[ps.xp, { color: medalColor }]}>
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
          borderTopLeftRadius: radius.md,
          borderTopRightRadius: radius.md,
          marginTop: spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={ps.podiumRank}>{rank}</Text>
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
  const colors = useThemeStore((s) => s.colors);
  const ps = useMemo(() => createPs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  return (
    <View
      style={[
        s.rankRow,
        isCurrentUser
          ? { backgroundColor: colors.pastel.lavender.dim }
          : { backgroundColor: colors.bg.b2 },
      ]}
    >
      {/* Rank */}
      <View style={s.rankBadge}>
        <Text style={s.rankNum}>{entry.rank}</Text>
      </View>

      {/* Avatar */}
      <View style={s.rankAvatar}>
        {entry.avatar ? (
          <Text style={s.rankAvatarEmoji}>{entry.avatar}</Text>
        ) : (
          <Ionicons name="person" size={18} color={colors.text.secondary} />
        )}
      </View>

      {/* Info */}
      <View style={s.flex1}>
        <Text
          style={[
            s.rankName,
            { color: isCurrentUser ? colors.pastel.lavender.base : colors.text.primary },
          ]}
        >
          {entry.name || 'Người dùng'}
          {isCurrentUser ? ' (Bạn)' : ''}
        </Text>
        <Text style={s.rankSub}>
          Level {entry.level} - {entry.levelName}
        </Text>
      </View>

      {/* XP */}
      <Text style={s.rankXp}>{entry.xp.toLocaleString()}</Text>
      <Text style={s.rankXpLabel}>XP</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const colors = useThemeStore((s) => s.colors);
  const ps = useMemo(() => createPs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
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
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Bảng xếp hạng</Text>
      </View>

      {/* Period Tabs */}
      <View style={s.tabRow}>
        {PERIODS.map((p) => {
          const isActive = period === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[
                s.tab,
                isActive
                  ? { backgroundColor: colors.pastel.lime.base }
                  : { backgroundColor: colors.bg.b2 },
              ]}
            >
              <Text
                style={[
                  s.tabLabel,
                  isActive
                    ? { color: colors.pastel.lime.on }
                    : { color: colors.text.secondary },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.pastel.peach.base}
            colors={[colors.pastel.peach.base]}
          />
        }
      >
        {isLoading ? (
          <View style={s.emptyWrap}>
            <ActivityIndicator size="large" color={colors.pastel.peach.base} />
          </View>
        ) : !entries || entries.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="podium-outline" size={48} color={colors.text.tertiary} />
            <Text style={s.emptyText}>Chưa có dữ liệu xếp hạng</Text>
          </View>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <View style={s.podiumCard}>
                <View style={s.podiumRow}>
                  {podiumOrder.map((entry) => {
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
              <View style={{ marginTop: spacing.sm }}>
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

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createPs = (colors: any) => StyleSheet.create({
  column: {
    flex: 1,
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 3,
  },
  name: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  xp: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  podiumRank: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: '#FFFFFF',
  },
});

const createS = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  podiumCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  rankRow: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.stone,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  rankBadge: {
    marginRight: spacing.md,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  rankNum: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.secondary,
  },
  rankAvatar: {
    marginRight: spacing.md,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.bg.b3,
  },
  rankAvatarEmoji: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.body,
  },
  flex1: {
    flex: 1,
  },
  rankName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
  },
  rankSub: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  rankXp: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  rankXpLabel: {
    marginLeft: 4,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
});
