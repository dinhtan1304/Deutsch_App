import { useState, useRef } from 'react';
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
import { useReadingTopics, useGenerateReading, useSubmitReading } from '@/hooks/useReading';
import type { ReadingSession } from '@/lib/api/reading';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const LEVELS = ['A1', 'A2', 'B1'] as const;

// ── Screen ──

export default function ReadingPracticeScreen() {
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
            colors={['#22C55E', '#14B8A6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-9 w-9 items-center justify-center rounded-xl"
          >
            <Ionicons name="book-outline" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">Luyện Đọc</Text>
            <Text className="text-xs text-gray-400">Leseübung</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
          {/* ====== Results Banner ====== */}
          {showResults && session?.status === 'GRADED' && (
            <View className="mx-4 mb-4 rounded-2xl overflow-hidden">
              <LinearGradient
                colors={
                  (session.score ?? 0) >= 70
                    ? ['#22C55E', '#14B8A6']
                    : (session.score ?? 0) >= 40
                    ? ['#F59E0B', '#F97316']
                    : ['#EF4444', '#F97316']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-5"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-semibold text-white/80">Kết quả</Text>
                    <Text className="text-3xl font-bold text-white">
                      {session.correctCount}/{session.totalQuestions}
                    </Text>
                    <Text className="mt-1 text-xs text-white/70">
                      Điểm: {Math.round(session.score ?? 0)}%
                    </Text>
                  </View>
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Ionicons
                      name={(session.score ?? 0) >= 70 ? 'trophy' : 'refresh'}
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

          {/* ====== Setup Section (hidden when session active + no results) ====== */}
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
                        ? { backgroundColor: 'rgba(34,197,94,0.15)' }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-sm font-bold ${
                        selectedLevel === level ? 'text-green-400' : 'text-gray-400'
                      }`}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Text Type Selection */}
              {textTypes.length > 0 && (
                <>
                  <Text className="mb-2 text-sm font-bold text-white">Loại văn bản</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                  >
                    {textTypes.map((tt) => (
                      <TouchableOpacity
                        key={tt.value}
                        onPress={() => setSelectedTextType(tt.value)}
                        className={`mr-2 rounded-xl px-4 py-2.5 ${
                          selectedTextType === tt.value ? '' : 'bg-dark-card'
                        }`}
                        style={
                          selectedTextType === tt.value
                            ? { backgroundColor: 'rgba(34,197,94,0.15)' }
                            : undefined
                        }
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            selectedTextType === tt.value ? 'text-green-400' : 'text-gray-400'
                          }`}
                        >
                          {tt.labelVi}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Topic Input */}
              <Text className="mb-2 text-sm font-bold text-white">Chủ đề (tùy chọn)</Text>
              <TextInput
                className="mb-4 rounded-xl bg-dark-card px-4 py-3 text-sm text-white"
                placeholder="VD: Einkaufen, Reisen, Familie..."
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
                  colors={['#22C55E', '#14B8A6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="items-center rounded-2xl py-4"
                >
                  {generateMutation.isPending ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text className="text-sm font-bold text-white">Đang tạo bài đọc...</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                      <Text className="text-sm font-bold text-white">Tạo bài đọc</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ====== Passage ====== */}
          {session && (
            <View className="px-4">
              {/* Title */}
              <View className="mb-4 rounded-2xl bg-dark-card p-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                    <Text className="text-xs font-bold text-green-400">{session.cefrLevel}</Text>
                  </View>
                  <Text className="text-xs text-gray-500">{session.textType}</Text>
                </View>
                <Text className="text-lg font-bold text-white">{session.title}</Text>
              </View>

              {/* Passage Text */}
              <View className="mb-4 rounded-2xl bg-dark-card p-4">
                <Text className="text-sm leading-6 text-gray-200">{session.passage}</Text>
              </View>

              {/* Vocab Highlights */}
              {session.vocabHighlights && session.vocabHighlights.length > 0 && (
                <View className="mb-4 rounded-2xl bg-dark-card p-4">
                  <Text className="mb-2 text-sm font-bold text-green-400">Từ vựng quan trọng</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {session.vocabHighlights.map((v, idx) => (
                      <View key={idx} className="rounded-lg bg-dark-secondary px-3 py-1.5">
                        <Text className="text-xs font-semibold text-white">{v.word}</Text>
                        <Text className="text-[10px] text-gray-400">{v.translation}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Questions */}
              <Text className="mb-3 text-base font-bold text-white">
                Câu hỏi ({session.questions.length})
              </Text>

              {session.questions.map((q, qIndex) => {
                const isGraded = showResults && session.gradingDetails;
                const grading = session.gradingDetails?.find((g) => g.questionId === q.id);

                return (
                  <View key={q.id} className="mb-3 rounded-2xl bg-dark-card p-4">
                    <Text className="mb-3 text-sm font-semibold text-white">
                      {qIndex + 1}. {q.questionText}
                    </Text>

                    {q.options.map((opt) => {
                      const isSelected = userAnswers[q.id] === opt.id;
                      const isCorrect = isGraded && q.correctAnswer === opt.id;
                      const isWrong = isGraded && isSelected && !isCorrect;

                      let bgStyle = 'bg-dark-secondary';
                      let borderColor = 'transparent';
                      if (isGraded) {
                        if (isCorrect) {
                          bgStyle = '';
                          borderColor = '#22C55E';
                        }
                        if (isWrong) {
                          bgStyle = '';
                          borderColor = '#EF4444';
                        }
                      } else if (isSelected) {
                        bgStyle = '';
                        borderColor = '#22C55E';
                      }

                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() => {
                            if (!showResults) {
                              setUserAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                            }
                          }}
                          disabled={showResults}
                          className={`mb-2 flex-row items-center rounded-xl px-4 py-3 ${bgStyle}`}
                          style={{
                            borderWidth: borderColor !== 'transparent' ? 1.5 : 0,
                            borderColor,
                            backgroundColor:
                              isGraded && isCorrect
                                ? 'rgba(34,197,94,0.1)'
                                : isGraded && isWrong
                                ? 'rgba(239,68,68,0.1)'
                                : !isGraded && isSelected
                                ? 'rgba(34,197,94,0.1)'
                                : undefined,
                          }}
                        >
                          <View
                            className="mr-3 h-6 w-6 items-center justify-center rounded-full"
                            style={{
                              backgroundColor:
                                isGraded && isCorrect
                                  ? '#22C55E'
                                  : isGraded && isWrong
                                  ? '#EF4444'
                                  : isSelected
                                  ? '#22C55E'
                                  : '#374151',
                            }}
                          >
                            {isGraded && isCorrect ? (
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            ) : isGraded && isWrong ? (
                              <Ionicons name="close" size={14} color="#FFFFFF" />
                            ) : (
                              <Text className="text-[10px] font-bold text-gray-400">
                                {opt.id.toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <Text
                            className={`flex-1 text-sm ${
                              isGraded && isCorrect
                                ? 'font-semibold text-green-400'
                                : isGraded && isWrong
                                ? 'text-red-400'
                                : 'text-gray-300'
                            }`}
                          >
                            {opt.text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Explanation */}
                    {isGraded && grading && (
                      <View
                        className="mt-2 rounded-lg p-3"
                        style={{
                          backgroundColor: grading.isCorrect
                            ? 'rgba(34,197,94,0.08)'
                            : 'rgba(239,68,68,0.08)',
                        }}
                      >
                        <Text className="text-xs text-gray-300">{grading.explanationVi}</Text>
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
                  className="mb-4"
                >
                  <LinearGradient
                    colors={['#22C55E', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="items-center rounded-2xl py-4"
                  >
                    {submitMutation.isPending ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text className="text-sm font-bold text-white">Đang chấm điểm...</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        <Text className="text-sm font-bold text-white">Nộp bài</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View className="h-8" />
            </View>
          )}

          <View className="h-4" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
