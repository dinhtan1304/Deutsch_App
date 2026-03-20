import React, { useMemo } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { radius, spacing, type PastelKey } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

type Props = {
  color: PastelKey | 'neutral';
  children: React.ReactNode;
  style?: ViewStyle;
};

export function PastelCard({ color, children, style }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bg =
    color === 'neutral'
      ? colors.bg.b2
      : colors.pastel[color].dim;
  const border =
    color === 'neutral'
      ? colors.border.default
      : colors.pastel[color].base + '33';

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }, style]}>
      {children}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    borderRadius: radius.stone,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
