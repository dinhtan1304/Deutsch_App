import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Word, GenderInfo } from '@/types';

interface WordCardProps {
  word: Word;
  onPress: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22C55E',
  A2: '#3B82F6',
  B1: '#F59E0B',
  B2: '#EF4444',
  C1: '#A855F7',
  C2: '#EC4899',
};

export default function WordCard({ word, onPress }: WordCardProps) {
  const genderInfo = GenderInfo[word.gender];
  const levelColor = LEVEL_COLORS[word.level] || '#6B7280';

  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-3 rounded-2xl border border-dark-border bg-dark-card p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between">
        {/* Left: word content */}
        <View className="shrink">
          {/* Article + Word */}
          <View className="flex-row items-baseline">
            <Text
              className="text-lg font-bold"
              style={{ color: genderInfo.color }}
            >
              {word.article}{' '}
            </Text>
            <Text className="text-lg font-bold text-white">{word.word}</Text>
          </View>

          {/* Translation */}
          <Text className="mt-1 text-sm text-gray-400" numberOfLines={1}>
            {word.translationEn}
          </Text>
          {word.translationVi && (
            <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
              {word.translationVi}
            </Text>
          )}
        </View>

        {/* Right: badges */}
        <View className="ml-3 items-end">
          {/* Level badge */}
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: `${levelColor}20` }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: levelColor }}
            >
              {word.level}
            </Text>
          </View>

          {/* Gender indicator */}
          <View
            className="mt-2 rounded-full px-2 py-0.5"
            style={{ backgroundColor: genderInfo.bgColor }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: genderInfo.color }}
            >
              {genderInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom: category + plural */}
      <View className="mt-3 flex-row items-center">
        <View className="flex-row items-center rounded-full bg-dark-secondary px-2.5 py-1">
          <Ionicons name="folder-outline" size={12} color="#9CA3AF" />
          <Text className="ml-1 text-xs text-gray-400 capitalize">
            {word.category}
          </Text>
        </View>

        {word.plural && (
          <View className="ml-2 flex-row items-center rounded-full bg-dark-secondary px-2.5 py-1">
            <Text className="text-xs text-gray-400">Pl: {word.plural}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
