import { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import type { Favorite } from '@/types';
import { GenderInfo } from '@/types';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -80;

function SwipeableFavoriteItem({
  item,
  onRemove,
}: {
  item: Favorite;
  onRemove: (wordId: string) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const genderInfo = item.word.gender ? GenderInfo[item.word.gender] : null;

  return (
    <View style={s.swipeContainer}>
      {/* Delete button behind */}
      <View style={s.deleteBackdrop}>
        <Pressable
          onPress={() => onRemove(item.wordId)}
          style={s.deleteBtn}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={s.deleteBtnText}>Xóa</Text>
        </Pressable>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <View style={s.favCard}>
          <View style={s.favRow}>
            {/* Gender colored dot */}
            {genderInfo && (
              <View
                style={[s.genderDot, { backgroundColor: genderInfo.color }]}
              />
            )}

            <View style={s.flex1}>
              <View style={s.wordRow}>
                {item.word.article && (
                  <Text
                    style={[
                      s.articleText,
                      { color: genderInfo?.color ?? colors.text.secondary },
                    ]}
                  >
                    {item.word.article}
                  </Text>
                )}
                <Text style={s.wordText}>{item.word.word}</Text>
              </View>
              <Text style={s.translationText}>
                {item.word.translationVi || item.word.translationEn}
              </Text>
            </View>

            {/* Level Badge */}
            <View style={s.levelBadge}>
              <Text style={s.levelText}>{item.word.level}</Text>
            </View>

            <Ionicons
              name="heart"
              size={18}
              color={colors.pastel.rose.base}
              style={{ marginLeft: spacing.sm }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function FavoritesScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { data: favorites, isLoading, refetch, isRefetching } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  const handleRemove = useCallback(
    (wordId: string) => {
      Alert.alert('Xóa yêu thích', 'Bạn có chắc muốn xóa từ này khỏi danh sách yêu thích?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => removeFavorite.mutate(wordId),
        },
      ]);
    },
    [removeFavorite],
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: Favorite }) => (
      <SwipeableFavoriteItem item={item} onRemove={handleRemove} />
    ),
    [handleRemove],
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Yêu thích</Text>
        <View style={s.countBadge}>
          <Ionicons name="heart" size={14} color={colors.pastel.rose.base} />
          <Text style={s.countText}>{favorites?.length ?? 0}</Text>
        </View>
      </View>

      {/* Hint */}
      <View style={s.hintRow}>
        <Ionicons name="information-circle-outline" size={16} color={colors.text.tertiary} />
        <Text style={s.hintText}>
          Vuốt sang trái để xóa khỏi yêu thích
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={favorites ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.pastel.lavender.base}
            colors={[colors.pastel.lavender.base]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={s.emptyWrap}>
              <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
            </View>
          ) : (
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon}>
                <Ionicons name="heart-outline" size={40} color={colors.text.tertiary} />
              </View>
              <Text style={s.emptyTitle}>Chưa có từ yêu thích</Text>
              <Text style={s.emptySubtitle}>
                Nhấn vào biểu tượng trái tim khi xem từ vựng để thêm vào danh sách yêu thích
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.secondary,
  },
  hintRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  hintText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  swipeContainer: {
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderRadius: radius.stone,
  },
  deleteBackdrop: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    backgroundColor: colors.pastel.rose.base,
  },
  deleteBtn: {
    alignItems: 'center',
  },
  deleteBtnText: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: '#FFFFFF',
  },
  favCard: {
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderDot: {
    marginRight: spacing.md,
    height: 12,
    width: 12,
    borderRadius: 6,
  },
  flex1: {
    flex: 1,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  articleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  wordText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  translationText: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  levelBadge: {
    borderRadius: radius.md,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  levelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.secondary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: colors.bg.b2,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.secondary,
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    maxWidth: 240,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
});
