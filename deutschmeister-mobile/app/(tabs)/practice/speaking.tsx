import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useGenerateFreeSpeaking,
  useSubmitFreeSpeaking,
  useFreeSpeakingSession,
} from '@/hooks/useFreeSpeaking';
import type { FreeSpeakingSession } from '@/lib/api/freeSpeaking';

const LEVELS = ['A1', 'A2', 'B1'] as const;

const TOPIC_TYPES = [
  { value: 'Alltag', labelVi: 'Đời sống', icon: 'home-outline' as const },
  { value: 'Reisen', labelVi: 'Du lịch', icon: 'airplane-outline' as const },
  { value: 'Einkaufen', labelVi: 'Mua sắm', icon: 'cart-outline' as const },
  { value: 'Essen', labelVi: 'Ẩm thực', icon: 'restaurant-outline' as const },
  { value: 'Arbeit', labelVi: 'Công việc', icon: 'briefcase-outline' as const },
  { value: 'Gesundheit', labelVi: 'Sức khỏe', icon: 'fitness-outline' as const },
  { value: 'Freizeit', labelVi: 'Giải trí', icon: 'game-controller-outline' as const },
  { value: 'Familie', labelVi: 'Gia đình', icon: 'people-outline' as const },
];

// ── Screen ──

export default function SpeakingPracticeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Setup state
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedTopicType, setSelectedTopicType] = useState('Alltag');

  // Session state
  const [session, setSession] = useState<FreeSpeakingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Timer ref for recording duration
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setHasRecorded(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleSubmit = async () => {
    if (!session) return;

    try {
      // Placeholder: submit with dummy audio data
      // In a real app, this would send actual recorded audio
      const result = await submitMutation.mutateAsync({
        id: session.id,
        audioBase64: '', // Placeholder
        transcript: '',  // Placeholder - server would transcribe
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
    if (score >= 80) return ['#22C55E', '#14B8A6'];
    if (score >= 60) return ['#F59E0B', '#F97316'];
    return ['#EF4444', '#F97316'];
  };

  const displaySession = activeSession ?? session;

  // ── Render ──

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <LinearGradient
          colors={['#EF4444', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-9 w-9 items-center justify-center rounded-xl"
        >
          <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">Luyện Nói</Text>
          <Text className="text-xs text-gray-400">Sprechübung</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ====== Results Banner ====== */}
        {showResults && displaySession?.status === 'GRADED' && displaySession.totalScore != null && (
          <View className="mx-4 mb-4 rounded-2xl overflow-hidden">
            <LinearGradient
              colors={getScoreColor(displaySession.totalScore)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-white/80">Điểm tổng</Text>
                  <Text className="text-4xl font-bold text-white">
                    {Math.round(displaySession.totalScore)}%
                  </Text>
                  <Text className="mt-1 text-xs text-white/70">
                    {displaySession.topicType} · {displaySession.cefrLevel}
                  </Text>
                </View>
                <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <Ionicons
                    name={displaySession.totalScore >= 70 ? 'trophy' : 'refresh'}
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleReset}
                className="mt-4 items-center rounded-xl bg-white/20 py-2.5"
              >
                <Text className="text-sm font-bold text-white">Làm bài mới</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Grading status (polling) */}
        {displaySession?.status === 'GRADING' && (
          <View className="mx-4 mb-4 flex-row items-center gap-3 rounded-2xl bg-dark-card p-4">
            <ActivityIndicator color="#EF4444" size="small" />
            <Text className="flex-1 text-sm text-gray-300">
              AI đang chấm bài nói của bạn...
            </Text>
          </View>
        )}

        {/* ====== Grading Details ====== */}
        {showResults && displaySession?.status === 'GRADED' && displaySession.grading && (
          <View className="px-4">
            {/* Criteria Scores */}
            <View className="mb-3 rounded-2xl bg-dark-card p-4">
              <Text className="mb-3 text-sm font-bold text-white">Điểm chi tiết</Text>
              {[
                { key: 'aufgabe', label: 'Nội dung (Aufgabe)', icon: 'document-text-outline' as const },
                { key: 'aussprache', label: 'Phát âm (Aussprache)', icon: 'volume-high-outline' as const },
                { key: 'grammatik', label: 'Ngữ pháp (Grammatik)', icon: 'library-outline' as const },
                { key: 'wortschatz', label: 'Từ vựng (Wortschatz)', icon: 'book-outline' as const },
              ].map((criterion) => {
                const score = displaySession.grading!.criteriaScores[criterion.key as keyof typeof displaySession.grading.criteriaScores];
                return (
                  <View key={criterion.key} className="mb-2 flex-row items-center gap-3">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
                    >
                      <Ionicons name={criterion.icon} size={16} color="#F87171" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-400">{criterion.label}</Text>
                      <View className="mt-1 h-2 rounded-full bg-dark-secondary">
                        <View
                          className="h-2 rounded-full"
                          style={{
                            width: `${score}%`,
                            backgroundColor: score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </View>
                    </View>
                    <Text className="text-sm font-bold text-white">{score}%</Text>
                  </View>
                );
              })}
            </View>

            {/* Strengths */}
            {displaySession.grading.strengths && displaySession.grading.strengths.length > 0 && (
              <View className="mb-3 rounded-2xl bg-dark-card p-4">
                <Text className="mb-2 text-sm font-bold text-green-400">Điểm mạnh</Text>
                {displaySession.grading.strengths.map((s, i) => (
                  <View key={i} className="mb-1 flex-row items-start gap-2">
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                    <Text className="flex-1 text-xs text-gray-300">{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Corrections */}
            {displaySession.grading.corrections && displaySession.grading.corrections.length > 0 && (
              <View className="mb-3 rounded-2xl bg-dark-card p-4">
                <Text className="mb-2 text-sm font-bold text-red-400">Cần sửa</Text>
                {displaySession.grading.corrections.map((c, i) => (
                  <View key={i} className="mb-1 flex-row items-start gap-2">
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text className="flex-1 text-xs text-gray-300">{c}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Feedback */}
            {displaySession.grading.feedbackVi && (
              <View className="mb-4 rounded-2xl bg-dark-card p-4">
                <Text className="mb-2 text-sm font-bold text-orange-400">Nhận xét</Text>
                <Text className="text-sm leading-5 text-gray-300">
                  {displaySession.grading.feedbackVi}
                </Text>
              </View>
            )}

            {/* Transcript */}
            {displaySession.transcript && (
              <View className="mb-4 rounded-2xl bg-dark-card p-4">
                <Text className="mb-2 text-sm font-bold text-orange-400">Bản ghi âm</Text>
                <Text className="text-sm leading-5 text-gray-300">
                  {displaySession.transcript}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ====== Setup Section ====== */}
        {!session && (
          <View className="px-4">
            {/* Level Selection */}
            <Text className="mb-2 text-sm font-bold text-white">Trình độ</Text>
            <View className="mb-4 flex-row gap-2">
              {LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setSelectedLevel(level)}
                  className={`flex-1 items-center rounded-xl py-3 ${
                    selectedLevel === level ? '' : 'bg-dark-card'
                  }`}
                  style={
                    selectedLevel === level
                      ? { backgroundColor: 'rgba(239,68,68,0.15)' }
                      : undefined
                  }
                >
                  <Text
                    className={`text-sm font-bold ${
                      selectedLevel === level ? 'text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Topic Type Selection */}
            <Text className="mb-2 text-sm font-bold text-white">Chủ đề</Text>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {TOPIC_TYPES.map((tt) => (
                <TouchableOpacity
                  key={tt.value}
                  onPress={() => setSelectedTopicType(tt.value)}
                  className={`flex-row items-center gap-1.5 rounded-xl px-4 py-2.5 ${
                    selectedTopicType === tt.value ? '' : 'bg-dark-card'
                  }`}
                  style={
                    selectedTopicType === tt.value
                      ? { backgroundColor: 'rgba(239,68,68,0.15)' }
                      : undefined
                  }
                >
                  <Ionicons
                    name={tt.icon}
                    size={16}
                    color={selectedTopicType === tt.value ? '#F87171' : '#9CA3AF'}
                  />
                  <Text
                    className={`text-xs font-semibold ${
                      selectedTopicType === tt.value ? 'text-red-400' : 'text-gray-400'
                    }`}
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
                colors={['#EF4444', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="items-center rounded-2xl py-4"
              >
                {generateMutation.isPending ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text className="text-sm font-bold text-white">Đang tạo đề nói...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text className="text-sm font-bold text-white">Tạo đề nói</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ====== Speaking Session ====== */}
        {session && !showResults && session.status !== 'GRADING' && (
          <View className="px-4">
            {/* Prompt Card */}
            <View className="mb-4 rounded-2xl bg-dark-card p-4">
              <View className="mb-2 flex-row items-center gap-2">
                <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
                  <Text className="text-xs font-bold text-red-400">{session.cefrLevel}</Text>
                </View>
                <Text className="text-xs text-gray-500">{session.topicType}</Text>
              </View>
              <Text className="mb-2 text-sm font-bold text-white">Đề bài</Text>
              <Text className="text-sm leading-6 text-gray-200">{session.prompt}</Text>
              {session.promptVi && (
                <Text className="mt-2 text-xs leading-5 text-gray-400">{session.promptVi}</Text>
              )}
            </View>

            {/* Key Points */}
            {session.keyPoints && session.keyPoints.length > 0 && (
              <View className="mb-4 rounded-2xl bg-dark-card p-4">
                <Text className="mb-2 text-sm font-bold text-orange-400">Gợi ý nội dung</Text>
                {session.keyPoints.map((point, idx) => (
                  <View key={idx} className="mb-1.5 flex-row items-start gap-2">
                    <View
                      className="mt-0.5 h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(249,115,22,0.15)' }}
                    >
                      <Text className="text-[10px] font-bold text-orange-400">{idx + 1}</Text>
                    </View>
                    <Text className="flex-1 text-xs text-gray-300">{point}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recording Area */}
            <View className="mb-4 items-center rounded-2xl bg-dark-card p-6">
              <Text className="mb-4 text-sm font-bold text-white">
                {isRecording ? 'Đang ghi âm...' : hasRecorded ? 'Đã ghi âm' : 'Nhấn để ghi âm'}
              </Text>

              {/* Recording Timer */}
              {(isRecording || hasRecorded) && (
                <Text className="mb-4 text-2xl font-bold text-white">
                  {formatDuration(recordingDuration)}
                </Text>
              )}

              {/* Record Button */}
              <TouchableOpacity
                onPress={handleToggleRecording}
                activeOpacity={0.8}
                className="mb-4"
              >
                <LinearGradient
                  colors={isRecording ? ['#EF4444', '#DC2626'] : ['#EF4444', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-20 w-20 items-center justify-center rounded-full"
                  style={isRecording ? {
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 10,
                  } : undefined}
                >
                  <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={36}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </TouchableOpacity>

              {isRecording && (
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-red-500" />
                  <Text className="text-xs text-red-400">Đang ghi âm</Text>
                </View>
              )}

              {hasRecorded && !isRecording && (
                <TouchableOpacity
                  onPress={() => {
                    setHasRecorded(false);
                    setRecordingDuration(0);
                  }}
                  className="flex-row items-center gap-1.5"
                >
                  <Ionicons name="refresh" size={16} color="#9CA3AF" />
                  <Text className="text-xs text-gray-400">Ghi lại</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitMutation.isPending || !hasRecorded}
              activeOpacity={0.8}
              className="mb-4 overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={['#EF4444', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="items-center py-4"
                style={{ opacity: !hasRecorded ? 0.5 : 1 }}
              >
                {submitMutation.isPending ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text className="text-sm font-bold text-white">Đang nộp...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text className="text-sm font-bold text-white">Nộp & chấm AI</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View className="h-8" />
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
