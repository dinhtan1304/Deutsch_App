import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
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
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

function buildRatingOptions(colors: ThemeColors): Array<{
  rating: ReviewRating;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> {
  return [
    {
      rating: 'again',
      label: 'Lại',
      sublabel: '<1p',
      color: colors.pastel.rose.base,
      bg: colors.pastel.rose.dim,
      icon: 'close-circle',
    },
    {
      rating: 'hard',
      label: 'Khó',
      sublabel: '~6p',
      color: colors.pastel.peach.base,
      bg: colors.pastel.peach.dim,
      icon: 'alert-circle',
    },
    {
      rating: 'good',
      label: 'Tốt',
      sublabel: '~1d',
      color: colors.pastel.sky.base,
      bg: colors.pastel.sky.dim,
      icon: 'checkmark-circle',
    },
    {
      rating: 'easy',
      label: 'Dễ',
      sublabel: '~4d',
      color: colors.pastel.mint.base,
      bg: colors.pastel.mint.dim,
      icon: 'rocket',
    },
  ];
}

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
  const colors = useThemeStore((s) => s.colors);
  const sc = useMemo(() => createSc(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  return (
    <View style={sc.card}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const colors = useThemeStore((s) => s.colors);
  const sc = useMemo(() => createSc(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  const RATING_OPTIONS = useMemo(() => buildRatingOptions(colors), [colors]);
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
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Ôn tập SRS</Text>
        {remaining > 0 && (
          <View style={s.remainBadge}>
            <Text style={s.remainText}>Còn {remaining}</Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={s.statsRow}>
        <StatCard
          label="Tổng"
          value={stats?.total ?? 0}
          color={colors.pastel.lavender.base}
          icon="layers-outline"
        />
        <StatCard
          label="Đã thuộc"
          value={stats?.mastered ?? 0}
          color={colors.pastel.mint.base}
          icon="checkmark-done-outline"
        />
        <StatCard
          label="Đang học"
          value={stats?.learning ?? 0}
          color={colors.pastel.peach.base}
          icon="bulb-outline"
        />
        <StatCard
          label="Cần ôn"
          value={stats?.due ?? 0}
          color={colors.pastel.rose.base}
          icon="alarm-outline"
        />
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.pastel.lavender.base}
            colors={[colors.pastel.lavender.base]}
          />
        }
      >
        {isLoading ? (
          <View style={s.emptyWrap}>
            <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
          </View>
        ) : cards.length === 0 ? (
          /* Empty State */
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="checkmark-done" size={48} color={colors.pastel.mint.base} />
            </View>
            <Text style={s.emptyTitle}>Tuyệt vời!</Text>
            <Text style={s.emptyDesc}>
              Không có từ nào cần ôn tập lúc này. Quay lại sau nhé!
            </Text>
          </View>
        ) : isComplete ? (
          /* Session Complete */
          <View style={s.emptyState}>
            <View style={s.completeIconWrap}>
              <Ionicons name="trophy" size={48} color={colors.pastel.mint.base} />
            </View>
            <Text style={s.emptyTitle}>Hoàn thành!</Text>
            <Text style={s.emptyDesc}>
              Bạn đã ôn {reviewed} từ vựng trong phiên này
            </Text>
            <Pressable onPress={onRefresh} style={s.continueBtn}>
              <Text style={s.continueBtnText}>Ôn tập tiếp</Text>
            </Pressable>
          </View>
        ) : currentCard ? (
          /* Flashcard */
          <View style={s.flashArea}>
            {/* Progress Bar */}
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${(currentIndex / cards.length) * 100}%`,
                  },
                ]}
              />
            </View>

            {/* Card */}
            <Pressable
              onPress={() => setShowAnswer(true)}
              style={s.flashCard}
            >
              {/* Word */}
              <View style={s.wordCenter}>
                {currentCard.word.article && (
                  <Text style={s.articleText}>{currentCard.word.article}</Text>
                )}
                <Text style={s.wordText}>{currentCard.word.word}</Text>

                {currentCard.word.plural && (
                  <Text style={s.pluralText}>
                    Pl: {currentCard.word.plural}
                  </Text>
                )}
              </View>

              {/* Divider & Answer */}
              {showAnswer ? (
                <View style={s.answerSection}>
                  <View style={s.divider} />
                  <Text style={s.answerText}>
                    {currentCard.word.translationVi ||
                      currentCard.word.translationEn}
                  </Text>
                  {currentCard.word.examples?.[0] && (
                    <Text style={s.exampleText}>
                      "{currentCard.word.examples[0]}"
                    </Text>
                  )}
                </View>
              ) : (
                <View style={s.tapHint}>
                  <Ionicons name="eye-outline" size={24} color={colors.text.tertiary} />
                  <Text style={s.tapHintText}>Nhấn để xem đáp án</Text>
                </View>
              )}
            </Pressable>

            {/* Rating Buttons */}
            {showAnswer && (
              <View style={s.ratingRow}>
                {RATING_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.rating}
                    onPress={() => handleRate(opt.rating)}
                    style={[s.ratingBtn, { backgroundColor: opt.bg }]}
                    disabled={reviewCard.isPending}
                  >
                    <Ionicons name={opt.icon} size={22} color={opt.color} />
                    <Text style={[s.ratingLabel, { color: opt.color }]}>
                      {opt.label}
                    </Text>
                    <Text style={s.ratingSub}>{opt.sublabel}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Review counter */}
            <View style={s.reviewCounter}>
              <Text style={s.reviewCounterText}>
                Đã ôn: {reviewed} / {cards.length}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createSc = (colors: any) => StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  value: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
});

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
  remainBadge: {
    borderRadius: radius.lg,
    backgroundColor: colors.pastel.lime.dim,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  remainText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.base,
  },
  statsRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  emptyIconWrap: {
    marginBottom: spacing.lg,
    height: 96,
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    backgroundColor: colors.bg.b2,
  },
  completeIconWrap: {
    marginBottom: spacing.lg,
    height: 96,
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    backgroundColor: colors.pastel.mint.dim,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  emptyDesc: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  continueBtn: {
    marginTop: 24,
    borderRadius: radius.stone,
    backgroundColor: colors.pastel.lime.base,
    paddingHorizontal: 24,
    paddingVertical: spacing.md,
  },
  continueBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.pastel.lime.on,
  },
  flashArea: {
    paddingHorizontal: spacing.lg,
  },
  progressTrack: {
    marginBottom: spacing.lg,
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b2,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.pastel.lime.base,
  },
  flashCard: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius['2xl'],
    backgroundColor: colors.bg.b2,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  wordCenter: {
    alignItems: 'center',
  },
  articleText: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  wordText: {
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  pluralText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  answerSection: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  divider: {
    marginBottom: spacing.lg,
    height: 1,
    width: 80,
    backgroundColor: colors.border.default,
  },
  answerText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.pastel.lavender.base,
  },
  exampleText: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.text.tertiary,
  },
  tapHint: {
    marginTop: 32,
    alignItems: 'center',
  },
  tapHintText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  ratingRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    paddingVertical: spacing.md,
  },
  ratingLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  ratingSub: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  reviewCounter: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingBottom: 32,
  },
  reviewCounterText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
});
