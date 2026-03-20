import React, { useEffect, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

interface ComboBadgeProps {
  streak: number;
}

/** Returns combo label and color based on streak */
function getComboInfo(streak: number, colors: any) {
  if (streak >= 10) return { label: 'x5', color: colors.pastel.lime.base, bg: colors.pastel.lime.dim };
  if (streak >= 5) return { label: 'x3', color: colors.pastel.peach.base, bg: colors.pastel.peach.dim };
  if (streak >= 3) return { label: 'x2', color: colors.pastel.lavender.base, bg: colors.pastel.lavender.dim };
  return null;
}

/**
 * Combo multiplier badge that pulses when streak increases.
 * Shows x2 (3+), x3 (5+), x5 (10+).
 */
export function ComboBadge({ streak }: ComboBadgeProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useSharedValue(1);
  const combo = getComboInfo(streak, colors);

  useEffect(() => {
    if (!combo) return;
    scale.value = withSequence(
      withTiming(1.3, { duration: 120 }),
      withTiming(1, { duration: 120 }),
    );
  }, [streak]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!combo) return null;

  return (
    <Animated.View style={[styles.badge, { backgroundColor: combo.bg }, animatedStyle]}>
      <Ionicons name="flame" size={12} color={combo.color} />
      <Text style={[styles.text, { color: combo.color }]}>{combo.label}</Text>
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.bodyBlack,
  },
});
