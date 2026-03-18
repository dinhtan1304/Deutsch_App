import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { wordsApi } from '@/lib/api/words';
import { Word, Gender, CEFRLevel, PaginatedResponse } from '@/types';
import WordCard from '@/components/words/WordCard';
import FilterChips from '@/components/words/FilterChips';

const PAGE_LIMIT = 20;

// Debounce hook
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function WordsScreen() {
  const router = useRouter();

  // Search and filter state
  const [searchText, setSearchText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>();
  const [selectedGender, setSelectedGender] = useState<Gender>();
  const [selectedCategory, setSelectedCategory] = useState<string>();

  const debouncedSearch = useDebounce(searchText, 400);

  // Infinite query for paginated words
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery<PaginatedResponse<Word>>({
    queryKey: ['words', 'infinite', debouncedSearch, selectedLevel, selectedGender, selectedCategory],
    queryFn: ({ pageParam }) =>
      wordsApi.search({
        search: debouncedSearch || undefined,
        level: selectedLevel,
        gender: selectedGender,
        category: selectedCategory,
        page: pageParam as number,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Flatten all pages into single list
  const words = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const totalCount = data?.pages[0]?.total ?? 0;

  const handleWordPress = useCallback(
    (word: Word) => {
      router.push(`/(tabs)/words/${word.id}`);
    },
    [router],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Word }) => (
      <WordCard word={item} onPress={() => handleWordPress(item)} />
    ),
    [handleWordPress],
  );

  const keyExtractor = useCallback((item: Word) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Search bar */}
        <View className="mx-4 mt-3 flex-row items-center rounded-xl border border-dark-border bg-dark-card px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="ml-3 flex-1 text-base text-white"
            placeholder="Search words..."
            placeholderTextColor="#6B7280"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </Pressable>
          )}
        </View>

        {/* Filter chips */}
        <FilterChips
          selectedLevel={selectedLevel}
          selectedGender={selectedGender}
          selectedCategory={selectedCategory}
          onLevelChange={setSelectedLevel}
          onGenderChange={setSelectedGender}
          onCategoryChange={setSelectedCategory}
        />

        {/* Results count */}
        {!isLoading && (
          <View className="mx-4 mb-3 flex-row items-center">
            <Ionicons name="library-outline" size={14} color="#6B7280" />
            <Text className="ml-1.5 text-sm text-gray-500">
              {totalCount} {totalCount === 1 ? 'word' : 'words'} found
            </Text>
          </View>
        )}
      </View>
    ),
    [searchText, selectedLevel, selectedGender, selectedCategory, isLoading, totalCount],
  );

  const ListFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View className="py-6">
          <ActivityIndicator color="#6366F1" />
        </View>
      );
    }
    if (words.length > 0 && !hasNextPage) {
      return (
        <View className="items-center py-6">
          <Text className="text-sm text-gray-500">All words loaded</Text>
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage, hasNextPage, words.length]);

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-3 text-gray-400">Loading words...</Text>
        </View>
      );
    }
    if (isError) {
      return (
        <View className="flex-1 items-center justify-center px-8 py-20">
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text className="mt-3 text-center text-base text-gray-400">
            Failed to load words
          </Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            {(error as Error)?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center px-8 py-20">
        <Ionicons name="search-outline" size={48} color="#6B7280" />
        <Text className="mt-3 text-center text-base text-gray-400">
          No words found
        </Text>
        <Text className="mt-1 text-center text-sm text-gray-500">
          Try adjusting your search or filters
        </Text>
      </View>
    );
  }, [isLoading, isError, error]);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Title */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
        <View>
          <Text className="text-2xl font-bold text-white">Dictionary</Text>
          <Text className="mt-0.5 text-sm text-gray-400">German vocabulary</Text>
        </View>
        <View className="rounded-full bg-primary-500/20 p-2">
          <Ionicons name="book" size={22} color="#6366F1" />
        </View>
      </View>

      {/* Word list */}
      <FlatList
        data={words}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        contentContainerStyle={words.length === 0 ? { flexGrow: 1 } : { paddingBottom: 20 }}
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}
