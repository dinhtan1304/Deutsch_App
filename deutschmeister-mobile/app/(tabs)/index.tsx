import { useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useFullDashboard, dashboardKeys } from '@/hooks/useDashboard';
import { useGrammarProgress } from '@/hooks/useGrammar';
import { useUserTopicsProgress } from '@/hooks/useTopics';
import { useSRSStats } from '@/hooks/usePersonalWords';
import { useAuthStore } from '@/stores/authStore';
import { spacing, radius, typography, component } from '@/theme';
import type { PastelKey } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';
import { PastelCard } from '@/components/ui/PastelCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { DashboardStats, WeeklyProgress } from '@/types/dashboard';

// ── Constants ────────────────────────────────────────
const DAILY_GOAL = 10;
const RING_SIZE = 100;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Daily Goal Ring ──────────────────────────────────
function DailyGoalRing({ wordsLearned }: { wordsLearned: number }) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const percentage = Math.min(100, (wordsLearned / DAILY_GOAL) * 100);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percentage / 100, { duration: 800 });
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={s.goalRingWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={colors.bg.b3}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {/* Fill */}
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={colors.pastel.lime.base}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={s.goalRingCenter}>
        <Text style={s.goalRingPercent}>{Math.round(percentage)}%</Text>
      </View>
      <Text style={s.goalRingLabel}>Mục tiêu hôm nay</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

function toLocalDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getEmptyStats(): DashboardStats {
  return {
    streak: 0, totalWordsLearned: 0, totalWords: 0, accuracy: 0,
    totalMinutes: 0, topicsCompleted: 0, totalTopics: 12, wordsToReview: 0,
    gamesPlayed: 0, startedAt: toLocalDateStr(new Date()),
    grammarCompleted: 0, grammarTotal: 0,
  };
}

function getEmptyWeeklyProgress(): WeeklyProgress[] {
  const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { day: names[d.getDay()], date: toLocalDateStr(d), wordsLearned: 0, gamesPlayed: 0, minutes: 0 };
  });
}

