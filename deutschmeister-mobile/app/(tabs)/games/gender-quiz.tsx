import { View, Text, TouchableOpacity, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRandomWords } from '@/hooks/useWords';
import { useGameSession } from '@/hooks/useGameSession';
import { Difficulty, Word, GenderInfo, Gender } from '@/types';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography } from '@/theme';
import { useXPStore, calculateGameXP } from '@/stores/xpStore';
import { XPToast } from '@/components/ui/XPToast';
import { XPSummary } from '@/components/ui/XPSummary';
import { ComboBadge } from '@/components/ui/ComboBadge';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

type Phase = 'playing' | 'result';

function getGenderButtons(colors: ThemeColors) {
  return [
    { gender: 'masculine' as Gender, article: 'der', label: 'Maskulin', base: colors.pastel.sky.base, dim: colors.pastel.sky.dim },
    { gender: 'feminine' as Gender, article: 'die', label: 'Feminin', base: colors.pastel.rose.base, dim: colors.pastel.rose.dim },
    { gender: 'neuter' as Gender, article: 'das', label: 'Neutrum', base: colors.pastel.mint.base, dim: colors.pastel.mint.dim },
  ];
}

export default function GenderQuizScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const genderButtons = useMemo(() => getGenderButtons(colors), [colors]);
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
        // XP toast
        const xpGain = 10 + (streak >= 10 ? 40 : streak >= 5 ? 20 : streak >= 3 ? 10 : 0);
        setXpToastAmount(xpGain);
        setXpToastKey((k) => k + 1);
        setSessionXP((x) => x + xpGain);
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
      // XP + Best Score
      const finalAccuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const totalXP = calculateGameXP(correctCount, bestStreak, finalAccuracy);
      setSessionXP(totalXP);
      const { leveledUp: didLevelUp } = addXP(totalXP);
      setLeveledUp(didLevelUp);
      const newBest = updateBestScore('gender-quiz', score);
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
    setSelectedGender(null);
    setIsCorrect(null);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    refetch();
  };

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
    const accuracy =
      questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.resultCenter}>
          {/* Result Hero Card */}
          <View style={s.resultHero}>
            <View style={s.resultIconCircle}>
              <Ionicons
                name={accuracy >= 70 ? 'trophy' : accuracy >= 40 ? 'thumbs-up' : 'refresh'}
                size={32}
                color={colors.pastel.lime.on}
              />
            </View>
            <Text style={s.resultTitle}>
              {accuracy >= 70 ? 'Xuất sắc!' : accuracy >= 40 ? 'Khá tốt!' : 'Cần luyện thêm!'}
            </Text>
            <Text style={s.resultSubtitle}>Gender Quiz hoàn thành</Text>
          </View>

          {/* Score / Accuracy / Streak */}
          <View style={s.statRow}>
            <View style={s.statCard}>
              <Text style={s.statValueWhite}>{score}</Text>
              <Text style={s.statLabel}>Điểm</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValueWhite, { color: colors.pastel.mint.base }]}>{accuracy}%</Text>
              <Text style={s.statLabel}>Chính xác</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValueWhite, { color: colors.pastel.peach.base }]}>{bestStreak}</Text>
              <Text style={s.statLabel}>Chuỗi</Text>
            </View>
          </View>

          {/* Correct / Wrong */}
          <View style={s.statRow}>
            <View style={s.statCard}>
              <Text style={[s.statValueSmall, { color: colors.pastel.mint.base }]}>{correctCount}</Text>
              <Text style={s.statLabel}>Đúng</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValueSmall, { color: colors.pastel.rose.base }]}>{wrongCount}</Text>
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

          {/* Actions */}
          <View style={s.resultActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePlayAgain}
              style={s.playAgainBtn}
            >
              <Ionicons name="refresh" size={20} color={colors.pastel.lime.on} />
              <Text style={s.playAgainText}>Chơi lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={s.goBackBtn}
            >
              <Text style={s.goBackText}>Quay về</Text>
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
    <SafeAreaView style={s.safeArea}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.closeBtn}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <View style={s.streakContainer}>
          <Ionicons name="flame" size={18} color={colors.pastel.peach.base} />
          <Text style={s.streakText}>{streak}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ComboBadge streak={streak} />
          <View style={s.scoreBadge}>
            <Ionicons name="star" size={16} color={colors.pastel.lavender.base} />
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
        <View style={s.progressStats}>
          <Text style={[s.progressStatText, { color: colors.pastel.mint.base }]}>
            {correctCount} đúng
          </Text>
          <Text style={[s.progressStatText, { color: colors.pastel.rose.base }]}>
            {wrongCount} sai
          </Text>
        </View>
      </View>

      {/* Question Card */}
      <View style={s.questionArea}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
          <View style={s.questionCard}>
            <Text style={s.questionHint}>Danh từ này thuộc giống nào?</Text>
            <Text style={s.questionWord}>{currentWord?.word}</Text>
            {currentWord?.pronunciation && (
              <Text style={s.pronunciation}>[{currentWord.pronunciation}]</Text>
            )}

            {/* Translation hint (shows after answer) */}
            {selectedGender !== null && (
              <View style={s.translationContainer}>
                <View
                  style={[
                    s.correctArticleBadge,
                    { backgroundColor: correctGenderInfo?.bgColor },
                  ]}
                >
                  <Text
                    style={[
                      s.correctArticleText,
                      { color: correctGenderInfo?.color },
                    ]}
                  >
                    {correctGenderInfo?.article} {currentWord?.word}
                  </Text>
                </View>
                <Text style={s.translationText}>
                  {currentWord?.translationVi || currentWord?.translationEn}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Feedback overlay */}
        <Animated.View
          style={[s.feedbackOverlay, { opacity: feedbackOpacity }]}
          pointerEvents="none"
        >
          {isCorrect !== null && (
            <View
              style={[
                s.feedbackCircle,
                {
                  backgroundColor: isCorrect
                    ? colors.pastel.mint.dim
                    : colors.pastel.rose.dim,
                },
              ]}
            >
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={48}
                color={isCorrect ? colors.pastel.mint.base : colors.pastel.rose.base}
              />
            </View>
          )}
        </Animated.View>
      </View>

      {/* Gender Buttons */}
      <View style={s.buttonsArea}>
        <View style={s.buttonsRow}>
          {genderButtons.map((btn) => {
            const isSelected = selectedGender === btn.gender;
            const isCorrectAnswer = currentWord?.gender === btn.gender;
            const showResult = selectedGender !== null;

            let borderColor = 'transparent';
            let bgColor = btn.dim;

            if (showResult) {
              if (isCorrectAnswer) {
                borderColor = btn.base;
                bgColor = btn.dim;
              } else if (isSelected && !isCorrectAnswer) {
                borderColor = colors.pastel.rose.base;
                bgColor = colors.pastel.rose.dim;
              } else {
                bgColor = colors.bg.b3;
              }
            }

            return (
              <TouchableOpacity
                key={btn.gender}
                activeOpacity={0.7}
                disabled={selectedGender !== null}
                onPress={() => handleAnswer(btn.gender)}
                style={[
                  s.genderBtn,
                  {
                    backgroundColor: bgColor,
                    borderWidth: showResult ? 2 : 1,
                    borderColor: showResult ? borderColor : btn.base + '33',
                  },
                ]}
              >
                <Text
                  style={[
                    s.genderArticle,
                    {
                      color:
                        showResult && isSelected && !isCorrectAnswer
                          ? colors.pastel.rose.base
                          : showResult && !isCorrectAnswer && !isSelected
                            ? colors.text.tertiary
                            : btn.base,
                    },
                  ]}
                >
                  {btn.article}
                </Text>
                <Text
                  style={[
                    s.genderLabel,
                    {
                      color:
                        showResult && !isCorrectAnswer
                          ? colors.text.tertiary
                          : btn.base,
                    },
                  ]}
                >
                  {btn.label}
                </Text>
                {showResult && isCorrectAnswer && (
                  <View style={s.genderIcon}>
                    <Ionicons name="checkmark-circle" size={18} color={btn.base} />
                  </View>
                )}
                {showResult && isSelected && !isCorrectAnswer && (
                  <View style={s.genderIcon}>
                    <Ionicons name="close-circle" size={18} color={colors.pastel.rose.base} />
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

const createS = (colors: any) => StyleSheet.create({
  /* ── Layout ──────────────────────────────── */
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
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

  /* ── Top Bar ─────────────────────────────── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  closeBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
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
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  scoreText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },

  /* ── Progress ────────────────────────────── */
  progressTrack: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
    overflow: 'hidden',
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
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressStatText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },

  /* ── Question Card ───────────────────────── */
  questionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + 4,
  },
  questionCard: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
  },
  questionHint: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  questionWord: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  pronunciation: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  translationContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  correctArticleBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
  },
  correctArticleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  translationText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },

  /* ── Feedback Overlay ────────────────────── */
  feedbackOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  feedbackCircle: {
    borderRadius: radius.pill,
    padding: spacing.lg,
  },

  /* ── Gender Buttons ──────────────────────── */
  buttonsArea: {
    paddingHorizontal: spacing.xl + 4,
    paddingBottom: spacing['3xl'],
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    paddingVertical: spacing.xl,
  },
  genderArticle: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  genderLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  genderIcon: {
    marginTop: spacing.sm,
  },

  /* ── Result Screen ───────────────────────── */
  resultCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + 4,
  },
  resultHero: {
    width: '100%',
    alignItems: 'center',
    borderRadius: radius['2xl'],
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.pastel.lime.base + '33',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
  },
  resultIconCircle: {
    marginBottom: spacing.lg,
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.pastel.lime.base,
  },
  resultTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  resultSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },

  /* ── Stat Cards ──────────────────────────── */
  statRow: {
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
  statValueWhite: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  statValueSmall: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },

  /* ── Result Actions ──────────────────────── */
  resultActions: {
    marginTop: spacing['2xl'],
    width: '100%',
    gap: spacing.md,
  },
  playAgainBtn: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.pastel.lime.base,
  },
  playAgainText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.on,
  },
  goBackBtn: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 14,
  },
  goBackText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.secondary,
  },
});
