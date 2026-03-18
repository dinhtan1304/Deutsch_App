import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRandomWords } from '@/hooks/useWords';
import { useGameSession } from '@/hooks/useGameSession';
import { Difficulty, Word, GenderInfo, Gender } from '@/types';
import * as Haptics from 'expo-haptics';

type Phase = 'playing' | 'result';

const GENDER_BUTTONS: { gender: Gender; article: string; color: string; bgColor: string }[] = [
  { gender: 'masculine', article: 'der', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  { gender: 'feminine', article: 'die', color: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.15)' },
  { gender: 'neuter', article: 'das', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
];

export default function GenderQuizScreen() {
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

  const { data: words, isLoading, refetch } = useRandomWords(totalQuestions, {
    category: category || undefined,
    levels: difficultyLevels[difficulty] || ['A1', 'A2'],
  });

  const session = useGameSession('gender-quiz', difficulty as Difficulty);

  const [phase, setPhase] = useState<Phase>('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const questions = useMemo(() => words ?? [], [words]);
  const currentWord: Word | null = questions[currentIndex] ?? null;

  // Start session
  useEffect(() => {
    if (questions.length > 0 && !sessionStarted) {
      session.start(questions.length);
      setSessionStarted(true);
    }
  }, [questions.length, sessionStarted]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: questions.length > 0 ? currentIndex / questions.length : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, questions.length]);

  const handleAnswer = useCallback(
    (gender: Gender) => {
      if (selectedGender !== null || !currentWord) return;

      const correct = gender === currentWord.gender;
      setSelectedGender(gender);
      setIsCorrect(correct);

      if (correct) {
        const points = 10 + streak * 3;
        setScore((s) => s + points);
        setCorrectCount((c) => c + 1);
        setStreak((s) => {
          const newStreak = s + 1;
          setBestStreak((b) => Math.max(b, newStreak));
          return newStreak;
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        // Pop animation
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      } else {
        setWrongCount((w) => w + 1);
        setStreak(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }

      // Show feedback
      feedbackOpacity.setValue(1);
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }).start();

      setTimeout(goNext, 1200);
    },
    [selectedGender, currentWord, streak, currentIndex, questions.length],
  );

  const goNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedGender(null);
      setIsCorrect(null);
    }
  }, [currentIndex, questions.length]);

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
    setSelectedGender(null);
    setIsCorrect(null);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    refetch();
  };

  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="mt-4 text-gray-400">Đang tải câu hỏi...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy =
      questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <SafeAreaView className="flex-1 bg-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
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
            <Text className="mt-1 text-white/70">Gender Quiz hoàn thành</Text>
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
                colors={['#6366F1', '#4F46E5']}
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
  const correctGenderInfo = currentWord
    ? GenderInfo[currentWord.gender as keyof typeof GenderInfo]
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

        <View className="flex-row items-center">
          <Ionicons name="flame" size={18} color="#F59E0B" />
          <Text className="ml-1 text-sm font-bold text-amber-400">{streak}</Text>
        </View>

        <View className="flex-row items-center rounded-lg bg-dark-card px-3 py-1.5">
          <Ionicons name="star" size={16} color="#6366F1" />
          <Text className="ml-1 text-sm font-bold text-white">{score}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mx-4 mt-1 h-2 overflow-hidden rounded-full bg-dark-secondary">
        <Animated.View
          className="h-full rounded-full"
          style={{
            backgroundColor: '#6366F1',
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
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Text className="text-xs text-emerald-400">{correctCount} đúng</Text>
          <Text className="text-xs text-red-400">{wrongCount} sai</Text>
        </View>
      </View>

      {/* Question Card */}
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
          <View className="items-center rounded-2xl bg-dark-card p-8">
            <Text className="mb-2 text-sm text-gray-400">Danh từ này thuộc giống nào?</Text>
            <Text className="text-4xl font-bold text-white">{currentWord?.word}</Text>
            {currentWord?.pronunciation && (
              <Text className="mt-2 text-sm text-gray-500">[{currentWord.pronunciation}]</Text>
            )}

            {/* Translation hint (shows after answer) */}
            {selectedGender !== null && (
              <View className="mt-4 items-center">
                <View
                  className="rounded-full px-4 py-1.5"
                  style={{ backgroundColor: correctGenderInfo?.bgColor }}
                >
                  <Text
                    style={{ color: correctGenderInfo?.color }}
                    className="text-sm font-bold"
                  >
                    {correctGenderInfo?.article} {currentWord?.word}
                  </Text>
                </View>
                <Text className="mt-2 text-sm text-gray-400">
                  {currentWord?.translationVi || currentWord?.translationEn}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Feedback overlay */}
        <Animated.View
          className="absolute items-center"
          style={{ opacity: feedbackOpacity }}
          pointerEvents="none"
        >
          {isCorrect !== null && (
            <View
              className="rounded-full p-4"
              style={{
                backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={48}
                color={isCorrect ? '#10B981' : '#EF4444'}
              />
            </View>
          )}
        </Animated.View>
      </View>

      {/* Gender Buttons */}
      <View className="px-6 pb-8" style={{ gap: 12 }}>
        <View className="flex-row" style={{ gap: 12 }}>
          {GENDER_BUTTONS.map((btn) => {
            const isSelected = selectedGender === btn.gender;
            const isCorrectAnswer = currentWord?.gender === btn.gender;
            const showResult = selectedGender !== null;

            let borderColor = 'transparent';
            let bgOpacity = 0.15;

            if (showResult) {
              if (isCorrectAnswer) {
                borderColor = btn.color;
                bgOpacity = 0.25;
              } else if (isSelected && !isCorrectAnswer) {
                borderColor = '#EF4444';
                bgOpacity = 0.1;
              } else {
                bgOpacity = 0.05;
              }
            }

            return (
              <TouchableOpacity
                key={btn.gender}
                activeOpacity={0.7}
                disabled={selectedGender !== null}
                onPress={() => handleAnswer(btn.gender)}
                className="flex-1 items-center rounded-2xl py-5"
                style={{
                  backgroundColor:
                    showResult && isSelected && !isCorrectAnswer
                      ? 'rgba(239, 68, 68, 0.1)'
                      : btn.bgColor.replace(
                          /[\d.]+\)$/,
                          `${bgOpacity})`,
                        ),
                  borderWidth: showResult ? 2 : 0,
                  borderColor,
                }}
              >
                <Text
                  className="text-3xl font-bold"
                  style={{
                    color:
                      showResult && isSelected && !isCorrectAnswer
                        ? '#EF4444'
                        : showResult && !isCorrectAnswer && !isSelected
                          ? '#6B7280'
                          : btn.color,
                  }}
                >
                  {btn.article}
                </Text>
                <Text
                  className="mt-1 text-xs font-medium"
                  style={{
                    color:
                      showResult && !isCorrectAnswer
                        ? '#6B7280'
                        : btn.color,
                  }}
                >
                  {btn.gender === 'masculine'
                    ? 'Maskulin'
                    : btn.gender === 'feminine'
                      ? 'Feminin'
                      : 'Neutrum'}
                </Text>
                {showResult && isCorrectAnswer && (
                  <View className="mt-2">
                    <Ionicons name="checkmark-circle" size={18} color={btn.color} />
                  </View>
                )}
                {showResult && isSelected && !isCorrectAnswer && (
                  <View className="mt-2">
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
