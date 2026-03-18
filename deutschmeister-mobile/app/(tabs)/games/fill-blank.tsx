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

interface BlankQuestion {
  word: Word;
  sentence: string;
  answer: string;
}

function buildQuestions(words: Word[]): BlankQuestion[] {
  return words.map((word) => {
    const translation = word.translationVi || word.translationEn;
    // Use an example sentence if available, otherwise build one
    let sentence: string;
    if (word.examples && word.examples.length > 0) {
      // Replace the word in the example with blanks
      const example = word.examples[0];
      // Try to replace the exact word (case-insensitive)
      const regex = new RegExp(`\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(example)) {
        sentence = example.replace(regex, '___');
      } else {
        sentence = `${example}\n\nTừ cần điền: ___ (${translation})`;
      }
    } else {
      sentence = `${word.article ? word.article + ' ' : ''}___ = ${translation}`;
    }
    return {
      word,
      sentence,
      answer: word.word,
    };
  });
}

export default function FillBlankScreen() {
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

  const session = useGameSession('fill-blank', difficulty as Difficulty);

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
  const [hintUsed, setHintUsed] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0)).current;

  const inputRef = useRef<TextInput>(null);

  const questions = useMemo(() => {
    if (!words || words.length === 0) return [];
    return buildQuestions(words.slice(0, totalQuestions));
  }, [words, totalQuestions]);

  const currentQuestion = questions[currentIndex] ?? null;

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

  // Auto-focus input on new question
  useEffect(() => {
    if (phase === 'playing' && !checked) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentIndex, phase, checked]);

  const handleCheck = useCallback(() => {
    if (checked || !currentQuestion || userInput.trim() === '') return;

    Keyboard.dismiss();
    const correct = userInput.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
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
  }, [checked, currentQuestion, userInput, streak, hintUsed, shakeAnim, feedbackScale]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setUserInput('');
      setChecked(false);
      setIsCorrect(null);
      setHintUsed(false);
      feedbackScale.setValue(0);
    }
  }, [currentIndex, questions.length, feedbackScale]);

  const handleHint = useCallback(() => {
    if (!currentQuestion || hintUsed || checked) return;
    setHintUsed(true);
    const firstLetter = currentQuestion.answer.charAt(0);
    setUserInput(firstLetter);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [currentQuestion, hintUsed, checked]);

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
    setSessionStarted(false);
    sessionEndedRef.current = false;
    feedbackScale.setValue(0);
    refetch();
  };

  // Loading state
  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#F59E0B" />
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
            colors={['#F59E0B', '#D97706']}
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
            <Text className="mt-1 text-white/70">Fill in Blank hoàn thành</Text>
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
                colors={['#F59E0B', '#D97706']}
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
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text className="ml-1 text-sm font-bold text-white">{score}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mx-4 mt-1 h-2 overflow-hidden rounded-full bg-dark-secondary">
        <Animated.View
          className="h-full rounded-full"
          style={{
            backgroundColor: '#F59E0B',
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

      {/* Sentence Card */}
      <Animated.View
        className="mx-4 mt-6"
        style={{ transform: [{ translateX: shakeAnim }] }}
      >
        <View className="rounded-2xl bg-dark-card p-6">
          <Text className="mb-2 text-center text-sm text-gray-400">Điền từ còn thiếu</Text>
          <Text className="text-center text-lg leading-7 text-white">
            {currentQuestion?.sentence}
          </Text>
          {currentQuestion?.word.category && (
            <View className="mt-3 items-center">
              <View className="rounded-lg bg-dark-secondary px-3 py-1">
                <Text className="text-xs text-gray-400">{currentQuestion.word.category}</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Input + Hint */}
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
                hintUsed ? 'bg-dark-secondary' : 'bg-amber-500/15'
              }`}
            >
              <Ionicons
                name="bulb-outline"
                size={22}
                color={hintUsed ? '#6B7280' : '#F59E0B'}
              />
            </TouchableOpacity>
          )}
        </View>

        {hintUsed && !checked && (
          <Text className="mt-2 text-xs text-amber-400">
            Gợi ý: Bắt đầu bằng "{currentQuestion?.answer.charAt(0)}" ({currentQuestion?.answer.length} ký tự)
          </Text>
        )}
      </View>

      {/* Feedback */}
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
            {!isCorrect && (
              <Text className="mt-2 text-sm text-gray-300">
                Đáp án đúng: <Text className="font-bold text-emerald-400">{currentQuestion?.answer}</Text>
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
              colors={userInput.trim() === '' ? ['#374151', '#374151'] : ['#F59E0B', '#D97706']}
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
              colors={['#F59E0B', '#D97706']}
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
                {currentIndex + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
