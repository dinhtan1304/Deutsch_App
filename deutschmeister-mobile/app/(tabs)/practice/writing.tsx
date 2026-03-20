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
import {
  useWritingTopics,
  useGeneratePrompt,
  useSubmitWriting,
  useSaveDraft,
} from '@/hooks/useWriting';
import type { WritingSession } from '@/lib/api/writing';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const LEVELS = ['A1', 'A2', 'B1'] as const;

const WRITING_TYPES = [
  { value: 'email', labelVi: 'Email', icon: 'mail-outline' as const },
  { value: 'letter', labelVi: 'Thư', icon: 'document-text-outline' as const },
  { value: 'essay', labelVi: 'Bài luận', icon: 'newspaper-outline' as const },
];

// ── Screen ──

export default function WritingPracticeScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Setup state
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedType, setSelectedType] = useState('email');
  const [topicInput, setTopicInput] = useState('');

  // Session state
  const [session, setSession] = useState<WritingSession | null>(null);
  const [userText, setUserText] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Queries / mutations
  const { data: topicsData } = useWritingTopics(selectedLevel);
  const generateMutation = useGeneratePrompt();
  const submitMutation = useSubmitWriting();
  const saveDraftMutation = useSaveDraft();

  const wordCount = useMemo(() => {
    return userText.trim().split(/\s+/).filter(Boolean).length;
  }, [userText]);

  const topics = topicsData?.topics || [];

  // ── Handlers ──

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        cefrLevel: selectedLevel,
        topic: topicInput || 'Alltag',
        writingType: selectedType,
        wordCountMin: selectedLevel === 'A1' ? 30 : selectedLevel === 'A2' ? 40 : 80,
        wordCountMax: selectedLevel === 'A1' ? 60 : selectedLevel === 'A2' ? 80 : 150,
      });
      setSession(result);
      setUserText('');
      setShowResults(false);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 300, animated: true }), 300);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo đề bài. Vui lòng thử lại.');
    }
  };

  const handleSaveDraft = async () => {
    if (!session || !userText.trim()) return;
    try {
      await saveDraftMutation.mutateAsync({ id: session.id, userText });
      Alert.alert('Đã lưu', 'Bản nháp đã được lưu thành công.');
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu nháp.');
    }
  };

  const handleSubmit = async () => {
    if (!session) return;
    if (wordCount < 20) {
      Alert.alert('Quá ngắn', 'Bài viết cần ít nhất 20 từ.');
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        id: session.id,
        userText,
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
    setUserText('');
    setShowResults(false);
  };

  // Score color helper
  const getScoreColor = (score: number): [string, string] => {
    if (score >= 80) return colors.gradient.correct;
    if (score >= 60) return colors.gradient.warning;
    return colors.gradient.danger;
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
            colors={colors.gradient.writing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.flex1}>
            <Text style={styles.headerTitle}>Luyện Viết</Text>
            <Text style={styles.headerSubtitle}>Schreibübung</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={styles.flex1} showsVerticalScrollIndicator={false}>
          {/* ====== Results Section ====== */}
          {showResults && session?.status === 'GRADED' && session.overallScore != null && (
            <View style={styles.resultsBannerWrap}>
              <LinearGradient
                colors={getScoreColor(session.overallScore)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultsBannerGradient}
              >
                <View style={styles.resultsBannerRow}>
                  <View>
                    <Text style={styles.resultLabel}>Điểm tổng</Text>
                    <Text style={styles.resultScoreLarge}>
                      {Math.round(session.overallScore)}%
                    </Text>
                    <Text style={styles.resultPercent}>
                      {session.wordCount} từ · {session.errors?.length ?? 0} lỗi
                    </Text>
                  </View>
                  <View style={styles.resultIconCircle}>
                    <Ionicons
                      name={session.overallScore >= 70 ? 'trophy' : 'refresh'}
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

          {/* Grading status (polling) */}
          {session?.status === 'GRADING' && (
            <View style={styles.gradingStatusCard}>
              <ActivityIndicator color={colors.pastel.lime.base} size="small" />
              <Text style={styles.gradingStatusText}>
                AI đang chấm bài viết của bạn...
              </Text>
            </View>
          )}

          {/* ====== Feedback Details ====== */}
          {showResults && session?.status === 'GRADED' && (
            <View style={styles.sectionPadding}>
              {/* Strengths */}
              {session.strengths && session.strengths.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.strengthsTitle}>Điểm mạnh</Text>
                  {session.strengths.map((s, i) => (
                    <View key={i} style={styles.feedbackRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.semantic.correct} />
                      <Text style={styles.feedbackText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Improvements */}
              {session.improvements && session.improvements.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.improvementsTitle}>Cần cải thiện</Text>
                  {session.improvements.map((s, i) => (
                    <View key={i} style={styles.feedbackRow}>
                      <Ionicons name="alert-circle" size={16} color={colors.pastel.peach.base} />
                      <Text style={styles.feedbackText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Errors */}
              {session.errors && session.errors.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.errorsTitle}>
                    Lỗi ({session.errors.length})
                  </Text>
                  {session.errors.map((err) => (
                    <View key={err.id} style={styles.errorItem}>
                      <View style={styles.errorHeaderRow}>
                        <View
                          style={[
                            styles.severityTag,
                            {
                              backgroundColor:
                                err.severity === 'error'
                                  ? colors.pastel.rose.dim
                                  : err.severity === 'warning'
                                  ? colors.pastel.peach.dim
                                  : colors.pastel.lavender.dim,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.severityTagText,
                              {
                                color:
                                  err.severity === 'error'
                                    ? colors.pastel.rose.base
                                    : err.severity === 'warning'
                                    ? colors.pastel.peach.base
                                    : colors.pastel.lime.base,
                              },
                            ]}
                          >
                            {err.severity === 'error'
                              ? 'Lỗi'
                              : err.severity === 'warning'
                              ? 'Cảnh báo'
                              : 'Gợi ý'}
                          </Text>
                        </View>
                        <Text style={styles.errorTypeText}>{err.errorType}</Text>
                      </View>
                      <Text style={styles.errorOriginalText}>{err.originalText}</Text>
                      <Text style={styles.errorCorrectedText}>{err.correctedText}</Text>
                      <Text style={styles.errorExplanation}>{err.explanationVi}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Corrected Text */}
              {session.correctedText && (
                <View style={styles.card}>
                  <Text style={styles.correctedTitle}>Bài viết đã sửa</Text>
                  <Text style={styles.correctedBody}>{session.correctedText}</Text>
                </View>
              )}

              {/* Feedback */}
              {session.feedbackVi && (
                <View style={styles.card}>
                  <Text style={styles.correctedTitle}>Nhận xét</Text>
                  <Text style={styles.feedbackBody}>{session.feedbackVi}</Text>
                </View>
              )}
            </View>
          )}

          {/* ====== Setup Section ====== */}
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
                        ? styles.levelBtnActiveWriting
                        : styles.levelBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelBtnText,
                        selectedLevel === level
                          ? styles.levelBtnTextActiveWriting
                          : styles.levelBtnTextInactive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Writing Type */}
              <Text style={styles.sectionLabel}>Dạng bài</Text>
              <View style={styles.levelRow}>
                {WRITING_TYPES.map((wt) => (
                  <TouchableOpacity
                    key={wt.value}
                    onPress={() => setSelectedType(wt.value)}
                    style={[
                      styles.writingTypeBtn,
                      selectedType === wt.value
                        ? styles.writingTypeBtnActive
                        : styles.writingTypeBtnInactive,
                    ]}
                  >
                    <Ionicons
                      name={wt.icon}
                      size={16}
                      color={selectedType === wt.value ? colors.pastel.lavender.base : colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.writingTypeBtnText,
                        selectedType === wt.value
                          ? styles.writingTypeBtnTextActive
                          : styles.writingTypeBtnTextInactive,
                      ]}
                    >
                      {wt.labelVi}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Topic */}
              <Text style={styles.sectionLabel}>Chủ đề (tùy chọn)</Text>
              <TextInput
                style={styles.topicInput}
                placeholder="VD: Einladung, Urlaub, Beschwerde..."
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
                  colors={colors.gradient.writing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateBtn}
                >
                  {generateMutation.isPending ? (
                    <View style={styles.btnInnerRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.btnText}>Đang tạo đề bài...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInnerRow}>
                      <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                      <Text style={styles.btnText}>Tạo đề bài</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ====== Writing Session ====== */}
          {session && !showResults && session.status !== 'GRADING' && (
            <View style={styles.sectionPadding}>
              {/* Prompt Card */}
              <View style={styles.card}>
                <View style={styles.tagRow}>
                  <View style={styles.levelTagWriting}>
                    <Text style={styles.levelTagTextWriting}>{session.cefrLevel}</Text>
                  </View>
                  <Text style={styles.textTypeLabelSmall}>{session.writingType}</Text>
                </View>
                <Text style={styles.promptLabel}>Đề bài</Text>
                <Text style={styles.promptBody}>{session.prompt}</Text>
              </View>

              {/* Hints */}
              {(session.vocabHints?.length > 0 || session.grammarHints?.length > 0) && (
                <View style={styles.card}>
                  {session.vocabHints?.length > 0 && (
                    <View style={styles.hintBlock}>
                      <Text style={styles.hintTitle}>Gợi ý từ vựng</Text>
                      <Text style={styles.hintText}>
                        {session.vocabHints.join(' · ')}
                      </Text>
                    </View>
                  )}
                  {session.grammarHints?.length > 0 && (
                    <View>
                      <Text style={styles.hintTitle}>Gợi ý ngữ pháp</Text>
                      <Text style={styles.hintText}>
                        {session.grammarHints.join(' · ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Writing Area */}
              <View style={styles.card}>
                <TextInput
                  style={styles.writingArea}
                  placeholder="Viết bài của bạn ở đây..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  textAlignVertical="top"
                  value={userText}
                  onChangeText={setUserText}
                />
              </View>

              {/* Word Count */}
              <View style={styles.wordCountRow}>
                <Text style={styles.wordCountText}>
                  {wordCount} từ
                  {session.wordCountMin > 0 && (
                    <Text>
                      {' '}
                      / {session.wordCountMin}-{session.wordCountMax} từ yêu cầu
                    </Text>
                  )}
                </Text>
                {wordCount >= (session.wordCountMin || 20) && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.semantic.correct} />
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                  style={styles.draftBtn}
                >
                  <View style={styles.btnInnerRow}>
                    <Ionicons name="save-outline" size={16} color={colors.text.secondary} />
                    <Text style={styles.draftBtnText}>Lưu nháp</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitMutation.isPending || wordCount < 20}
                  activeOpacity={0.8}
                  style={styles.submitBtnWrap}
                >
                  <LinearGradient
                    colors={colors.gradient.writing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.submitBtnGradient, { opacity: wordCount < 20 ? 0.5 : 1 }]}
                  >
                    {submitMutation.isPending ? (
                      <View style={styles.btnInnerRow}>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.btnText}>Đang nộp...</Text>
                      </View>
                    ) : (
                      <View style={styles.btnInnerRow}>
                        <Ionicons name="send" size={16} color="#FFFFFF" />
                        <Text style={styles.btnText}>Nộp & chấm AI</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

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
  resultScoreLarge: {
    fontSize: 36,
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
    fontFamily: typography.fontFamily.bodyBold,
    color: '#FFFFFF',
  },
  // Grading status
  gradingStatusCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius['2xl'],
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: 16,
  },
  gradingStatusText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Section
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
  levelBtnActiveWriting: {
    backgroundColor: colors.pastel.lavender.dim,
  },
  levelBtnInactive: {
    backgroundColor: colors.bg.b2,
  },
  levelBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  levelBtnTextActiveWriting: {
    color: colors.pastel.lavender.base,
  },
  levelBtnTextInactive: {
    color: colors.text.secondary,
  },
  // Writing type
  writingTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.stone,
    paddingVertical: 12,
  },
  writingTypeBtnActive: {
    backgroundColor: colors.pastel.lavender.dim,
  },
  writingTypeBtnInactive: {
    backgroundColor: colors.bg.b2,
  },
  writingTypeBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  writingTypeBtnTextActive: {
    color: colors.pastel.lavender.base,
  },
  writingTypeBtnTextInactive: {
    color: colors.text.secondary,
  },
  // Topic input
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
  mb5: {
    marginBottom: 20,
  },
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
  // Generate button
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
    marginBottom: 12,
    borderRadius: radius['2xl'],
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: 16,
  },
  // Feedback
  strengthsTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.mint.base,
  },
  improvementsTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.peach.base,
  },
  errorsTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.rose.base,
  },
  feedbackRow: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Error item
  errorItem: {
    marginBottom: 12,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b3,
    padding: 12,
  },
  errorHeaderRow: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityTag: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  severityTagText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  errorTypeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  errorOriginalText: {
    fontSize: typography.fontSize.xs,
    color: colors.pastel.rose.base,
    textDecorationLine: 'line-through',
  },
  errorCorrectedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.pastel.mint.base,
  },
  errorExplanation: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Corrected text / feedback
  correctedTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.lavender.base,
  },
  correctedBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  feedbackBody: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  // Prompt
  tagRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTagWriting: {
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.pastel.lavender.dim,
  },
  levelTagTextWriting: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lavender.base,
  },
  textTypeLabelSmall: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  promptLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  promptBody: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  // Hints
  hintBlock: {
    marginBottom: 8,
  },
  hintTitle: {
    marginBottom: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.lavender.base,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Writing area
  writingArea: {
    minHeight: 200,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    lineHeight: 24,
    color: colors.text.primary,
  },
  // Word count
  wordCountRow: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  wordCountText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  draftBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    paddingVertical: 14,
  },
  draftBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.secondary,
  },
  submitBtnWrap: {
    flex: 2,
    overflow: 'hidden',
    borderRadius: radius.stone,
  },
  submitBtnGradient: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  // Spacers
  spacer8: {
    height: 32,
  },
  spacer4: {
    height: 16,
  },
});
