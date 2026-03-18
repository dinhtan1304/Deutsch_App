import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePersonalWords, usePersonalWordStats } from '@/hooks/usePersonalWords';
import type { PersonalWord, WordType, Level } from '@/lib/api/personal-words';
import { WordTypeInfo, getSRSStatus, SRSStatusInfo } from '@/lib/api/personal-words';

const WORD_TYPES: Array<{ key: WordType | 'all'; label: string }> = [
  { key: 'all', label: 'Tat ca' },
  { key: 'nomen', label: 'Nomen' },
  { key: 'verb', label: 'Verb' },
  { key: 'adjektiv', label: 'Adjektiv' },
  { key: 'adverb', label: 'Adverb' },
  { key: 'praposition', label: 'Prap.' },
];

const LEVEL_FILTERS: Array<{ key: Level | 'all'; label: string }> = [
  { key: 'all', label: 'Tat ca' },
  { key: 'A1', label: 'A1' },
  { key: 'A2', label: 'A2' },
  { key: 'B1', label: 'B1' },
];

function WordCard({ word }: { word: PersonalWord }) {
  const srsStatus = getSRSStatus(word);
  const statusInfo = SRSStatusInfo[srsStatus];
  const typeInfo = WordTypeInfo[word.wordType];

  return (
    <View className="mb-2 rounded-2xl bg-dark-card p-4">
      <View className="flex-row items-start">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-white">{word.word}</Text>
            {word.nomenData && (
              <Text
                className="text-sm font-medium"
                style={{
                  color:
                    word.nomenData.article === 'der'
                      ? '#3B82F6'
                      : word.nomenData.article === 'die'
                      ? '#EC4899'
                      : '#10B981',
                }}
              >
                {word.nomenData.article}
              </Text>
            )}
          </View>
          <Text className="mt-0.5 text-sm text-gray-400">
            {word.translationVi || word.translationEn}
          </Text>
        </View>

        <View className="items-end gap-1">
          {/* Word Type Badge */}
          <View
            className="rounded-md px-2 py-0.5"
            style={{ backgroundColor: `${typeInfo?.color ?? '#64748b'}20` }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: typeInfo?.color ?? '#64748b' }}
            >
              {typeInfo?.labelDe ?? word.wordType}
            </Text>
          </View>

          {/* SRS Status */}
          <View
            className="rounded-md px-2 py-0.5"
            style={{ backgroundColor: `${statusInfo.color}20` }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: statusInfo.color }}
            >
              {statusInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Level + Favorite */}
      <View className="mt-2 flex-row items-center">
        <View className="rounded bg-dark-border px-1.5 py-0.5">
          <Text className="text-xs font-medium text-gray-400">{word.level}</Text>
        </View>
        {word.isFavorite && (
          <Ionicons
            name="heart"
            size={14}
            color="#EF4444"
            style={{ marginLeft: 6 }}
          />
        )}
      </View>
    </View>
  );
}

export default function WordBankScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [wordType, setWordType] = useState<WordType | 'all'>('all');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = usePersonalWords({
    search: search || undefined,
    wordType,
    level,
    page,
    limit: 30,
  });
  const { data: stats } = usePersonalWordStats();

  const words = data?.data ?? [];
  const total = data?.total ?? 0;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: PersonalWord }) => <WordCard word={item} />,
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-2 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">Word Bank</Text>
        <View className="rounded-lg bg-dark-card px-2.5 py-1">
          <Text className="text-xs font-medium text-gray-400">
            {total} tu
          </Text>
        </View>
      </View>

      {/* Stats Bar */}
      {stats && (
        <View className="mx-4 mb-2 flex-row gap-2">
          <View className="flex-1 rounded-xl bg-dark-card px-3 py-2">
            <Text className="text-xs text-gray-500">Tong</Text>
            <Text className="text-base font-bold text-white">{stats.total}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-dark-card px-3 py-2">
            <Text className="text-xs text-gray-500">Yeu thich</Text>
            <Text className="text-base font-bold text-red-400">{stats.favorites}</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View className="mx-4 mb-2 flex-row items-center rounded-xl bg-dark-card px-3">
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          className="ml-2 flex-1 py-2.5 text-base text-white"
          placeholder="Tim tu vung..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </Pressable>
        )}
      </View>

      {/* Word Type Filter */}
      <ScrollableChips
        items={WORD_TYPES}
        selected={wordType}
        onSelect={(k) => {
          setWordType(k as WordType | 'all');
          setPage(1);
        }}
      />

      {/* Level Filter */}
      <ScrollableChips
        items={LEVEL_FILTERS}
        selected={level}
        onSelect={(k) => {
          setLevel(k as Level | 'all');
          setPage(1);
        }}
      />

      {/* List */}
      <FlatList
        data={words}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : (
            <View className="items-center py-20">
              <Ionicons name="folder-open-outline" size={48} color="#4B5563" />
              <Text className="mt-3 text-base text-gray-500">
                Chua co tu nao
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                Them tu vung cua ban vao day
              </Text>
            </View>
          )
        }
        onEndReached={() => {
          if (data && page < data.totalPages) {
            setPage((p) => p + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />

      {/* FAB - Add Word */}
      <Pressable
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:bg-primary-600"
        onPress={() => {
          // Could navigate to an add word screen
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

// Reusable horizontal chips
import { ScrollView } from 'react-native';

function ScrollableChips({
  items,
  selected,
  onSelect,
}: {
  items: Array<{ key: string; label: string }>;
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-2 px-4"
      contentContainerStyle={{ gap: 8 }}
    >
      {items.map((item) => {
        const isActive = selected === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            className={`rounded-full px-3.5 py-1.5 ${
              isActive ? 'bg-primary-500' : 'bg-dark-card'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
