import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography, component, type PastelKey } from '@/theme';
import { GhostButton } from './GhostButton';
import { useThemeStore } from '@/stores/themeStore';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  color?: PastelKey;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  color = 'lavender',
}: EmptyStateProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pastel = colors.pastel[color];

  return (
    <View style={styles.root}>
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: pastel.dim }]}>
        <Ionicons
          name={icon as any}
          size={28}
          color={pastel.base}
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Subtitle */}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Optional action */}
      {actionLabel && onAction ? (
        <GhostButton
          label={actionLabel}
          onPress={onAction}
          style={[styles.action, { borderColor: pastel.base + '55' }]}
        />
      ) : null}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.relaxed,
  },
  action: {
    marginTop: spacing.sm,
  },
});

export default EmptyState;
