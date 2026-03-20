import { View, Text, TouchableOpacity, Animated, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
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

interface MatchCard {
  id: string;
  text: string;
  pairId: string;
  type: 'word' | 'translation';
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildCards(words: Word[]): MatchCard[] {
  const cards: MatchCard[] = [];
  words.forEach((word) => {
    cards.push({
      id: `word-${word.id}`,
      text: word.word,
      pairId: word.id,
      type: 'word',
    });
    cards.push({
      id: `trans-${word.id}`,
      text: word.translationVi || word.translationEn,
      pairId: word.id,
      type: 'translation',
    });
  });
  return shuffleArray(cards);
}

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 24 - 16 - 8) / 2;

export default function MatchingScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { difficulty = 'beginner', count = '10', category } = useLocalSearchParams<{
    difficulty: Difficulty;
    count: string;
    category?: string;
  }>();

  // For matching, limit to 8 pairs max to fit on screen
  const totalPairs = Math.min(parseInt(count, 10) || 8, 8);
  const difficultyLevels: Record<string, string[]> = {
    beginner: ['A1', 'A2'],
    intermediate: ['B1', 'B2'],
    advanced: ['C1', 'C2'],
  };

  const { data: words, isLoading, refetch } = useRandomWords(totalPairs, {
    category: category || undefined,
    levels: difficultyLevels[difficulty] || ['A1', 'A2'],
  });

  const session = useGameSession('matching', difficulty as Difficulty);

  const [phase, setPhase] = useState<Phase>('playing');
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

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

  // Build cards from words
  useEffect(() => {
    if (words && words.length >= 2) {
      setCards(buildCards(words.slice(0, totalPairs)));
    }
  }, [words, totalPairs]);

  // Start session
  useEffect(() => {
    if (cards.length > 0 && !sessionStarted) {
      session.start(totalPairs);
      setSessionStarted(true);
    }
  }, [cards.length, sessionStarted]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || cards.length === 0) return;
    const interval = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [phase, cards.length]);

  const handleCardTap = useCallback(
    (card: MatchCard) => {
      if (matchedPairs.has(card.pairId) && matchedPairs.has(card.id)) return;
      if (wrongPair) return;

      // If card is already matched, ignore
      if (matchedPairs.has(card.pairId) && cards.find((c) => c.id === card.id && matchedPairs.has(card.pairId))) {
        // Check if THIS specific card side is matched
      }

      if (selectedId === card.id) {
        // Deselect
        setSelectedId(null);
        return;
      }

      if (selectedId === null) {
        // First selection
        setSelectedId(card.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return;
      }

      // Second selection
      const firstCard = cards.find((c) => c.id === selectedId);
      if (!firstCard) {
        setSelectedId(card.id);
        return;
      }

      setMoves((m) => m + 1);

      if (firstCard.pairId === card.pairId && firstCard.type !== card.type) {
        // Match found
        const timeBonus = Math.max(0, 30 - elapsedTime);
        const points = 20 + timeBonus;
        setScore((s) => s + points);
        setCorrectCount((c) => c + 1);

        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);

        // XP toast
        const xpGain = 10 + (newStreak >= 10 ? 40 : newStreak >= 5 ? 20 : newStreak >= 3 ? 10 : 0);
        setXpToastAmount(xpGain);
        setXpToastKey((k) => k + 1);

        const newMatched = new Set(matchedPairs);
        newMatched.add(card.pairId);
        setMatchedPairs(newMatched);
        setSelectedId(null);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        // Check if all matched
        if (newMatched.size === totalPairs) {
          setTimeout(() => setPhase('result'), 600);
        }
      } else {
        // Wrong match
        setWrongCount((w) => w + 1);
        setStreak(0);
        setWrongPair([selectedId, card.id]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

        // Shake animation
        shakeAnim.setValue(0);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
          setWrongPair(null);
          setSelectedId(null);
        }, 800);
      }
    },
    [selectedId, matchedPairs, cards, wrongPair, elapsedTime, totalPairs, shakeAnim, streak, bestStreak],
  );

  // End session when result phase + XP
  const sessionEndedRef = useRef(false);
  useEffect(() => {
    if (phase === 'result' && !sessionEndedRef.current) {
      sessionEndedRef.current = true;
      session.end(score, correctCount, correctCount, wrongCount);

      const finalAccuracy = moves > 0 ? (correctCount / moves) * 100 : 0;
      const earned = calculateGameXP(correctCount, bestStreak, finalAccuracy);
      setSessionXP(earned);

      const { leveledUp: didLevel } = addXP(earned);
      setLeveledUp(didLevel);

      const newBest = updateBestScore('matching', score);
      setIsNewBest(newBest);
    }
  }, [phase]);

  const handlePlayAgain = () => {
    setPhase('playing');
    setCards([]);
    setSelectedId(null);
    setMatchedPairs(new Set());
    setWrongPair(null);
    setScore(0);
    setMoves(0);
    setCorrectCount(0);
    setWrongCount(0);
    setElapsedTime(0);
    setStreak(0);
    setBestStreak(0);
    setSessionStarted(false);
    sessionEndedRef.current = false;
    setXpToastAmount(0);
    setXpToastKey(0);
    setSessionXP(0);
    setIsNewBest(false);
    setLeveledUp(false);
    refetch();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading || cards.length === 0) {
    return (
      <SafeAreaView style={s.screenCenter}>
        <ActivityIndicator size="large" color={colors.pastel.lime.base} />
        <Text style={s.loadingText}>Đang tải trò chơi...</Text>
      </SafeAreaView>
    );
  }

  // Result screen
  if (phase === 'result') {
    const accuracy = moves > 0 ? Math.round((correctCount / moves) * 100) : 0;
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.resultContainer}>
          <LinearGradient
            colors={[colors.pastel.lime.base, colors.pastel.mint.base]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.resultGradient}
          >
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
            <Text style={s.resultSubtitle}>Word Match hoàn thành</Text>
          </LinearGradient>

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statValueWhite}>{score}</Text>
              <Text style={s.statLabel}>Điểm</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValueAccent, { color: colors.pastel.mint.base }]}>{accuracy}%</Text>
              <Text style={s.statLabel}>Chính xác</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValueAccent, { color: colors.pastel.peach.base }]}>{formatTime(elapsedTime)}</Text>
              <Text style={s.statLabel}>Thời gian</Text>
            </View>
          </View>

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={[s.statValueSmall, { color: colors.pastel.mint.base }]}>{correctCount}</Text>
              <Text style={s.statLabel}>Đúng</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValueSmall, { color: colors.pastel.rose.base }]}>{wrongCount}</Text>
              <Text style={s.statLabel}>Sai</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValueSmall, { color: colors.pastel.sky.base }]}>{moves}</Text>
              <Text style={s.statLabel}>Lượt chơi</Text>
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

          <View style={s.resultActions}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAgain}>
              <View style={s.primaryButton}>
                <Ionicons name="refresh" size={20} color={colors.pastel.lime.on} />
                <Text style={s.primaryButtonText}>Chơi lại</Text>
              </View>
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
    <SafeAreaView style={s.screen}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.closeButton}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <View style={s.timerRow}>
          <Ionicons name="timer-outline" size={16} color={colors.text.secondary} />
          <Text style={s.timerText}>{formatTime(elapsedTime)}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <ComboBadge streak={streak} />
          <View style={s.scoreBadge}>
            <Ionicons name="star" size={16} color={colors.pastel.lime.base} />
            <Text style={s.scoreText}>{score}</Text>
          </View>
          <XPToast amount={xpToastAmount} triggerKey={xpToastKey} />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={s.progressTrack}>
        <View
          style={[s.progressFill, { width: `${(matchedPairs.size / totalPairs) * 100}%` }]}
        />
      </View>

      <View style={s.progressInfo}>
        <Text style={s.progressLabel}>
          {matchedPairs.size}/{totalPairs} cặp
        </Text>
        <Text style={s.progressLabel}>{moves} lượt</Text>
      </View>

      {/* Card Grid */}
      <Animated.View
        style={[s.cardGrid, { transform: [{ translateX: shakeAnim }] }]}
      >
        {cards.map((card) => {
          const isSelected = selectedId === card.id;
          const isMatched = matchedPairs.has(card.pairId);
          const isWrong = wrongPair !== null && (wrongPair[0] === card.id || wrongPair[1] === card.id);

          const cardBg = isMatched
            ? colors.pastel.mint.dim
            : isWrong
              ? colors.pastel.rose.dim
              : isSelected
                ? colors.pastel.lavender.dim
                : colors.bg.b2;

          const cardBorder = isMatched
            ? colors.pastel.mint.base
            : isWrong
              ? colors.pastel.rose.base
              : isSelected
                ? colors.pastel.lavender.base
                : colors.border.default;

          const textColor = isMatched
            ? colors.pastel.mint.base
            : isWrong
              ? colors.pastel.rose.base
              : isSelected
                ? colors.pastel.lavender.base
                : colors.text.primary;

          return (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.7}
              disabled={isMatched || wrongPair !== null}
              onPress={() => handleCardTap(card)}
              style={[
                s.matchCard,
                {
                  width: cardWidth,
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  borderWidth: (isSelected || isMatched || isWrong) ? 2 : 1,
                  opacity: isMatched ? 0.6 : 1,
                },
              ]}
            >
              <Text
                style={[s.cardText, { color: textColor }]}
                numberOfLines={2}
              >
                {card.text}
              </Text>
              <Text style={s.cardTypeLabel}>
                {card.type === 'word' ? 'DE' : 'VI'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  // ── Layout ────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  screenCenter: {
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

  // ── Top Bar ───────────────────────────────────────
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
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
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

  // ── Progress ──────────────────────────────────────
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

  // ── Card Grid ─────────────────────────────────────
  cardGrid: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: spacing.sm,
  },
  matchCard: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  cardTypeLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },

  // ── Result Screen ─────────────────────────────────
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  resultGradient: {
    borderRadius: radius['2xl'],
    padding: spacing['3xl'],
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
    color: colors.pastel.lime.on,
    opacity: 0.7,
  },

  // ── Stats ─────────────────────────────────────────
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
    padding: spacing.lg,
  },
  statValueWhite: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  statValueAccent: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  statValueSmall: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // ── Buttons ───────────────────────────────────────
  resultActions: {
    marginTop: spacing['2xl'],
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.pastel.lime.base,
    borderRadius: radius.stone,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButtonText: {
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
});
