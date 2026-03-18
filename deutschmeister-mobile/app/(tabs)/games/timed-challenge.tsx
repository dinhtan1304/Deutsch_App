import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRandomWords } from '@/hooks/useWords';
import { useGameSession } from '@/hooks/useGameSession';
import { Difficulty, Word } from '@/types';
import * as Haptics from 'expo-haptics';

type Phase = 'playing' | 'result';

const TIME_PER_QUESTION = 5; // Much shorter timer for urgency

interface QuizQuestion {
  word: Word;
  options: string[];
  correctAnswer: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(words: Word[]): QuizQuestion[] {
  return words.map((word, idx) => {
    const correctAnswer = word.translationVi || word.translationEn;
    const otherWords = words.filter((_, i) => i !== idx);
    const shuffledOthers = shuffleArray(otherWords).slice(0, 3);
    const wrongAnswers = shuffledOthers.map((w) => w.translationVi || w.translationEn);
    const options = shuffleArray([correctAnswer, ...wrongAnswers]);
    return { word, options, correctAnswer };
  });
}

export default function TimedChallengeScreen() {
  const router = useRouter();
  const { difficulty = 'beginner', count = '10', category } = useLocalSearchParams<{
    difficulty: Difficulty;
    count: string;
    category?: string;
  }>();

  const totalQuestions = parseInt(count, 10) || 10;
  const difficultyLevels: Record<string, string[]> = {
    beginner: ['A1', 'A2'],
    intermediate: ['B1', 'B2'],
    advanced: ['C1', 'C2'],
  };

  const { data: words, isLoading, refetch } = useRandomWords(
    Math.max(totalQuestions, 20),
    {
      category: category || undefined,
      levels: difficultyLevels[difficulty] || ['A1', 'A2'],
    },
  );

  const session = useGameSession('timed-challenge', difficulty as Difficulty);

  const [phase, setPhase] = useState<Phase>('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Animations
  const bgFlash = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerBarAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const questions = useMemo(() => {
    if (!words || words.length < 4) return [];
    return buildQuestions(words.slice(0, totalQuestions));
  }, [words, totalQuestions]);

  const currentQuestion = questions[currentIndex] ?? null;

  const goNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimeLeft(TIME_PER_QUESTION);
      timerBarAnim.setValue(1);
    }
  }, [currentIndex, questions.length, timerBarAnim]);

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  const triggerCorrectAnimation = useCallback(() => {
    bgFlash.setValue(0);
    Animated.sequence([
      Animated.timing(bgFlash, { toValue: 1, duration: 150, useNativeDriver: false }),
      Animated.timing(bgFlash, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  }, [bgFlash]);

  const triggerWrongAnimation = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Start session
  useEffect(() => {
    if (questions.length > 0 && !sessionStarted) {
      session.start(questions.length);
      setSessionStarted(true);
    }
  }, [questions.length, sessionStarted]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing' || selectedAnswer !== null || !currentQuestion) return;
    if (timeLeft <= 0) {
      setSelectedAnswer('__timeout__');
      setIsCorrect(false);
      setWrongCount((w) => w + 1);
      setStreak(0);
      triggerWrongAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setTimeout(() => goNextRef.current(), 800);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, phase, selectedAnswer, currentQuestion, triggerWrongAnimation]);

  // Animate timer bar
  useEffect(() => {
    if (selectedAnswer !== null) return;
    Animated.timing(timerBarAnim, {
      toValue: timeLeft / TIME_PER_QUESTION,
      duration: 950,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, selectedAnswer]);

  // Pulse when timer is low
  useEffect(() => {
    if (timeLeft <= 2 && timeLeft > 0 && selectedAnswer === null) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [timeLeft, selectedAnswer]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: questions.length > 0 ? currentIndex / questions.length : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, questions.length]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null || !currentQuestion) return;

      const correct = answer === currentQuestion.correctAnswer;
      setSelectedAnswer(answer);
      setIsCorrect(correct);

      if (correct) {
        // Higher streak bonuses for timed challenge
        const points = 15 + streak * 5 + Math.max(0, timeLeft * 3);
        setScore((s) => s + points);
        setCorrectCount((c) => c + 1);
        setStreak((s) => {
          const newStreak = s + 1;
          setBestStreak((b) => Math.max(b, newStreak));
          return newStreak;
        });
        triggerCorrectAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        setWrongCount((w) => w + 1);
        setStreak(0);
        triggerWrongAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }

      setTimeout(() => goNextRef.current(), 800);
    },
    [selectedAnswer, currentQuestion, streak, timeLeft, triggerCorrectAnimation, triggerWrongAnimation],
  );

  // End session when result phase
  const sessionEndedRef = useRef(false);
  useEffect(() => {
    if (phase === 'result' && !sessionEndedRef.current) {
      sessionEndedRef.current = true;
      session.end(score, bestStreak, correctCount, wrongCount);
    }
  }, [phase]);

  const handlePlayAgain = () => {
    setPhase('playing');
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTimeLeft(TIME_PER_QUESTION);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    timerBarAnim.setValue(1);
    refetch();
  };

  const bgColor = bgFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.15)'],
  });

  const timerBarColor = timerBarAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: ['#EF4444', '#EF4444', '#F59E0B', '#10B981'],
  });

  // Loading state
  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#EF4444" />
        <Text className="mt-4 text-gray-400">Đang tải câu hỏi...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <SafeAreaView className="flex-1 bg-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
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
              {accuracy >= 70 ? 'Tốc độ tuyệt vời!' : accuracy >= 40 ? 'Khá nhanh!' : 'Cần luyện thêm!'}
            </Text>
            <Text className="mt-1 text-white/70">Time Challenge hoàn thành</Text>
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
              <Text className="text-2xl font-bold text-amber-400">{bestStreak}</Text>
              <Text className="text-xs text-gray-400">Streak</Text>
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
          </View>

          <View className="mt-8 w-full" style={{ gap: 12 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAgain}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
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
      <Animated.View className="flex-1" style={{ backgroundColor: bgColor }}>
        {/* Top Bar */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-dark-card"
          >
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Ionicons name="flame" size={18} color="#F59E0B" />
            <Text className="ml-1 text-sm font-bold text-amber-400">{streak}</Text>
          </View>

          <View className="flex-row items-center rounded-lg bg-dark-card px-3 py-1.5">
            <Ionicons name="star" size={16} color="#EF4444" />
            <Text className="ml-1 text-sm font-bold text-white">{score}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mx-4 mt-1 h-2 overflow-hidden rounded-full bg-dark-secondary">
          <Animated.View
            className="h-full rounded-full"
            style={{
              backgroundColor: '#EF4444',
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>

        {/* Timer Bar - prominent, shrinking */}
        <View className="mx-4 mt-3 h-3 overflow-hidden rounded-full bg-dark-secondary">
          <Animated.View
            className="h-full rounded-full"
            style={{
              backgroundColor: timerBarColor,
              width: timerBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>

        <View className="mx-4 mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-gray-400">
            Câu {currentIndex + 1}/{questions.length}
          </Text>
          <Animated.View
            className="flex-row items-center"
            style={{ transform: [{ scale: pulseAnim }] }}
          >
            <Ionicons
              name="timer-outline"
              size={16}
              color={timeLeft <= 2 ? '#EF4444' : '#F59E0B'}
            />
            <Text
              className={`ml-1 text-sm font-bold ${
                timeLeft <= 2 ? 'text-red-400' : 'text-amber-400'
              }`}
            >
              {timeLeft}s
            </Text>
          </Animated.View>
        </View>

        {/* Question */}
        <Animated.View
          className="mx-4 mt-4"
          style={{ transform: [{ translateX: shakeAnim }] }}
        >
          <View className="items-center rounded-2xl bg-dark-card p-6">
            {currentQuestion?.word.article && (
              <Text className="mb-1 text-sm text-gray-400">{currentQuestion.word.article}</Text>
            )}
            <Text className="text-3xl font-bold text-white">{currentQuestion?.word.word}</Text>
            {currentQuestion?.word.pronunciation && (
              <Text className="mt-2 text-sm text-gray-500">
                [{currentQuestion.word.pronunciation}]
              </Text>
            )}
            <View className="mt-3 flex-row items-center rounded-lg bg-red-500/10 px-3 py-1">
              <Ionicons name="flash" size={12} color="#EF4444" />
              <Text className="ml-1 text-xs font-bold text-red-400">SPEED ROUND</Text>
            </View>
          </View>
        </Animated.View>

        {/* Answer Options */}
        <View className="mx-4 mt-5" style={{ gap: 8 }}>
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            const showResult = selectedAnswer !== null;

            let bgStyle = '#111827';
            let borderColor = 'transparent';
            let textColor = '#FFFFFF';

            if (showResult) {
              if (isCorrectOption) {
                bgStyle = 'rgba(16, 185, 129, 0.1)';
                borderColor = '#10B981';
                textColor = '#34D399';
              } else if (isSelected && !isCorrectOption) {
                bgStyle = 'rgba(239, 68, 68, 0.1)';
                borderColor = '#EF4444';
                textColor = '#F87171';
              } else {
                textColor = '#6B7280';
              }
            }

            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <TouchableOpacity
                key={`${currentIndex}-${index}`}
                activeOpacity={0.7}
                disabled={selectedAnswer !== null}
                onPress={() => handleAnswer(option)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 12,
                  padding: 14,
                  backgroundColor: bgStyle,
                  borderWidth: showResult && (isCorrectOption || isSelected) ? 1 : 0,
                  borderColor,
                }}
              >
                <View
                  style={{
                    marginRight: 12,
                    height: 32,
                    width: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: showResult && isCorrectOption
                      ? 'rgba(16, 185, 129, 0.2)'
                      : showResult && isSelected
                        ? 'rgba(239, 68, 68, 0.2)'
                        : '#1F2937',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: showResult && isCorrectOption
                        ? '#34D399'
                        : showResult && isSelected
                          ? '#F87171'
                          : '#9CA3AF',
                    }}
                  >
                    {optionLetters[index]}
                  </Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: textColor }}>
                  {option}
                </Text>
                {showResult && isCorrectOption && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
                {showResult && isSelected && !isCorrectOption && (
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
