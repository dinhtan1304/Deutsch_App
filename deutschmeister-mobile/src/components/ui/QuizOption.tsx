import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { radius, spacing, typography, animation } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

type OptionState = 'default' | 'selected' | 'correct' | 'wrong';

type Props = {
  label: string;
  letter: 'A' | 'B' | 'C' | 'D';
  state: OptionState;
  onPress?: () => void;
  disabled?: boolean;
};

function getStateStyles(colors: ThemeColors): Record<OptionState, { bg: string; border: string; text: string; letterBg: string }> {
  return {
    default:  { bg: colors.bg.b2,             border: colors.border.default, text: colors.text.primary,       letterBg: colors.bg.b3 },
    selected: { bg: colors.bg.b3,             border: colors.border.strong,  text: colors.text.primary,       letterBg: colors.bg.b4 },
    correct:  { bg: colors.pastel.mint.dim,   border: 'rgba(123, 200, 140, 0.30)', text: colors.pastel.mint.base, letterBg: colors.pastel.mint.dim },
    wrong:    { bg: colors.pastel.rose.dim,   border: 'rgba(212, 131, 142, 0.25)', text: colors.pastel.rose.base, letterBg: colors.pastel.rose.dim },
  };
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function QuizOption({ label, letter, state, onPress, disabled }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const stateStyles = useMemo(() => getStateStyles(colors), [colors]);
  const s = stateStyles[state];

  const animStyle = useAnimatedStyle(() => {
    if (state === 'correct' || state === 'wrong') {
      return {
        transform: [
          {
            scale: withSequence(
              withTiming(1.02, { duration: animation.duration.fast / 2 }),
              withTiming(1, { duration: animation.duration.fast / 2 }),
            ),
          },
        ],
      };
    }
    return { transform: [{ scale: 1 }] };
  }, [state]);

  return (
    <AnimatedTouchable
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.row, { backgroundColor: s.bg, borderColor: s.border }, animStyle]}
    >
      <View style={[styles.letterBox, { backgroundColor: s.letterBg }]}>
        <Text style={[styles.letter, { color: s.text }]}>{letter}</Text>
      </View>
      <Text style={[styles.label, { color: s.text }]}>{label}</Text>
    </AnimatedTouchable>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  letterBox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  label: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
});
