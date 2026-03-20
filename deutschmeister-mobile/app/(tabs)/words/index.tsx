import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useInfiniteQuery } from '@tanstack/react-query';
import { wordsApi } from '@/lib/api/words';
import { Word, Gender, CEFRLevel, PaginatedResponse } from '@/types';
import WordCard from '@/components/words/WordCard';
import FilterChips from '@/components/words/FilterChips';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

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
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm từ vựng..."
            placeholderTextColor={colors.text.tertiary}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
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

        {/* Section label + results count */}
        {!isLoading && (
          <View style={styles.resultsRow}>
            <Ionicons name="library-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.sectionLabel}>
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
        <View style={styles.footerContainer}>
          <ActivityIndicator color={colors.pastel.lavender.base} />
        </View>
      );
    }
    if (words.length > 0 && !hasNextPage) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Đã tải hết từ vựng</Text>
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage, hasNextPage, words.length]);

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
          <Text style={styles.emptyTitle}>Đang tải từ vựng...</Text>
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.pastel.rose.base} />
          <Text style={styles.emptyTitle}>
            Không thể tải từ vựng
          </Text>
          <Text style={styles.emptySubtitle}>
            {(error as Error)?.message || 'Lỗi không xác định'}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>
          Không tìm thấy từ vựng
        </Text>
        <Text style={styles.emptySubtitle}>
          Thử thay đổi từ khoá hoặc bộ lọc
        </Text>
      </View>
    );
  }, [isLoading, isError, error]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="book" size={22} color={colors.pastel.lavender.on} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Từ điển</Text>
          <Text style={styles.headerSubtitle}>Tra cứu và học từ vựng tiếng Đức</Text>
        </View>
      </Animated.View>

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
            tintColor={colors.pastel.lavender.base}
            colors={[colors.pastel.lavender.base]}
          />
        }
        contentContainerStyle={words.length === 0 ? { flexGrow: 1 } : { paddingBottom: spacing.xl }}
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },

  /* ── Header ───────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.pastel.lavender.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.snug,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },

  /* ── Search bar ───────────────────────────── */
  searchBar: {
    marginHorizontal: spacing.screenH,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.stone,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },

  /* ── Results label ────────────────────────── */
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenH,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    marginLeft: spacing.xs + 2,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
  },

  /* ── Footer ───────────────────────────────── */
  footerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl + 4,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },

  /* ── Empty states ─────────────────────────── */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'] + 4,
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.secondary,
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
});
