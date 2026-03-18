import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameHistory } from '@/hooks/useGames';
import { GameType } from '@/types';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

interface GameCardConfig {
  type: GameType | string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  route: string;
}

const GAME_CARDS: GameCardConfig[] = [
  {
    type: 'flashcard',
    name: 'Flashcards',
    description: 'Lật thẻ học từ vựng',
    icon: 'albums-outline',
    colors: ['#3B82F6', '#2563EB'],
    route: '/(tabs)/games/setup?game=flashcards',
  },
  {
    type: 'quick-quiz',
    name: 'Quick Quiz',
    description: 'Trắc nghiệm nhanh',
    icon: 'help-circle-outline',
    colors: ['#8B5CF6', '#7C3AED'],
    route: '/(tabs)/games/setup?game=quick-quiz',
  },
  {
    type: 'matching',
    name: 'Word Match',
    description: 'Nối từ với nghĩa',
    icon: 'git-compare-outline',
    colors: ['#10B981', '#059669'],
    route: '/(tabs)/games/setup?game=matching',
  },
  {
    type: 'timed-challenge',
    name: 'Time Challenge',
    description: 'Trả lời nhanh nhất',
    icon: 'timer-outline',
    colors: ['#EF4444', '#DC2626'],
    route: '/(tabs)/games/setup?game=timed-challenge',
  },
  {
    type: 'fill-blank',
    name: 'Fill in Blank',
    description: 'Điền từ còn thiếu',
    icon: 'text-outline',
    colors: ['#F59E0B', '#D97706'],
    route: '/(tabs)/games/setup?game=fill-blank',
  },
  {
    type: 'spelling',
    name: 'Spelling',
    description: 'Đánh vần từ tiếng Đức',
    icon: 'pencil-outline',
    colors: ['#EC4899', '#DB2777'],
    route: '/(tabs)/games/setup?game=spelling',
  },
  {
    type: 'gender-quiz',
    name: 'Gender Quiz',
    description: 'Đoán giống der/die/das',
    icon: 'male-female-outline',
    colors: ['#6366F1', '#4F46E5'],
    route: '/(tabs)/games/setup?game=gender-quiz',
  },
  {
    type: 'listening',
    name: 'Listening',
    description: 'Nghe và chọn đáp án',
    icon: 'ear-outline',
    colors: ['#14B8A6', '#0D9488'],
    route: '/(tabs)/games/setup?game=listening',
  },
];

function getGameLabel(gameType: string): string {
  const card = GAME_CARDS.find((c) => c.type === gameType);
  return card?.name ?? gameType;
}

function getGameIcon(gameType: string): keyof typeof Ionicons.glyphMap {
  const card = GAME_CARDS.find((c) => c.type === gameType);
  return card?.icon ?? 'game-controller-outline';
}

function getGameColor(gameType: string): string {
  const card = GAME_CARDS.find((c) => c.type === gameType);
  return card?.colors[0] ?? '#6366F1';
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function GamesHubScreen() {
  const router = useRouter();
  const { data: history } = useGameHistory(5);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-white">Mini Games</Text>
          <Text className="mt-1 text-sm text-gray-400">
            8 trò chơi giúp bạn học tiếng Đức hiệu quả
          </Text>
        </View>

        {/* Game Grid */}
        <View className="flex-row flex-wrap px-4 pt-3" style={{ gap: CARD_GAP }}>
          {GAME_CARDS.map((game) => (
            <TouchableOpacity
              key={game.type}
              activeOpacity={0.8}
              onPress={() => router.push(game.route as any)}
              style={{ width: CARD_WIDTH }}
            >
              <LinearGradient
                colors={game.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16, minHeight: 140 }}
              >
                <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Ionicons name={game.icon} size={22} color="#FFFFFF" />
                </View>
                <Text className="text-base font-bold text-white">{game.name}</Text>
                <Text className="mt-1 text-xs text-white/70" numberOfLines={2}>
                  {game.description}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent History */}
        {history && history.length > 0 && (
          <View className="mt-6 px-4 pb-8">
            <Text className="mb-3 text-lg font-bold text-white">Lịch sử gần đây</Text>
            {history.map((session) => (
              <View
                key={session.id}
                className="mb-2 flex-row items-center rounded-xl bg-dark-card p-3"
              >
                <View
                  className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: getGameColor(session.gameType) + '20' }}
                >
                  <Ionicons
                    name={getGameIcon(session.gameType)}
                    size={20}
                    color={getGameColor(session.gameType)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">
                    {getGameLabel(session.gameType)}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {session.correctAnswers}/{session.totalQuestions} đúng
                    {session.startedAt ? ` · ${formatTimeAgo(session.startedAt)}` : ''}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold text-white">{session.score}</Text>
                  <Text className="text-xs text-gray-500">điểm</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacer */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
