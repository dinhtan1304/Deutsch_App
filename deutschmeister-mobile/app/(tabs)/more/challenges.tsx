import { useMemo, useCallback } from 'react';
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
import { useWeeklyChallenges, useChallengeHistory } from '@/hooks/useChallenges';
import type { ChallengeProgress } from '@/lib/api/challenges';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

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
  const colors = useThemeStore((s) => s.colors);
  const cs = useMemo(() => createCs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  const iconName = getChallengeIcon(challenge.challengeKey);
  const progress = challenge.target > 0 ? Math.min(challenge.current / challenge.target, 1) : 0;
  const percent = Math.round(progress * 100);
  const isCompleted = challenge.completed;

  return (
    <View style={cs.card}>
      <View style={cs.cardRow}>
        {/* Icon */}
        <View
          style={[
            cs.iconWrap,
            {
              backgroundColor: isCompleted
                ? colors.pastel.mint.dim
                : colors.pastel.lime.dim,
            },
          ]}
        >
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.pastel.mint.base} />
          ) : (
            <Ionicons name={iconName} size={22} color={colors.pastel.lime.base} />
          )}
        </View>

        {/* Info */}
        <View style={cs.infoWrap}>
          <View style={cs.titleRow}>
            <Text style={cs.title} numberOfLines={1}>
              {challenge.titleVi || challenge.title}
            </Text>
            <View style={cs.xpBadge}>
              <Ionicons name="star" size={12} color={colors.pastel.peach.base} />
              <Text style={cs.xpText}>+{challenge.xpReward} XP</Text>
            </View>
          </View>

          {/* Progress Text */}
          <Text style={cs.progressLabel}>
            {challenge.current}/{challenge.target}
            {isCompleted ? ' - Hoàn thành!' : ''}
          </Text>

          {/* Progress Bar */}
          <View style={cs.progressTrack}>
            {isCompleted ? (
              <LinearGradient
                colors={colors.gradient.correct}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={cs.progressFillFull}
              />
            ) : (
              <View
                style={[
                  cs.progressFill,
                  {
                    width: `${percent}%`,
                    backgroundColor: colors.pastel.lime.base,
                  },
                ]}
              />
            )}
          </View>

          {/* Percentage */}
          <Text style={cs.percentText}>{percent}%</Text>
        </View>
      </View>
    </View>
  );
}

export default function ChallengesScreen() {
  const colors = useThemeStore((s) => s.colors);
  const cs = useMemo(() => createCs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
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
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Thách thức</Text>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.pastel.lime.base}
            colors={[colors.pastel.lime.base]}
          />
        }
      >
        {/* Weekly Summary */}
        <View style={s.summaryCard}>
          <View style={s.summaryTopRow}>
            <View style={s.summaryLeft}>
              <LinearGradient
                colors={colors.gradient.quiz}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.summaryIcon}
              >
                <Ionicons name="flag" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ marginLeft: spacing.md }}>
                <Text style={s.summaryTitle}>Thách thức hàng tuần</Text>
                <Text style={s.summarySub}>
                  {stats.done}/{stats.total} hoàn thành
                </Text>
              </View>
            </View>

            {stats.totalXp > 0 && (
              <View style={s.summaryRight}>
                <Text style={s.summaryXp}>+{stats.totalXp}</Text>
                <Text style={s.summaryXpLabel}>XP</Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View style={s.summaryTrack}>
            <LinearGradient
              colors={colors.gradient.quiz}
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
          <View style={s.emptyWrap}>
            <ActivityIndicator size="large" color={colors.pastel.lime.base} />
          </View>
        ) : (
          <>
            {/* Active Challenges */}
            {active.length > 0 && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={s.sectionLabel}>Đang thực hiện</Text>
                {active.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </View>
            )}

            {/* Completed This Week */}
            {completedThisWeek.length > 0 && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={s.sectionLabel}>Đã hoàn thành tuần này</Text>
                {completedThisWeek.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </View>
            )}

            {/* Past Completed (from history) */}
            {historyChallenges && historyChallenges.length > 0 && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={s.sectionLabel}>Lịch sử thách thức</Text>
                {historyChallenges.slice(0, 10).map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </View>
            )}

            {/* Empty state */}
            {active.length === 0 &&
              completedThisWeek.length === 0 &&
              (!historyChallenges || historyChallenges.length === 0) && (
                <View style={s.emptyWrap}>
                  <Ionicons name="flag-outline" size={48} color={colors.text.tertiary} />
                  <Text style={s.emptyText}>Chưa có thách thức nào</Text>
                </View>
              )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createCs = (colors: any) => StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.stone,
  },
  infoWrap: {
    marginLeft: spacing.md,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  xpBadge: {
    marginLeft: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  xpText: {
    marginLeft: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.pastel.peach.base,
  },
  progressLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  progressFillFull: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  percentText: {
    marginTop: spacing.xs,
    textAlign: 'right',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
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
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
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
  summaryXp: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  summaryXpLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  summaryTrack: {
    marginTop: spacing.md,
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    color: colors.text.tertiary,
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
});
