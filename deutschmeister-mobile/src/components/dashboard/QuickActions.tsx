import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ActionItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  route: string;
}

const ACTIONS: ActionItem[] = [
  {
    label: 'Học từ vựng',
    icon: 'book',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.15)',
    route: '/(tabs)/words',
  },
  {
    label: 'Chơi game',
    icon: 'game-controller',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.15)',
    route: '/(tabs)/games',
  },
  {
    label: 'Luyện thi',
    icon: 'school',
    color: '#A855F7',
    bgColor: 'rgba(168,85,247,0.15)',
    route: '/(tabs)/practice',
  },
  {
    label: 'Ôn tập SRS',
    icon: 'refresh-circle',
    color: '#F97316',
    bgColor: 'rgba(249,115,22,0.15)',
    route: '/(tabs)/words',
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View className="mx-4">
      <Text className="mb-3 text-sm font-bold text-white">Hành động nhanh</Text>
      <View className="flex-row flex-wrap gap-3">
        {ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.route as any)}
            className="rounded-2xl bg-dark-card p-4 active:opacity-80"
            style={{ width: '47.5%' }}
          >
            <View
              className="mb-3 h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: action.bgColor }}
            >
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text className="text-sm font-semibold text-white">
              {action.label}
            </Text>
            <View className="mt-2 flex-row items-center gap-1">
              <Text className="text-xs" style={{ color: action.color }}>
                Bắt đầu
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={action.color}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
