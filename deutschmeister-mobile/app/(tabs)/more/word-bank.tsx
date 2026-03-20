import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  usePersonalWords,
  usePersonalWordStats,
  useToggleFavorite,
} from '@/hooks/usePersonalWords';
import type { PersonalWord, WordType, Level } from '@/lib/api/personal-words';
import { WordTypeInfo } from '@/lib/api/personal-words';
import { spacing, radius, typography, pastelSurface } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

// ── Constants ────────────────────────────────────────────────
const PAGE_LIMIT = 30;

const WORD_TYPES: Array<{ key: WordType | 'all'; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'nomen', label: 'Nomen' },
  { key: 'verb', label: 'Verb' },
  { key: 'adjektiv', label: 'Adjektiv' },
  { key: 'adverb', label: 'Adverb' },
];

const LEVEL_FILTERS: Array<{ key: Level | 'all'; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'A1', label: 'A1' },
  { key: 'A2', label: 'A2' },
  { key: 'B1', label: 'B1' },
];

function buildLevelColor(colors: ThemeColors): Record<string, string> {
  return {
    A1: colors.pastel.mint.base,
    A2: colors.pastel.sky.base,
    B1: colors.pastel.lavender.base,
    B2: colors.pastel.peach.base,
    C1: colors.pastel.rose.base,
  };
}

