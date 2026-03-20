import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '@/theme';
import { useGrammarLesson, useSubmitGrammarExercises } from '@/hooks/useGrammar';
import type { Exercise } from '@/types/grammar';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

type Tab = 'theory' | 'exercises';

const EXERCISE_TYPE_LABEL: Record<string, string> = {
  mcq: 'Trắc nghiệm',
  fill_blank: 'Điền từ',
  reorder: 'Sắp xếp',
  translate: 'Dịch câu',
  error_correct: 'Sửa lỗi',
};

function buildExerciseTypeColor(colors: ThemeColors): Record<string, { base: string; dim: string }> {
  return {
    mcq: { base: colors.pastel.sky.base, dim: colors.pastel.sky.dim },
    fill_blank: { base: colors.pastel.lavender.base, dim: colors.pastel.lavender.dim },
    reorder: { base: colors.pastel.peach.base, dim: colors.pastel.peach.dim },
    translate: { base: colors.pastel.mint.base, dim: colors.pastel.mint.dim },
    error_correct: { base: colors.pastel.rose.base, dim: colors.pastel.rose.dim },
  };
}

// ── Theory Section ──
function TheoryView({ content }: { content: any }) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  if (!content || !Array.isArray(content.sections)) {
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyText}>Chưa có nội dung lý thuyết</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.flex1} contentContainerStyle={s.theoryContent} showsVerticalScrollIndicator={false}>
      {content.sections.map((section: any, idx: number) => (
        <View key={idx} style={s.theorySection}>
          <View style={s.theorySectionHeader}>
            <View style={s.theorySectionNum}>
              <Text style={s.theorySectionNumText}>{idx + 1}</Text>
            </View>
            <Text style={s.theorySectionTitle}>
              {section.title?.vi || section.title?.de || `Phần ${idx + 1}`}
            </Text>
          </View>

          {section.content ? (
            <Text style={s.theoryText}>{section.content}</Text>
          ) : null}

          {section.table ? (
            <View style={s.tableWrap}>
              {section.table.headers?.length > 0 && (
                <View style={s.tableHeaderRow}>
                  {section.table.headers.map((h: string, hi: number) => (
                    <View key={hi} style={s.tableHeaderCell}>
                      <Text style={s.tableHeaderText}>{h}</Text>
                    </View>
                  ))}
                </View>
              )}
              {section.table.rows?.map((row: string[], ri: number) => (
                <View key={ri} style={[s.tableRow, ri % 2 === 0 && s.tableRowEven]}>
                  {row.map((cell: string, ci: number) => (
                    <View key={ci} style={s.tableCell}>
                      <Text style={[s.tableCellText, ci === 0 && s.tableCellBold]}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Exercise Item ──
function ExerciseItem({
  exercise,
  index,
  answer,
  onAnswer,
  feedback,
  submitted,
}: {
  exercise: Exercise;
  index: number;
  answer: string | string[] | undefined;
  onAnswer: (val: string | string[]) => void;
  feedback?: { correct: boolean; explanation?: any };
  submitted: boolean;
}) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const exerciseTypeColor = useMemo(() => buildExerciseTypeColor(colors), [colors]);
  const typeColor = exerciseTypeColor[exercise.exerciseType] || exerciseTypeColor.mcq;
  const question = exercise.questionVi || exercise.questionDe || '';

  return (
    <View style={[s.exerciseCard, feedback && (feedback.correct ? s.exerciseCorrect : s.exerciseWrong)]}>
      {/* Header */}
      <View style={s.exerciseHeader}>
        <View style={[s.exerciseTypeBadge, { backgroundColor: typeColor.dim }]}>
          <Text style={[s.exerciseTypeText, { color: typeColor.base }]}>
            {EXERCISE_TYPE_LABEL[exercise.exerciseType] || exercise.exerciseType}
          </Text>
        </View>
        <Text style={s.exerciseNum}>Câu {index + 1}</Text>
      </View>

      {/* Question */}
      <Text style={s.exerciseQuestion}>{question}</Text>

      {/* Answer area by type */}
      {exercise.exerciseType === 'mcq' && exercise.answerData?.options ? (
        <View style={s.mcqOptions}>
          {exercise.answerData.options.map((opt: string, oi: number) => {
            const selected = answer === String(oi);
            const isCorrect = submitted && feedback && oi === exercise.answerData.correctIndex;
            const isWrong = submitted && feedback && selected && !feedback.correct;

            return (
              <TouchableOpacity
                key={oi}
                disabled={submitted}
                onPress={() => onAnswer(String(oi))}
                style={[
                  s.mcqOption,
                  selected && !submitted && s.mcqOptionSelected,
                  isCorrect && s.mcqOptionCorrect,
                  isWrong && s.mcqOptionWrong,
                ]}
              >
                <View style={[s.mcqLetter, selected && !submitted && s.mcqLetterSelected]}>
                  <Text style={[s.mcqLetterText, selected && !submitted && s.mcqLetterTextSelected]}>
                    {String.fromCharCode(65 + oi)}
                  </Text>
                </View>
                <Text style={[s.mcqOptionText, isCorrect && s.mcqCorrectText, isWrong && s.mcqWrongText]}>
                  {opt}
                </Text>
                {isCorrect && <Ionicons name="checkmark-circle" size={18} color={colors.pastel.mint.base} />}
                {isWrong && <Ionicons name="close-circle" size={18} color={colors.pastel.rose.base} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <TextInput
          style={s.textInput}
          placeholder="Nhập câu trả lời..."
          placeholderTextColor={colors.text.tertiary}
          value={typeof answer === 'string' ? answer : ''}
          onChangeText={(t) => onAnswer(t)}
          editable={!submitted}
          autoCapitalize="none"
        />
      )}

      {/* Feedback */}
      {submitted && feedback && (
        <View style={[s.feedbackBar, feedback.correct ? s.feedbackCorrect : s.feedbackWrong]}>
          <Ionicons
            name={feedback.correct ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={feedback.correct ? colors.pastel.mint.base : colors.pastel.rose.base}
          />
          <Text style={[s.feedbackText, { color: feedback.correct ? colors.pastel.mint.base : colors.pastel.rose.base }]}>
            {feedback.correct ? 'Chính xác!' : 'Chưa đúng'}
          </Text>
          {feedback.explanation?.vi && (
            <Text style={s.feedbackExpl}>{feedback.explanation.vi}</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──
export default function GrammarLessonDetailScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('theory');
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: lesson, isLoading } = useGrammarLesson(slug!);
  const submitMutation = useSubmitGrammarExercises();

  const feedbackMap = submitted && submitMutation.data?.feedback
    ? Object.fromEntries(submitMutation.data.feedback.map((f) => [f.exerciseId, f]))
    : {};

  const handleAnswer = useCallback((exIndex: number, val: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [exIndex]: val }));
  }, []);

  const handleSubmit = () => {
    if (!lesson) return;
    const answeredCount = Object.keys(answers).length;
    const totalCount = lesson.exercises?.length || 0;

    if (answeredCount < totalCount) {
      Alert.alert('Chưa hoàn thành', `Bạn mới trả lời ${answeredCount}/${totalCount} câu. Tiếp tục nộp bài?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Nộp bài', onPress: doSubmit },
      ]);
    } else {
      doSubmit();
    }
  };

  const doSubmit = () => {
    if (!lesson) return;
    submitMutation.mutate(
      { lessonId: lesson.id, answers },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => Alert.alert('Lỗi', 'Không thể nộp bài. Vui lòng thử lại.'),
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color={colors.pastel.lavender.base} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Không tìm thấy bài học</Text>
        </View>
      </SafeAreaView>
    );
  }

  const exercises = lesson.exercises || [];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={s.flex1}>
          <Text style={s.headerTitle} numberOfLines={1}>{lesson.titleVi}</Text>
          <Text style={s.headerSub}>{lesson.titleDe}</Text>
        </View>
        <View style={[s.levelPill, { backgroundColor: colors.pastel.lavender.dim }]}>
          <Text style={[s.levelPillText, { color: colors.pastel.lavender.base }]}>{lesson.level}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(['theory', 'exercises'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[s.tab, activeTab === tab && s.tabActive]}
          >
            <Ionicons
              name={tab === 'theory' ? 'book-outline' : 'list-outline'}
              size={16}
              color={activeTab === tab ? colors.pastel.lime.base : colors.text.tertiary}
            />
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'theory' ? 'Lý thuyết' : `Bài tập (${exercises.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'theory' ? (
        <TheoryView content={lesson.theoryContent} />
      ) : (
        <ScrollView style={s.flex1} contentContainerStyle={s.exercisesList} showsVerticalScrollIndicator={false}>
          {/* Result card */}
          {submitted && submitMutation.data && (
            <View style={s.resultCard}>
              <Text style={s.resultScore}>{Math.round(submitMutation.data.score)}%</Text>
              <Text style={s.resultLabel}>
                {submitMutation.data.correctCount}/{submitMutation.data.totalQuestions} câu đúng
              </Text>
              <View style={[s.resultBadge, submitMutation.data.passed ? s.resultPassed : s.resultFailed]}>
                <Text style={s.resultBadgeText}>
                  {submitMutation.data.passed ? 'Đạt' : 'Chưa đạt'}
                </Text>
              </View>
            </View>
          )}

          {/* Progress */}
          {!submitted && exercises.length > 0 && (
            <View style={s.progressRow}>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${(Object.keys(answers).length / exercises.length) * 100}%` }]} />
              </View>
              <Text style={s.progressText}>
                {Object.keys(answers).length}/{exercises.length}
              </Text>
            </View>
          )}

          {/* Exercises */}
          {exercises.map((ex, i) => (
            <ExerciseItem
              key={ex.id}
              exercise={ex}
              index={i}
              answer={answers[i]}
              onAnswer={(val) => handleAnswer(i, val)}
              feedback={(feedbackMap as any)[ex.id]}
              submitted={submitted}
            />
          ))}

          {/* Submit button */}
          {!submitted && exercises.length > 0 && (
            <TouchableOpacity
              style={s.submitBtn}
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
              activeOpacity={0.8}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color={colors.pastel.lime.on} />
              ) : (
                <Text style={s.submitBtnText}>Nộp bài</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Retry button */}
          {submitted && (
            <TouchableOpacity
              style={s.retryBtn}
              onPress={() => { setSubmitted(false); setAnswers({}); submitMutation.reset(); }}
              activeOpacity={0.8}
            >
              <Text style={s.retryBtnText}>Làm lại</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.b0 },
  flex1: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.bg.b2,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold as any, color: colors.text.primary, fontFamily: typography.fontFamily.heading },
  headerSub: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  levelPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  levelPillText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold as any, fontFamily: typography.fontFamily.heading },

  // Tabs
  tabRow: {
    flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: radius.stone, backgroundColor: colors.bg.b2,
  },
  tabActive: { backgroundColor: colors.pastel.lime.dim },
  tabText: { fontSize: typography.fontSize.sm, color: colors.text.tertiary },
  tabTextActive: { color: colors.pastel.lime.base, fontWeight: typography.fontWeight.semibold as any, fontFamily: typography.fontFamily.heading },

  // Theory
  theoryContent: { paddingHorizontal: spacing.md, paddingBottom: 40 },
  theorySection: { marginBottom: spacing.xl },
  theorySectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  theorySectionNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.pastel.lavender.dim,
    alignItems: 'center', justifyContent: 'center',
  },
  theorySectionNumText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold as any, color: colors.pastel.lavender.base, fontFamily: typography.fontFamily.heading },
  theorySectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold as any, color: colors.text.primary, flex: 1, fontFamily: typography.fontFamily.heading },
  theoryText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 22 },

  // Table
  tableWrap: {
    marginTop: spacing.sm, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border.default,
  },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: colors.bg.b3 },
  tableHeaderCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 10 },
  tableHeaderText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold as any, color: colors.text.secondary, fontFamily: typography.fontFamily.heading },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border.subtle },
  tableRowEven: { backgroundColor: colors.bg.b1 },
  tableCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 10 },
  tableCellText: { fontSize: typography.fontSize.sm, color: colors.text.primary },
  tableCellBold: { fontWeight: typography.fontWeight.semibold as any, fontFamily: typography.fontFamily.heading },

  // Exercises
  exercisesList: { paddingHorizontal: spacing.md, gap: spacing.md },
  exerciseCard: {
    backgroundColor: colors.bg.b2, borderRadius: radius.stone, borderWidth: 1,
    borderColor: colors.border.default, padding: spacing.lg,
  },
  exerciseCorrect: { borderColor: colors.pastel.mint.base + '40' },
  exerciseWrong: { borderColor: colors.pastel.rose.base + '40' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  exerciseTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  exerciseTypeText: { fontSize: 10, fontWeight: typography.fontWeight.bold as any, fontFamily: typography.fontFamily.heading },
  exerciseNum: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  exerciseQuestion: { fontSize: typography.fontSize.base, color: colors.text.primary, marginBottom: spacing.md, lineHeight: 22, fontFamily: typography.fontFamily.body },

  // MCQ
  mcqOptions: { gap: spacing.sm },
  mcqOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.bg.b3,
    borderWidth: 1, borderColor: 'transparent',
  },
  mcqOptionSelected: { borderColor: colors.pastel.lavender.base, backgroundColor: colors.pastel.lavender.dim },
  mcqOptionCorrect: { borderColor: colors.pastel.mint.base, backgroundColor: colors.pastel.mint.dim },
  mcqOptionWrong: { borderColor: colors.pastel.rose.base, backgroundColor: colors.pastel.rose.dim },
  mcqLetter: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: colors.bg.b2,
    alignItems: 'center', justifyContent: 'center',
  },
  mcqLetterSelected: { backgroundColor: colors.pastel.lavender.base },
  mcqLetterText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold as any, color: colors.text.secondary, fontFamily: typography.fontFamily.bodyBold },
  mcqLetterTextSelected: { color: colors.pastel.lavender.on },
  mcqOptionText: { flex: 1, fontSize: typography.fontSize.sm, color: colors.text.primary, fontFamily: typography.fontFamily.body },
  mcqCorrectText: { color: colors.pastel.mint.base },
  mcqWrongText: { color: colors.pastel.rose.base },

  // Text input
  textInput: {
    backgroundColor: colors.bg.b3, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border.default, padding: spacing.sm,
    fontSize: typography.fontSize.sm, color: colors.text.primary,
    fontFamily: typography.fontFamily.body,
  },

  // Feedback
  feedbackBar: {
    marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center',
    gap: 6, padding: spacing.sm, borderRadius: radius.md,
  },
  feedbackCorrect: { backgroundColor: colors.pastel.mint.dim },
  feedbackWrong: { backgroundColor: colors.pastel.rose.dim },
  feedbackText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold as any, fontFamily: typography.fontFamily.bodySemibold },
  feedbackExpl: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginLeft: 4 },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.bg.b3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.pastel.lime.base },
  progressText: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, fontFamily: typography.fontFamily.body },

  // Result
  resultCard: {
    backgroundColor: colors.bg.b2, borderRadius: radius.stone, padding: spacing.xl,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border.default,
  },
  resultScore: { fontSize: 48, fontWeight: typography.fontWeight.black as any, color: colors.pastel.lime.base, fontFamily: typography.fontFamily.bodyBlack },
  resultLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 4 },
  resultBadge: { marginTop: spacing.sm, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  resultPassed: { backgroundColor: colors.pastel.mint.dim },
  resultFailed: { backgroundColor: colors.pastel.rose.dim },
  resultBadgeText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold as any, color: colors.text.primary, fontFamily: typography.fontFamily.bodyBold },

  // Buttons
  submitBtn: {
    height: 50, borderRadius: radius.pill, backgroundColor: colors.pastel.lime.base,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.black as any, color: colors.pastel.lime.on, fontFamily: typography.fontFamily.bodyBlack },
  retryBtn: {
    height: 50, borderRadius: radius.pill, backgroundColor: colors.bg.b2,
    borderWidth: 1, borderColor: colors.border.default,
    alignItems: 'center', justifyContent: 'center',
  },
  retryBtnText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary, fontFamily: typography.fontFamily.bodySemibold },

  // Empty
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: typography.fontSize.base, color: colors.text.tertiary, fontFamily: typography.fontFamily.body },
});
