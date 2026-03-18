import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Word, GenderInfo } from '@/types';
import { useCheckFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { useAddToHistory } from '@/hooks/useHistory';
import { useAuthStore } from '@/stores/authStore';

interface WordDetailProps {
  word: Word;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22C55E',
  A2: '#3B82F6',
  B1: '#F59E0B',
  B2: '#EF4444',
  C1: '#A855F7',
  C2: '#EC4899',
};

export default function WordDetail({ word }: WordDetailProps) {
  const genderInfo = GenderInfo[word.gender];
  const levelColor = LEVEL_COLORS[word.level] || '#6B7280';

  const { isAuthenticated } = useAuthStore();
  const { data: favoriteData } = useCheckFavorite(word.id);
  const { toggle, isLoading: toggleLoading } = useToggleFavorite();
  const addToHistory = useAddToHistory();

  const hasAddedToHistory = useRef(false);

  // Add to history on mount
  useEffect(() => {
    if (isAuthenticated && !hasAddedToHistory.current) {
      hasAddedToHistory.current = true;
      addToHistory.mutate(word.id);
    }
  }, [word.id, isAuthenticated]);

  const isFavorite = favoriteData?.isFavorite ?? false;

  const handleSpeak = () => {
    const fullWord = `${word.article} ${word.word}`;
    Speech.speak(fullWord, { language: 'de-DE', rate: 0.8 });
  };

  const handleToggleFavorite = () => {
    if (!isAuthenticated || toggleLoading) return;
    toggle(word.id, isFavorite);
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header card */}
      <View className="mx-4 mt-4 rounded-2xl border border-dark-border bg-dark-card p-6">
        {/* Gender color bar */}
        <View
          className="mb-4 h-1 w-16 self-center rounded-full"
          style={{ backgroundColor: genderInfo.color }}
        />

        {/* Article + Word */}
        <View className="items-center">
          <Text
            className="text-center text-lg font-semibold"
            style={{ color: genderInfo.color }}
          >
            {genderInfo.label}
          </Text>
          <View className="mt-2 flex-row items-baseline">
            <Text
              className="text-3xl font-bold"
              style={{ color: genderInfo.color }}
            >
              {word.article}{' '}
            </Text>
            <Text className="text-3xl font-bold text-white">{word.word}</Text>
          </View>

          {/* Pronunciation + speaker */}
          <View className="mt-3 flex-row items-center">
            {word.pronunciation && (
              <Text className="mr-2 text-base text-gray-400">
                [{word.pronunciation}]
              </Text>
            )}
            <Pressable
              onPress={handleSpeak}
              className="rounded-full p-2 active:opacity-70"
              style={{ backgroundColor: `${genderInfo.color}20` }}
            >
              <Ionicons name="volume-high" size={22} color={genderInfo.color} />
            </Pressable>
          </View>
        </View>

        {/* Favorite button */}
        {isAuthenticated && (
          <Pressable
            onPress={handleToggleFavorite}
            className="absolute right-4 top-4 rounded-full p-2 active:opacity-70"
            disabled={toggleLoading}
          >
            {toggleLoading ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={26}
                color={isFavorite ? '#EF4444' : '#6B7280'}
              />
            )}
          </Pressable>
        )}
      </View>

      {/* Translations */}
      <View className="mx-4 mt-4 rounded-2xl border border-dark-border bg-dark-card p-4">
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Translation
        </Text>

        <View className="flex-row items-center">
          <View className="mr-3 rounded-full bg-blue-500/20 px-2 py-1">
            <Text className="text-xs font-bold text-blue-400">EN</Text>
          </View>
          <Text className="shrink text-base text-white">{word.translationEn}</Text>
        </View>

        {word.translationVi && (
          <View className="mt-3 flex-row items-center">
            <View className="mr-3 rounded-full bg-amber-500/20 px-2 py-1">
              <Text className="text-xs font-bold text-amber-400">VI</Text>
            </View>
            <Text className="shrink text-base text-gray-300">{word.translationVi}</Text>
          </View>
        )}
      </View>

      {/* Info: Plural, Level, Category */}
      <View className="mx-4 mt-4 flex-row">
        {/* Level */}
        <View className="mr-2 flex-1 rounded-2xl border border-dark-border bg-dark-card p-4">
          <Text className="mb-1 text-xs font-semibold uppercase text-gray-500">Level</Text>
          <View
            className="mt-1 self-start rounded-full px-3 py-1.5"
            style={{ backgroundColor: `${levelColor}20` }}
          >
            <Text className="text-sm font-bold" style={{ color: levelColor }}>
              {word.level}
            </Text>
          </View>
        </View>

        {/* Category */}
        <View className="ml-2 flex-1 rounded-2xl border border-dark-border bg-dark-card p-4">
          <Text className="mb-1 text-xs font-semibold uppercase text-gray-500">Category</Text>
          <View className="mt-1 flex-row items-center self-start rounded-full bg-dark-secondary px-3 py-1.5">
            <Ionicons name="folder-outline" size={14} color="#9CA3AF" />
            <Text className="ml-1.5 text-sm capitalize text-gray-300">{word.category}</Text>
          </View>
        </View>
      </View>

      {/* Plural */}
      {word.plural && (
        <View className="mx-4 mt-4 rounded-2xl border border-dark-border bg-dark-card p-4">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Plural
          </Text>
          <Text className="text-base text-white">
            die{' '}
            <Text className="font-bold">{word.plural}</Text>
          </Text>
        </View>
      )}

      {/* Examples */}
      {word.examples && word.examples.length > 0 && (
        <View className="mx-4 mt-4 rounded-2xl border border-dark-border bg-dark-card p-4">
          <View className="mb-3 flex-row items-center">
            <Ionicons name="chatbubble-outline" size={16} color="#9CA3AF" />
            <Text className="ml-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Examples
            </Text>
          </View>
          {word.examples.map((example, index) => (
            <View
              key={index}
              className={`flex-row ${index > 0 ? 'mt-3 border-t border-dark-border pt-3' : ''}`}
            >
              <View
                className="mr-3 mt-1 h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: `${genderInfo.color}20` }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: genderInfo.color }}
                >
                  {index + 1}
                </Text>
              </View>
              <Text className="shrink text-base leading-6 text-gray-300">
                {example}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Tips */}
      {word.tips && word.tips.length > 0 && (
        <View className="mx-4 mt-4 rounded-2xl border border-dark-border bg-dark-card p-4">
          <View className="mb-3 flex-row items-center">
            <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
            <Text className="ml-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Tips
            </Text>
          </View>
          {word.tips.map((tip, index) => (
            <View
              key={index}
              className={`flex-row ${index > 0 ? 'mt-3 border-t border-dark-border pt-3' : ''}`}
            >
              <Ionicons
                name="sparkles"
                size={14}
                color="#F59E0B"
                style={{ marginTop: 3, marginRight: 8 }}
              />
              <Text className="shrink text-base leading-6 text-gray-300">
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
