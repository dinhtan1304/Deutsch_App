import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
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
import * as Speech from 'expo-speech';
import { useGenerateListening, useSubmitListening } from '@/hooks/useListening';
import type { ListeningSession } from '@/lib/api/listening';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const LEVELS = ['A1', 'A2', 'B1'] as const;

const SCRIPT_TYPES = [
  { value: 'dialogue', labelVi: 'Hội thoại', icon: 'chatbubbles-outline' as const },
  { value: 'monologue', labelVi: 'Độc thoại', icon: 'person-outline' as const },
  { value: 'announcement', labelVi: 'Thông báo', icon: 'megaphone-outline' as const },
  { value: 'interview', labelVi: 'Phỏng vấn', icon: 'mic-outline' as const },
];

// ── Screen ──

export default function ListeningPracticeScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Setup state
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedScriptType, setSelectedScriptType] = useState('dialogue');

  // Session state
  const [session, setSession] = useState<ListeningSession | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cleanup TTS on unmount or session change
  useEffect(() => {
    return () => { Speech.stop(); };
  }, [session]);

  const handlePlayAudio = useCallback(() => {
    if (!session?.transcript) return;
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(session.transcript, {
      language: 'de-DE',
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [session?.transcript, isSpeaking]);

  // Queries / mutations
  const generateMutation = useGenerateListening();
  const submitMutation = useSubmitListening();

  // ── Handlers ──

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        cefrLevel: selectedLevel,
        scriptType: selectedScriptType,
      });
      setSession(result);
      setUserAnswers({});
      setShowResults(false);
      setShowTranscript(false);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 300, animated: true }), 300);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo bài nghe. Vui lòng thử lại.');
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
    setShowTranscript(false);
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
            colors={colors.gradient.listening}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Ionicons name="ear-outline" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.flex1}>
            <Text style={styles.headerTitle}>Luyện Nghe</Text>
            <Text style={styles.headerSubtitle}>Hörübung</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={styles.flex1} showsVerticalScrollIndicator={false}>
          {/* ====== Results Banner ====== */}
          {showResults && session?.status === 'GRADED' && (
            <View style={styles.resultsBannerWrap}>
              <LinearGradient
                colors={
                  (session.score ?? 0) >= 70
                    ? colors.gradient.correct
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
                      {session.correctCount}/{session.totalQ}
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
                        ? styles.levelBtnActiveListening
                        : styles.levelBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelBtnText,
                        selectedLevel === level
                          ? styles.levelBtnTextActiveListening
                          : styles.levelBtnTextInactive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Script Type Selection */}
              <Text style={styles.sectionLabel}>Dạng bài nghe</Text>
              <View style={styles.scriptTypeWrap}>
                {SCRIPT_TYPES.map((st) => (
                  <TouchableOpacity
                    key={st.value}
                    onPress={() => setSelectedScriptType(st.value)}
                    style={[
                      styles.scriptTypeChip,
                      selectedScriptType === st.value
                        ? styles.scriptTypeChipActive
                        : styles.scriptTypeChipInactive,
                    ]}
                  >
                    <Ionicons
                      name={st.icon}
                      size={16}
                      color={selectedScriptType === st.value ? colors.pastel.peach.base : colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.scriptTypeChipText,
                        selectedScriptType === st.value
                          ? styles.scriptTypeChipTextActive
                          : styles.scriptTypeChipTextInactive,
                      ]}
                    >
                      {st.labelVi}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                onPress={handleGenerate}
                disabled={generateMutation.isPending}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradient.listening}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateBtn}
                >
                  {generateMutation.isPending ? (
                    <View style={styles.btnInnerRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.btnText}>Đang tạo bài nghe...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInnerRow}>
                      <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                      <Text style={styles.btnText}>Tạo bài nghe</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ====== Session Content ====== */}
          {session && (
            <View style={styles.sectionPadding}>
              {/* Title Card */}
              <View style={styles.card}>
                <View style={styles.tagRow}>
                  <View style={styles.levelTagListening}>
                    <Text style={styles.levelTagTextListening}>{session.cefrLevel}</Text>
                  </View>
                  <Text style={styles.textTypeLabelSmall}>{session.scriptType}</Text>
                </View>
                <Text style={styles.sessionTitle}>{session.title}</Text>
              </View>

              {/* Audio Player (TTS) */}
              <View style={styles.card}>
                <View style={styles.audioRow}>
                  <TouchableOpacity style={styles.playBtn} onPress={handlePlayAudio}>
                    <Ionicons
                      name={isSpeaking ? 'stop' : 'play'}
                      size={24}
                      color={colors.pastel.peach.base}
                    />
                  </TouchableOpacity>
                  <View style={styles.flex1}>
                    <Text style={styles.audioLabel}>
                      {isSpeaking ? 'Đang phát...' : 'Nghe bài'}
                    </Text>
                    <Text style={styles.audioHint}>
                      {isSpeaking ? 'Nhấn để dừng' : 'Nhấn để nghe phát âm tiếng Đức'}
                    </Text>
                  </View>
                </View>

                {/* Transcript toggle */}
                <TouchableOpacity
                  onPress={() => setShowTranscript(!showTranscript)}
                  style={styles.transcriptToggle}
                >
                  <Ionicons
                    name={showTranscript ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={colors.pastel.peach.base}
                  />
                  <Text style={styles.transcriptToggleText}>
                    {showTranscript ? 'Ẩn transcript' : 'Hiện transcript'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Transcript */}
              {showTranscript && session.transcript && (
                <View style={styles.card}>
                  <Text style={styles.transcriptTitle}>Transcript</Text>
                  <Text style={styles.transcriptBody}>{session.transcript}</Text>
                </View>
              )}

              {/* Questions */}
              <Text style={styles.questionsHeader}>
                Câu hỏi ({session.questions.length})
              </Text>

              {session.questions.map((q, qIndex) => {
                const isGraded = showResults && session.status === 'GRADED';

                return (
                  <View key={q.id} style={styles.card}>
                    <View style={styles.qTypeRow}>
                      <View style={styles.qTypeBadge}>
                        <Text style={styles.qTypeBadgeText}>
                          {q.type === 'richtig_falsch' ? 'R/F' : 'MC'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.questionText}>
                      {qIndex + 1}. {q.questionText}
                    </Text>

                    {q.type === 'richtig_falsch' ? (
                      // Richtig / Falsch buttons
                      <View style={styles.rfRow}>
                        {[
                          { id: 'richtig', label: 'Richtig' },
                          { id: 'falsch', label: 'Falsch' },
                        ].map((opt) => {
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
                                styles.rfBtn,
                                {
                                  borderWidth: isSelected || (isGraded && isCorrect) ? 1.5 : 0,
                                  borderColor: isGraded && isCorrect
                                    ? colors.semantic.correct
                                    : isGraded && isWrong
                                    ? colors.semantic.wrong
                                    : isSelected
                                    ? colors.pastel.peach.base
                                    : 'transparent',
                                  backgroundColor: isGraded && isCorrect
                                    ? colors.pastel.mint.dim
                                    : isGraded && isWrong
                                    ? colors.pastel.rose.dim
                                    : isSelected
                                    ? colors.pastel.peach.dim
                                    : colors.bg.b3,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.rfBtnText,
                                  isGraded && isCorrect
                                    ? { color: colors.pastel.mint.base }
                                    : isGraded && isWrong
                                    ? { color: colors.pastel.rose.base }
                                    : isSelected
                                    ? { color: colors.pastel.peach.base }
                                    : { color: colors.text.secondary },
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      // Multiple choice options
                      (q.options || []).map((opt) => {
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
                              styles.mcOptionBtn,
                              {
                                borderWidth: (isSelected || (isGraded && isCorrect)) ? 1.5 : 0,
                                borderColor: isGraded && isCorrect
                                  ? colors.semantic.correct
                                  : isGraded && isWrong
                                  ? colors.semantic.wrong
                                  : isSelected
                                  ? colors.pastel.peach.base
                                  : 'transparent',
                                backgroundColor: isGraded && isCorrect
                                  ? colors.pastel.mint.dim
                                  : isGraded && isWrong
                                  ? colors.pastel.rose.dim
                                  : isSelected
                                  ? colors.pastel.peach.dim
                                  : colors.bg.b3,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.optionCircle,
                                {
                                  backgroundColor: isGraded && isCorrect
                                    ? colors.semantic.correct
                                    : isGraded && isWrong
                                    ? colors.semantic.wrong
                                    : isSelected
                                    ? colors.pastel.peach.base
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
                      })
                    )}

                    {/* Explanation (after grading) */}
                    {isGraded && (
                      <View
                        style={[
                          styles.explanationBox,
                          {
                            backgroundColor: userAnswers[q.id] === q.correctAnswer
                              ? colors.pastel.mint.dim
                              : colors.pastel.rose.dim,
                          },
                        ]}
                      >
                        <Text style={styles.explanationText}>{q.explanationVi}</Text>
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
                    colors={colors.gradient.listening}
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
  levelBtnActiveListening: {
    backgroundColor: colors.pastel.peach.dim,
  },
  levelBtnInactive: {
    backgroundColor: colors.bg.b2,
  },
  levelBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  levelBtnTextActiveListening: {
    color: colors.pastel.peach.base,
  },
  levelBtnTextInactive: {
    color: colors.text.secondary,
  },
  // Script Type
  scriptTypeWrap: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scriptTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.stone,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scriptTypeChipActive: {
    backgroundColor: colors.pastel.peach.dim,
  },
  scriptTypeChipInactive: {
    backgroundColor: colors.bg.b2,
  },
  scriptTypeChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  scriptTypeChipTextActive: {
    color: colors.pastel.peach.base,
  },
  scriptTypeChipTextInactive: {
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
  tagRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTagListening: {
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.pastel.peach.dim,
  },
  levelTagTextListening: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  textTypeLabelSmall: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  sessionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  // Audio
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.pastel.peach.dim,
  },
  audioLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  audioHint: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  transcriptToggle: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transcriptToggleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.peach.base,
  },
  // Transcript
  transcriptTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.peach.base,
  },
  transcriptBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 24,
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
  qTypeRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qTypeBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.pastel.peach.dim,
  },
  qTypeBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  questionText: {
    marginBottom: 12,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  // Richtig/Falsch
  rfRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rfBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.stone,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rfBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  // MC options
  mcOptionBtn: {
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
  // Misc
  mb4: {
    marginBottom: spacing.md,
  },
  spacer8: {
    height: 32,
  },
  spacer4: {
    height: 16,
  },
});
