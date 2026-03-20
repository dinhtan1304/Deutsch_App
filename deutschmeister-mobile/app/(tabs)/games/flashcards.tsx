import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRandomWords } from '@/hooks/useWords';
import { useGameSession } from '@/hooks/useGameSession';
import { Difficulty, Word, GenderInfo } from '@/types';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography } from '@/theme';
import { useXPStore, calculateGameXP } from '@/stores/xpStore';
import { XPSummary } from '@/components/ui/XPSummary';
import { useThemeStore } from '@/stores/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type Phase = 'playing' | 'result';

export default function FlashcardsScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { difficulty = 'beginner', count = '10', category } = useLocalSearchParams<{
    difficulty: Difficulty;
    count: string;
    category?: string;
  }>();

  const totalCards = parseInt(count, 10) || 10;
  const difficultyLevels: Record<string, string[]> = {
    beginner: ['A1', 'A2'],
    intermediate: ['B1', 'B2'],
    advanced: ['C1', 'C2'],
  };

  const { data: words, isLoading, refetch } = useRandomWords(totalCards, {
    category: category || undefined,
    levels: difficultyLevels[difficulty] || ['A1', 'A2'],
  });

  const session = useGameSession('flashcard', difficulty as Difficulty);

  const [phase, setPhase] = useState<Phase>('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  // XP state
  const [sessionXP, setSessionXP] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);

  const addXP = useXPStore((s) => s.addXP);
  const updateBestScore = useXPStore((s) => s.updateBestScore);
  const xpLevel = useXPStore((s) => s.level);
  const xpInCurrentLevel = useXPStore((s) => s.xpInCurrentLevel);
  const xpNeededForLevel = useXPStore((s) => s.xpNeededForLevel);

  // Animations
  const flipAnim = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const cards = useMemo(() => words ?? [], [words]);
  const currentCard: Word | null = cards[currentIndex] ?? null;

  // Start session
  useEffect(() => {
    if (cards.length > 0 && !sessionStarted) {
      session.start(cards.length);
      setSessionStarted(true);
    }
  }, [cards.length, sessionStarted]);

  const flipCard = useCallback(() => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const known = direction === 'right';
      if (known) {
        setKnownCount((c) => c + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        setUnknownCount((c) => c + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }

      // Animate card off screen
      Animated.parallel([
        Animated.timing(panX, {
          toValue: direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (currentIndex + 1 >= cards.length) {
          setPhase('result');
        } else {
          setCurrentIndex((i) => i + 1);
          setIsFlipped(false);
          flipAnim.setValue(0);
          panX.setValue(0);
          panY.setValue(0);
          cardOpacity.setValue(1);
        }
      });
    },
    [currentIndex, cards.length, panX, cardOpacity, flipAnim, panY],
  );

  // Ref to always call latest handleSwipe from PanResponder (avoids stale closure)
  const handleSwipeRef = useRef(handleSwipe);
  handleSwipeRef.current = handleSwipe;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 15 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          panX.setValue(gesture.dx);
          panY.setValue(gesture.dy * 0.3);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            handleSwipeRef.current('right');
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            handleSwipeRef.current('left');
          } else {
            // Snap back
            Animated.spring(panX, {
              toValue: 0,
              friction: 5,
              useNativeDriver: true,
            }).start();
            Animated.spring(panY, {
              toValue: 0,
              friction: 5,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [panX, panY],
  );

  // End session when result phase
  const sessionEndedRef = useRef(false);
  useEffect(() => {
    if (phase === 'result' && !sessionEndedRef.current) {
      sessionEndedRef.current = true;
      const score = knownCount * 10;
      session.end(score, knownCount, knownCount, unknownCount);

      // XP + Best Score
      const total = knownCount + unknownCount;
      const finalAccuracy = total > 0 ? Math.round((knownCount / total) * 100) : 0;
      const totalXP = calculateGameXP(knownCount, 0, finalAccuracy);
      setSessionXP(totalXP);
      const { leveledUp: didLevelUp } = addXP(totalXP);
      setLeveledUp(didLevelUp);
      const newBest = updateBestScore('flashcard', score);
      setIsNewBest(newBest);
    }
  }, [phase]);

  const handlePlayAgain = () => {
    setPhase('playing');
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    setSessionXP(0);
    setIsNewBest(false);
    setLeveledUp(false);
    flipAnim.setValue(0);
    panX.setValue(0);
    panY.setValue(0);
    cardOpacity.setValue(1);
    refetch();
  };

  // Flip interpolations
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const rotateCard = panX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  // Swipe indicator opacity
  const knowOpacity = panX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const dontKnowOpacity = panX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (isLoading || cards.length === 0) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
          <Text style={s.loadingText}>Đang tải thẻ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const total = knownCount + unknownCount;
    const accuracy = total > 0 ? Math.round((knownCount / total) * 100) : 0;

    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.resultContainer}>
          <LinearGradient
            colors={[colors.bg.b3, colors.bg.b2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.resultGradient}
          >
            <View style={s.resultIconCircle}>
              <Ionicons
                name={accuracy >= 70 ? 'trophy' : accuracy >= 40 ? 'thumbs-up' : 'refresh'}
                size={32}
                color={colors.pastel.lime.base}
              />
            </View>
            <Text style={s.resultTitle}>
              {accuracy >= 70 ? 'Tuyệt vời!' : accuracy >= 40 ? 'Khá tốt!' : 'Cần ôn lại!'}
            </Text>
            <Text style={s.resultSubtitle}>Flashcards hoàn thành</Text>
          </LinearGradient>

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color: colors.pastel.mint.base }]}>{knownCount}</Text>
              <Text style={s.statLabel}>Đã biết</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color: colors.pastel.rose.base }]}>{unknownCount}</Text>
              <Text style={s.statLabel}>Chưa biết</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color: colors.pastel.sky.base }]}>{accuracy}%</Text>
              <Text style={s.statLabel}>Tỷ lệ</Text>
            </View>
          </View>

          <XPSummary
            xpEarned={sessionXP}
            isNewBest={isNewBest}
            level={xpLevel}
            leveledUp={leveledUp}
            xpInCurrentLevel={xpInCurrentLevel}
            xpNeededForLevel={xpNeededForLevel}
          />

          <View style={s.resultButtons}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAgain} style={s.primaryButton}>
              <Ionicons name="refresh" size={20} color={colors.pastel.lime.on} />
              <Text style={s.primaryButtonText}>Chơi lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={s.ghostButton}
            >
              <Text style={s.ghostButtonText}>Quay về</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Playing state
  const genderInfo = currentCard
    ? GenderInfo[currentCard.gender as keyof typeof GenderInfo]
    : null;

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.closeButton}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <Text style={s.counterText}>
          {currentIndex + 1} / {cards.length}
        </Text>

        <View style={s.scoreRow}>
          <View style={s.scoreItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.pastel.mint.base} />
            <Text style={[s.scoreText, { color: colors.pastel.mint.base }]}>{knownCount}</Text>
          </View>
          <View style={s.scoreItem}>
            <Ionicons name="close-circle" size={16} color={colors.pastel.rose.base} />
            <Text style={[s.scoreText, { color: colors.pastel.rose.base }]}>{unknownCount}</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={s.progressBarTrack}>
        <View
          style={[
            s.progressBarFill,
            { width: `${((currentIndex) / cards.length) * 100}%` },
          ]}
        />
      </View>

      {/* Swipe Indicators */}
      <View style={s.cardArea}>
        {/* Know indicator (right) */}
        <Animated.View
          style={[s.knowIndicator, { opacity: knowOpacity }]}
        >
          <Text style={s.knowIndicatorText}>BIẾT</Text>
        </Animated.View>

        {/* Don't know indicator (left) */}
        <Animated.View
          style={[s.dontKnowIndicator, { opacity: dontKnowOpacity }]}
        >
          <Text style={s.dontKnowIndicatorText}>CHƯA BIẾT</Text>
        </Animated.View>

        {/* Flashcard */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            width: SCREEN_WIDTH - 48,
            height: 360,
            opacity: cardOpacity,
            transform: [{ translateX: panX }, { translateY: panY }, { rotate: rotateCard }],
          }}
        >
          <TouchableOpacity activeOpacity={0.95} onPress={flipCard} style={{ flex: 1 }}>
            {/* Front Side */}
            <Animated.View
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: [{ rotateY: frontInterpolate }],
              }}
            >
              <View style={s.cardFront}>
                {genderInfo && (
                  <View
                    style={[s.genderBadge, { backgroundColor: genderInfo.bgColor }]}
                  >
                    <Text style={[s.genderBadgeText, { color: genderInfo.color }]}>
                      {genderInfo.article} · {genderInfo.label}
                    </Text>
                  </View>
                )}
                <Text style={s.cardWord}>{currentCard?.word}</Text>
                {currentCard?.pronunciation && (
                  <Text style={s.cardPronunciation}>
                    [{currentCard.pronunciation}]
                  </Text>
                )}
                {currentCard?.plural && (
                  <Text style={s.cardPlural}>Plural: {currentCard.plural}</Text>
                )}
                <View style={s.flipHintRow}>
                  <Ionicons name="sync-outline" size={14} color={colors.text.tertiary} />
                  <Text style={s.flipHintText}>Nhấn để lật thẻ</Text>
                </View>
              </View>
            </Animated.View>

            {/* Back Side */}
            <Animated.View
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: [{ rotateY: backInterpolate }],
              }}
            >
              <View style={s.cardBack}>
                <Text style={s.backLabel}>Nghĩa</Text>
                <Text style={s.backTranslation}>
                  {currentCard?.translationVi || currentCard?.translationEn}
                </Text>
                {currentCard?.translationVi && currentCard?.translationEn && (
                  <Text style={s.backSecondary}>
                    {currentCard.translationEn}
                  </Text>
                )}
                {currentCard?.examples && currentCard.examples.length > 0 && (
                  <View style={s.exampleBox}>
                    <Text style={s.exampleLabel}>Ví dụ:</Text>
                    <Text style={s.exampleText} numberOfLines={3}>
                      {currentCard.examples[0]}
                    </Text>
                  </View>
                )}
                <View style={s.flipHintRow}>
                  <Ionicons name="sync-outline" size={14} color={colors.text.tertiary} />
                  <Text style={s.flipHintText}>Nhấn để lật thẻ</Text>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Buttons */}
      <View style={s.bottomButtons}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSwipe('left')}
          style={s.swipeButtonWrong}
        >
          <Ionicons name="close" size={28} color={colors.pastel.rose.base} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={flipCard}
          style={s.flipButton}
        >
          <Ionicons name="sync-outline" size={22} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSwipe('right')}
          style={s.swipeButtonCorrect}
        >
          <Ionicons name="checkmark" size={28} color={colors.pastel.mint.base} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },

  /* ── Loading ─────────────────────────────────────── */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
  },

  /* ── Result Screen ───────────────────────────────── */
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + spacing.xs, // ~24
  },
  resultGradient: {
    borderRadius: radius.stone,
    padding: spacing['3xl'],
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  resultIconCircle: {
    marginBottom: spacing.lg,
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.pastel.lime.dim,
  },
  resultTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  resultSubtitle: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
  },
  statsRow: {
    marginTop: spacing.xl + spacing.xs, // ~24
    width: '100%',
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  resultButtons: {
    marginTop: spacing['2xl'] + spacing.xs, // ~32
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.pastel.lime.base,
    borderRadius: radius.stone,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.on,
  },
  ghostButton: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.lg,
  },
  ghostButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },

  /* ── Playing – Top Bar ───────────────────────────── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.bg.b2,
  },
  counterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },

  /* ── Progress Bar ────────────────────────────────── */
  progressBarTrack: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.pastel.lime.base,
  },

  /* ── Card Area ───────────────────────────────────── */
  cardArea: {
    position: 'relative',
    marginTop: spacing.lg,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + spacing.xs, // ~24
  },

  /* ── Swipe Indicators ────────────────────────────── */
  knowIndicator: {
    position: 'absolute',
    right: 32,
    top: spacing.lg,
    zIndex: 10,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.pastel.mint.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  knowIndicatorText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.mint.base,
  },
  dontKnowIndicator: {
    position: 'absolute',
    left: 32,
    top: spacing.lg,
    zIndex: 10,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.pastel.rose.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dontKnowIndicatorText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.rose.base,
  },

  /* ── Card Faces ──────────────────────────────────── */
  cardFront: {
    flex: 1,
    borderRadius: radius['2xl'],
    padding: spacing.xl + spacing.xs, // ~24
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.b2,
  },
  genderBadge: {
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  genderBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  cardWord: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  cardPronunciation: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  cardPlural: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  flipHintRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flipHintText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },

  cardBack: {
    flex: 1,
    borderRadius: radius['2xl'],
    padding: spacing.xl + spacing.xs, // ~24
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pastel.lavender.base + '33',
    backgroundColor: colors.bg.b3,
  },
  backLabel: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  backTranslation: {
    textAlign: 'center',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  backSecondary: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  exampleBox: {
    marginTop: spacing.lg,
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b4,
    padding: spacing.md,
  },
  exampleLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  exampleText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },

  /* ── Bottom Buttons ──────────────────────────────── */
  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + spacing.xs, // ~24
    paddingBottom: spacing.xl + spacing.xs,
    gap: spacing.xl + spacing.xs, // ~24
  },
  swipeButtonWrong: {
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.pastel.rose.dim,
    borderWidth: 2,
    borderColor: colors.pastel.rose.base + '4D', // ~30%
  },
  flipButton: {
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  swipeButtonCorrect: {
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.pastel.mint.dim,
    borderWidth: 2,
    borderColor: colors.pastel.mint.base + '4D', // ~30%
  },
});
