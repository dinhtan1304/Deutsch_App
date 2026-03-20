import { View, Text, TouchableOpacity, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRandomWords } from '@/hooks/useWords';
import { useGameSession } from '@/hooks/useGameSession';
import { Difficulty, Word } from '@/types';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography } from '@/theme';
import { useXPStore, calculateGameXP } from '@/stores/xpStore';
import { XPToast } from '@/components/ui/XPToast';
import { XPSummary } from '@/components/ui/XPSummary';
import { ComboBadge } from '@/components/ui/ComboBadge';
import { useThemeStore } from '@/stores/themeStore';

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
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  // XP state
  const [xpToastAmount, setXpToastAmount] = useState(0);
  const [xpToastKey, setXpToastKey] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);

  const addXP = useXPStore((s) => s.addXP);
  const updateBestScore = useXPStore((s) => s.updateBestScore);
  const xpLevel = useXPStore((s) => s.level);
  const xpInCurrentLevel = useXPStore((s) => s.xpInCurrentLevel);
  const xpNeededForLevel = useXPStore((s) => s.xpNeededForLevel);

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

        // XP toast
        const xpGain = 10 + (streak >= 10 ? 40 : streak >= 5 ? 20 : streak >= 3 ? 10 : 0);
        setXpToastAmount(xpGain);
        setXpToastKey((k) => k + 1);
        setSessionXP((x) => x + xpGain);
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

      // XP + Best Score
      const finalAccuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const totalXP = calculateGameXP(correctCount, bestStreak, finalAccuracy);
      setSessionXP(totalXP);
      const { leveledUp: didLevelUp } = addXP(totalXP);
      setLeveledUp(didLevelUp);
      const newBest = updateBestScore('quick-quiz', score);
      setIsNewBest(newBest);
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
    setSessionXP(0);
    setXpToastAmount(0);
    setXpToastKey(0);
    setIsNewBest(false);
    setLeveledUp(false);
    refetch();
  };

  const bgColor = bgFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.15)'],
  });

  // Loading state
  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
        <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultCenter}>
          <LinearGradient
            colors={colors.gradient.quiz}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultGradient}
          >
            <View style={styles.resultIconCircle}>
              <Ionicons
                name={accuracy >= 70 ? 'trophy' : accuracy >= 40 ? 'thumbs-up' : 'refresh'}
                size={32}
                color={colors.text.primary}
              />
            </View>
            <Text style={styles.resultTitle}>
              {accuracy >= 70 ? 'Xuất sắc!' : accuracy >= 40 ? 'Khá tốt!' : 'Cần luyện thêm!'}
            </Text>
            <Text style={styles.resultSubtitle}>Quick Quiz hoàn thành</Text>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValuePrimary}>{score}</Text>
              <Text style={styles.statLabel}>Điểm</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValuePrimary, { color: colors.pastel.mint.base }]}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Chính xác</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValuePrimary, { color: colors.pastel.peach.base }]}>{bestStreak}</Text>
              <Text style={styles.statLabel}>Chuỗi</Text>
            </View>
          </View>

          <View style={styles.statsRow2}>
            <View style={styles.statCard}>
              <Text style={[styles.statValueSecondary, { color: colors.pastel.mint.base }]}>{correctCount}</Text>
              <Text style={styles.statLabel}>Đúng</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValueSecondary, { color: colors.pastel.rose.base }]}>{wrongCount}</Text>
              <Text style={styles.statLabel}>Sai</Text>
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

          <View style={styles.resultActions}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAgain}>
              <LinearGradient
                colors={colors.gradient.quiz}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playAgainGradient}
              >
                <Ionicons name="refresh" size={20} color={colors.text.primary} />
                <Text style={styles.playAgainText}>Chơi lại</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backToMenuBtn}
            >
              <Text style={styles.backToMenuText}>Quay về</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Playing state
  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.flex1, { backgroundColor: bgColor }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.streakRow}>
            <Ionicons name="flame" size={18} color={colors.pastel.peach.base} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ComboBadge streak={streak} />
            <View style={styles.scoreBadge}>
              <Ionicons name="star" size={16} color={colors.pastel.lavender.base} />
              <Text style={styles.scoreText}>{score}</Text>
              <XPToast amount={xpToastAmount} triggerKey={xpToastKey} />
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.pastel.lavender.base,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>
            Câu {currentIndex + 1}/{questions.length}
          </Text>
          <View style={styles.timerRow}>
            <Ionicons
              name="timer-outline"
              size={14}
              color={timeLeft <= 5 ? colors.pastel.rose.base : colors.text.secondary}
            />
            <Text
              style={[
                styles.timerText,
                { color: timeLeft <= 5 ? colors.pastel.rose.base : colors.text.secondary },
              ]}
            >
              {timeLeft}s
            </Text>
          </View>
        </View>

        {/* Question */}
        <Animated.View
          style={[styles.questionWrapper, { transform: [{ translateX: shakeAnim }] }]}
        >
          <View style={styles.questionCard}>
            {currentQuestion?.word.article && (
              <Text style={styles.articleText}>{currentQuestion.word.article}</Text>
            )}
            <Text style={styles.wordText}>{currentQuestion?.word.word}</Text>
            {currentQuestion?.word.pronunciation && (
              <Text style={styles.pronunciationText}>
                [{currentQuestion.word.pronunciation}]
              </Text>
            )}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{currentQuestion?.word.category}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            const showResult = selectedAnswer !== null;

            let bgStyle = colors.bg.b2;
            let borderColor = 'transparent';
            let borderW = 0;
            let textColor = colors.text.primary;

            if (showResult) {
              if (isCorrectOption) {
                bgStyle = colors.pastel.mint.dim;
                borderColor = colors.pastel.mint.base;
                borderW = 1;
                textColor = colors.pastel.mint.base;
              } else if (isSelected && !isCorrectOption) {
                bgStyle = colors.pastel.rose.dim;
                borderColor = colors.pastel.rose.base;
                borderW = 1;
                textColor = colors.pastel.rose.base;
              } else {
                bgStyle = colors.bg.b2;
                textColor = colors.text.tertiary;
              }
            }

            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <TouchableOpacity
                key={`${currentIndex}-${index}`}
                activeOpacity={0.7}
                disabled={selectedAnswer !== null}
                onPress={() => handleAnswer(option)}
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: bgStyle,
                    borderWidth: borderW,
                    borderColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionLetterBox,
                    {
                      backgroundColor:
                        showResult && isCorrectOption
                          ? colors.pastel.mint.dim
                          : showResult && isSelected
                            ? colors.pastel.rose.dim
                            : colors.bg.b3,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetter,
                      {
                        color:
                          showResult && isCorrectOption
                            ? colors.pastel.mint.base
                            : showResult && isSelected
                              ? colors.pastel.rose.base
                              : colors.text.secondary,
                      },
                    ]}
                  >
                    {optionLetters[index]}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                {showResult && isCorrectOption && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.pastel.mint.base} />
                )}
                {showResult && isSelected && !isCorrectOption && (
                  <Ionicons name="close-circle" size={20} color={colors.pastel.rose.base} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  flex1: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.b0,
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
  },
  resultCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  resultGradient: {
    borderRadius: radius['2xl'],
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  resultIconCircle: {
    marginBottom: spacing.lg,
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  resultTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  resultSubtitle: {
    marginTop: spacing.xs,
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.fontSize.base,
  },
  statsRow: {
    marginTop: spacing['2xl'],
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  statsRow2: {
    marginTop: spacing.lg,
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statValuePrimary: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  statValueSecondary: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  resultActions: {
    marginTop: spacing['3xl'],
    width: '100%',
    gap: 12,
  },
  playAgainGradient: {
    borderRadius: radius.stone,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playAgainText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  backToMenuBtn: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  backToMenuText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.secondary,
  },
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
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  scoreText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
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
  },
  progressInfo: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  questionWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
  },
  questionCard: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  articleText: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  wordText: {
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  pronunciationText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  categoryBadge: {
    marginTop: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  optionsContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  optionLetterBox: {
    marginRight: spacing.md,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  optionLetter: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
});
