import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

interface XPSummaryProps {
  xpEarned: number;
  isNewBest: boolean;
  level: number;
  leveledUp: boolean;
  xpInCurrentLevel: number;
  xpNeededForLevel: number;
}

/**
 * XP summary card shown on game result screens.
 * Shows XP earned, level progress bar, new-best badge, and level-up celebration.
 */
export function XPSummary({
  xpEarned,
  isNewBest,
  level,
  leveledUp,
  xpInCurrentLevel,
  xpNeededForLevel,
}: XPSummaryProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const pct = xpNeededForLevel > 0 ? Math.min(1, xpInCurrentLevel / xpNeededForLevel) : 0;
    progressWidth.value = withDelay(400, withTiming(pct, { duration: 800 }));
  }, [xpInCurrentLevel, xpNeededForLevel]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as any,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.card}>
      {/* XP Earned Row */}
      <View style={styles.xpRow}>
        <View style={styles.xpIconBox}>
          <Ionicons name="flash" size={18} color={colors.pastel.peach.base} />
        </View>
        <View style={styles.xpInfo}>
          <Text style={styles.xpLabel}>XP kiếm được</Text>
          <Text style={styles.xpValue}>+{xpEarned} XP</Text>
        </View>
        {isNewBest && (
          <View style={styles.newBestBadge}>
            <Ionicons name="trophy" size={12} color={colors.pastel.lime.on} />
            <Text style={styles.newBestText}>Kỷ lục!</Text>
          </View>
        )}
      </View>

      {/* Level Progress */}
      <View style={styles.levelRow}>
        <Text style={styles.levelLabel}>Level {level}</Text>
        <Text style={styles.levelXP}>
          {xpInCurrentLevel}/{xpNeededForLevel} XP
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, barStyle]} />
      </View>

      {/* Level Up Celebration */}
      {leveledUp && (
        <View style={styles.levelUpBanner}>
          <Ionicons name="arrow-up-circle" size={16} color={colors.pastel.lime.base} />
          <Text style={styles.levelUpText}>Level Up! Bạn đã đạt Level {level}!</Text>
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: colors.bg.b2,
    borderRadius: radius.stone,
    borderWidth: 1,
    borderColor: colors.pastel.peach.base + '30',
    padding: spacing.lg,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  xpIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.pastel.peach.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpInfo: {
    flex: 1,
  },
  xpLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  xpValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.bodyBlack,
    color: colors.pastel.peach.base,
  },
  newBestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.pastel.lime.base,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  newBestText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.on,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  levelLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.pastel.lavender.base,
  },
  levelXP: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  progressTrack: {
    marginTop: spacing.xs,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.pastel.lavender.base,
  },
  levelUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.pastel.lime.dim,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  levelUpText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.base,
  },
});
