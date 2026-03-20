import { useMemo } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { Stack } from 'expo-router';


export default function TopicsLayout() {
  const colors = useThemeStore((s) => s.colors);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.b0 },
        animation: 'slide_from_right',
      }}
    />
  );
}
