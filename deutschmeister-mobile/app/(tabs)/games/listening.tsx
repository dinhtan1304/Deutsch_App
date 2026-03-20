import { View, Text, TouchableOpacity, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRandomWords } from '@/hooks/useWords';
import { useGameSession } from '@/hooks/useGameSession';
import { Difficulty, Word } from '@/types';
import { spacing, radius, typography } from '@/theme';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useXPStore, calculateGameXP } from '@/stores/xpStore';
import { XPToast } from '@/components/ui/XPToast';
import { XPSummary } from '@/components/ui/XPSummary';
import { ComboBadge } from '@/components/ui/ComboBadge';
import { useThemeStore } from '@/stores/themeStore';

type Phase = 'playing' | 'result';

interface ListeningQuestion {
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

function buildQuestions(words: Word[]): ListeningQuestion[] {
  return words.map((word, idx) => {
    const correctAnswer = word.word;
    const otherWords = words.filter((_, i) => i !== idx);
    const shuffledOthers = shuffleArray(otherWords).slice(0, 3);
    const wrongAnswers = shuffledOthers.map((w) => w.word);
    const options = shuffleArray([correctAnswer, ...wrongAnswers]);
    return { word, options, correctAnswer };
  });
}

export default function ListeningScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
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

  const session = useGameSession('listening', difficulty as Difficulty);

  const [phase, setPhase] = useState<Phase>('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playCount, setPlayCount] = useState(0);
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
  const speakerPulse = useRef(new Animated.Value(1)).current;

  const questions = useMemo(() => {
    if (!words || words.length < 4) return [];
    return buildQuestions(words.slice(0, totalQuestions));
  }, [words, totalQuestions]);

  const currentQuestion = questions[currentIndex] ?? null;

  const speakWord = useCallback(
    (rate: number = 0.8) => {
      if (!currentQuestion || isSpeaking) return;
      setIsSpeaking(true);
      setPlayCount((c) => c + 1);

      // Pulse animation while speaking
      Animated.loop(
        Animated.sequence([
          Animated.timing(speakerPulse, { toValue: 1.2, duration: 400, useNativeDriver: true }),
          Animated.timing(speakerPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ).start();

      const wordToSpeak = currentQuestion.word.article
        ? `${currentQuestion.word.article} ${currentQuestion.word.word}`
        : currentQuestion.word.word;

      Speech.speak(wordToSpeak, {
        language: 'de-DE',
        rate,
        onDone: () => {
          setIsSpeaking(false);
          speakerPulse.stopAnimation();
          speakerPulse.setValue(1);
        },
        onError: () => {
          setIsSpeaking(false);
          speakerPulse.stopAnimation();
          speakerPulse.setValue(1);
        },
      });
    },
    [currentQuestion, isSpeaking, speakerPulse],
  );

  // Auto-play word when question changes
  useEffect(() => {
    if (currentQuestion && phase === 'playing' && selectedAnswer === null) {
      const timeout = setTimeout(() => speakWord(), 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, phase]);

  const goNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setPlayCount(0);
    }
  }, [currentIndex, questions.length]);

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

      // Stop any ongoing speech
      Speech.stop();
      setIsSpeaking(false);
      speakerPulse.stopAnimation();
      speakerPulse.setValue(1);

      const correct = answer === currentQuestion.correctAnswer;
      setSelectedAnswer(answer);
      setIsCorrect(correct);

      if (correct) {
        const points = 10 + streak * 2;
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

      setTimeout(() => goNextRef.current(), 1500);
    },
    [selectedAnswer, currentQuestion, streak, triggerCorrectAnimation, triggerWrongAnimation, speakerPulse],
  );

  // End session when result phase
  const sessionEndedRef = useRef(false);
  useEffect(() => {
    if (phase === 'result' && !sessionEndedRef.current) {
      sessionEndedRef.current = true;
      Speech.stop();
      session.end(score, bestStreak, correctCount, wrongCount);

      // XP + Best Score
      const finalAccuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const totalXP = calculateGameXP(correctCount, bestStreak, finalAccuracy);
      setSessionXP(totalXP);
      const { leveledUp: didLevelUp } = addXP(totalXP);
      setLeveledUp(didLevelUp);
      const newBest = updateBestScore('listening', score);
      setIsNewBest(newBest);
    }
  }, [phase]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

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
    setIsSpeaking(false);
    setPlayCount(0);
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
    outputRange: ['rgba(123, 200, 140, 0)', 'rgba(123, 200, 140, 0.15)'],
  });

  // Loading state
  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
          <Text style={s.loadingText}>Đang tải câu hỏi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.resultContainer}>
          {/* Result Hero Card */}
          <View style={s.resultHeroCard}>
            <View style={s.resultIconCircle}>
              <Ionicons
                name={accuracy >= 70 ? 'trophy' : accuracy >= 40 ? 'thumbs-up' : 'refresh'}
                size={32}
                color={colors.pastel.lime.on}
              />
            </View>
            <Text style={s.resultTitle}>
              {accuracy >= 70 ? 'Thính giác tuyệt vời!' : accuracy >= 40 ? 'Khá tốt!' : 'Cần luyện thêm!'}
            </Text>
            <Text style={s.resultSubtitle}>Listening hoàn thành</Text>
          </View>

