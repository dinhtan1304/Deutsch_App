import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { spacing, radius, typography } from '@/theme';
import { PastelCard } from '@/components/ui/PastelCard';
import { SRSChip } from '@/components/ui/SRSChip';
import { useThemeStore } from '@/stores/themeStore';

// ── Types ─────────────────────────────────────────────
type StatsData = {
  level: number;
  levelName: string;
  currentXP: number;
  nextLevelXP: number;
  wordsLearned: number;
  accuracy: number;
  totalMinutes: number;
  weeklyActivity: { day: string; value: number }[];
  srsWords: { word: string; urgency: 'hot' | 'warm' }[];
};

type Props = {
  stats: StatsData;
};

// ── Component ─────────────────────────────────────────
export function StatsScreen({ stats }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const xpPct = Math.min((stats.currentXP / stats.nextLevelXP) * 100, 100);
  const maxActivity = Math.max(...stats.weeklyActivity.map(d => d.value), 1);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={s.header}>Tiến độ</Text>
        </Animated.View>

        {/* ── Level Hero Card ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.levelCard}>
          <View style={s.levelRow}>
            <View style={s.levelBadge}>
              <Text style={s.levelBadgeText}>{stats.level}</Text>
            </View>
            <View style={s.levelInfo}>
              <Text style={s.levelName}>{stats.levelName}</Text>
              <Text style={s.levelXP}>{stats.currentXP} / {stats.nextLevelXP} XP</Text>
            </View>
          </View>
          <View style={s.xpBarOuter}>
            <View style={[s.xpBarInner, { width: `${xpPct}%` as any }]} />
          </View>
        </Animated.View>

        {/* ── 3-col Metric Grid ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={s.metricRow}>
          <PastelCard color="mint" style={s.metricCard}>
            <Text style={[s.metricValue, { color: colors.pastel.mint.base }]}>{stats.wordsLearned}</Text>
            <Text style={s.metricLabel}>Từ học</Text>
          </PastelCard>
          <PastelCard color="peach" style={s.metricCard}>
            <Text style={[s.metricValue, { color: colors.pastel.peach.base }]}>{stats.accuracy}%</Text>
            <Text style={s.metricLabel}>Chính xác</Text>
          </PastelCard>
          <PastelCard color="sky" style={s.metricCard}>
            <Text style={[s.metricValue, { color: colors.pastel.sky.base }]}>{stats.totalMinutes}p</Text>
            <Text style={s.metricLabel}>Thời gian</Text>
          </PastelCard>
        </Animated.View>

        {/* ── Activity Chart Card ── */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={s.chartCard}>
          <Text style={s.sectionLabel}>HOẠT ĐỘNG 7 NGÀY</Text>
          <View style={s.chartBars}>
            {stats.weeklyActivity.map((day, i) => {
              const h = Math.max((day.value / maxActivity) * 90, 4);
              const isToday = i === stats.weeklyActivity.length - 1;
              const active = day.value > 0;
              return (
                <View key={i} style={s.barCol}>
                  <View style={[s.bar, {
                    height: h,
                    backgroundColor: active || isToday ? colors.pastel.lime.base : colors.bg.b3,
                  }]} />
                  <Text style={[s.barLabel, isToday && s.barLabelToday]}>{day.day}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── SRS Card ── */}
        {stats.srsWords.length > 0 && (
          <Animated.View entering={FadeInDown.delay(320).duration(400)} style={s.srsCard}>
            <Text style={s.sectionLabel}>CẦN ÔN TẬP · SRS</Text>
            <View style={s.srsWrap}>
              {stats.srsWords.map((w, i) => (
                <SRSChip key={i} word={w.word} urgency={w.urgency} />
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────
const createS = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.b0 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.screenH },

  // Header
  header: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.xl, fontFamily: typography.fontFamily.heading },

  // Level Card
  levelCard: {
    backgroundColor: colors.pastel.lavender.dim, borderRadius: radius['2xl'],
    borderWidth: 1, borderColor: colors.pastel.lavender.base + '33',
    padding: spacing.xl,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelBadge: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.pastel.lavender.base, alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, color: colors.pastel.lavender.on, fontFamily: typography.fontFamily.heading },
  levelInfo: { flex: 1 },
  levelName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary, fontFamily: typography.fontFamily.heading },
  levelXP: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  xpBarOuter: { height: 8, borderRadius: 4, backgroundColor: colors.bg.b3, marginTop: spacing.md, overflow: 'hidden' },
  xpBarInner: { height: 8, borderRadius: 4, backgroundColor: colors.pastel.lavender.base },

  // Metrics
  metricRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  metricCard: { flex: 1, alignItems: 'center' as const },
  metricValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, fontFamily: typography.fontFamily.bodyBlack },
  metricLabel: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 4 },

  // Chart
  chartCard: { backgroundColor: colors.bg.b2, borderRadius: radius['2xl'], borderWidth: 1, borderColor: colors.border.default, padding: spacing.lg, marginTop: spacing.lg },
  sectionLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.text.tertiary, letterSpacing: typography.letterSpacing.widest, marginBottom: spacing.md, fontFamily: typography.fontFamily.heading },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
  barCol: { alignItems: 'center', gap: 6, flex: 1 },
  bar: { width: 22, borderRadius: 6 },
  barLabel: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  barLabelToday: { color: colors.text.primary, fontWeight: typography.fontWeight.bold, fontFamily: typography.fontFamily.heading },

  // SRS
  srsCard: { backgroundColor: colors.bg.b2, borderRadius: radius['2xl'], borderWidth: 1, borderColor: colors.border.default, padding: spacing.lg, marginTop: spacing.lg },
  srsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
