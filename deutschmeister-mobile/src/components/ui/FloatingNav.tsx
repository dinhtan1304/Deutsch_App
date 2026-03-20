import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography, component } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

export type TabKey = 'home' | 'learn' | 'rank' | 'profile';

type TabItem = { key: TabKey; icon: keyof typeof Ionicons.glyphMap; label: string };

const TABS: TabItem[] = [
  { key: 'home',    icon: 'home',        label: 'Home' },
  { key: 'learn',   icon: 'book',        label: 'Học' },
  { key: 'rank',    icon: 'trophy',      label: 'BXH' },
  { key: 'profile', icon: 'person',      label: 'Tôi' },
];

type Props = {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
};

export function FloatingNav({ activeTab, onTabPress }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          const isHome = tab.key === 'home';
          const activeBg = isHome ? colors.pastel.lime.dim : colors.pastel.lavender.dim;
          const activeColor = isHome ? colors.pastel.lime.base : colors.pastel.lavender.base;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
              style={[styles.tab, active && { backgroundColor: activeBg }]}
            >
              <Ionicons
                name={active ? tab.icon : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap)}
                size={20}
                color={active ? activeColor : colors.text.tertiary}
              />
              <Text style={[styles.tabLabel, { color: active ? activeColor : colors.text.tertiary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: component.bottomNav.margin.bottom,
    left: component.bottomNav.margin.horizontal,
    right: component.bottomNav.margin.horizontal,
  },
  pill: {
    flexDirection: 'row',
    height: component.bottomNav.height,
    backgroundColor: colors.bg.b2,
    borderRadius: component.bottomNav.borderRadius,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    gap: 2,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
});
