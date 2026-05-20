import { View, Text, TouchableOpacity, Animated, ActivityIndicator, TextInput, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  const { data: words, isLoading, refetch } = useRandomWords(totalQuestions, {
    category: category || undefined,
    levels: difficultyLevels[difficulty] || ['A1', 'A2'],
    nounsOnly: true,
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

      // XP + Best Score
      const finalAccuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const totalXP = calculateGameXP(correctCount, bestStreak, finalAccuracy);
      setSessionXP(totalXP);
      const { leveledUp: didLevelUp } = addXP(totalXP);
      setLeveledUp(didLevelUp);
      const newBest = updateBestScore('fill-blank', score);
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
    setSessionStarted(false);
    sessionEndedRef.current = false;
    feedbackScale.setValue(0);
    setSessionXP(0);
    setXpToastAmount(0);
    setXpToastKey(0);
    setIsNewBest(false);
    setLeveledUp(false);
    refetch();
  };

  // Loading state
  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pastel.peach.base} />
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
            colors={colors.gradient.warning}
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
            <Text style={styles.resultSubtitle}>Fill in Blank hoàn thành</Text>
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
                colors={colors.gradient.warning}
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
            <Ionicons name="star" size={16} color={colors.pastel.peach.base} />
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
              backgroundColor: colors.pastel.peach.base,
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
        <View style={styles.correctWrongRow}>
          <Text style={styles.correctCountText}>{correctCount} đúng</Text>
          <Text style={styles.wrongCountText}>{wrongCount} sai</Text>
        </View>
      </View>

      {/* Sentence Card */}
      <Animated.View
        style={[styles.sentenceWrapper, { transform: [{ translateX: shakeAnim }] }]}
      >
        <View style={styles.sentenceCard}>
          <Text style={styles.sentenceLabel}>Điền từ còn thiếu</Text>
          <Text style={styles.sentenceText}>
            {currentQuestion?.sentence}
          </Text>
          {currentQuestion?.word.category && (
            <View style={styles.categoryCenter}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{currentQuestion.word.category}</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Input + Hint */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
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
            style={[
              styles.textInput,
              {
                borderWidth: checked ? 2 : 1,
                borderColor: checked
                  ? isCorrect
                    ? colors.pastel.mint.base
                    : colors.pastel.rose.base
                  : colors.border.strong,
              },
            ]}
          />
          {!checked && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleHint}
              disabled={hintUsed}
              style={[
                styles.hintButton,
                { backgroundColor: hintUsed ? colors.bg.b3 : colors.pastel.peach.dim },
              ]}
            >
              <Ionicons
                name="bulb-outline"
                size={22}
                color={hintUsed ? colors.text.tertiary : colors.pastel.peach.base}
              />
            </TouchableOpacity>
          )}
        </View>

        {hintUsed && !checked && (
          <Text style={styles.hintText}>
            Gợi ý: Bắt đầu bằng "{currentQuestion?.answer.charAt(0)}" ({currentQuestion?.answer.length} ký tự)
          </Text>
        )}
      </View>

      {/* Feedback */}
      {checked && (
        <Animated.View
          style={[styles.feedbackWrapper, { transform: [{ scale: feedbackScale }] }]}
        >
          <View
            style={[
              styles.feedbackCard,
              {
                backgroundColor: isCorrect ? colors.pastel.mint.dim : colors.pastel.rose.dim,
                borderWidth: 1,
                borderColor: isCorrect ? colors.pastel.mint.base : colors.pastel.rose.base,
              },
            ]}
          >
            <View style={styles.feedbackRow}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={isCorrect ? colors.pastel.mint.base : colors.pastel.rose.base}
              />
              <Text
                style={[
                  styles.feedbackLabel,
                  { color: isCorrect ? colors.pastel.mint.base : colors.pastel.rose.base },
                ]}
              >
                {isCorrect ? 'Chính xác!' : 'Chưa đúng!'}
              </Text>
            </View>
            {!isCorrect && (
              <Text style={styles.feedbackAnswer}>
                Đáp án đúng: <Text style={styles.feedbackAnswerBold}>{currentQuestion?.answer}</Text>
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* Action Button */}
      <View style={styles.actionSection}>
        {!checked ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={userInput.trim() === ''}
            onPress={handleCheck}
          >
            <LinearGradient
              colors={userInput.trim() === '' ? [colors.bg.b3, colors.bg.b3] : colors.gradient.warning}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="checkmark" size={20} color={colors.text.primary} />
              <Text style={styles.actionText}>Kiểm tra</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.8} onPress={handleNext}>
            <LinearGradient
              colors={colors.gradient.warning}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>
                {currentIndex + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.text.primary} style={{ marginLeft: spacing.sm }} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
  correctWrongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  correctCountText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.mint.base,
  },
  wrongCountText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.rose.base,
  },
  sentenceWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
  },
  sentenceCard: {
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  sentenceLabel: {
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  sentenceText: {
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.body,
    lineHeight: 28,
    color: colors.text.primary,
  },
  categoryCenter: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  categoryBadge: {
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
  inputSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
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
    fontSize: typography.fontSize.md,
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
  hintText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.peach.base,
  },
  feedbackWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  feedbackCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackLabel: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  feedbackAnswer: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  feedbackAnswerBold: {
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.mint.base,
  },
  actionSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
  },
  actionGradient: {
    borderRadius: radius.stone,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
});
