import { View, Text, TouchableOpacity, Animated, ActivityIndicator, TextInput, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

export default function SpellingScreen() {
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
  const [inputFocused, setInputFocused] = useState(false);

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

      // XP toast
      const xpGain = 10 + (streak >= 10 ? 40 : streak >= 5 ? 20 : streak >= 3 ? 10 : 0);
      setXpToastAmount(xpGain);
      setXpToastKey((k) => k + 1);
      setSessionXP((x) => x + xpGain);
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

      // XP + Best Score
      const finalAccuracy = questionWords.length > 0 ? Math.round((correctCount / questionWords.length) * 100) : 0;
      const totalXP = calculateGameXP(correctCount, bestStreak, finalAccuracy);
      setSessionXP(totalXP);
      const { leveledUp: didLevelUp } = addXP(totalXP);
      setLeveledUp(didLevelUp);
      const newBest = updateBestScore('spelling', score);
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
    setUserInput('');
    setChecked(false);
    setIsCorrect(null);
    setHintUsed(false);
    setShowHint(false);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    feedbackScale.setValue(0);
    hintOpacity.setValue(0);
    setSessionXP(0);
    setXpToastAmount(0);
    setXpToastKey(0);
    setIsNewBest(false);
    setLeveledUp(false);
    refetch();
  };

  // Render letter-by-letter comparison
  const renderLetterComparison = () => {
    if (!checked || !currentWord) return null;
    const answer = currentWord.word;
    const input = userInput.trim();
    const maxLen = Math.max(answer.length, input.length);

    return (
      <View style={s.letterRow}>
        {Array.from({ length: maxLen }).map((_, i) => {
          const answerChar = answer[i] || '';
          const inputChar = input[i] || '';
          const isMatch = answerChar.toLowerCase() === inputChar.toLowerCase();

          return (
            <View
              key={i}
              style={[
                s.letterBox,
                {
                  backgroundColor: isMatch
                    ? colors.pastel.mint.dim
                    : colors.pastel.rose.dim,
                  borderColor: isMatch
                    ? colors.pastel.mint.base
                    : colors.pastel.rose.base,
                },
              ]}
            >
              <Text
                style={[
                  s.letterText,
                  { color: isMatch ? colors.pastel.mint.base : colors.pastel.rose.base },
                ]}
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
      <SafeAreaView style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pastel.lime.base} />
        <Text style={s.loadingText}>Đang tải câu hỏi...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy =
      questionWords.length > 0 ? Math.round((correctCount / questionWords.length) * 100) : 0;
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
            <Text style={s.resultSubtitle}>Spelling hoàn thành</Text>
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

          {/* Correct / Wrong row */}
          <View style={s.statsRow2}>
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

          {/* Buttons */}
          <View style={s.resultButtons}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAgain} style={s.ctaButton}>
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
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.closeButton}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <View style={s.streakBadge}>
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
        <Text style={s.progressText}>
          Câu {currentIndex + 1}/{questionWords.length}
        </Text>
        <View style={s.progressCounters}>
          <Text style={[s.progressCounterText, { color: colors.pastel.mint.base }]}>{correctCount} đúng</Text>
          <Text style={[s.progressCounterText, { color: colors.pastel.rose.base }]}>{wrongCount} sai</Text>
        </View>
      </View>

      {/* Translation Card */}
      <Animated.View
        style={[s.cardOuter, { transform: [{ translateX: shakeAnim }] }]}
      >
        <View style={s.translationCard}>
          <Text style={s.cardHint}>Viết từ tiếng Đức</Text>
          <Text style={s.cardWord}>
            {currentWord?.translationVi || currentWord?.translationEn}
          </Text>
          {currentWord?.translationVi && currentWord?.translationEn && (
            <Text style={s.cardSubtext}>
              ({currentWord.translationEn})
            </Text>
          )}
          {currentWord?.article && (
            <View style={s.articleBadge}>
              <Text style={s.articleText}>Mạo từ: {currentWord.article}</Text>
            </View>
          )}

          {/* Hint: show word briefly */}
          {showHint && (
            <Animated.View style={[s.hintWrapper, { opacity: hintOpacity }]}>
              <View style={s.hintBox}>
                <Text style={s.hintText}>
                  {currentWord?.word}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* Input */}
      <View style={s.inputSection}>
        <View style={s.inputRow}>
          <TextInput
            ref={inputRef}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Nhập từ tiếng Đức..."
            placeholderTextColor={colors.text.tertiary}
            editable={!checked}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleCheck}
            returnKeyType="done"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={[
              s.textInput,
              {
                borderWidth: checked ? 2 : 1,
                borderColor: checked
                  ? isCorrect
                    ? colors.pastel.mint.base
                    : colors.pastel.rose.base
                  : inputFocused
                    ? colors.pastel.lavender.base
                    : colors.border.default,
              },
            ]}
          />
          {!checked && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleHint}
              disabled={hintUsed}
              style={[
                s.hintButton,
                {
                  backgroundColor: hintUsed ? colors.bg.b3 : colors.pastel.peach.dim,
                },
              ]}
            >
              <Ionicons
                name="eye-outline"
                size={22}
                color={hintUsed ? colors.text.tertiary : colors.pastel.peach.base}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Letter-by-letter feedback */}
      {checked && (
        <Animated.View
          style={[s.feedbackOuter, { transform: [{ scale: feedbackScale }] }]}
        >
          <View
            style={[
              s.feedbackCard,
              {
                backgroundColor: isCorrect
                  ? colors.pastel.mint.dim
                  : colors.pastel.rose.dim,
                borderColor: isCorrect
                  ? colors.pastel.mint.base
                  : colors.pastel.rose.base,
              },
            ]}
          >
            <View style={s.feedbackHeader}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={isCorrect ? colors.pastel.mint.base : colors.pastel.rose.base}
              />
              <Text
                style={[
                  s.feedbackLabel,
                  { color: isCorrect ? colors.pastel.mint.base : colors.pastel.rose.base },
                ]}
              >
                {isCorrect ? 'Chính xác!' : 'Chưa đúng!'}
              </Text>
            </View>

            {/* Letter comparison */}
            {!isCorrect && renderLetterComparison()}

            {!isCorrect && (
              <Text style={s.answerReveal}>
                Đáp án: <Text style={s.answerWord}>{currentWord?.word}</Text>
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* Action Button */}
      <View style={s.actionSection}>
        {!checked ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={userInput.trim() === ''}
            onPress={handleCheck}
            style={[
              s.ctaButton,
              userInput.trim() === '' && s.ctaButtonDisabled,
            ]}
          >
            <Ionicons
              name="checkmark"
              size={20}
              color={userInput.trim() === '' ? colors.text.tertiary : colors.pastel.lime.on}
            />
            <Text
              style={[
                s.ctaButtonText,
                userInput.trim() === '' && { color: colors.text.tertiary },
              ]}
            >
              Kiểm tra
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={s.ctaButton}>
            <Text style={s.ctaButtonText}>
              {currentIndex + 1 >= questionWords.length ? 'Xem kết quả' : 'Câu tiếp theo'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.pastel.lime.on} style={{ marginLeft: spacing.sm }} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  /* ── Layout ─────────────────────────────── */
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
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

  /* ── Top Bar ────────────────────────────── */
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
  streakBadge: {
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
    paddingVertical: spacing.xs + 2,
  },
  scoreText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },

  /* ── Progress ───────────────────────────── */
  progressTrack: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b2,
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
  progressText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  progressCounters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressCounterText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
  },

  /* ── Translation Card ───────────────────── */
  cardOuter: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl + 4,
  },
  translationCard: {
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.xl + 4,
  },
  cardHint: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  cardWord: {
    textAlign: 'center',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  cardSubtext: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  articleBadge: {
    marginTop: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  articleText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  hintWrapper: {
    marginTop: spacing.lg,
  },
  hintBox: {
    borderRadius: radius.sm,
    backgroundColor: colors.pastel.peach.dim,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  hintText: {
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },

  /* ── Input ──────────────────────────────── */
  inputSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl + 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  hintButton: {
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },

  /* ── Feedback ───────────────────────────── */
  feedbackOuter: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  feedbackCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackLabel: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  letterRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  letterBox: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  letterText: {
    fontSize: typography.fontSize.md + 1,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  answerReveal: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  answerWord: {
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.mint.base,
  },

  /* ── Action Button ──────────────────────── */
  actionSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl + 4,
  },
  ctaButton: {
    borderRadius: radius.stone,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.pastel.lime.base,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.bg.b3,
  },
  ctaButtonText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.on,
  },

  /* ── Result Screen ──────────────────────── */
  resultCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + 4,
  },
  resultHero: {
    borderRadius: radius['2xl'],
    padding: spacing['3xl'],
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.pastel.lime.base,
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
    color: colors.pastel.lime.on,
    opacity: 0.7,
  },
  statsRow: {
    marginTop: spacing.xl + 4,
    width: '100%',
    flexDirection: 'row',
    gap: spacing.md,
  },
  statsRow2: {
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
    padding: spacing.lg,
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
  resultButtons: {
    marginTop: spacing['2xl'] + 4,
    width: '100%',
    gap: spacing.md,
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
});