// ── Main Screen ───────────────────────────────────────
export default function HomeScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, refetch } = useFullDashboard();

  const stats = data?.stats ?? getEmptyStats();
  const weekly = data?.weeklyProgress ?? getEmptyWeeklyProgress();
  const greeting = useMemo(getGreeting, []);
  const displayName = user?.name || 'bạn';

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    refetch();
  }, [queryClient, refetch]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh}
            tintColor={colors.pastel.lime.base} colors={[colors.pastel.lime.base]} />
        }
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={s.header}>
          <Image source={require('../../assets/logo.png')} style={s.logo} />
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{greeting}</Text>
            <Text style={s.name}>{displayName}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/more/profile')}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hero Streak Card ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={s.heroStreakRow}>
              <Ionicons name="flame" size={28} color={colors.pastel.peach.base} />
              <Text style={s.heroNumber}>{stats.streak}</Text>
              <Text style={s.heroLabel}>ngày liên tiếp</Text>
            </View>
            <View style={s.levelPill}>
              <Ionicons name="school" size={14} color={colors.pastel.lavender.base} style={{ marginRight: 4 }} />
              <Text style={s.levelText}>Level {Math.floor(stats.totalWordsLearned / 50) + 1}</Text>
            </View>
          </View>
          {/* Week dots */}
          <View style={s.weekRow}>
            {weekly.map((day, i) => {
              const isToday = i === 6;
              const done = day.wordsLearned > 0 || day.gamesPlayed > 0;
              return (
                <View key={day.date} style={s.weekDayCol}>
                  <View style={[
                    s.weekDot,
                    done && s.weekDotDone,
                    isToday && !done && s.weekDotToday,
                    isToday && done && s.weekDotTodayDone,
                  ]}>
                    {done && <Ionicons name="checkmark" size={14} color={isToday ? colors.pastel.lime.on : colors.pastel.lime.base} />}
                  </View>
                  <Text style={[s.weekLabel, isToday && { color: colors.text.primary }]}>{day.day}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Next Lesson Card ── */}
        <Animated.View entering={FadeInDown.delay(130).duration(400)} style={{ marginTop: spacing.lg }}>
          <NextLessonCard onNavigate={(path) => router.push(path as any)} />
        </Animated.View>

        {/* ── SRS Reminder ── */}
        <SRSReminderCard onNavigate={() => router.push('/(tabs)/more/review' as any)} />

        {/* ── Daily Goal + Metrics ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.goalMetricRow}>
          <DailyGoalRing wordsLearned={stats.totalWordsLearned} />
          <View style={s.goalMetricStack}>
            <View style={s.miniMetricRow}>
              <View style={[s.miniMetricCard, { flex: 1 }]}>
                <View style={s.miniMetricIconRow}>
                  <Ionicons name="book" size={14} color={colors.pastel.mint.base} />
                  <Text style={[s.miniMetricValue, { color: colors.pastel.mint.base }]}>{stats.totalWordsLearned}</Text>
                </View>
                <Text style={s.miniMetricLabel}>Từ đã học</Text>
              </View>
              <View style={[s.miniMetricCard, { flex: 1 }]}>
                <View style={s.miniMetricIconRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.pastel.peach.base} />
                  <Text style={[s.miniMetricValue, { color: colors.pastel.peach.base }]}>{stats.accuracy}%</Text>
                </View>
                <Text style={s.miniMetricLabel}>Độ chính xác</Text>
              </View>
            </View>
            <View style={s.miniMetricRow}>
              <View style={[s.miniMetricCard, { flex: 1 }]}>
                <View style={s.miniMetricIconRow}>
                  <Ionicons name="game-controller" size={14} color={colors.pastel.sky.base} />
                  <Text style={[s.miniMetricValue, { color: colors.pastel.sky.base }]}>{stats.gamesPlayed}</Text>
                </View>
                <Text style={s.miniMetricLabel}>Trò chơi</Text>
              </View>
              <View style={[s.miniMetricCard, { flex: 1 }]}>
                <View style={s.miniMetricIconRow}>
                  <Ionicons name="refresh-circle" size={14} color={colors.pastel.rose.base} />
                  <Text style={[s.miniMetricValue, { color: colors.pastel.rose.base }]}>{stats.wordsToReview}</Text>
                </View>
                <Text style={s.miniMetricLabel}>Cần ôn tập</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── CTA Button ── */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginTop: spacing.lg }}>
          <PrimaryButton label="Tiếp tục học" onPress={() => router.push('/(tabs)/words')} />
        </Animated.View>

        {/* ── Module Grid 2x2 ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={s.sectionTitle}>Khu vực học</Text>
          <View style={s.moduleGrid}>
            <ModuleCard color="lavender" icon="library" label="Từ vựng" sub={`${stats.totalWordsLearned} từ`} onPress={() => router.push('/(tabs)/words')} />
            <ModuleCard color="sky" icon="male-female" label="Game" sub="der/die/das" onPress={() => router.push('/(tabs)/games')} />
            <ModuleCard color="mint" icon="create" label="Luyện viết" sub="AI chấm điểm" onPress={() => router.push('/(tabs)/practice')} />
            <ModuleCard color="peach" icon="mic" label="Phát âm" sub="Luyện nói" onPress={() => router.push('/(tabs)/practice')} />
          </View>
        </Animated.View>

        {/* ── Activity Chart ── */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={s.chartCard}>
          <Text style={s.chartTitle}>HOẠT ĐỘNG TUẦN NÀY</Text>
          <View style={s.chartBars}>
            {weekly.map((day, i) => {
              const val = day.wordsLearned + day.gamesPlayed;
              const maxVal = Math.max(...weekly.map(d => d.wordsLearned + d.gamesPlayed), 1);
              const h = Math.max((val / maxVal) * 80, 4);
              const isToday = i === 6;
              return (
                <View key={day.date} style={s.barCol}>
                  <View style={[s.bar, { height: h, backgroundColor: isToday || val > 0 ? colors.pastel.lime.base : colors.bg.b3 }]} />
                  <Text style={[s.barLabel, isToday && { color: colors.text.primary }]}>{day.day}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Quick Stats Row ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={s.metricRow}>
          <PastelCard color="sky" style={s.metricCard}>
            <Text style={[s.metricValue, { color: colors.pastel.sky.base }]}>{stats.gamesPlayed}</Text>
            <Text style={s.metricLabel}>Trò chơi</Text>
          </PastelCard>
          <PastelCard color="lavender" style={s.metricCard}>
            <Text style={[s.metricValue, { color: colors.pastel.lavender.base }]}>{stats.totalMinutes}p</Text>
            <Text style={s.metricLabel}>Thời gian</Text>
          </PastelCard>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Next Lesson Card ─────────────────────────────────
function NextLessonCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const { data: grammarProgress } = useGrammarProgress();
  const { data: topicsProgress } = useUserTopicsProgress();

  const nextLesson = useMemo(() => {
    // 1. Check for in-progress grammar lesson
    const inProgressGrammar = grammarProgress?.find(
      (g) => g.status === 'in_progress',
    );
    if (inProgressGrammar) {
      return {
        icon: 'library-outline' as const,
        title: inProgressGrammar.lessonTitle,
        subtitle: `${inProgressGrammar.level} · ${inProgressGrammar.correctCount}/${inProgressGrammar.totalAttempts} đúng`,
        path: '/(tabs)/practice/grammar',
      };
    }

    // 2. Check for incomplete topic (started but not finished)
    const incompleteTopic = topicsProgress?.find(
      (t) => t.wordsLearned > 0 && !t.completedAt && t.wordsLearned < t.wordsTotal,
    );
    if (incompleteTopic) {
      return {
        icon: 'book-outline' as const,
        title: incompleteTopic.nameVi || incompleteTopic.nameDe,
        subtitle: `${incompleteTopic.level} · ${incompleteTopic.wordsLearned}/${incompleteTopic.wordsTotal} từ`,
        path: '/(tabs)/more/topics',
      };
    }

    // 3. Fallback: start new
    return {
      icon: 'book-outline' as const,
      title: 'Bắt đầu bài mới',
      subtitle: 'Chọn chủ đề hoặc ngữ pháp',
      path: '/(tabs)/practice',
    };
  }, [grammarProgress, topicsProgress]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onNavigate(nextLesson.path)}
      style={s.nextLessonCard}
    >
      <View style={s.nextLessonIconBox}>
        <Ionicons name={nextLesson.icon} size={16} color={colors.pastel.lavender.base} />
      </View>
      <View style={s.nextLessonContent}>
        <Text style={s.nextLessonTitle} numberOfLines={1}>
          Tiếp tục: {nextLesson.title}
        </Text>
        <Text style={s.nextLessonSubtitle} numberOfLines={1}>
          {nextLesson.subtitle}
        </Text>
      </View>
      <View style={s.nextLessonArrow}>
        <Ionicons name="arrow-forward" size={14} color={colors.pastel.lime.on} />
      </View>
    </TouchableOpacity>
  );
}

// ── SRS Reminder Card ─────────────────────────────────
function SRSReminderCard({ onNavigate }: { onNavigate: () => void }) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const { data: srsStats } = useSRSStats();
  const dueCount = srsStats?.due ?? 0;

  if (dueCount <= 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ marginTop: spacing.md }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onNavigate}
        style={s.srsCard}
      >
        <View style={s.srsIconBox}>
          <Ionicons name="refresh-outline" size={16} color={colors.pastel.rose.base} />
        </View>
        <View style={s.srsContent}>
          <Text style={s.srsTitle}>{dueCount} từ cần ôn tập</Text>
          <Text style={s.srsSubtitle}>Ôn ngay để không quên!</Text>
        </View>
        <View style={s.srsArrow}>
          <Ionicons name="arrow-forward" size={14} color={colors.pastel.rose.on} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Module Card ───────────────────────────────────────

function ModuleCard({ color, icon, label, sub, onPress }: {
  color: PastelKey; icon: string; label: string; sub: string; onPress: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const palette = colors.pastel[color];
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}
      style={[s.moduleCard, { backgroundColor: palette.dim, borderColor: palette.base + '33' }]}
    >
      <View style={[s.moduleIcon, { backgroundColor: palette.base + '20' }]}>
        <Ionicons name={icon as any} size={22} color={palette.base} />
      </View>
      <Text style={[s.moduleLabel, { color: colors.text.primary }]}>{label}</Text>
      <Text style={s.moduleSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────
const createS = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.b0 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.screenH },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl, gap: spacing.md },
  logo: { width: 36, height: 36, borderRadius: radius.lg },
  greeting: { fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.body, color: colors.text.secondary },
  name: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, fontFamily: typography.fontFamily.heading, color: colors.text.primary, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.pastel.lavender.dim, borderWidth: 1, borderColor: colors.pastel.lavender.base + '33', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, fontFamily: typography.fontFamily.heading, color: colors.pastel.lavender.base },

  // Hero Streak
  heroCard: {
    backgroundColor: colors.bg.b2, borderRadius: radius.stone, borderWidth: 1,
    borderColor: component.heroCard.accentBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroNumber: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, fontFamily: typography.fontFamily.heading, color: colors.pastel.lime.base },
  heroLabel: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body, color: colors.text.secondary },
  levelPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.pastel.lavender.dim, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.pastel.lavender.base + '33' },
  levelText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, fontFamily: typography.fontFamily.bodySemibold, color: colors.pastel.lavender.base },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  weekDayCol: { alignItems: 'center', gap: 3 },
  weekDot: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.bg.b3, alignItems: 'center', justifyContent: 'center' },
  weekDotDone: { backgroundColor: colors.pastel.lime.dim },
  weekDotToday: { borderWidth: 2, borderColor: colors.pastel.lime.base + '40' },
  weekDotTodayDone: { backgroundColor: colors.pastel.lime.base },
  weekLabel: { fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.body, color: colors.text.tertiary },

  // Next Lesson
  nextLessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.b2,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.pastel.lime.base + '25',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: spacing.md,
  },
  nextLessonIconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.pastel.lavender.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLessonContent: {
    flex: 1,
  },
  nextLessonTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  nextLessonSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  nextLessonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.pastel.lime.base,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SRS Reminder
  srsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pastel.rose.dim,
    borderRadius: radius.stone,
    borderWidth: 1,
    borderColor: colors.pastel.rose.base + '30',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: spacing.md,
  },
  srsIconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.pastel.rose.base + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  srsContent: {
    flex: 1,
  },
  srsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.rose.base,
  },
  srsSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  srsArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.pastel.rose.base,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Daily Goal Ring
  goalRingWrap: { alignItems: 'center', justifyContent: 'center' },
  goalRingCenter: { position: 'absolute', top: 0, left: 0, width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  goalRingPercent: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, fontFamily: typography.fontFamily.heading, color: colors.pastel.lime.base },
  goalRingLabel: { fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.body, color: colors.text.secondary, marginTop: spacing.xs },

  // Goal + Metrics row
  goalMetricRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  goalMetricStack: { flex: 1, gap: spacing.xs },
  miniMetricRow: { flexDirection: 'row', gap: spacing.xs },
  miniMetricCard: { backgroundColor: colors.bg.b2, borderRadius: radius.stone, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  miniMetricIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniMetricValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.black, fontFamily: typography.fontFamily.heading, lineHeight: 24 },
  miniMetricLabel: { fontSize: 10, fontFamily: typography.fontFamily.body, color: colors.text.secondary, marginTop: 1 },

  // Metrics (Quick Stats Row)
  metricRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  metricCard: { flex: 1 },
  metricValue: { fontSize: typography.fontSize.xl + 6, fontWeight: typography.fontWeight.black, fontFamily: typography.fontFamily.heading, lineHeight: 36 },
  metricLabel: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body, color: colors.text.secondary, marginTop: 4 },

  // Sections
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, fontFamily: typography.fontFamily.bodyBold, color: colors.text.tertiary, letterSpacing: typography.letterSpacing.widest, textTransform: 'uppercase', marginTop: spacing['2xl'], marginBottom: spacing.md },

  // Module Grid
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  moduleCard: { width: '48%' as any, borderRadius: radius.stone, borderWidth: 1, padding: spacing.lg, flexGrow: 1, flexBasis: '45%' },
  moduleIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  moduleLabel: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, fontFamily: typography.fontFamily.headingSemibold },
  moduleSub: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body, color: colors.text.secondary, marginTop: 2 },

  // Chart
  chartCard: { backgroundColor: colors.bg.b2, borderRadius: radius['2xl'], borderWidth: 1, borderColor: colors.border.default, padding: spacing.lg, marginTop: spacing.lg },
  chartTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, fontFamily: typography.fontFamily.bodyBold, color: colors.text.tertiary, letterSpacing: typography.letterSpacing.widest, marginBottom: spacing.md },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barCol: { alignItems: 'center', gap: 6, flex: 1 },
  bar: { width: 20, borderRadius: 6 },
  barLabel: { fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.body, color: colors.text.tertiary },
});
