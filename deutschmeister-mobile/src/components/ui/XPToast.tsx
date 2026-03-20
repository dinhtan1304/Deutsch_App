import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

interface XPToastProps {
  /** XP amount to display, e.g. 10 */
  amount: number;
  /** Combo multiplier label, e.g. "x2" */
  combo?: string;
  /** Unique key to trigger re-render on new toasts */
  triggerKey: number;
  /** Called when animation finishes */
  onFinish?: () => void;
}

/**
 * Animated "+XP" toast that floats up and fades out.
 * Place it absolutely in the game top bar area.
 */
export function XPToast({ amount, combo, triggerKey, onFinish }: XPToastProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (triggerKey === 0) return;

    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(600, withTiming(0, { duration: 300 })),
    );
    translateY.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(-30, { duration: 900 }),
    );
    scale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 }),
    );

    if (onFinish) {
      const timer = setTimeout(() => onFinish(), 1100);
      return () => clearTimeout(timer);
    }
  }, [triggerKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (triggerKey === 0) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>+{amount} XP</Text>
      {combo ? <Text style={styles.combo}>{combo}</Text> : null}
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: -8,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pastel.peach.dim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 4,
    zIndex: 100,
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  combo: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.bodyBlack,
    color: colors.pastel.lime.base,
  },
});
