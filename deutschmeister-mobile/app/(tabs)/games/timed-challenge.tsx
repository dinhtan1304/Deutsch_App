import { View, Text, TouchableOpacity, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
    Math.max(totalQuestions, 20),
    {
      category: category || undefined,
      levels: difficultyLevels[difficulty] || ['A1', 'A2'],
      nounsOnly: true,
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

      // XP + Best Score
      const finalAccuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const totalXP = calculateGameXP(correctCount, bestStreak, finalAccuracy);
      setSessionXP(totalXP);
      const { leveledUp: didLevelUp } = addXP(totalXP);
      setLeveledUp(didLevelUp);
      const newBest = updateBestScore('timed-challenge', score);
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
    setTimeLeft(TIME_PER_QUESTION);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    setSessionXP(0);
    setXpToastAmount(0);
    setXpToastKey(0);
    setIsNewBest(false);
    setLeveledUp(false);
    timerBarAnim.setValue(1);
    refetch();
  };

  const bgColor = bgFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(142, 173, 146, 0)', 'rgba(142, 173, 146, 0.12)'],
  });

  const timerBarColor = timerBarAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [colors.pastel.rose.base, colors.pastel.rose.base, colors.pastel.peach.base, colors.pastel.lime.base],
  });

  // Loading state
  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pastel.lime.base} />
        <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultContainer}>
          {/* Result Hero */}
          <View style={styles.resultHero}>
            <View style={styles.resultIconCircle}>
              <Ionicons
                name={accuracy >= 70 ? 'trophy' : accuracy >= 40 ? 'thumbs-up' : 'refresh'}
                size={32}
                color={colors.pastel.lime.on}
              />
            </View>
            <Text style={styles.resultTitle}>
              {accuracy >= 70 ? 'Tốc độ tuyệt vời!' : accuracy >= 40 ? 'Khá nhanh!' : 'Cần luyện thêm!'}
            </Text>
            <Text style={styles.resultSubtitle}>Time Challenge hoàn thành</Text>
          </View>

          {/* Top Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValueWhite}>{score}</Text>
              <Text style={styles.statLabel}>Điểm</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValueLime}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Chính xác</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValuePeach}>{bestStreak}</Text>
              <Text style={styles.statLabel}>Chuỗi</Text>
            </View>
          </View>

          {/* Correct/Wrong Row */}
          <View style={styles.statsRowSmall}>
            <View style={styles.statCard}>
              <Text style={styles.statValueMint}>{correctCount}</Text>
              <Text style={styles.statLabel}>Đúng</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValueRose}>{wrongCount}</Text>
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

          {/* Action Buttons */}
          <View style={styles.resultActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePlayAgain}
              style={styles.ctaButton}
            >
              <Ionicons name="refresh" size={20} color={colors.pastel.lime.on} />
              <Text style={styles.ctaButtonText}>Chơi lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Quay về</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Playing state
  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.playingContainer, { backgroundColor: bgColor }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={18} color={colors.pastel.peach.base} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ComboBadge streak={streak} />
            <View style={styles.scoreChip}>
              <Ionicons name="star" size={16} color={colors.pastel.lime.base} />
              <Text style={styles.scoreChipText}>{score}</Text>
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
                backgroundColor: colors.pastel.lime.base,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Timer Bar - prominent, shrinking */}
        <View style={styles.timerBarTrack}>
          <Animated.View
            style={[
              styles.timerBarFill,
              {
                backgroundColor: timerBarColor,
                width: timerBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.questionMeta}>
          <Text style={styles.questionCounter}>
            Câu {currentIndex + 1}/{questions.length}
          </Text>
          <Animated.View
            style={[styles.timerDisplay, { transform: [{ scale: pulseAnim }] }]}
          >
            <Ionicons
              name="timer-outline"
              size={16}
              color={timeLeft <= 2 ? colors.pastel.rose.base : colors.pastel.lime.base}
            />
            <Text
              style={[
                styles.timerText,
                { color: timeLeft <= 2 ? colors.pastel.rose.base : colors.pastel.lime.base },
              ]}
            >
              {timeLeft}s
            </Text>
          </Animated.View>
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
            <View style={styles.speedBadge}>
              <Ionicons name="flash" size={12} color={colors.pastel.lime.base} />
              <Text style={styles.speedBadgeText}>SPEED ROUND</Text>
            </View>
          </View>
        </Animated.View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            const showResult = selectedAnswer !== null;

            let optionBg = colors.bg.b2;
            let borderClr = colors.border.default;
            let textClr = colors.text.primary;
            let borderW = 1;

            if (showResult) {
              if (isCorrectOption) {
                optionBg = colors.pastel.mint.dim;
                borderClr = colors.pastel.mint.base + '4D'; // 30%
                textClr = colors.pastel.mint.base;
                borderW = 1.5;
              } else if (isSelected && !isCorrectOption) {
                optionBg = colors.pastel.rose.dim;
                borderClr = colors.pastel.rose.base + '40'; // 25%
                textClr = colors.pastel.rose.base;
                borderW = 1.5;
              } else {
                textClr = colors.text.tertiary;
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
                  styles.optionButton,
                  {
                    backgroundColor: optionBg,
                    borderWidth: borderW,
                    borderColor: borderClr,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionLetter,
                    {
                      backgroundColor: showResult && isCorrectOption
                        ? colors.pastel.mint.dim
                        : showResult && isSelected
                          ? colors.pastel.rose.dim
                          : colors.bg.b3,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetterText,
                      {
                        color: showResult && isCorrectOption
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
                <Text style={[styles.optionText, { color: textClr }]}>
                  {option}
                </Text>
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
  /* ── Loading ──────────────────────────── */
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

  /* ── Shared ───────────────────────────── */
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },

  /* ── Result Screen ────────────────────── */
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + 4, // ~24
  },
  resultHero: {
    backgroundColor: colors.pastel.lime.base,
    borderRadius: radius['2xl'],
    padding: spacing['3xl'] - 4, // ~32
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
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  resultTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.lime.on,
  },
  resultSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.lime.on + 'B3', // 70%
  },

  /* ── Stat Cards ───────────────────────── */
  statsRow: {
    marginTop: spacing.xl + 4,
    width: '100%',
    flexDirection: 'row',
    gap: spacing.md,
  },
  statsRowSmall: {
    marginTop: spacing.lg,
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
  statValueWhite: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  statValueLime: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.base,
  },
  statValuePeach: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  statValueMint: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.mint.base,
  },
  statValueRose: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.rose.base,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  /* ── Result Actions ───────────────────── */
  resultActions: {
    marginTop: spacing['2xl'] + 4, // ~32
    width: '100%',
    gap: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.pastel.lime.base,
    borderRadius: radius.stone,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ctaButtonText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.on,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.lg,
  },
  backButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.secondary,
  },

  /* ── Playing Screen ───────────────────── */
  playingContainer: {
    flex: 1,
  },

  /* ── Top Bar ──────────────────────────── */
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
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  streakContainer: {
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
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  scoreChipText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },

  /* ── Progress & Timer Bars ────────────── */
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
  timerBarTrack: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    height: 12,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
  },
  timerBarFill: {
    height: '100%',
    borderRadius: radius.pill,
  },

  /* ── Question Meta ────────────────────── */
  questionMeta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionCounter: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },

  /* ── Question Card ────────────────────── */
  questionWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  questionCard: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.xl + 4,
    paddingHorizontal: spacing.xl,
  },
  articleText: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  wordText: {
    fontSize: 28,
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
  speedBadge: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.pastel.lime.dim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  speedBadgeText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.base,
  },

  /* ── Answer Options ───────────────────── */
  optionsContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: 14,
  },
  optionLetter: {
    marginRight: spacing.md,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  optionLetterText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
});
