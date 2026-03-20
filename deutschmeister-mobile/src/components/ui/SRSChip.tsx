import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

type Urgency = 'hot' | 'warm';

type Props = {
  word: string;
  urgency: Urgency;
};

function getUrgencyStyles(colors: ThemeColors): Record<Urgency, { bg: string; border: string; text: string }> {
  return {
    hot:  { bg: colors.pastel.rose.dim,  border: 'rgba(212, 131, 142, 0.20)', text: colors.pastel.rose.base },
    warm: { bg: colors.pastel.peach.dim, border: 'rgba(212, 180, 131, 0.18)', text: colors.pastel.peach.base },
  };
}

export function SRSChip({ word, urgency }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const urgencyStyles = useMemo(() => getUrgencyStyles(colors), [colors]);
  const s = urgencyStyles[urgency];

  return (
    <View style={[styles.chip, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.label, { color: s.text }]}>{word}</Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
});
