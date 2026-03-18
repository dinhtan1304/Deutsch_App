import { View, Text, TouchableOpacity, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRandomWords } from '@/hooks/useWords';
import { useGameSession } from '@/hooks/useGameSession';
import { Difficulty, Word } from '@/types';
import * as Haptics from 'expo-haptics';

type Phase = 'playing' | 'result';

interface MatchCard {
  id: string;
  text: string;
  pairId: string;
  type: 'word' | 'translation';
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildCards(words: Word[]): MatchCard[] {
  const cards: MatchCard[] = [];
  words.forEach((word) => {
    cards.push({
      id: `word-${word.id}`,
      text: word.word,
      pairId: word.id,
      type: 'word',
    });
    cards.push({
      id: `trans-${word.id}`,
      text: word.translationVi || word.translationEn,
      pairId: word.id,
      type: 'translation',
    });
  });
  return shuffleArray(cards);
}

export default function MatchingScreen() {
  const router = useRouter();
  const { difficulty = 'beginner', count = '10', category } = useLocalSearchParams<{
    difficulty: Difficulty;
    count: string;
    category?: string;
  }>();

  // For matching, limit to 8 pairs max to fit on screen
  const totalPairs = Math.min(parseInt(count, 10) || 8, 8);
  const difficultyLevels: Record<string, string[]> = {
    beginner: ['A1', 'A2'],
    intermediate: ['B1', 'B2'],
    advanced: ['C1', 'C2'],
  };

  const { data: words, isLoading, refetch } = useRandomWords(totalPairs, {
    category: category || undefined,
    levels: difficultyLevels[difficulty] || ['A1', 'A2'],
  });

  const session = useGameSession('matching', difficulty as Difficulty);

  const [phase, setPhase] = useState<Phase>('playing');
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Build cards from words
  useEffect(() => {
    if (words && words.length >= 2) {
      setCards(buildCards(words.slice(0, totalPairs)));
    }
  }, [words, totalPairs]);

  // Start session
  useEffect(() => {
    if (cards.length > 0 && !sessionStarted) {
      session.start(totalPairs);
      setSessionStarted(true);
    }
  }, [cards.length, sessionStarted]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || cards.length === 0) return;
    const interval = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [phase, cards.length]);

  const handleCardTap = useCallback(
    (card: MatchCard) => {
      if (matchedPairs.has(card.pairId) && matchedPairs.has(card.id)) return;
      if (wrongPair) return;

      // If card is already matched, ignore
      if (matchedPairs.has(card.pairId) && cards.find((c) => c.id === card.id && matchedPairs.has(card.pairId))) {
        // Check if THIS specific card side is matched
      }

      if (selectedId === card.id) {
        // Deselect
        setSelectedId(null);
        return;
      }

      if (selectedId === null) {
        // First selection
        setSelectedId(card.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return;
      }

      // Second selection
      const firstCard = cards.find((c) => c.id === selectedId);
      if (!firstCard) {
        setSelectedId(card.id);
        return;
      }

      setMoves((m) => m + 1);

      if (firstCard.pairId === card.pairId && firstCard.type !== card.type) {
        // Match found
        const timeBonus = Math.max(0, 30 - elapsedTime);
        const points = 20 + timeBonus;
        setScore((s) => s + points);
        setCorrectCount((c) => c + 1);

        const newMatched = new Set(matchedPairs);
        newMatched.add(card.pairId);
        setMatchedPairs(newMatched);
        setSelectedId(null);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        // Check if all matched
        if (newMatched.size === totalPairs) {
          setTimeout(() => setPhase('result'), 600);
        }
      } else {
        // Wrong match
        setWrongCount((w) => w + 1);
        setWrongPair([selectedId, card.id]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

        // Shake animation
        shakeAnim.setValue(0);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
          setWrongPair(null);
          setSelectedId(null);
        }, 800);
      }
    },
    [selectedId, matchedPairs, cards, wrongPair, elapsedTime, totalPairs, shakeAnim],
  );

  // End session when result phase
  const sessionEndedRef = useRef(false);
  useEffect(() => {
    if (phase === 'result' && !sessionEndedRef.current) {
      sessionEndedRef.current = true;
      session.end(score, correctCount, correctCount, wrongCount);
    }
  }, [phase]);