          {/* Top stats row */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statValuePrimary}>{score}</Text>
              <Text style={s.statLabel}>Điểm</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValuePrimary, { color: colors.pastel.mint.base }]}>{accuracy}%</Text>
              <Text style={s.statLabel}>Chính xác</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValuePrimary, { color: colors.pastel.peach.base }]}>{bestStreak}</Text>
              <Text style={s.statLabel}>Chuỗi</Text>
            </View>
          </View>

          {/* Correct/Wrong row */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={[s.statValueSecondary, { color: colors.pastel.mint.base }]}>{correctCount}</Text>
              <Text style={s.statLabel}>Đúng</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValueSecondary, { color: colors.pastel.rose.base }]}>{wrongCount}</Text>
              <Text style={s.statLabel}>Sai</Text>
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

          {/* Action buttons */}
          <View style={s.resultActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePlayAgain}
              style={s.ctaButton}
            >
              <Ionicons name="refresh" size={20} color={colors.pastel.lime.on} />
              <Text style={s.ctaButtonText}>Chơi lại</Text>
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
  return (
    <SafeAreaView style={s.safeArea}>
      <Animated.View style={[s.flex1, { backgroundColor: bgColor }]}>
        {/* Top Bar */}
        <View style={s.topBar}>
          <TouchableOpacity
            onPress={() => {
              Speech.stop();
              router.back();
            }}
            style={s.closeButton}
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <View style={s.streakRow}>
            <Ionicons name="flame" size={18} color={colors.pastel.peach.base} />
            <Text style={s.streakText}>{streak}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ComboBadge streak={streak} />
            <View style={s.scoreBadge}>
              <Ionicons name="star" size={16} color={colors.pastel.lime.base} />
              <Text style={s.scoreText}>{score}</Text>
              <XPToast amount={xpToastAmount} triggerKey={xpToastKey} />
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={s.progressTrack}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={s.progressInfo}>
          <Text style={s.progressLabel}>
            Câu {currentIndex + 1}/{questions.length}
          </Text>
          <View style={s.progressCounters}>
            <Text style={s.correctCounter}>{correctCount} đúng</Text>
            <Text style={s.wrongCounter}>{wrongCount} sai</Text>
          </View>
        </View>

        {/* Speaker Area */}
        <View style={s.speakerSection}>
          <View style={s.speakerCard}>
            <Text style={s.speakerHint}>Nghe và chọn từ đúng</Text>

            {/* Big Speaker Button */}
            <Animated.View style={{ transform: [{ scale: speakerPulse }] }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => speakWord(0.8)}
                disabled={isSpeaking || selectedAnswer !== null}
                style={[
                  s.speakerButton,
                  {
                    backgroundColor: isSpeaking
                      ? colors.pastel.lavender.dim
                      : 'rgba(184, 169, 212, 0.08)',
                    borderColor: colors.pastel.lavender.base,
                  },
                ]}
              >
                <Ionicons
                  name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                  size={36}
                  color={colors.pastel.lavender.base}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Slow play button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => speakWord(0.4)}
              disabled={isSpeaking || selectedAnswer !== null}
              style={s.slowPlayButton}
            >
              <Ionicons name="play-outline" size={16} color={colors.text.secondary} />
              <Text style={s.slowPlayText}>Nghe chậm</Text>
            </TouchableOpacity>

            {playCount > 0 && (
              <Text style={s.playCountText}>Đã nghe {playCount} lần</Text>
            )}

            {/* Show translation after answer */}
            {selectedAnswer !== null && currentQuestion && (
              <View style={s.translationArea}>
                <Text style={s.translationWord}>
                  {currentQuestion.word.article ? `${currentQuestion.word.article} ` : ''}
                  {currentQuestion.word.word}
                </Text>
                <Text style={s.translationMeaning}>
                  {currentQuestion.word.translationVi || currentQuestion.word.translationEn}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Answer Options */}
        <Animated.View
          style={[s.optionsContainer, { transform: [{ translateX: shakeAnim }] }]}
        >
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            const showResult = selectedAnswer !== null;

            let optionBg = colors.bg.b2;
            let optionBorder = colors.border.default;
            let textColor = colors.text.primary;
            let letterBg = colors.bg.b3;
            let letterColor = colors.text.secondary;
            let borderWidth = 1;

            if (showResult) {
              if (isCorrectOption) {
                optionBg = colors.pastel.mint.dim;
                optionBorder = colors.pastel.mint.base + '4D'; // 30%
                textColor = colors.pastel.mint.base;
                letterBg = 'rgba(123, 200, 140, 0.20)';
                letterColor = colors.pastel.mint.base;
                borderWidth = 1;
              } else if (isSelected && !isCorrectOption) {
                optionBg = colors.pastel.rose.dim;
                optionBorder = colors.pastel.rose.base + '40'; // 25%
                textColor = colors.pastel.rose.base;
                letterBg = 'rgba(212, 131, 142, 0.20)';
                letterColor = colors.pastel.rose.base;
                borderWidth = 1;
              } else {
                textColor = colors.text.tertiary;
                optionBorder = 'transparent';
                borderWidth = 1;
              }
            } else if (isSelected) {
              optionBg = colors.pastel.lavender.dim;
              optionBorder = colors.pastel.lavender.base + '33'; // 20%
              textColor = colors.pastel.lavender.base;
              letterBg = 'rgba(184, 169, 212, 0.20)';
              letterColor = colors.pastel.lavender.base;
            }

            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <TouchableOpacity
                key={`${currentIndex}-${index}`}
                activeOpacity={0.7}
                disabled={selectedAnswer !== null}
                onPress={() => handleAnswer(option)}
                style={[
                  s.optionRow,
                  {
                    backgroundColor: optionBg,
                    borderWidth,
                    borderColor: optionBorder,
                  },
                ]}
              >
                <View
                  style={[
                    s.optionLetter,
                    { backgroundColor: letterBg },
                  ]}
                >
                  <Text style={[s.optionLetterText, { color: letterColor }]}>
                    {optionLetters[index]}
                  </Text>
                </View>
                <Text style={[s.optionText, { color: textColor }]}>
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
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  /* ── Layout ────────────────────────────── */
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  flex1: {
    flex: 1,
  },

  /* ── Loading ───────────────────────────── */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },

  /* ── Result Screen ─────────────────────── */
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  resultHeroCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.pastel.lime.base,
    borderRadius: radius['2xl'],
    paddingVertical: 32,
    paddingHorizontal: spacing.xl,
  },
  resultIconCircle: {
    marginBottom: spacing.lg,
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: 'rgba(10, 20, 0, 0.15)',
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
    color: colors.pastel.lime.on,
    opacity: 0.7,
  },
  statsRow: {
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
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  resultActions: {
    marginTop: spacing['2xl'],
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
    color: colors.text.secondary,
  },

  /* ── Top Bar ───────────────────────────── */
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
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
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
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
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

  /* ── Progress Bar ──────────────────────── */
  progressTrack: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.pastel.lime.base,
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
  progressCounters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  correctCounter: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.mint.base,
  },
  wrongCounter: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.rose.base,
  },

  /* ── Speaker Area ──────────────────────── */
  speakerSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  speakerCard: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing['2xl'],
    width: '100%',
  },
  speakerHint: {
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  speakerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  slowPlayButton: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  slowPlayText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  playCountText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  translationArea: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  translationWord: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  translationMeaning: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },

  /* ── Options ───────────────────────────── */
  optionsContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: 10,
  },
  optionRow: {
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
