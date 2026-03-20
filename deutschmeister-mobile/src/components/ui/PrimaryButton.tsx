import React, { useMemo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { radius, spacing, typography, component } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
};

export function PrimaryButton({ label, onPress, loading, disabled, style }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.btn, disabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.pastel.lime.on} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  btn: {
    height: component.button.height,
    backgroundColor: colors.pastel.lime.base,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  label: {
    color: colors.pastel.lime.on,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.bodyBlack,
    letterSpacing: typography.letterSpacing.snug,
  },
  disabled: {
    opacity: 0.5,
  },
});
