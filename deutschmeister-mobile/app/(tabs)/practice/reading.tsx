import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useReadingTopics, useGenerateReading, useSubmitReading } from '@/hooks/useReading';
import type { ReadingSession } from '@/lib/api/reading';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const LEVELS = ['A1', 'A2', 'B1'] as const;

// ── Screen ──

export default function ReadingPracticeScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Setup state
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [topicInput, setTopicInput] = useState('');
  const [selectedTextType, setSelectedTextType] = useState<string>('');

  // Session state
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  // Queries / mutations
  const { data: topicsData, isLoading: loadingTopics } = useReadingTopics(selectedLevel);
  const generateMutation = useGenerateReading();
  const submitMutation = useSubmitReading();

  const textTypes = topicsData?.textTypes || [];
  const topics = topicsData?.topics || [];

  // ── Handlers ──

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        cefrLevel: selectedLevel,
        topic: topicInput || 'Alltag',
        textType: selectedTextType || (textTypes[0]?.value ?? 'dialog'),
        questionCount: 5,
      });
      setSession(result);
      setUserAnswers({});
      setShowResults(false);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 400, animated: true }), 300);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo bài đọc. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async () => {
    if (!session) return;
    const unanswered = session.questions.filter((q) => !userAnswers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert('Chưa hoàn thành', `Bạn còn ${unanswered.length} câu chưa trả lời.`);
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        id: session.id,
        userAnswers,
      });
      setSession(result);
      setShowResults(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  const handleReset = () => {
    setSession(null);
    setUserAnswers({});
    setShowResults(false);
  };

  // ── Render ──

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <LinearGradient
            colors={colors.gradient.reading}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Ionicons name="book-outline" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.flex1}>
            <Text style={styles.headerTitle}>Luyện Đọc</Text>
            <Text style={styles.headerSubtitle}>Leseübung</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={styles.flex1} showsVerticalScrollIndicator={false}>
          {/* ====== Results Banner ====== */}
          {showResults && session?.status === 'GRADED' && (
            <View style={styles.resultsBannerWrap}>
              <LinearGradient
                colors={
                  (session.score ?? 0) >= 70
                    ? colors.gradient.reading
                    : (session.score ?? 0) >= 40
                    ? colors.gradient.warning
                    : colors.gradient.danger
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultsBannerGradient}
              >
                <View style={styles.resultsBannerRow}>
                  <View>
                    <Text style={styles.resultLabel}>Kết quả</Text>
                    <Text style={styles.resultScore}>
                      {session.correctCount}/{session.totalQuestions}
                    </Text>
                    <Text style={styles.resultPercent}>
                      Điểm: {Math.round(session.score ?? 0)}%
                    </Text>
                  </View>
                  <View style={styles.resultIconCircle}>
                    <Ionicons
                      name={(session.score ?? 0) >= 70 ? 'trophy' : 'refresh'}
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleReset} style={styles.resultResetBtn}>
                  <Text style={styles.resultResetText}>Làm bài mới</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* ====== Setup Section (hidden when session active + no results) ====== */}
          {!session && (
            <View style={styles.sectionPadding}>
              {/* Level Selection */}
              <Text style={styles.sectionLabel}>Trình độ</Text>
              <View style={styles.levelRow}>
                {LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setSelectedLevel(level)}
                    style={[
                      styles.levelBtn,
                      selectedLevel === level
                        ? styles.levelBtnActiveReading
                        : styles.levelBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelBtnText,
                        selectedLevel === level
                          ? styles.levelBtnTextActiveReading
                          : styles.levelBtnTextInactive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Text Type Selection */}
              {textTypes.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Loại văn bản</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.mb4}
                  >
                    {textTypes.map((tt) => (
                      <TouchableOpacity
                        key={tt.value}
                        onPress={() => setSelectedTextType(tt.value)}
                        style={[
                          styles.textTypeChip,
                          selectedTextType === tt.value
                            ? styles.textTypeChipActiveReading
                            : styles.textTypeChipInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.textTypeChipText,
                            selectedTextType === tt.value
                              ? styles.textTypeChipTextActiveReading
                              : styles.textTypeChipTextInactive,
                          ]}
                        >
                          {tt.labelVi}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Topic Input */}
              <Text style={styles.sectionLabel}>Chủ đề (tùy chọn)</Text>
              <TextInput
                style={styles.topicInput}
                placeholder="VD: Einkaufen, Reisen, Familie..."
                placeholderTextColor={colors.text.tertiary}
                value={topicInput}
                onChangeText={setTopicInput}
              />

              {/* Quick Topic Chips */}
              {topics.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.mb5}
                >
                  {topics.slice(0, 8).map((t) => (
                    <TouchableOpacity
                      key={t.topic}
                      onPress={() => setTopicInput(t.topic)}
                      style={styles.quickTopicChip}
                    >
                      <Text style={styles.quickTopicChipText}>{t.labelVi}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Generate Button */}
              <TouchableOpacity
                onPress={handleGenerate}
                disabled={generateMutation.isPending}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradient.reading}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateBtn}
                >
                  {generateMutation.isPending ? (
                    <View style={styles.btnInnerRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.btnText}>Đang tạo bài đọc...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInnerRow}>
                      <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                      <Text style={styles.btnText}>Tạo bài đọc</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ====== Passage ====== */}
          {session && (
            <View style={styles.sectionPadding}>
              {/* Title */}
              <View style={styles.card}>
                <View style={styles.tagRow}>
                  <View style={styles.levelTagReading}>
                    <Text style={styles.levelTagTextReading}>{session.cefrLevel}</Text>
                  </View>
                  <Text style={styles.textTypeLabelSmall}>{session.textType}</Text>
                </View>
                <Text style={styles.passageTitle}>{session.title}</Text>
              </View>

              {/* Passage Text */}
              <View style={styles.card}>
                <Text style={styles.passageText}>{session.passage}</Text>
              </View>

              {/* Vocab Highlights */}
              {session.vocabHighlights && session.vocabHighlights.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.vocabTitle}>Từ vựng quan trọng</Text>
                  <View style={styles.vocabWrap}>
                    {session.vocabHighlights.map((v, idx) => (
                      <View key={idx} style={styles.vocabChip}>
                        <Text style={styles.vocabWord}>{v.word}</Text>
                        <Text style={styles.vocabTranslation}>{v.translation}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Questions */}
              <Text style={styles.questionsHeader}>
                Câu hỏi ({session.questions.length})
              </Text>

              {session.questions.map((q, qIndex) => {
                const isGraded = showResults && session.gradingDetails;
                const grading = session.gradingDetails?.find((g) => g.questionId === q.id);

                return (
                  <View key={q.id} style={styles.card}>
                    <Text style={styles.questionText}>
                      {qIndex + 1}. {q.questionText}
                    </Text>

                    {q.options.map((opt) => {
                      const isSelected = userAnswers[q.id] === opt.id;
                      const isCorrect = isGraded && q.correctAnswer === opt.id;
                      const isWrong = isGraded && isSelected && !isCorrect;

                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() => {
                            if (!showResults) {
                              setUserAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                            }
                          }}
                          disabled={showResults}
                          style={[
                            styles.optionBtn,
                            {
                              borderWidth: (isSelected || (isGraded && isCorrect) || (isGraded && isWrong)) ? 1.5 : 0,
                              borderColor:
                                isGraded && isCorrect
                                  ? colors.semantic.correct
                                  : isGraded && isWrong
                                  ? colors.pastel.rose.base
                                  : isSelected
                                  ? colors.semantic.correct
                                  : 'transparent',
                              backgroundColor:
                                isGraded && isCorrect
                                  ? colors.pastel.mint.dim
                                  : isGraded && isWrong
                                  ? colors.pastel.rose.dim
                                  : !isGraded && isSelected
                                  ? colors.pastel.mint.dim
                                  : colors.bg.b3,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.optionCircle,
                              {
                                backgroundColor:
                                  isGraded && isCorrect
                                    ? colors.semantic.correct
                                    : isGraded && isWrong
                                    ? colors.pastel.rose.base
                                    : isSelected
                                    ? colors.semantic.correct
                                    : colors.bg.b3,
                              },
                            ]}
                          >
                            {isGraded && isCorrect ? (
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            ) : isGraded && isWrong ? (
                              <Ionicons name="close" size={14} color="#FFFFFF" />
                            ) : (
                              <Text style={styles.optionCircleText}>
                                {opt.id.toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.optionText,
                              isGraded && isCorrect
                                ? styles.optionTextCorrect
                                : isGraded && isWrong
                                ? styles.optionTextWrong
                                : styles.optionTextDefault,
                            ]}
                          >
                            {opt.text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Explanation */}
                    {isGraded && grading && (
                      <View
                        style={[
                          styles.explanationBox,
                          {
                            backgroundColor: grading.isCorrect
                              ? colors.pastel.mint.dim
                              : colors.pastel.rose.dim,
                          },
                        ]}
                      >
                        <Text style={styles.explanationText}>{grading.explanationVi}</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Submit Button */}
              {!showResults && (
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitMutation.isPending}
                  activeOpacity={0.8}
                  style={styles.mb4}
                >
                  <LinearGradient
                    colors={colors.gradient.reading}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.generateBtn}
                  >
                    {submitMutation.isPending ? (
                      <View style={styles.btnInnerRow}>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.btnText}>Đang chấm điểm...</Text>
                      </View>
                    ) : (
                      <View style={styles.btnInnerRow}>
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.btnText}>Nộp bài</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={styles.spacer8} />
            </View>
          )}

          <View style={styles.spacer4} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    paddingTop: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerIcon: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.stone,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Results Banner
  resultsBannerWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
  resultsBannerGradient: {
    padding: 20,
  },
  resultsBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: 'rgba(255,255,255,0.8)',
  },
  resultScore: {
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: '#FFFFFF',
  },
  resultPercent: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: 'rgba(255,255,255,0.7)',
  },
  resultIconCircle: {
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  resultResetBtn: {
    marginTop: 16,
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
  },
  resultResetText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: '#FFFFFF',
  },
  // Setup Section
  sectionPadding: {
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  levelRow: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    gap: 8,
  },
  levelBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    paddingVertical: 12,
  },
  levelBtnActiveReading: {
    backgroundColor: colors.pastel.mint.dim,
  },
  levelBtnInactive: {
    backgroundColor: colors.bg.b2,
  },
  levelBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  levelBtnTextActiveReading: {
    color: colors.pastel.mint.base,
  },
  levelBtnTextInactive: {
    color: colors.text.secondary,
  },
  // Text Type
  mb4: {
    marginBottom: spacing.md,
  },
  mb5: {
    marginBottom: 20,
  },
  textTypeChip: {
    marginRight: 8,
    borderRadius: radius.stone,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textTypeChipActiveReading: {
    backgroundColor: colors.pastel.mint.dim,
  },
  textTypeChipInactive: {
    backgroundColor: colors.bg.b2,
  },
  textTypeChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  textTypeChipTextActiveReading: {
    color: colors.pastel.mint.base,
  },
  textTypeChipTextInactive: {
    color: colors.text.secondary,
  },
  // Topic Input
  topicInput: {
    marginBottom: spacing.md,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  // Quick topic chips
  quickTopicChip: {
    marginRight: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickTopicChipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Generate Button
  generateBtn: {
    alignItems: 'center',
    borderRadius: radius['2xl'],
    paddingVertical: 16,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: '#FFFFFF',
  },
  // Card
  card: {
    marginBottom: spacing.md,
    borderRadius: radius['2xl'],
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: 16,
  },
  // Passage
  tagRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTagReading: {
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.pastel.mint.dim,
  },
  levelTagTextReading: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.mint.base,
  },
  textTypeLabelSmall: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  passageTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  passageText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  // Vocab
  vocabTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.mint.base,
  },
  vocabWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vocabChip: {
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  vocabWord: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  vocabTranslation: {
    fontSize: 10,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Questions
  questionsHeader: {
    marginBottom: 12,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  questionText: {
    marginBottom: 12,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  optionBtn: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.stone,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionCircle: {
    marginRight: 12,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  optionCircleText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.secondary,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
  },
  optionTextCorrect: {
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.pastel.mint.base,
  },
  optionTextWrong: {
    color: colors.pastel.rose.base,
  },
  optionTextDefault: {
    color: colors.text.secondary,
  },
  // Explanation
  explanationBox: {
    marginTop: 8,
    borderRadius: radius.lg,
    padding: 12,
  },
  explanationText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Spacers
  spacer8: {
    height: 32,
  },
  spacer4: {
    height: 16,
  },
});
