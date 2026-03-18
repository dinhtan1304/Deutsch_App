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
    // Pick 3 random wrong answers from other words
    const otherWords = words.filter((_, i) => i !== idx);
    const shuffledOthers = shuffleArray(otherWords).slice(0, 3);
    const wrongAnswers = shuffledOthers.map((w) => w.translationVi || w.translationEn);
    const options = shuffleArray([correctAnswer, ...wrongAnswers]);
    return { word, options, correctAnswer };
  });
}

export default function QuickQuizScreen() {
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
    Math.max(totalQuestions, 20), // fetch extra for wrong-answer pool
    {
      category: category || undefined,
      levels: difficultyLevels[difficulty] || ['A1', 'A2'],
    },
  );

  const session = useGameSession('quick-quiz', difficulty as Difficulty);

  const [phase, setPhase] = useState<Phase>('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Animations
  const bgFlash = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Build questions from words
  const questions = useMemo(() => {
    if (!words || words.length < 4) return [];
    return buildQuestions(words.slice(0, totalQuestions));
  }, [words, totalQuestions]);

  const currentQuestion = questions[currentIndex] ?? null;

  // goNext — advance to next question or finish
  const goNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimeLeft(15);
    }
  }, [currentIndex, questions.length]);

  // Keep a ref so callbacks scheduled via setTimeout always call the latest version
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  const triggerCorrectAnimation = useCallback(() => {
    bgFlash.setValue(0);
    Animated.sequence([
      Animated.timing(bgFlash, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(bgFlash, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();
  }, [bgFlash]);

  const triggerWrongAnimation = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
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
      // Time up = wrong answer
      setSelectedAnswer('__timeout__');
      setIsCorrect(false);
      setWrongCount((w) => w + 1);
      setStreak(0);
      triggerWrongAnimation();
      setTimeout(() => goNextRef.current(), 1200);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, phase, selectedAnswer, currentQuestion, triggerWrongAnimation]);

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
        const points = 10 + streak * 2 + Math.max(0, timeLeft);
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

      setTimeout(() => goNextRef.current(), 1200);
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
    setTimeLeft(15);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    refetch();
  };

  const bgColor = bgFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.15)'],
  });

  // Loading state
  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#8B5CF6" />
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
            colors={['#8B5CF6', '#7C3AED']}
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
            <Text className="mt-1 text-white/70">Quick Quiz hoàn thành</Text>
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
                colors={['#8B5CF6', '#7C3AED']}
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
            <Ionicons name="star" size={16} color="#8B5CF6" />
            <Text className="ml-1 text-sm font-bold text-white">{score}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mx-4 mt-1 h-2 overflow-hidden rounded-full bg-dark-secondary">
          <Animated.View
            className="h-full rounded-full bg-primary-500"
            style={{
              width: progressAnim.interpolate({
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
          <View className="flex-row items-center">
            <Ionicons
              name="timer-outline"
              size={14}
              color={timeLeft <= 5 ? '#EF4444' : '#9CA3AF'}
            />
            <Text
              className={`ml-1 text-xs font-bold ${
                timeLeft <= 5 ? 'text-red-400' : 'text-gray-400'
              }`}
            >
              {timeLeft}s
            </Text>
          </View>
        </View>

        {/* Question */}
        <Animated.View
          className="mx-4 mt-6"
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
            <View className="mt-3 rounded-lg bg-dark-secondary px-3 py-1">
              <Text className="text-xs text-gray-400">{currentQuestion?.word.category}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Answer Options */}
        <View className="mx-4 mt-6" style={{ gap: 10 }}>
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            const showResult = selectedAnswer !== null;

            let bgClass = 'bg-dark-card';
            let borderClass = '';
            let textClass = 'text-white';

            if (showResult) {
              if (isCorrectOption) {
                bgClass = 'bg-emerald-500/10';
                borderClass = 'border border-emerald-500';
                textClass = 'text-emerald-400';
              } else if (isSelected && !isCorrectOption) {
                bgClass = 'bg-red-500/10';
                borderClass = 'border border-red-500';
                textClass = 'text-red-400';
              } else {
                bgClass = 'bg-dark-card';
                textClass = 'text-gray-500';
              }
            }

            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <TouchableOpacity
                key={`${currentIndex}-${index}`}
                activeOpacity={0.7}
                disabled={selectedAnswer !== null}
                onPress={() => handleAnswer(option)}
                className={`flex-row items-center rounded-xl p-4 ${bgClass} ${borderClass}`}
              >
                <View
                  className={`mr-3 h-8 w-8 items-center justify-center rounded-lg ${
                    showResult && isCorrectOption
                      ? 'bg-emerald-500/20'
                      : showResult && isSelected
                        ? 'bg-red-500/20'
                        : 'bg-dark-secondary'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      showResult && isCorrectOption
                        ? 'text-emerald-400'
                        : showResult && isSelected
                          ? 'text-red-400'
                          : 'text-gray-400'
                    }`}
                  >
                    {optionLetters[index]}
                  </Text>
                </View>
                <Text className={`flex-1 text-sm font-medium ${textClass}`}>{option}</Text>
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