  const handlePlayAgain = () => {
    setPhase('playing');
    setCards([]);
    setSelectedId(null);
    setMatchedPairs(new Set());
    setWrongPair(null);
    setScore(0);
    setMoves(0);
    setCorrectCount(0);
    setWrongCount(0);
    setElapsedTime(0);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    refetch();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading || cards.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-4 text-gray-400">Đang tải trò chơi...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy = moves > 0 ? Math.round((correctCount / moves) * 100) : 0;
    return (
      <SafeAreaView className="flex-1 bg-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <LinearGradient
            colors={['#10B981', '#059669']}
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
              {accuracy >= 70 ? 'Xuất sắc!' : accuracy >= 40 ? 'Khá tốt!' : 'Cần luyện thêm!'}
            </Text>
            <Text className="mt-1 text-white/70">Word Match hoàn thành</Text>
          </LinearGradient>

          <View className="mt-6 w-full flex-row" style={{ gap: 12 }}>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-2xl font-bold text-white">{score}</Text>
              <Text className="text-xs text-gray-400">Điểm</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-2xl font-bold text-emerald-400">{accuracy}%</Text>
              <Text className="text-xs text-gray-400">Chính xác</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-2xl font-bold text-amber-400">{formatTime(elapsedTime)}</Text>
              <Text className="text-xs text-gray-400">Thời gian</Text>
            </View>
          </View>

          <View className="mt-4 w-full flex-row" style={{ gap: 12 }}>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-lg font-bold text-emerald-400">{correctCount}</Text>
              <Text className="text-xs text-gray-400">Đúng</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-lg font-bold text-red-400">{wrongCount}</Text>
              <Text className="text-xs text-gray-400">Sai</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-dark-card p-4">
              <Text className="text-lg font-bold text-blue-400">{moves}</Text>
              <Text className="text-xs text-gray-400">Lượt chơi</Text>
            </View>
          </View>

          <View className="mt-8 w-full" style={{ gap: 12 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAgain}>
              <LinearGradient
                colors={['#10B981', '#059669']}
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

        <View className="flex-row items-center">
          <Ionicons name="timer-outline" size={16} color="#9CA3AF" />
          <Text className="ml-1 text-sm font-bold text-white">{formatTime(elapsedTime)}</Text>
        </View>

        <View className="flex-row items-center rounded-lg bg-dark-card px-3 py-1.5">
          <Ionicons name="star" size={16} color="#10B981" />
          <Text className="ml-1 text-sm font-bold text-white">{score}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mx-4 mt-1 h-2 overflow-hidden rounded-full bg-dark-secondary">
        <View
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${(matchedPairs.size / totalPairs) * 100}%` }}
        />
      </View>

      <View className="mx-4 mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-gray-400">
          {matchedPairs.size}/{totalPairs} cặp
        </Text>
        <Text className="text-xs text-gray-400">{moves} lượt</Text>
      </View>

      {/* Card Grid */}
      <Animated.View
        className="mx-3 mt-4 flex-1 flex-row flex-wrap content-start"
        style={{ transform: [{ translateX: shakeAnim }], gap: 8 }}
      >
        {cards.map((card) => {
          const isSelected = selectedId === card.id;
          const isMatched = matchedPairs.has(card.pairId);
          const isWrong = wrongPair !== null && (wrongPair[0] === card.id || wrongPair[1] === card.id);

          // Calculate card width: 2 columns with gap
          const screenWidth = Dimensions.get('window').width;
          const cardWidth = (screenWidth - 24 - 16 - 8) / 2; // mx-3 (12*2=24), padding, gap

          let bgClass = 'bg-dark-card';
          let borderColor = 'transparent';

          if (isMatched) {
            bgClass = 'bg-emerald-500/15';
            borderColor = '#10B981';
          } else if (isWrong) {
            bgClass = 'bg-red-500/15';
            borderColor = '#EF4444';
          } else if (isSelected) {
            bgClass = 'bg-dark-secondary';
            borderColor = '#10B981';
          }

          return (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.7}
              disabled={isMatched || wrongPair !== null}
              onPress={() => handleCardTap(card)}
              style={{
                width: cardWidth,
                borderWidth: isSelected || isMatched || isWrong ? 2 : 0,
                borderColor,
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isMatched
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isWrong
                    ? 'rgba(239, 68, 68, 0.15)'
                    : isSelected
                      ? '#1F2937'
                      : '#111827',
                opacity: isMatched ? 0.6 : 1,
              }}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  isMatched
                    ? 'text-emerald-400'
                    : isWrong
                      ? 'text-red-400'
                      : isSelected
                        ? 'text-emerald-300'
                        : 'text-white'
                }`}
                numberOfLines={2}
              >
                {card.text}
              </Text>
              <Text className="mt-1 text-xs text-gray-500">
                {card.type === 'word' ? 'DE' : 'VI'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </SafeAreaView>
  );
}
