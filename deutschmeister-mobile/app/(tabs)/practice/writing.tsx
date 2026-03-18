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

const LEVELS = ['A1', 'A2', 'B1'] as const;

const WRITING_TYPES = [
  { value: 'email', labelVi: 'Email', icon: 'mail-outline' as const },
  { value: 'letter', labelVi: 'Thư', icon: 'document-text-outline' as const },
  { value: 'essay', labelVi: 'Bài luận', icon: 'newspaper-outline' as const },
];

// ── Screen ──

export default function WritingPracticeScreen() {
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
    if (score >= 80) return ['#22C55E', '#14B8A6'];
    if (score >= 60) return ['#F59E0B', '#F97316'];
    return ['#EF4444', '#F97316'];
  };

  // ── Render ──

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-9 w-9 items-center justify-center rounded-xl"
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">Luyện Viết</Text>
            <Text className="text-xs text-gray-400">Schreibübung</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
          {/* ====== Results Section ====== */}
          {showResults && session?.status === 'GRADED' && session.overallScore != null && (
            <View className="mx-4 mb-4 rounded-2xl overflow-hidden">
              <LinearGradient
                colors={getScoreColor(session.overallScore)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-5"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-semibold text-white/80">Điểm tổng</Text>
                    <Text className="text-4xl font-bold text-white">
                      {Math.round(session.overallScore)}%
                    </Text>
                    <Text className="mt-1 text-xs text-white/70">
                      {session.wordCount} từ · {session.errors?.length ?? 0} lỗi
                    </Text>
                  </View>
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Ionicons
                      name={session.overallScore >= 70 ? 'trophy' : 'refresh'}
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
          {session?.status === 'GRADING' && (
            <View className="mx-4 mb-4 flex-row items-center gap-3 rounded-2xl bg-dark-card p-4">
              <ActivityIndicator color="#6366F1" size="small" />
              <Text className="flex-1 text-sm text-gray-300">
                AI đang chấm bài viết của bạn...
              </Text>
            </View>
          )}

          {/* ====== Feedback Details ====== */}
          {showResults && session?.status === 'GRADED' && (
            <View className="px-4">
              {/* Strengths */}
              {session.strengths && session.strengths.length > 0 && (
                <View className="mb-3 rounded-2xl bg-dark-card p-4">
                  <Text className="mb-2 text-sm font-bold text-green-400">Điểm mạnh</Text>
                  {session.strengths.map((s, i) => (
                    <View key={i} className="mb-1 flex-row items-start gap-2">
                      <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                      <Text className="flex-1 text-xs text-gray-300">{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Improvements */}
              {session.improvements && session.improvements.length > 0 && (
                <View className="mb-3 rounded-2xl bg-dark-card p-4">
                  <Text className="mb-2 text-sm font-bold text-amber-400">Cần cải thiện</Text>
                  {session.improvements.map((s, i) => (
                    <View key={i} className="mb-1 flex-row items-start gap-2">
                      <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                      <Text className="flex-1 text-xs text-gray-300">{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Errors */}
              {session.errors && session.errors.length > 0 && (
                <View className="mb-3 rounded-2xl bg-dark-card p-4">
                  <Text className="mb-2 text-sm font-bold text-red-400">
                    Lỗi ({session.errors.length})
                  </Text>
                  {session.errors.map((err) => (
                    <View key={err.id} className="mb-3 rounded-xl bg-dark-secondary p-3">
                      <View className="mb-1 flex-row items-center gap-2">
                        <View
                          className="rounded px-1.5 py-0.5"
                          style={{
                            backgroundColor:
                              err.severity === 'error'
                                ? 'rgba(239,68,68,0.15)'
                                : err.severity === 'warning'
                                ? 'rgba(245,158,11,0.15)'
                                : 'rgba(99,102,241,0.15)',
                          }}
                        >
                          <Text
                            className="text-[10px] font-bold"
                            style={{
                              color:
                                err.severity === 'error'
                                  ? '#EF4444'
                                  : err.severity === 'warning'
                                  ? '#F59E0B'
                                  : '#6366F1',
                            }}
                          >
                            {err.severity === 'error'
                              ? 'Lỗi'
                              : err.severity === 'warning'
                              ? 'Cảnh báo'
                              : 'Gợi ý'}
                          </Text>
                        </View>
                        <Text className="text-[10px] text-gray-500">{err.errorType}</Text>
                      </View>
                      <Text className="text-xs text-red-400 line-through">{err.originalText}</Text>
                      <Text className="text-xs font-semibold text-green-400">{err.correctedText}</Text>
                      <Text className="mt-1 text-xs text-gray-400">{err.explanationVi}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Corrected Text */}
              {session.correctedText && (
                <View className="mb-3 rounded-2xl bg-dark-card p-4">
                  <Text className="mb-2 text-sm font-bold text-indigo-400">Bài viết đã sửa</Text>
                  <Text className="text-sm leading-6 text-gray-200">{session.correctedText}</Text>
                </View>
              )}

              {/* Feedback */}
              {session.feedbackVi && (
                <View className="mb-4 rounded-2xl bg-dark-card p-4">
                  <Text className="mb-2 text-sm font-bold text-indigo-400">Nhận xét</Text>
                  <Text className="text-sm leading-5 text-gray-300">{session.feedbackVi}</Text>
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
                        ? { backgroundColor: 'rgba(99,102,241,0.15)' }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-sm font-bold ${
                        selectedLevel === level ? 'text-indigo-400' : 'text-gray-400'
                      }`}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Writing Type */}
              <Text className="mb-2 text-sm font-bold text-white">Dạng bài</Text>
              <View className="mb-4 flex-row gap-2">
                {WRITING_TYPES.map((wt) => (
                  <TouchableOpacity
                    key={wt.value}
                    onPress={() => setSelectedType(wt.value)}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 ${
                      selectedType === wt.value ? '' : 'bg-dark-card'
                    }`}
                    style={
                      selectedType === wt.value
                        ? { backgroundColor: 'rgba(99,102,241,0.15)' }
                        : undefined
                    }
                  >
                    <Ionicons
                      name={wt.icon}
                      size={16}
                      color={selectedType === wt.value ? '#818CF8' : '#9CA3AF'}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        selectedType === wt.value ? 'text-indigo-400' : 'text-gray-400'
                      }`}
                    >
                      {wt.labelVi}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Topic */}
              <Text className="mb-2 text-sm font-bold text-white">Chủ đề (tùy chọn)</Text>
              <TextInput
                className="mb-4 rounded-xl bg-dark-card px-4 py-3 text-sm text-white"
                placeholder="VD: Einladung, Urlaub, Beschwerde..."
                placeholderTextColor="#6B7280"
                value={topicInput}
                onChangeText={setTopicInput}
              />

              {/* Quick Topic Chips */}
              {topics.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-5"
                >
                  {topics.slice(0, 8).map((t) => (
                    <TouchableOpacity
                      key={t.topic}
                      onPress={() => setTopicInput(t.topic)}
                      className="mr-2 rounded-lg bg-dark-secondary px-3 py-1.5"
                    >
                      <Text className="text-xs text-gray-300">{t.labelVi}</Text>
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
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="items-center rounded-2xl py-4"
                >
                  {generateMutation.isPending ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text className="text-sm font-bold text-white">Đang tạo đề bài...</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                      <Text className="text-sm font-bold text-white">Tạo đề bài</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ====== Writing Session ====== */}
          {session && !showResults && session.status !== 'GRADING' && (
            <View className="px-4">
              {/* Prompt Card */}
              <View className="mb-4 rounded-2xl bg-dark-card p-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
                    <Text className="text-xs font-bold text-indigo-400">{session.cefrLevel}</Text>
                  </View>
                  <Text className="text-xs text-gray-500">{session.writingType}</Text>
                </View>
                <Text className="text-sm font-bold text-white mb-2">Đề bài</Text>
                <Text className="text-sm leading-6 text-gray-200">{session.prompt}</Text>
              </View>

              {/* Hints */}
              {(session.vocabHints?.length > 0 || session.grammarHints?.length > 0) && (
                <View className="mb-4 rounded-2xl bg-dark-card p-4">
                  {session.vocabHints?.length > 0 && (
                    <View className="mb-2">
                      <Text className="mb-1 text-xs font-bold text-indigo-400">Gợi ý từ vựng</Text>
                      <Text className="text-xs text-gray-400">
                        {session.vocabHints.join(' · ')}
                      </Text>
                    </View>
                  )}
                  {session.grammarHints?.length > 0 && (
                    <View>
                      <Text className="mb-1 text-xs font-bold text-indigo-400">Gợi ý ngữ pháp</Text>
                      <Text className="text-xs text-gray-400">
                        {session.grammarHints.join(' · ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Writing Area */}
              <View className="mb-2 rounded-2xl bg-dark-card p-4">
                <TextInput
                  className="min-h-[200px] text-sm leading-6 text-white"
                  placeholder="Viết bài của bạn ở đây..."
                  placeholderTextColor="#6B7280"
                  multiline
                  textAlignVertical="top"
                  value={userText}
                  onChangeText={setUserText}
                />
              </View>

              {/* Word Count */}
              <View className="mb-4 flex-row items-center justify-between px-1">
                <Text className="text-xs text-gray-500">
                  {wordCount} từ
                  {session.wordCountMin > 0 && (
                    <Text>
                      {' '}
                      / {session.wordCountMin}-{session.wordCountMax} từ yêu cầu
                    </Text>
                  )}
                </Text>
                {wordCount >= (session.wordCountMin || 20) && (
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                  className="flex-1 items-center rounded-xl bg-dark-card py-3.5"
                >
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="save-outline" size={16} color="#9CA3AF" />
                    <Text className="text-sm font-semibold text-gray-400">Lưu nháp</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitMutation.isPending || wordCount < 20}
                  activeOpacity={0.8}
                  className="flex-[2] overflow-hidden rounded-xl"
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="items-center py-3.5"
                    style={{ opacity: wordCount < 20 ? 0.5 : 1 }}
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
              </View>

              <View className="h-8" />
            </View>
          )}

          <View className="h-4" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
