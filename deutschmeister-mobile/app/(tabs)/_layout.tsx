import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { radius, typography, floatShadow } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: TabIconName;
  iconFocused: TabIconName;
  colorKey: 'lime' | 'sky' | 'lavender' | 'mint' | 'peach';
}

const TAB_CONFIG: TabConfig[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconFocused: 'home', colorKey: 'lime' },
  { name: 'words', title: 'Từ vựng', icon: 'book-outline', iconFocused: 'book', colorKey: 'sky' },
  { name: 'games', title: 'Trò chơi', icon: 'game-controller-outline', iconFocused: 'game-controller', colorKey: 'lavender' },
  { name: 'practice', title: 'Luyện tập', icon: 'school-outline', iconFocused: 'school', colorKey: 'mint' },
  { name: 'more', title: 'Thêm', icon: 'menu-outline', iconFocused: 'menu', colorKey: 'peach' },
];

export default function TabLayout() {
  const colors = useThemeStore((s) => s.colors);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pastel.lime.base,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 12,
          marginHorizontal: 12,
          backgroundColor: colors.bg.b2 + 'CC',
          borderTopWidth: 0,
          borderRadius: radius.pill,
          height: 60,
          paddingBottom: 0,
          paddingTop: 6,
          borderWidth: 1,
          borderColor: colors.border.subtle,
          ...floatShadow,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: typography.fontFamily.bodySemibold,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarActiveTintColor: colors.pastel[tab.colorKey].base,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
