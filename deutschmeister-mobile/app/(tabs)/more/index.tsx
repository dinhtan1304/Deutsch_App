import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItemProps {
  icon: IoniconsName;
  label: string;
  sublabel?: string;
  color?: string;
  onPress: () => void;
}

function MenuItem({ icon, label, sublabel, color = '#9CA3AF', onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 active:bg-dark-secondary"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-white">{label}</Text>
        {sublabel && <Text className="text-sm text-gray-500">{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#4B5563" />
    </Pressable>
  );
}

const MENU_SECTIONS = [
  {
    title: 'Learning',
    items: [
      { icon: 'library-outline' as IoniconsName, label: 'Topics', sublabel: 'A1-B1 vocabulary topics', color: '#22C55E', route: '/more/topics' },
      { icon: 'folder-outline' as IoniconsName, label: 'Word Bank', sublabel: 'Personal vocabulary', color: '#3B82F6', route: '/more/word-bank' },
      { icon: 'document-text-outline' as IoniconsName, label: 'Grammar', sublabel: 'Lessons & exercises', color: '#F59E0B', route: '/more/grammar' },
      { icon: 'refresh-outline' as IoniconsName, label: 'SRS Review', sublabel: 'Spaced repetition', color: '#8B5CF6', route: '/more/review' },
    ],
  },
  {
    title: 'Community',
    items: [
      { icon: 'trophy-outline' as IoniconsName, label: 'Achievements', sublabel: 'Badges & rewards', color: '#F59E0B', route: '/more/achievements' },
      { icon: 'podium-outline' as IoniconsName, label: 'Leaderboard', sublabel: 'Weekly rankings', color: '#EF4444', route: '/more/leaderboard' },
      { icon: 'flag-outline' as IoniconsName, label: 'Challenges', sublabel: 'Weekly challenges', color: '#6366F1', route: '/more/challenges' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'person-outline' as IoniconsName, label: 'Profile', color: '#9CA3AF', route: '/more/profile' },
      { icon: 'settings-outline' as IoniconsName, label: 'Settings', color: '#9CA3AF', route: '/more/settings' },
      { icon: 'heart-outline' as IoniconsName, label: 'Favorites', color: '#EF4444', route: '/more/favorites' },
      { icon: 'time-outline' as IoniconsName, label: 'History', color: '#9CA3AF', route: '/more/history' },
      { icon: 'diamond-outline' as IoniconsName, label: 'Subscription', color: '#A855F7', route: '/more/pricing' },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1">
        <Text className="px-4 pt-4 text-2xl font-bold text-white">More</Text>

        {MENU_SECTIONS.map((section) => (
          <View key={section.title} className="mt-4">
            <Text className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {section.title}
            </Text>
            <View className="mx-4 overflow-hidden rounded-2xl bg-dark-card">
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  {idx > 0 && <View className="ml-16 h-px bg-dark-border" />}
                  <MenuItem
                    icon={item.icon}
                    label={item.label}
                    sublabel={item.sublabel}
                    color={item.color}
                    onPress={() => router.push(item.route as any)}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
