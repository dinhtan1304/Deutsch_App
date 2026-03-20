import { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Lazy-loaded: expo-av requires a dev build (not available in Expo Go)
let Audio: typeof import('expo-av').Audio | null = null;
let FileSystem: typeof import('expo-file-system') | null = null;
try {
  Audio = require('expo-av').Audio;
  FileSystem = require('expo-file-system');
} catch {
  // Native modules not available (Expo Go)
}
import {
  useGenerateFreeSpeaking,
  useSubmitFreeSpeaking,
  useFreeSpeakingSession,
} from '@/hooks/useFreeSpeaking';
import type { FreeSpeakingSession } from '@/lib/api/freeSpeaking';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const LEVELS = ['A1', 'A2', 'B1'] as const;

const TOPIC_TYPES = [
  { value: 'sich_vorstellen', labelVi: 'Giới thiệu', icon: 'person-circle-outline' as const },
  { value: 'alltag', labelVi: 'Đời sống', icon: 'home-outline' as const },
  { value: 'reisen', labelVi: 'Du lịch', icon: 'airplane-outline' as const },
  { value: 'einkaufen', labelVi: 'Mua sắm', icon: 'cart-outline' as const },
  { value: 'arbeit', labelVi: 'Công việc', icon: 'briefcase-outline' as const },
  { value: 'gesundheit', labelVi: 'Sức khỏe', icon: 'fitness-outline' as const },
  { value: 'wohnen', labelVi: 'Nhà ở', icon: 'bed-outline' as const },
  { value: 'familie', labelVi: 'Gia đình', icon: 'people-outline' as const },
  { value: 'meinung', labelVi: 'Ý kiến', icon: 'chatbubble-outline' as const },
];

// ── Screen ──

export default function SpeakingPracticeScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Setup state
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedTopicType, setSelectedTopicType] = useState('alltag');

  // Session state
  const [session, setSession] = useState<FreeSpeakingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Audio recording refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingUriRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Queries / mutations
  const generateMutation = useGenerateFreeSpeaking();
  const submitMutation = useSubmitFreeSpeaking();

  // Poll for grading if status is GRADING
  const { data: polledSession } = useFreeSpeakingSession(session?.id ?? '', {
    refetchInterval: session?.status === 'GRADING' ? 3000 : false,
  });

  // Use polled session if available and more up-to-date
  const activeSession = polledSession?.status === 'GRADED' ? polledSession : session;

  // Auto-show results when grading completes
  if (polledSession?.status === 'GRADED' && session?.status === 'GRADING') {
    setSession(polledSession);
    setShowResults(true);
  }

  // ── Handlers ──

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        cefrLevel: selectedLevel,
        topicType: selectedTopicType,
      });
      setSession(result);
      setHasRecorded(false);
      setShowResults(false);
      setRecordingDuration(0);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 300, animated: true }), 300);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo đề nói. Vui lòng thử lại.');
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      try {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          recordingUriRef.current = recordingRef.current.getURI();
          recordingRef.current = null;
        }
        setIsRecording(false);
        setHasRecorded(true);
      } catch (err) {
        console.error('Failed to stop recording:', err);
        setIsRecording(false);
      }
    } else {
      // Start recording — request permission first
      try {
        if (!Audio) {
          // Fallback for Expo Go: fake recording with timer only
          setIsRecording(true);
          setHasRecorded(false);
          setRecordingDuration(0);
          timerRef.current = setInterval(() => {
            setRecordingDuration((prev) => prev + 1);
          }, 1000);
          return;
        }

        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập microphone để thu âm.');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
        recordingRef.current = recording;
        recordingUriRef.current = null;
        setIsRecording(true);
        setHasRecorded(false);
        setRecordingDuration(0);
        timerRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Failed to start recording:', err);
        Alert.alert('Lỗi', 'Không thể bắt đầu thu âm. Vui lòng thử lại.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!session) return;

    try {
      let audioBase64 = '';
      if (recordingUriRef.current && FileSystem) {
        audioBase64 = await FileSystem.readAsStringAsync(recordingUriRef.current, {
          encoding: 'base64',
        });
      }

      const result = await submitMutation.mutateAsync({
        id: session.id,
        audioBase64,
        transcript: '',
        mimeType: 'audio/m4a',
      });
      setSession(result);
      if (result.status === 'GRADED') {
        setShowResults(true);
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  const handleReset = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    recordingUriRef.current = null;
    setSession(null);
    setHasRecorded(false);
    setShowResults(false);
    setIsRecording(false);
    setRecordingDuration(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Score color helper
  const getScoreColor = (score: number): [string, string] => {
    if (score >= 80) return colors.gradient.correct;
    if (score >= 60) return colors.gradient.warning;
    return colors.gradient.danger;
  };

  const displaySession = activeSession ?? session;

  // ── Render ──

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <LinearGradient
          colors={colors.gradient.speaking}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIcon}
        >
          <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.flex1}>
          <Text style={styles.headerTitle}>Luyện Nói</Text>
          <Text style={styles.headerSubtitle}>Sprechübung</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.flex1} showsVerticalScrollIndicator={false}>
        {/* ====== Results Banner ====== */}
        {showResults && displaySession?.status === 'GRADED' && displaySession.totalScore != null && (
          <View style={styles.resultsBannerWrap}>
            <LinearGradient
              colors={getScoreColor(displaySession.totalScore)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultsBannerGradient}
            >
              <View style={styles.resultsBannerRow}>
                <View>
                  <Text style={styles.resultLabel}>Điểm tổng</Text>
                  <Text style={styles.resultScoreLarge}>
                    {Math.round(displaySession.totalScore)}%
                  </Text>
                  <Text style={styles.resultPercent}>
                    {displaySession.topicType} · {displaySession.cefrLevel}
                  </Text>
                </View>
                <View style={styles.resultIconCircle}>
                  <Ionicons
                    name={displaySession.totalScore >= 70 ? 'trophy' : 'refresh'}
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
        {displaySession?.status === 'GRADING' && (
          <View style={styles.gradingStatusCard}>
            <ActivityIndicator color={colors.pastel.rose.base} size="small" />
            <Text style={styles.gradingStatusText}>
              AI đang chấm bài nói của bạn...
            </Text>
          </View>
        )}

        {/* ====== Grading Details ====== */}
        {showResults && displaySession?.status === 'GRADED' && displaySession.grading && (
          <View style={styles.sectionPadding}>
            {/* Criteria Scores */}
            <View style={styles.card}>
              <Text style={styles.detailScoresTitle}>Điểm chi tiết</Text>
              {[
                { key: 'aufgabe', label: 'Nội dung (Aufgabe)', icon: 'document-text-outline' as const },
                { key: 'aussprache', label: 'Phát âm (Aussprache)', icon: 'volume-high-outline' as const },
                { key: 'grammatik', label: 'Ngữ pháp (Grammatik)', icon: 'library-outline' as const },
                { key: 'wortschatz', label: 'Từ vựng (Wortschatz)', icon: 'book-outline' as const },
              ].map((criterion) => {
                const score = displaySession.grading!.criteriaScores[criterion.key as keyof typeof displaySession.grading.criteriaScores];
                return (
                  <View key={criterion.key} style={styles.criterionRow}>
                    <View style={styles.criterionIcon}>
                      <Ionicons name={criterion.icon} size={16} color={colors.pastel.rose.base} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.criterionLabel}>{criterion.label}</Text>
                      <View style={styles.criterionBarBg}>
                        <View
                          style={[
                            styles.criterionBarFill,
                            {
                              width: `${score}%` as any,
                              backgroundColor: score >= 70 ? colors.semantic.correct : score >= 40 ? colors.pastel.peach.base : colors.semantic.wrong,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.criterionScore}>{score}%</Text>
                  </View>
                );
              })}
            </View>

            {/* Strengths */}
            {displaySession.grading.strengths && displaySession.grading.strengths.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.strengthsTitle}>Điểm mạnh</Text>
                {displaySession.grading.strengths.map((s, i) => (
                  <View key={i} style={styles.feedbackRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.semantic.correct} />
                    <Text style={styles.feedbackText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Corrections */}
            {displaySession.grading.corrections && displaySession.grading.corrections.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.correctionsTitle}>Cần sửa</Text>
                {displaySession.grading.corrections.map((c, i) => (
                  <View key={i} style={styles.feedbackRow}>
                    <Ionicons name="alert-circle" size={16} color={colors.pastel.rose.base} />
                    <Text style={styles.feedbackText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Feedback */}
            {displaySession.grading.feedbackVi && (
              <View style={styles.card}>
                <Text style={styles.feedbackTitle}>Nhận xét</Text>
                <Text style={styles.feedbackBody}>
                  {displaySession.grading.feedbackVi}
                </Text>
              </View>
            )}

            {/* Transcript */}
            {displaySession.transcript && (
              <View style={styles.card}>
                <Text style={styles.feedbackTitle}>Bản ghi âm</Text>
                <Text style={styles.feedbackBody}>
                  {displaySession.transcript}
                </Text>
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
                      ? styles.levelBtnActiveSpeaking
                      : styles.levelBtnInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.levelBtnText,
                      selectedLevel === level
                        ? styles.levelBtnTextActiveSpeaking
                        : styles.levelBtnTextInactive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Topic Type Selection */}
            <Text style={styles.sectionLabel}>Chủ đề</Text>
            <View style={styles.topicTypeWrap}>
              {TOPIC_TYPES.map((tt) => (
                <TouchableOpacity
                  key={tt.value}
                  onPress={() => setSelectedTopicType(tt.value)}
                  style={[
                    styles.topicTypeChip,
                    selectedTopicType === tt.value
                      ? styles.topicTypeChipActive
                      : styles.topicTypeChipInactive,
                  ]}
                >
                  <Ionicons
                    name={tt.icon}
                    size={16}
                    color={selectedTopicType === tt.value ? colors.pastel.rose.base : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.topicTypeChipText,
                      selectedTopicType === tt.value
                        ? styles.topicTypeChipTextActive
                        : styles.topicTypeChipTextInactive,
                    ]}
                  >
                    {tt.labelVi}
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
                colors={colors.gradient.speaking}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateBtn}
              >
                {generateMutation.isPending ? (
                  <View style={styles.btnInnerRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.btnText}>Đang tạo đề nói...</Text>
                  </View>
                ) : (
                  <View style={styles.btnInnerRow}>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.btnText}>Tạo đề nói</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ====== Speaking Session ====== */}
        {session && !showResults && session.status !== 'GRADING' && (
          <View style={styles.sectionPadding}>
            {/* Prompt Card */}
            <View style={styles.card}>
              <View style={styles.tagRow}>
                <View style={styles.levelTagSpeaking}>
                  <Text style={styles.levelTagTextSpeaking}>{session.cefrLevel}</Text>
                </View>
                <Text style={styles.textTypeLabelSmall}>{session.topicType}</Text>
              </View>
              <Text style={styles.promptLabel}>Đề bài</Text>
              <Text style={styles.promptBody}>{session.prompt}</Text>
              {session.promptVi && (
                <Text style={styles.promptViText}>{session.promptVi}</Text>
              )}
            </View>

            {/* Key Points */}
            {session.keyPoints && session.keyPoints.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.keyPointsTitle}>Gợi ý nội dung</Text>
                {session.keyPoints.map((point, idx) => (
                  <View key={idx} style={styles.keyPointRow}>
                    <View style={styles.keyPointNum}>
                      <Text style={styles.keyPointNumText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.keyPointText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recording Area */}
            <View style={styles.recordingCard}>
              <Text style={styles.recordingLabel}>
                {isRecording ? 'Đang ghi âm...' : hasRecorded ? 'Đã ghi âm' : 'Nhấn để ghi âm'}
              </Text>

              {/* Recording Timer */}
              {(isRecording || hasRecorded) && (
                <Text style={styles.recordingTimer}>
                  {formatDuration(recordingDuration)}
                </Text>
              )}

              {/* Record Button */}
              <TouchableOpacity
                onPress={handleToggleRecording}
                activeOpacity={0.8}
                style={styles.recordBtnWrap}
              >
                <LinearGradient
                  colors={isRecording ? colors.gradient.danger : colors.gradient.speaking}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.recordBtn,
                    isRecording ? styles.recordBtnRecording : undefined,
                  ]}
                >
                  <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={36}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </TouchableOpacity>

              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingIndicatorText}>Đang ghi âm</Text>
                </View>
              )}

              {hasRecorded && !isRecording && (
                <TouchableOpacity
                  onPress={() => {
                    setHasRecorded(false);
                    setRecordingDuration(0);
                  }}
                  style={styles.reRecordBtn}
                >
                  <Ionicons name="refresh" size={16} color={colors.text.secondary} />
                  <Text style={styles.reRecordText}>Ghi lại</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitMutation.isPending || !hasRecorded}
              activeOpacity={0.8}
              style={styles.submitBtnWrap}
            >
              <LinearGradient
                colors={colors.gradient.speaking}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.submitBtnGradient, { opacity: !hasRecorded ? 0.5 : 1 }]}
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

            <View style={styles.spacer8} />
          </View>
        )}

        <View style={styles.spacer4} />
      </ScrollView>
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
  levelBtnActiveSpeaking: {
    backgroundColor: colors.pastel.rose.dim,
  },
  levelBtnInactive: {
    backgroundColor: colors.bg.b2,
  },
  levelBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  levelBtnTextActiveSpeaking: {
    color: colors.pastel.rose.base,
  },
  levelBtnTextInactive: {
    color: colors.text.secondary,
  },
  // Topic Type
  topicTypeWrap: {
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.stone,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topicTypeChipActive: {
    backgroundColor: colors.pastel.rose.dim,
  },
  topicTypeChipInactive: {
    backgroundColor: colors.bg.b2,
  },
  topicTypeChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  topicTypeChipTextActive: {
    color: colors.pastel.rose.base,
  },
  topicTypeChipTextInactive: {
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
    marginBottom: 12,
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
  levelTagSpeaking: {
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.pastel.rose.dim,
  },
  levelTagTextSpeaking: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.rose.base,
  },
  textTypeLabelSmall: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  promptLabel: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  promptBody: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  promptViText: {
    marginTop: 8,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  // Key Points
  keyPointsTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.peach.base,
  },
  keyPointRow: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  keyPointNum: {
    marginTop: 2,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.pastel.peach.dim,
  },
  keyPointNumText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  keyPointText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Recording
  recordingCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
    borderRadius: radius['2xl'],
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: 24,
  },
  recordingLabel: {
    marginBottom: 16,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  recordingTimer: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  recordBtnWrap: {
    marginBottom: 16,
  },
  recordBtn: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
  },
  recordBtnRecording: {
    shadowColor: colors.pastel.rose.base,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.pastel.rose.base,
  },
  recordingIndicatorText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.rose.base,
  },
  reRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reRecordText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Submit
  submitBtnWrap: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderRadius: radius['2xl'],
  },
  submitBtnGradient: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  // Grading details
  detailScoresTitle: {
    marginBottom: 12,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  criterionRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  criterionIcon: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.pastel.rose.dim,
  },
  criterionLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  criterionBarBg: {
    marginTop: 4,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg.b3,
  },
  criterionBarFill: {
    height: 8,
    borderRadius: 4,
  },
  criterionScore: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  // Feedback
  strengthsTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.mint.base,
  },
  correctionsTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.rose.base,
  },
  feedbackTitle: {
    marginBottom: 8,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.peach.base,
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
  feedbackBody: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    lineHeight: 20,
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
