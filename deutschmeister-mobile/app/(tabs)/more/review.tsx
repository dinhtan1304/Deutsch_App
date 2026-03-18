import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useDueCards,
  useProgressStats,
  useReviewCard,
} from '@/hooks/useProgress';
import type { Progress, ReviewRating } from '@/types';

const RATING_OPTIONS: Array<{
  rating: ReviewRating;
  label: string;
  sublabel: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { rating: 'again', label: 'Lai', sublabel: '<1p', color: '#EF4444', icon: 'close-circle' },
  { rating: 'hard', label: 'Kho', sublabel: '~6p', color: '#F59E0B', icon: 'alert-circle' },
  { rating: 'good', label: 'Tot', sublabel: '~1d', color: '#22C55E', icon: 'checkmark-circle' },
  { rating: 'easy', label: 'De', sublabel: '~4d', color: '#3B82F6', icon: 'rocket' },
];

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View className="flex-1 items-center rounded-xl bg-dark-card py-3">
      <Ionicons name={icon} size={20} color={color} />
      <Text className="mt-1 text-lg font-bold text-white">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const { data: dueCards, isLoading, refetch, isRefetching } = useDueCards(30);
  const { data: stats } = useProgressStats();
  const reviewCard = useReviewCard();

  const cards = dueCards ?? [];
  const currentCard = cards[currentIndex] as Progress | undefined;
  const remaining = Math.max(0, cards.length - currentIndex);

  const handleRate = useCallback(
    async (rating: ReviewRating) => {
      if (!currentCard) return;

      try {
        await reviewCard.mutateAsync({
          wordId: currentCard.wordId,
          rating,
        });
        setReviewed((r) => r + 1);
        setShowAnswer(false);
        setCurrentIndex((i) => i + 1);
      } catch {
        // Error handled by mutation
      }
    },
    [currentCard, reviewCard],
  );

  const onRefresh = useCallback(() => {
    setCurrentIndex(0);
    setReviewed(0);
    setShowAnswer(false);
    refetch();
  }, [refetch]);

  // Session complete
  const isComplete = cards.length > 0 && currentIndex >= cards.length;

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">On tap SRS</Text>
        {remaining > 0 && (
          <View className="rounded-lg bg-primary-500/20 px-2.5 py-1">
            <Text className="text-xs font-bold text-primary-400">
              Con {remaining}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View className="mx-4 mb-4 flex-row gap-2">
        <StatCard
          label="Tong"
          value={stats?.total ?? 0}
          color="#6366F1"
          icon="layers-outline"
        />
        <StatCard
          label="Da thuoc"
          value={stats?.mastered ?? 0}
          color="#22C55E"
          icon="checkmark-done-outline"
        />
        <StatCard
          label="Dang hoc"
          value={stats?.learning ?? 0}
          color="#F59E0B"
          icon="bulb-outline"
        />
        <StatCard
          label="Can on"
          value={stats?.due ?? 0}
          color="#EF4444"
          icon="alarm-outline"
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : cards.length === 0 ? (
          /* Empty State */
          <View className="items-center px-6 py-16">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-dark-card">
              <Ionicons name="checkmark-done" size={48} color="#22C55E" />
            </View>
            <Text className="text-xl font-bold text-white">
              Tuyet voi!
            </Text>
            <Text className="mt-2 text-center text-base text-gray-400">
              Khong co tu nao can on tap luc nay. Quay lai sau nhe!
            </Text>
          </View>
        ) : isComplete ? (
          /* Session Complete */
          <View className="items-center px-6 py-16">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-green-500/20">
              <Ionicons name="trophy" size={48} color="#22C55E" />
            </View>
            <Text className="text-xl font-bold text-white">
              Hoan thanh!
            </Text>
            <Text className="mt-2 text-center text-base text-gray-400">
              Ban da on {reviewed} tu vung trong phien nay
            </Text>
            <Pressable
              onPress={onRefresh}
              className="mt-6 rounded-xl bg-primary-500 px-6 py-3"
            >
              <Text className="text-base font-semibold text-white">
                On tap tiep
              </Text>
            </Pressable>
          </View>
        ) : currentCard ? (
          /* Flashcard */
          <View className="px-4">
            {/* Progress Bar */}
            <View className="mb-4 h-2 overflow-hidden rounded-full bg-dark-card">
              <View
                className="h-full rounded-full bg-primary-500"
                style={{
                  width: `${(currentIndex / cards.length) * 100}%`,
                }}
              />
            </View>

            {/* Card */}
            <Pressable
              onPress={() => setShowAnswer(true)}
              className="min-h-[280px] items-center justify-center rounded-3xl bg-dark-card p-6"
            >
              {/* Word */}
              <View className="items-center">
                {currentCard.word.article && (
                  <Text className="mb-1 text-lg text-gray-500">
                    {currentCard.word.article}
                  </Text>
                )}
                <Text className="text-3xl font-bold text-white">
                  {currentCard.word.word}
                </Text>

                {currentCard.word.plural && (
                  <Text className="mt-1 text-base text-gray-500">
                    Pl: {currentCard.word.plural}
                  </Text>
                )}
              </View>

              {/* Divider & Answer */}
              {showAnswer ? (
                <View className="mt-6 w-full items-center">
                  <View className="mb-4 h-px w-20 bg-dark-border" />
                  <Text className="text-xl font-medium text-primary-400">
                    {currentCard.word.translationVi ||
                      currentCard.word.translationEn}
                  </Text>
                  {currentCard.word.examples?.[0] && (
                    <Text className="mt-3 text-center text-sm italic text-gray-500">
                      "{currentCard.word.examples[0]}"
                    </Text>
                  )}
                </View>
              ) : (
                <View className="mt-8 items-center">
                  <Ionicons name="eye-outline" size={24} color="#6B7280" />
                  <Text className="mt-1 text-sm text-gray-600">
                    Nhan de xem dap an
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Rating Buttons */}
            {showAnswer && (
              <View className="mt-4 flex-row gap-2">
                {RATING_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.rating}
                    onPress={() => handleRate(opt.rating)}
                    className="flex-1 items-center rounded-xl py-3 active:opacity-70"
                    style={{ backgroundColor: `${opt.color}20` }}
                    disabled={reviewCard.isPending}
                  >
                    <Ionicons name={opt.icon} size={22} color={opt.color} />
                    <Text
                      className="mt-1 text-sm font-semibold"
                      style={{ color: opt.color }}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-xs text-gray-600">
                      {opt.sublabel}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Review counter */}
            <View className="mt-4 items-center pb-8">
              <Text className="text-sm text-gray-600">
                Da on: {reviewed} / {cards.length}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
