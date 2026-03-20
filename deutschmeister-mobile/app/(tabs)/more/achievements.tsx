import { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAchievements } from '@/hooks/useAchievements';
import type { Achievement } from '@/lib/api/achievements';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

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
  if (achievement.icon && CATEGORY_ICONS[achievement.icon]) {
    return CATEGORY_ICONS[achievement.icon];
  }
  if (achievement.category && CATEGORY_ICONS[achievement.category]) {
    return CATEGORY_ICONS[achievement.category];
  }
  return CATEGORY_ICONS.default;
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const colors = useThemeStore((s) => s.colors);
  const bs = useMemo(() => createBs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  const iconName = getAchievementIcon(achievement);
  const isUnlocked = achievement.unlocked;

  return (
    <View
      style={[
        bs.card,
        { opacity: isUnlocked ? 1 : 0.45 },
      ]}
    >
      {/* Badge Circle */}
      <View style={bs.badgeWrap}>
        {isUnlocked ? (
          <LinearGradient
            colors={colors.gradient.quiz}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={bs.badgeGradient}
          >
            <Ionicons name={iconName} size={26} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={bs.badgeLocked}>
            <Ionicons name="lock-closed" size={22} color={colors.text.tertiary} />
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={bs.name} numberOfLines={2}>
        {achievement.nameVi || achievement.name}
      </Text>

      {/* Description */}
      <Text style={bs.desc} numberOfLines={2}>
        {achievement.descriptionVi || achievement.description}
      </Text>

      {/* XP Reward */}
      <View style={bs.xpRow}>
        <Ionicons name="star" size={12} color={colors.pastel.peach.base} />
        <Text style={bs.xpText}>+{achievement.xpReward} XP</Text>
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const colors = useThemeStore((s) => s.colors);
  const bs = useMemo(() => createBs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
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
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Thành tựu</Text>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.pastel.lavender.base}
            colors={[colors.pastel.lavender.base]}
          />
        }
      >
        {/* Stats Summary */}
        <View style={s.summaryCard}>
          <View style={s.summaryTopRow}>
            <View style={s.summaryLeft}>
              <LinearGradient
                colors={colors.gradient.quiz}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.summaryIcon}
              >
                <Ionicons name="trophy" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ marginLeft: spacing.md }}>
                <Text style={s.summaryCount}>
                  {stats.unlocked}/{stats.total}
                </Text>
                <Text style={s.summarySub}>Đã mở khóa</Text>
              </View>
            </View>

            {/* Progress ring approximation */}
            <View style={s.summaryRight}>
              <Text style={s.summaryPercent}>
                {stats.total > 0
                  ? Math.round((stats.unlocked / stats.total) * 100)
                  : 0}
                %
              </Text>
              <Text style={s.summaryPercentLabel}>Hoàn thành</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                {
                  width: `${stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}%`,
                  backgroundColor: colors.pastel.lavender.base,
                },
              ]}
            />
          </View>
        </View>

        {isLoading ? (
          <View style={s.emptyWrap}>
            <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
          </View>
        ) : !achievements || achievements.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="trophy-outline" size={48} color={colors.text.tertiary} />
            <Text style={s.emptyText}>Chưa có thành tựu nào</Text>
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={s.gridRow}>
              {row.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
              {/* Spacer if odd number of items in last row */}
              {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createBs = (colors: any) => StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  badgeWrap: {
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: {
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.bg.b3,
  },
  name: {
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  desc: {
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    marginLeft: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.pastel.peach.base,
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
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  summaryCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCount: {
    fontSize: typography.fontSize.xl + 2,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  summarySub: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  summaryRight: {
    alignItems: 'center',
  },
  summaryPercent: {
    fontSize: typography.fontSize.xl + 2,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lavender.base,
  },
  summaryPercentLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  progressTrack: {
    marginTop: spacing.md,
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
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
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});
