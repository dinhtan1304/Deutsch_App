import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Difficulty, CATEGORIES } from '@/types';

type GameKey =
  | 'flashcards'
  | 'quick-quiz'
  | 'matching'
  | 'timed-challenge'
  | 'fill-blank'
  | 'spelling'
  | 'gender-quiz'
  | 'listening';

const GAME_META: Record<
  GameKey,
  { name: string; icon: keyof typeof Ionicons.glyphMap; colors: [string, string]; route: string }
> = {
  flashcards: {
    name: 'Flashcards',
    icon: 'albums-outline',
    colors: ['#3B82F6', '#2563EB'],
    route: '/(tabs)/games/flashcards',
  },
  'quick-quiz': {
    name: 'Quick Quiz',
    icon: 'help-circle-outline',
    colors: ['#8B5CF6', '#7C3AED'],
    route: '/(tabs)/games/quick-quiz',
  },
  matching: {
    name: 'Word Match',
    icon: 'git-compare-outline',
    colors: ['#10B981', '#059669'],
    route: '/(tabs)/games/matching',
  },
  'timed-challenge': {
    name: 'Time Challenge',
    icon: 'timer-outline',
    colors: ['#EF4444', '#DC2626'],
    route: '/(tabs)/games/timed-challenge',
  },
  'fill-blank': {
    name: 'Fill in Blank',
    icon: 'text-outline',
    colors: ['#F59E0B', '#D97706'],
    route: '/(tabs)/games/fill-blank',
  },
  spelling: {
    name: 'Spelling',
    icon: 'pencil-outline',
    colors: ['#EC4899', '#DB2777'],
    route: '/(tabs)/games/spelling',
  },
  'gender-quiz': {
    name: 'Gender Quiz',
    icon: 'male-female-outline',
    colors: ['#6366F1', '#4F46E5'],
    route: '/(tabs)/games/gender-quiz',
  },
  listening: {
    name: 'Listening',
    icon: 'ear-outline',
    colors: ['#14B8A6', '#0D9488'],
    route: '/(tabs)/games/listening',
  },
};

const DIFFICULTIES: { value: Difficulty; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'beginner', label: 'Cơ bản', description: 'A1 - A2', icon: 'leaf-outline' },
  { value: 'intermediate', label: 'Trung bình', description: 'B1 - B2', icon: 'flame-outline' },
  { value: 'advanced', label: 'Nâng cao', description: 'C1 - C2', icon: 'diamond-outline' },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

const CATEGORY_LABELS: Record<string, string> = {
  animals: 'Động vật',
  body: 'Cơ thể',
  clothing: 'Quần áo',
  colors: 'Màu sắc',
  education: 'Giáo dục',
  family: 'Gia đình',
  food: 'Thực phẩm',
  health: 'Sức khỏe',
  home: 'Nhà cửa',
  nature: 'Thiên nhiên',
  numbers: 'Số đếm',
  occupations: 'Nghề nghiệp',
  places: 'Địa điểm',
  sports: 'Thể thao',
  technology: 'Công nghệ',
  time: 'Thời gian',
  transport: 'Giao thông',
  travel: 'Du lịch',
  weather: 'Thời tiết',
  other: 'Khác',
};

export default function GameSetupScreen() {
  const router = useRouter();
  const { game } = useLocalSearchParams<{ game: GameKey }>();
  const meta = game ? GAME_META[game] : null;

  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [questionCount, setQuestionCount] = useState(10);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [showCategories, setShowCategories] = useState(false);

  if (!meta) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <Text className="text-white">Game không tồn tại</Text>
      </SafeAreaView>
    );
  }

  const handleStart = () => {
    const params: Record<string, string> = {
      difficulty,
      count: questionCount.toString(),
    };
    if (category) params.category = category;

    router.push({
      pathname: meta.route as any,
      params,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-dark-card"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-white">Thiết lập game</Text>
        </View>

        {/* Game Info Card */}
        <View className="mx-4 mt-4">
          <LinearGradient
            colors={meta.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 20, alignItems: 'center' }}
          >
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Ionicons name={meta.icon} size={28} color="#FFFFFF" />
            </View>
            <Text className="text-xl font-bold text-white">{meta.name}</Text>
          </LinearGradient>
        </View>

        {/* Difficulty Selection */}
        <View className="mx-4 mt-6">
          <Text className="mb-3 text-base font-bold text-white">Độ khó</Text>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.value}
              activeOpacity={0.7}
              onPress={() => setDifficulty(d.value)}
              className={`mb-2 flex-row items-center rounded-xl p-4 ${
                difficulty === d.value
                  ? 'border border-primary-500 bg-primary-500/10'
                  : 'bg-dark-card'
              }`}
            >
              <View
                className={`mr-3 h-10 w-10 items-center justify-center rounded-lg ${
                  difficulty === d.value ? 'bg-primary-500/20' : 'bg-dark-secondary'
                }`}
              >
                <Ionicons
                  name={d.icon}
                  size={20}
                  color={difficulty === d.value ? '#6366F1' : '#9CA3AF'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-semibold ${
                    difficulty === d.value ? 'text-primary-400' : 'text-white'
                  }`}
                >
                  {d.label}
                </Text>
                <Text className="text-xs text-gray-400">{d.description}</Text>
              </View>
              {difficulty === d.value && (
                <Ionicons name="checkmark-circle" size={22} color="#6366F1" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Question Count */}
        <View className="mx-4 mt-5">
          <Text className="mb-3 text-base font-bold text-white">Số câu hỏi</Text>
          <View className="flex-row" style={{ gap: 10 }}>
            {QUESTION_COUNTS.map((count) => (
              <TouchableOpacity
                key={count}
                activeOpacity={0.7}
                onPress={() => setQuestionCount(count)}
                className={`flex-1 items-center rounded-xl py-3 ${
                  questionCount === count
                    ? 'border border-primary-500 bg-primary-500/10'
                    : 'bg-dark-card'
                }`}
              >
                <Text
                  className={`text-lg font-bold ${
                    questionCount === count ? 'text-primary-400' : 'text-white'
                  }`}
                >
                  {count}
                </Text>
                <Text className="text-xs text-gray-400">câu</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Filter (Optional) */}
        <View className="mx-4 mt-5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowCategories(!showCategories)}
            className="flex-row items-center justify-between"
          >
            <Text className="text-base font-bold text-white">
              Chủ đề {category ? `(${CATEGORY_LABELS[category] || category})` : '(Tất cả)'}
            </Text>
            <Ionicons
              name={showCategories ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {showCategories && (
            <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setCategory(undefined);
                  setShowCategories(false);
                }}
                className={`rounded-lg px-3 py-2 ${
                  !category ? 'border border-primary-500 bg-primary-500/10' : 'bg-dark-card'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    !category ? 'text-primary-400' : 'text-gray-300'
                  }`}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategories(false);
                  }}
                  className={`rounded-lg px-3 py-2 ${
                    category === cat
                      ? 'border border-primary-500 bg-primary-500/10'
                      : 'bg-dark-card'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      category === cat ? 'text-primary-400' : 'text-gray-300'
                    }`}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Start Button */}
        <View className="mx-4 mt-8 mb-8">
          <TouchableOpacity activeOpacity={0.8} onPress={handleStart}>
            <LinearGradient
              colors={meta.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="play" size={22} color="#FFFFFF" />
              <Text className="ml-2 text-lg font-bold text-white">Bắt đầu chơi</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
