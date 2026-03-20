import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing, typography, genderColor, type Gender } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const LABELS: Record<Gender, string> = {
  der: 'DER — maskulin',
  die: 'DIE — feminin',
  das: 'DAS — neutral',
};

type Props = { gender: Gender };

export function GenderBadge({ gender }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const key = genderColor(gender);
  const palette = colors.pastel[key];

  return (
    <View style={[styles.pill, { backgroundColor: palette.dim, borderColor: palette.base + '33' }]}>
      <Text style={[styles.label, { color: palette.base }]}>{LABELS[gender]}</Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
});
