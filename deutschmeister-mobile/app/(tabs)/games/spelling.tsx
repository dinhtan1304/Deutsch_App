import { View, Text, TouchableOpacity, Animated, ActivityIndicator, TextInput, Keyboard } from 'react-native';
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

export default function SpellingScreen() {
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

  const session = useGameSession('spelling', difficulty as Difficulty);

  const [phase, setPhase] = useState<Phase>('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;

  const inputRef = useRef<TextInput>(null);

  const questionWords = useMemo(() => words ?? [], [words]);
  const currentWord: Word | null = questionWords[currentIndex] ?? null;

  // Start session
  useEffect(() => {
    if (questionWords.length > 0 && !sessionStarted) {
      session.start(questionWords.length);
      setSessionStarted(true);
    }
  }, [questionWords.length, sessionStarted]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: questionWords.length > 0 ? currentIndex / questionWords.length : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, questionWords.length]);

  // Auto-focus input on new question
  useEffect(() => {
    if (phase === 'playing' && !checked) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentIndex, phase, checked]);

  const handleHint = useCallback(() => {
    if (!currentWord || hintUsed || checked) return;
    setHintUsed(true);
    setShowHint(true);

    // Show word briefly then hide
    hintOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHint(false));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [currentWord, hintUsed, checked, hintOpacity]);

  const handleCheck = useCallback(() => {
    if (checked || !currentWord || userInput.trim() === '') return;

    Keyboard.dismiss();
    const correct = userInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    setChecked(true);
    setIsCorrect(correct);

    // Animate feedback
    feedbackScale.setValue(0);
    Animated.spring(feedbackScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    if (correct) {
      const hintPenalty = hintUsed ? 5 : 0;
      const points = Math.max(5, 15 + streak * 3 - hintPenalty);
      setScore((s) => s + points);
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setWrongCount((w) => w + 1);
      setStreak(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      // Shake
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [checked, currentWord, userInput, streak, hintUsed, shakeAnim, feedbackScale]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questionWords.length) {
      setPhase('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setUserInput('');
      setChecked(false);
      setIsCorrect(null);
      setHintUsed(false);
      setShowHint(false);
      feedbackScale.setValue(0);
      hintOpacity.setValue(0);
    }
  }, [currentIndex, questionWords.length, feedbackScale, hintOpacity]);

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
    setUserInput('');
    setChecked(false);
    setIsCorrect(null);
    setHintUsed(false);
    setShowHint(false);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    feedbackScale.setValue(0);
    hintOpacity.setValue(0);
    refetch();
  };

  // Render letter-by-letter comparison
  const renderLetterComparison = () => {
    if (!checked || !currentWord) return null;
    const answer = currentWord.word;
    const input = userInput.trim();
    const maxLen = Math.max(answer.length, input.length);

    return (
      <View className="mt-3 flex-row flex-wrap justify-center" style={{ gap: 4 }}>
        {Array.from({ length: maxLen }).map((_, i) => {
          const answerChar = answer[i] || '';
          const inputChar = input[i] || '';
          const isMatch = answerChar.toLowerCase() === inputChar.toLowerCase();

          return (
            <View
              key={i}
              style={{
                width: 32,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                backgroundColor: isMatch
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                borderWidth: 1,
                borderColor: isMatch ? '#10B981' : '#EF4444',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isMatch ? '#10B981' : '#EF4444',
                }}
              >
                {inputChar || '_'}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Loading state
  if (isLoading || questionWords.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#EC4899" />
        <Text className="mt-4 text-gray-400">Đang tải câu hỏi...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy =
      questionWords.length > 0 ? Math.round((correctCount / questionWords.length) * 100) : 0;
    return (
      <SafeAreaView className="flex-1 bg-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <LinearGradient
            colors={['#EC4899', '#DB2777']}
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
            <Text className="mt-1 text-white/70">Spelling hoàn thành</Text>
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
                colors={['#EC4899', '#DB2777']}
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
          <Ionicons name="flame" size={18} color="#F59E0B" />
          <Text className="ml-1 text-sm font-bold text-amber-400">{streak}</Text>
        </View>

        <View className="flex-row items-center rounded-lg bg-dark-card px-3 py-1.5">
          <Ionicons name="star" size={16} color="#EC4899" />
          <Text className="ml-1 text-sm font-bold text-white">{score}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mx-4 mt-1 h-2 overflow-hidden rounded-full bg-dark-secondary">
        <Animated.View
          className="h-full rounded-full"
          style={{
            backgroundColor: '#EC4899',
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      <View className="mx-4 mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-gray-400">
          Câu {currentIndex + 1}/{questionWords.length}
        </Text>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Text className="text-xs text-emerald-400">{correctCount} đúng</Text>
          <Text className="text-xs text-red-400">{wrongCount} sai</Text>
        </View>
      </View>

      {/* Translation Card */}
      <Animated.View
        className="mx-4 mt-6"
        style={{ transform: [{ translateX: shakeAnim }] }}
      >
        <View className="items-center rounded-2xl bg-dark-card p-6">
          <Text className="mb-2 text-sm text-gray-400">Viết từ tiếng Đức</Text>
          <Text className="text-center text-2xl font-bold text-white">
            {currentWord?.translationVi || currentWord?.translationEn}
          </Text>
          {currentWord?.translationVi && currentWord?.translationEn && (
            <Text className="mt-1 text-center text-sm text-gray-500">
              ({currentWord.translationEn})
            </Text>
          )}
          {currentWord?.article && (
            <View className="mt-3 rounded-lg bg-dark-secondary px-3 py-1">
              <Text className="text-xs text-gray-400">Mạo từ: {currentWord.article}</Text>
            </View>
          )}

          {/* Hint: show word briefly */}
          {showHint && (
            <Animated.View className="mt-4" style={{ opacity: hintOpacity }}>
              <View className="rounded-lg bg-pink-500/10 px-4 py-2">
                <Text className="text-center text-lg font-bold text-pink-400">
                  {currentWord?.word}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* Input */}
      <View className="mx-4 mt-6">
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <TextInput
            ref={inputRef}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Nhập từ tiếng Đức..."
            placeholderTextColor="#6B7280"
            editable={!checked}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleCheck}
            returnKeyType="done"
            className="flex-1 rounded-xl bg-dark-card px-4 py-3.5 text-base text-white"
            style={{
              borderWidth: checked ? 2 : 1,
              borderColor: checked
                ? isCorrect
                  ? '#10B981'
                  : '#EF4444'
                : '#374151',
            }}
          />
          {!checked && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleHint}
              disabled={hintUsed}
              className={`h-12 w-12 items-center justify-center rounded-xl ${
                hintUsed ? 'bg-dark-secondary' : 'bg-pink-500/15'
              }`}
            >
              <Ionicons
                name="eye-outline"
                size={22}
                color={hintUsed ? '#6B7280' : '#EC4899'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Letter-by-letter feedback */}
      {checked && (
        <Animated.View
          className="mx-4 mt-4"
          style={{ transform: [{ scale: feedbackScale }] }}
        >
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderWidth: 1,
              borderColor: isCorrect ? '#10B981' : '#EF4444',
            }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={isCorrect ? '#10B981' : '#EF4444'}
              />
              <Text
                className={`ml-2 text-sm font-bold ${
                  isCorrect ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isCorrect ? 'Chính xác!' : 'Chưa đúng!'}
              </Text>
            </View>

            {/* Letter comparison */}
            {!isCorrect && renderLetterComparison()}

            {!isCorrect && (
              <Text className="mt-3 text-center text-sm text-gray-300">
                Đáp án: <Text className="font-bold text-emerald-400">{currentWord?.word}</Text>
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* Action Button */}
      <View className="mx-4 mt-6">
        {!checked ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={userInput.trim() === ''}
            onPress={handleCheck}
          >
            <LinearGradient
              colors={userInput.trim() === '' ? ['#374151', '#374151'] : ['#EC4899', '#DB2777']}
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
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text className="ml-2 text-base font-bold text-white">Kiểm tra</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.8} onPress={handleNext}>
            <LinearGradient
              colors={['#EC4899', '#DB2777']}
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
              <Text className="text-base font-bold text-white">
                {currentIndex + 1 >= questionWords.length ? 'Xem kết quả' : 'Câu tiếp theo'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
