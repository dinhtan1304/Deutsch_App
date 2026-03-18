import { useCallback, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import type { Favorite } from '@/types';
import { GenderInfo } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -80;

function SwipeableFavoriteItem({
  item,
  onRemove,
}: {
  item: Favorite;
  onRemove: (wordId: string) => void;
}) {
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
    <View className="mb-2 overflow-hidden rounded-2xl">
      {/* Delete button behind */}
      <View className="absolute right-0 top-0 bottom-0 w-24 items-center justify-center rounded-r-2xl bg-red-500">
        <Pressable
          onPress={() => onRemove(item.wordId)}
          className="items-center"
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text className="mt-1 text-xs font-medium text-white">Xoa</Text>
        </Pressable>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <View className="rounded-2xl bg-dark-card p-4">
          <View className="flex-row items-center">
            {/* Gender colored dot */}
            {genderInfo && (
              <View
                className="mr-3 h-3 w-3 rounded-full"
                style={{ backgroundColor: genderInfo.color }}
              />
            )}

            <View className="flex-1">
              <View className="flex-row items-baseline gap-2">
                {item.word.article && (
                  <Text
                    className="text-sm font-medium"
                    style={{ color: genderInfo?.color ?? '#9CA3AF' }}
                  >
                    {item.word.article}
                  </Text>
                )}
                <Text className="text-base font-bold text-white">
                  {item.word.word}
                </Text>
              </View>
              <Text className="mt-0.5 text-sm text-gray-400">
                {item.word.translationVi || item.word.translationEn}
              </Text>
            </View>

            {/* Level Badge */}
            <View className="rounded-md bg-dark-border px-2 py-0.5">
              <Text className="text-xs font-medium text-gray-400">
                {item.word.level}
              </Text>
            </View>

            <Ionicons
              name="heart"
              size={18}
              color="#EF4444"
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { data: favorites, isLoading, refetch, isRefetching } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  const handleRemove = useCallback(
    (wordId: string) => {
      Alert.alert('Xoa yeu thich', 'Ban co chac muon xoa tu nay khoi danh sach yeu thich?', [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Xoa',
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
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">Yeu thich</Text>
        <View className="flex-row items-center gap-1.5 rounded-lg bg-dark-card px-2.5 py-1">
          <Ionicons name="heart" size={14} color="#EF4444" />
          <Text className="text-xs font-medium text-gray-400">
            {favorites?.length ?? 0}
          </Text>
        </View>
      </View>

      {/* Hint */}
      <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl bg-dark-card px-3 py-2">
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text className="flex-1 text-xs text-gray-500">
          Vuot sang trai de xoa khoi yeu thich
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={favorites ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
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
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-dark-card">
                <Ionicons name="heart-outline" size={40} color="#4B5563" />
              </View>
              <Text className="text-lg font-semibold text-gray-400">
                Chua co tu yeu thich
              </Text>
              <Text className="mt-1 max-w-[240px] text-center text-sm text-gray-600">
                Nhan vao bieu tuong trai tim khi xem tu vung de them vao danh sach yeu thich
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