// ── WordCard ─────────────────────────────────────────────────
function WordCard({
  word,
  onToggleFavorite,
}: {
  word: PersonalWord;
  onToggleFavorite: (id: string) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const wc = useMemo(() => createWc(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  const levelColorMap = useMemo(() => buildLevelColor(colors), [colors]);
  const article = word.nomenData?.article;
  const genderPastel =
    article === 'der'
      ? colors.pastel.sky
      : article === 'die'
      ? colors.pastel.rose
      : article === 'das'
      ? colors.pastel.mint
      : null;

  const typeInfo = WordTypeInfo[word.wordType];
  const levelColor = levelColorMap[word.level] ?? colors.pastel.lavender.base;

  return (
    <View style={wc.card}>
      {/* Top row: article + word on left, level badge on right */}
      <View style={wc.topRow}>
        <View style={wc.wordSection}>
          {article && (
            <Text style={[wc.article, { color: genderPastel?.base }]}>
              {article}
            </Text>
          )}
          <Text style={wc.word} numberOfLines={1}>
            {word.word}
          </Text>
        </View>

        <View style={[wc.levelPill, { backgroundColor: levelColor + '22' }]}>
          <Text style={[wc.levelText, { color: levelColor }]}>
            {word.level}
          </Text>
        </View>
      </View>

      {/* Vietnamese translation */}
      <Text style={wc.translation} numberOfLines={2}>
        {word.translationVi || word.translationEn}
      </Text>

      {/* Bottom row: gender + type badges on left, heart on right */}
      <View style={wc.bottomRow}>
        <View style={wc.badges}>
          {genderPastel && (
            <View style={[wc.badge, { backgroundColor: genderPastel.dim }]}>
              <Text style={[wc.badgeText, { color: genderPastel.base }]}>
                {article}
              </Text>
            </View>
          )}
          <View
            style={[
              wc.badge,
              { backgroundColor: (typeInfo?.color ?? '#64748b') + '18' },
            ]}
          >
            <Text
              style={[
                wc.badgeText,
                { color: typeInfo?.color ?? '#64748b' },
              ]}
            >
              {typeInfo?.labelDe ?? word.wordType}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => onToggleFavorite(word.id)}
          hitSlop={12}
          style={wc.heartBtn}
        >
          <Ionicons
            name={word.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={
              word.isFavorite
                ? colors.pastel.rose.base
                : colors.text.disabled
            }
          />
        </Pressable>
      </View>
    </View>
  );
}

// ── Filter Chips ─────────────────────────────────────────────
function FilterChips({
  items,
  selected,
  onSelect,
}: {
  items: Array<{ key: string; label: string }>;
  selected: string;
  onSelect: (key: string) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const wc = useMemo(() => createWc(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.chipScroll}
      contentContainerStyle={s.chipContainer}
    >
      {items.map((item) => {
        const isActive = selected === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            style={[
              s.chip,
              isActive
                ? { backgroundColor: colors.pastel.lime.base }
                : { backgroundColor: colors.bg.b3 },
            ]}
          >
            <Text
              style={[
                s.chipLabel,
                { color: isActive ? colors.pastel.lime.on : colors.text.secondary },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function WordBankScreen() {
  const colors = useThemeStore((s) => s.colors);
  const wc = useMemo(() => createWc(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [wordType, setWordType] = useState<WordType | 'all'>('all');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [page, setPage] = useState(1);

  // Debounce search (300ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
      setPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Queries
  const {
    data,
    isLoading,
    isFetching,
    refetch,
    isRefetching,
  } = usePersonalWords({
    search: debouncedSearch || undefined,
    wordType,
    level,
    page,
    limit: PAGE_LIMIT,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: stats } = usePersonalWordStats();
  const toggleFavoriteMutation = useToggleFavorite();

  // Accumulated words for infinite scroll
  const [accumulatedWords, setAccumulatedWords] = useState<PersonalWord[]>([]);

  // Reset accumulated words when filters change, append on page increment
  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAccumulatedWords(data.data);
      } else {
        setAccumulatedWords((prev) => {
          const existingIds = new Set(prev.map((w) => w.id));
          const newWords = data.data.filter((w) => !existingIds.has(w.id));
          return [...prev, ...newWords];
        });
      }
    }
  }, [data, page]);

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasMore = page < totalPages;

  // Derived stats
  const statsTotal = stats?.total ?? 0;
  const statsFavorites = stats?.favorites ?? 0;
  const statsLearned = useMemo(() => {
    if (!stats) return 0;
    return stats.total;
  }, [stats]);

  const onRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const onToggleFavorite = useCallback(
    (id: string) => {
      // Optimistic UI update in local list
      setAccumulatedWords((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, isFavorite: !w.isFavorite } : w
        )
      );
      toggleFavoriteMutation.mutate(id);
    },
    [toggleFavoriteMutation]
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  }, [hasMore, isFetching]);

  const handleWordTypeChange = useCallback((key: string) => {
    setWordType(key as WordType | 'all');
    setPage(1);
  }, []);

  const handleLevelChange = useCallback((key: string) => {
    setLevel(key as Level | 'all');
    setPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchText('');
    setDebouncedSearch('');
    setPage(1);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: PersonalWord }) => (
      <WordCard word={item} onToggleFavorite={onToggleFavorite} />
    ),
    [onToggleFavorite]
  );

  const keyExtractor = useCallback((item: PersonalWord) => item.id, []);

  // Footer
  const ListFooter = useCallback(() => {
    if (isFetching && page > 1) {
      return (
        <View style={s.footerLoader}>
          <ActivityIndicator size="small" color={colors.pastel.lavender.base} />
        </View>
      );
    }
    if (hasMore && accumulatedWords.length > 0) {
      return (
        <Pressable style={s.loadMoreBtn} onPress={handleLoadMore}>
          <Text style={s.loadMoreText}>Tải thêm</Text>
        </Pressable>
      );
    }
    return null;
  }, [isFetching, page, hasMore, accumulatedWords.length, handleLoadMore]);

  // Empty / Loading state
  const ListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={s.emptyWrap}>
          <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
          <Text style={s.emptyTitle}>Đang tải...</Text>
        </View>
      );
    }
    return (
      <View style={s.emptyWrap}>
        <View style={[s.emptyIcon, pastelSurface('lavender')]}>
          <Ionicons
            name="folder-open-outline"
            size={40}
            color={colors.pastel.lavender.base}
          />
        </View>
        <Text style={s.emptyTitle}>Chưa có từ nào</Text>
        <Text style={s.emptySub}>
          Thêm từ vựng của bạn vào kho từ vựng cá nhân
        </Text>
      </View>
    );
  }, [isLoading]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={[s.headerIconBox, pastelSurface('peach')]}>
          <Ionicons name="book" size={20} color={colors.pastel.peach.base} />
        </View>
        <View style={s.headerTextWrap}>
          <Text style={s.headerTitle}>Kho từ vựng</Text>
          <Text style={s.headerSubtitle}>Từ vựng cá nhân</Text>
        </View>
      </View>

      {/* ── Stats Row ── */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <View style={[s.statIconBox, { backgroundColor: colors.pastel.lavender.dim }]}>
            <Ionicons name="library" size={16} color={colors.pastel.lavender.base} />
          </View>
          <Text style={[s.statValue, { color: colors.pastel.lavender.base }]}>
            {statsTotal}
          </Text>
          <Text style={s.statLabel}>Tổng từ</Text>
        </View>

        <View style={s.statCard}>
          <View style={[s.statIconBox, { backgroundColor: colors.pastel.rose.dim }]}>
            <Ionicons name="heart" size={16} color={colors.pastel.rose.base} />
          </View>
          <Text style={[s.statValue, { color: colors.pastel.rose.base }]}>
            {statsFavorites}
          </Text>
          <Text style={s.statLabel}>Yêu thích</Text>
        </View>

        <View style={s.statCard}>
          <View style={[s.statIconBox, { backgroundColor: colors.pastel.mint.dim }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.pastel.mint.base} />
          </View>
          <Text style={[s.statValue, { color: colors.pastel.mint.base }]}>
            {statsLearned}
          </Text>
          <Text style={s.statLabel}>Đã học</Text>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={s.searchRow}>
        <Ionicons
          name="search"
          size={18}
          color={colors.text.tertiary}
          style={s.searchIcon}
        />
        <TextInput
          style={s.searchInput}
          placeholder="Tìm từ vựng..."
          placeholderTextColor={colors.text.disabled}
          value={searchText}
          onChangeText={handleSearchChange}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <Pressable onPress={clearSearch} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.text.tertiary}
            />
          </Pressable>
        )}
      </View>

      {/* ── Word Type Filter Chips ── */}
      <FilterChips
        items={WORD_TYPES}
        selected={wordType}
        onSelect={handleWordTypeChange}
      />

      {/* ── Level Filter Chips ── */}
      <FilterChips
        items={LEVEL_FILTERS}
        selected={level}
        onSelect={handleLevelChange}
      />

      {/* ── Word Count ── */}
      <Text style={s.wordCountLabel}>{total} TỪ</Text>

      {/* ── Word FlatList ── */}
      <FlatList
        data={accumulatedWords}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.pastel.lavender.base}
            colors={[colors.pastel.lavender.base]}
          />
        }
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

// ── Word Card Styles ─────────────────────────────────────────
const createWc = (colors: any) => StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flex: 1,
    marginRight: spacing.sm,
  },
  article: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  word: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  levelPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  levelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  translation: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.snug,
  },
  bottomRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  heartBtn: {
    padding: 4,
  },
});

// ── Screen Styles ────────────────────────────────────────────
const createS = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
    marginTop: 1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statIconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Search
  searchRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },

  // Chips
  chipScroll: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  chipContainer: {
    gap: 6,
  },
  chip: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    lineHeight: 16,
  },

  // Word count
  wordCountLabel: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },

  // Footer / Load more
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadMoreBtn: {
    marginVertical: spacing.md,
    alignSelf: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  loadMoreText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.secondary,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.stone,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.secondary,
  },
  emptySub: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
