import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
  PanResponder,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type Phase = 'playing' | 'result';

export default function FlashcardsScreen() {
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
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-400">Đang tải thẻ...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const total = knownCount + unknownCount;
    const accuracy = total > 0 ? Math.round((knownCount / total) * 100) : 0;

    return (
      <SafeAreaView className="flex-1 bg-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 32, width: '100%', alignItems: 'center' }}
          >
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Ionicons
                name={accuracy >= 70 ? 'trophy' : accuracy >= 40 ? 'thumbs-up' : 'refresh'}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <Text className="text-2xl font-bold text-white">
              {accuracy >= 70 ? 'Tuyệt vời!' : accuracy >= 40 ? 'Khá tốt!' : 'Cần ôn lại!'}
            </Text>
            <Text className="mt-1 text-white/70">Flashcards hoàn thành</Text>
          </LinearGradient>

          <View className="mt-6 w-full flex-row" style={{ gap: 12 }}>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-2xl font-bold text-emerald-400">{knownCount}</Text>
              <Text className="text-xs text-gray-400">Đã biết</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-2xl font-bold text-red-400">{unknownCount}</Text>
              <Text className="text-xs text-gray-400">Chưa biết</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-2xl font-bold text-blue-400">{accuracy}%</Text>
              <Text className="text-xs text-gray-400">Tỷ lệ</Text>
            </View>
          </View>

          <View className="mt-8 w-full" style={{ gap: 12 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAgain}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text className="ml-2 text-base font-bold text-white">Chơi lại</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              className="items-center rounded-2xl bg-dark-card py-4"
            >
              <Text className="text-base font-semibold text-gray-300">Quay về</Text>
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
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-dark-card"
        >
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <Text className="text-sm font-semibold text-white">
          {currentIndex + 1} / {cards.length}
        </Text>

        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text className="ml-1 text-sm font-bold text-emerald-400">{knownCount}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text className="ml-1 text-sm font-bold text-red-400">{unknownCount}</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mx-4 mt-1 h-2 overflow-hidden rounded-full bg-dark-secondary">
        <View
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
        />
      </View>

      {/* Swipe Indicators */}
      <View className="relative mt-4 flex-1 items-center justify-center px-6">
        {/* Know indicator (right) */}
        <Animated.View
          className="absolute right-8 top-4 z-10 rounded-lg border-2 border-emerald-500 px-3 py-1"
          style={{ opacity: knowOpacity }}
        >
          <Text className="text-sm font-bold text-emerald-400">BIẾT</Text>
        </Animated.View>

        {/* Don't know indicator (left) */}
        <Animated.View
          className="absolute left-8 top-4 z-10 rounded-lg border-2 border-red-500 px-3 py-1"
          style={{ opacity: dontKnowOpacity }}
        >
          <Text className="text-sm font-bold text-red-400">CHƯA BIẾT</Text>
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
              <LinearGradient
                colors={['#1F2937', '#111827']}
                style={{
                  flex: 1,
                  borderRadius: 24,
                  padding: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
              >
                {genderInfo && (
                  <View
                    className="mb-3 rounded-full px-4 py-1"
                    style={{ backgroundColor: genderInfo.bgColor }}
                  >
                    <Text style={{ color: genderInfo.color }} className="text-sm font-bold">
                      {genderInfo.article} · {genderInfo.label}
                    </Text>
                  </View>
                )}
                <Text className="text-4xl font-bold text-white">{currentCard?.word}</Text>
                {currentCard?.pronunciation && (
                  <Text className="mt-3 text-base text-gray-500">
                    [{currentCard.pronunciation}]
                  </Text>
                )}
                {currentCard?.plural && (
                  <Text className="mt-2 text-sm text-gray-400">Plural: {currentCard.plural}</Text>
                )}
                <View className="mt-4 flex-row items-center">
                  <Ionicons name="sync-outline" size={14} color="#6B7280" />
                  <Text className="ml-1 text-xs text-gray-500">Nhấn để lật thẻ</Text>
                </View>
              </LinearGradient>
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
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={{
                  flex: 1,
                  borderRadius: 24,
                  padding: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="mb-2 text-sm text-white/60">Nghĩa</Text>
                <Text className="text-center text-2xl font-bold text-white">
                  {currentCard?.translationVi || currentCard?.translationEn}
                </Text>
                {currentCard?.translationVi && currentCard?.translationEn && (
                  <Text className="mt-2 text-center text-base text-white/70">
                    {currentCard.translationEn}
                  </Text>
                )}
                {currentCard?.examples && currentCard.examples.length > 0 && (
                  <View className="mt-4 w-full rounded-xl bg-white/10 p-3">
                    <Text className="text-xs text-white/50">Ví dụ:</Text>
                    <Text className="mt-1 text-sm text-white/80" numberOfLines={3}>
                      {currentCard.examples[0]}
                    </Text>
                  </View>
                )}
                <View className="mt-4 flex-row items-center">
                  <Ionicons name="sync-outline" size={14} color="rgba(255,255,255,0.5)" />
                  <Text className="ml-1 text-xs text-white/50">Nhấn để lật thẻ</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Buttons */}
      <View className="flex-row items-center justify-center px-6 pb-6" style={{ gap: 24 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSwipe('left')}
          className="h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border-2 border-red-500/30"
        >
          <Ionicons name="close" size={28} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={flipCard}
          className="h-12 w-12 items-center justify-center rounded-full bg-dark-card"
        >
          <Ionicons name="sync-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSwipe('right')}
          className="h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30"
        >
          <Ionicons name="checkmark" size={28} color="#10B981" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
