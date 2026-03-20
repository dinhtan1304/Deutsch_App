import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { radius, spacing, typography, component } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

type Props = {
  label: string;
  onPress: () => void;
  style?: object;
};

export function GhostButton({ label, onPress, style }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.btn, style]}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  btn: {
    height: component.button.height,
    backgroundColor: colors.bg.b2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
});
