import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, SlideInUp } from 'react-native-reanimated';

import { spacing, radius, typography } from '@/theme';
import { QuizOption } from '@/components/ui/QuizOption';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useThemeStore } from '@/stores/themeStore';

// ── Types ─────────────────────────────────────────────
type Letter = 'A' | 'B' | 'C' | 'D';

export type QuizQuestion = {
  word: string;
  meaning: string;
  type: 'gender' | 'conjugation' | 'translation';
  options: { label: string; letter: Letter }[];
  correctLetter: Letter;
  explanation: string;
};

type Props = {
  question: QuizQuestion;
  lives: number;
  maxLives: number;
  combo: number;
  xp: number;
  onAnswer: (letter: Letter, correct: boolean) => void;
  onNext: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  gender: 'Giới tính',
  conjugation: 'Chia động từ',
  translation: 'Dịch nghĩa',
};

// ── Component ─────────────────────────────────────────
export function QuizScreen({ question, lives, maxLives, combo, xp, onAnswer, onNext }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const [selected, setSelected] = useState<Letter | null>(null);
  const isAnswered = selected !== null;
  const isCorrect = selected === question.correctLetter;

  const handleSelect = useCallback((letter: Letter) => {
    if (isAnswered) return;
    setSelected(letter);
    onAnswer(letter, letter === question.correctLetter);
  }, [isAnswered, question.correctLetter, onAnswer]);

  function optionState(letter: Letter) {
    if (!isAnswered) return selected === letter ? 'selected' : 'default';
    if (letter === question.correctLetter) return 'correct';
    if (letter === selected) return 'wrong';
    return 'default';
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Meta Row ── */}
        <Animated.View entering={FadeInDown.duration(300)} style={s.metaRow}>
          <View style={s.typePill}>
            <Text style={s.typeText}>{TYPE_LABELS[question.type] || question.type}</Text>
          </View>
          <View style={s.hearts}>
            {Array.from({ length: maxLives }, (_, i) => (
              <View key={i} style={[s.heart, i < lives ? s.heartFull : s.heartEmpty]}>
                <Ionicons name="heart" size={14} color={i < lives ? colors.pastel.rose.base : colors.bg.b3} />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Question Card ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.questionCard}>
          <Text style={s.instruction}>Chọn đáp án đúng</Text>
          <Text style={s.questionWord}>{question.word}</Text>
          <Text style={s.questionMeaning}>{question.meaning}</Text>
        </Animated.View>

        {/* ── Options ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={s.options}>
          {question.options.map((opt) => (
            <QuizOption
              key={opt.letter}
              letter={opt.letter}
              label={opt.label}
              state={optionState(opt.letter)}
              onPress={() => handleSelect(opt.letter)}
              disabled={isAnswered}
            />
          ))}
        </Animated.View>

        {/* ── Feedback Bar ── */}
        {isAnswered && (
          <Animated.View
            entering={SlideInUp.duration(300).springify()}
            style={[s.feedback, isCorrect ? s.feedbackCorrect : s.feedbackWrong]}
          >
            <View style={s.feedbackHeader}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={isCorrect ? colors.pastel.mint.base : colors.pastel.rose.base}
              />
              <Text style={[s.feedbackTitle, { color: isCorrect ? colors.pastel.mint.base : colors.pastel.rose.base }]}>
                {isCorrect ? 'Chính xác!' : 'Sai rồi!'}
              </Text>
            </View>
            {!isCorrect && (
              <Text style={s.feedbackCorrectAnswer}>
                Đáp án: {question.options.find(o => o.letter === question.correctLetter)?.label}
              </Text>
            )}
            <Text style={s.feedbackExplanation}>{question.explanation}</Text>
          </Animated.View>
        )}

        {/* ── XP Badge ── */}
        {isAnswered && isCorrect && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={s.xpBadge}>
            <Ionicons name="star" size={16} color={colors.pastel.peach.base} />
            <Text style={s.xpText}>＋{xp} XP · Combo x{combo}</Text>
          </Animated.View>
        )}

        {/* ── Next Button ── */}
        {isAnswered && (
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={s.nextBtn}>
            <PrimaryButton label="Câu tiếp theo →" onPress={onNext} />
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────
const createS = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.b0 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.screenH },

  // Meta
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  typePill: { backgroundColor: colors.pastel.lavender.dim, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.pastel.lavender.base + '33' },
  typeText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.pastel.lavender.base, fontFamily: typography.fontFamily.bodySemibold },
  hearts: { flexDirection: 'row', gap: 4 },
  heart: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heartFull: { backgroundColor: colors.pastel.rose.dim },
  heartEmpty: { backgroundColor: colors.bg.b3 },

  // Question
  questionCard: {
    backgroundColor: colors.bg.b2, borderRadius: radius['2xl'], borderWidth: 1,
    borderColor: colors.border.default, padding: spacing.xl, marginTop: spacing.xl, alignItems: 'center',
  },
  instruction: { fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing.sm },
  questionWord: { fontSize: 44, fontWeight: typography.fontWeight.black, color: colors.text.primary, letterSpacing: typography.letterSpacing.tight, textAlign: 'center', fontFamily: typography.fontFamily.bodyBlack },
  questionMeaning: { fontSize: typography.fontSize.md, color: colors.text.secondary, marginTop: spacing.xs, textAlign: 'center' },

  // Options
  options: { marginTop: spacing.xl },

  // Feedback
  feedback: { borderRadius: radius.stone, borderWidth: 1, padding: spacing.lg, marginTop: spacing.lg },
  feedbackCorrect: { backgroundColor: colors.pastel.mint.dim, borderColor: 'rgba(123, 200, 140, 0.30)' },
  feedbackWrong: { backgroundColor: colors.pastel.rose.dim, borderColor: 'rgba(212, 131, 142, 0.25)' },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feedbackTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, fontFamily: typography.fontFamily.heading },
  feedbackCorrectAnswer: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.pastel.rose.base, marginTop: spacing.xs, marginLeft: 30, fontFamily: typography.fontFamily.heading },
  feedbackExplanation: { fontSize: typography.fontSize.base, color: colors.text.secondary, marginTop: spacing.xs, marginLeft: 30, lineHeight: typography.fontSize.base * typography.lineHeight.normal },

  // XP
  xpBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: spacing.xs, backgroundColor: colors.pastel.peach.dim, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.pastel.peach.base + '30', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.md },
  xpText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.pastel.peach.base, fontFamily: typography.fontFamily.bodyBold },

  // Next
  nextBtn: { marginTop: spacing.xl },
});
