import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { radius, spacing } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

// ── Types ───────────────────────────────────────────────
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface CircleProps {
  size?: number;
  style?: ViewStyle;
}

interface TextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  style?: ViewStyle;
}

// ── Pulse hook ──────────────────────────────────────────
function usePulse() {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true, // reverse
    );
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// ── Skeleton (rectangle) ────────────────────────────────
function SkeletonBase({
  width = '100%',
  height = 16,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pulseStyle = usePulse();

  return (
    <Animated.View
      style={[
        styles.bone,
        { width, height, borderRadius },
        pulseStyle,
        style,
      ]}
    />
  );
}

// ── Skeleton.Circle ─────────────────────────────────────
function Circle({ size = 48, style }: CircleProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pulseStyle = usePulse();

  return (
    <Animated.View
      style={[
        styles.bone,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        pulseStyle,
        style,
      ]}
    />
  );
}

// ── Skeleton.Text ───────────────────────────────────────
function TextLines({
  lines = 3,
  lineHeight = 14,
  spacing: gap = spacing.xs,
  style,
}: TextProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        return (
          <SkeletonBase
            key={i}
            width={isLast ? '60%' : '100%'}
            height={lineHeight}
            borderRadius={radius.sm}
          />
        );
      })}
    </View>
  );
}

// ── Compose ─────────────────────────────────────────────
const Skeleton = Object.assign(SkeletonBase, {
  Circle,
  Text: TextLines,
});

// ── Styles ──────────────────────────────────────────────
const createStyles = (colors: any) => StyleSheet.create({
  bone: {
    backgroundColor: colors.bg.b3,
  },
});

export { Skeleton };
export default Skeleton;
