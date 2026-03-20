import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, typography } from '@/theme';
import type { WeeklyProgress } from '@/types/dashboard';
import { useThemeStore } from '@/stores/themeStore';

interface WeeklyChartProps {
  data: WeeklyProgress[];
}

const DAY_LABELS: Record<string, string> = {
  Mon: 'T2',
  Tue: 'T3',
  Wed: 'T4',
  Thu: 'T5',
  Fri: 'T6',
  Sat: 'T7',
  Sun: 'CN',
};

function isToday(dateStr: string): boolean {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return dateStr === today;
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const maxWords = useMemo(
    () => Math.max(...data.map((d) => d.wordsLearned), 1),
    [data],
  );

  const totals = useMemo(
    () => ({
      words: data.reduce((s, d) => s + d.wordsLearned, 0),
      games: data.reduce((s, d) => s + d.gamesPlayed, 0),
      minutes: data.reduce((s, d) => s + d.minutes, 0),
    }),
    [data],
  );

  const BAR_MAX_HEIGHT = 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>📊</Text>
          <Text style={styles.headerTitle}>
            Tiến độ 7 ngày qua
          </Text>
        </View>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.dot, { backgroundColor: colors.pastel.lavender.base }]} />
          <Text style={styles.summaryText}>
            {totals.words} từ
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.dot, { backgroundColor: colors.pastel.mint.base }]} />
          <Text style={styles.summaryText}>
            {totals.games} games
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.dot, { backgroundColor: colors.pastel.lavender.base }]} />
          <Text style={styles.summaryText}>
            {totals.minutes} phút
          </Text>
        </View>
      </View>

      {/* Chart bars */}
      <View
        style={[styles.chartRow, { height: BAR_MAX_HEIGHT + 24 }]}
      >
        {data.map((day) => {
          const barHeight = Math.max(
            (day.wordsLearned / maxWords) * BAR_MAX_HEIGHT,
            4,
          );
          const today = isToday(day.date);
          const barColor = today ? colors.pastel.lavender.base : colors.bg.b4;
          const labelVi = DAY_LABELS[day.day] ?? day.day;

          return (
            <View key={day.date} style={styles.barColumn}>
              {/* Value label */}
              {day.wordsLearned > 0 && (
                <Text
                  style={[
                    styles.barValue,
                    { color: today ? colors.pastel.lavender.base : colors.text.secondary },
                  ]}
                >
                  {day.wordsLearned}
                </Text>
              )}
              {/* Bar */}
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: barColor,
                    ...(today && {
                      shadowColor: colors.pastel.lavender.base,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      elevation: 4,
                    }),
                  },
                ]}
              />
              {/* Day label */}
              <Text
                style={[
                  styles.dayLabel,
                  { color: today ? colors.text.primary : colors.text.tertiary },
                ]}
              >
                {labelVi}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function WeeklyChartSkeleton() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <View style={styles.skeletonTitle} />
      <View style={[styles.chartRow, { height: 124 }]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.barColumn}>
            <View
              style={[styles.skeletonBar, { height: 20 + Math.random() * 60 }]}
            />
            <View style={styles.skeletonDayLabel} />
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
  },
  headerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  summaryRow: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  bar: {
    width: 28,
    borderRadius: radius.sm,
  },
  dayLabel: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  skeletonTitle: {
    marginBottom: spacing.lg,
    height: 20,
    width: 160,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonBar: {
    width: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonDayLabel: {
    marginTop: spacing.sm,
    height: 12,
    width: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
});
