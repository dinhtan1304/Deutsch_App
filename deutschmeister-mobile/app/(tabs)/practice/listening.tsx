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
import { useGenerateListening, useSubmitListening } from '@/hooks/useListening';
import type { ListeningSession } from '@/lib/api/listening';

const LEVELS = ['A1', 'A2', 'B1'] as const;

const SCRIPT_TYPES = [
  { value: 'dialog', labelVi: 'Hội thoại', icon: 'chatbubbles-outline' as const },
  { value: 'monolog', labelVi: 'Độc thoại', icon: 'person-outline' as const },
  { value: 'announcement', labelVi: 'Thông báo', icon: 'megaphone-outline' as const },
  { value: 'interview', labelVi: 'Phỏng vấn', icon: 'mic-outline' as const },
];

// ── Screen ──

export default function ListeningPracticeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Setup state
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedScriptType, setSelectedScriptType] = useState('dialog');

  // Session state
  const [session, setSession] = useState<ListeningSession | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

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
            colors={['#F59E0B', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-9 w-9 items-center justify-center rounded-xl"
          >
            <Ionicons name="ear-outline" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">Luyện Nghe</Text>
            <Text className="text-xs text-gray-400">Hörübung</Text>
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
                      {session.correctCount}/{session.totalQ}
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
                        ? { backgroundColor: 'rgba(245,158,11,0.15)' }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-sm font-bold ${
                        selectedLevel === level ? 'text-amber-400' : 'text-gray-400'
                      }`}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Script Type Selection */}
              <Text className="mb-2 text-sm font-bold text-white">Dạng bài nghe</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {SCRIPT_TYPES.map((st) => (
                  <TouchableOpacity
                    key={st.value}
                    onPress={() => setSelectedScriptType(st.value)}
                    className={`flex-row items-center gap-1.5 rounded-xl px-4 py-2.5 ${
                      selectedScriptType === st.value ? '' : 'bg-dark-card'
                    }`}
                    style={
                      selectedScriptType === st.value
                        ? { backgroundColor: 'rgba(245,158,11,0.15)' }
                        : undefined
                    }
                  >
                    <Ionicons
                      name={st.icon}
                      size={16}
                      color={selectedScriptType === st.value ? '#FBBF24' : '#9CA3AF'}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        selectedScriptType === st.value ? 'text-amber-400' : 'text-gray-400'
                      }`}
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
                  colors={['#F59E0B', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="items-center rounded-2xl py-4"
                >
                  {generateMutation.isPending ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text className="text-sm font-bold text-white">Đang tạo bài nghe...</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                      <Text className="text-sm font-bold text-white">Tạo bài nghe</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ====== Session Content ====== */}
          {session && (
            <View className="px-4">
              {/* Title Card */}
              <View className="mb-4 rounded-2xl bg-dark-card p-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
                    <Text className="text-xs font-bold text-amber-400">{session.cefrLevel}</Text>
                  </View>
                  <Text className="text-xs text-gray-500">{session.scriptType}</Text>
                </View>
                <Text className="text-lg font-bold text-white">{session.title}</Text>
              </View>

              {/* Audio Placeholder */}
              <View className="mb-4 rounded-2xl bg-dark-card p-4">
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    className="h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}
                  >
                    <Ionicons name="play" size={24} color="#F59E0B" />
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white">Nghe bài</Text>
                    <Text className="text-xs text-gray-400">Đọc transcript bên dưới để luyện tập</Text>
                  </View>
                </View>

                {/* Transcript toggle */}
                <TouchableOpacity
                  onPress={() => setShowTranscript(!showTranscript)}
                  className="mt-3 flex-row items-center gap-1.5"
                >
                  <Ionicons
                    name={showTranscript ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color="#FBBF24"
                  />
                  <Text className="text-xs font-semibold text-amber-400">
                    {showTranscript ? 'Ẩn transcript' : 'Hiện transcript'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Transcript */}
              {showTranscript && session.transcript && (
                <View className="mb-4 rounded-2xl bg-dark-card p-4">
                  <Text className="mb-2 text-sm font-bold text-amber-400">Transcript</Text>
                  <Text className="text-sm leading-6 text-gray-200">{session.transcript}</Text>
                </View>
              )}

              {/* Questions */}
              <Text className="mb-3 text-base font-bold text-white">
                Câu hỏi ({session.questions.length})
              </Text>

              {session.questions.map((q, qIndex) => {
                const isGraded = showResults && session.status === 'GRADED';

                return (
                  <View key={q.id} className="mb-3 rounded-2xl bg-dark-card p-4">
                    <View className="mb-2 flex-row items-center gap-2">
                      <View
                        className="rounded px-1.5 py-0.5"
                        style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}
                      >
                        <Text className="text-[10px] font-bold text-amber-400">
                          {q.type === 'richtig_falsch' ? 'R/F' : 'MC'}
                        </Text>
                      </View>
                    </View>
                    <Text className="mb-3 text-sm font-semibold text-white">
                      {qIndex + 1}. {q.questionText}
                    </Text>

                    {q.type === 'richtig_falsch' ? (
                      // Richtig / Falsch buttons
                      <View className="flex-row gap-2">
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
                              className="flex-1 items-center rounded-xl px-4 py-3"
                              style={{
                                borderWidth: isSelected || (isGraded && isCorrect) ? 1.5 : 0,
                                borderColor: isGraded && isCorrect
                                  ? '#22C55E'
                                  : isGraded && isWrong
                                  ? '#EF4444'
                                  : isSelected
                                  ? '#F59E0B'
                                  : 'transparent',
                                backgroundColor: isGraded && isCorrect
                                  ? 'rgba(34,197,94,0.1)'
                                  : isGraded && isWrong
                                  ? 'rgba(239,68,68,0.1)'
                                  : isSelected
                                  ? 'rgba(245,158,11,0.1)'
                                  : '#1E2433',
                              }}
                            >
                              <Text
                                className={`text-sm font-semibold ${
                                  isGraded && isCorrect
                                    ? 'text-green-400'
                                    : isGraded && isWrong
                                    ? 'text-red-400'
                                    : isSelected
                                    ? 'text-amber-400'
                                    : 'text-gray-300'
                                }`}
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
                            className="mb-2 flex-row items-center rounded-xl px-4 py-3"
                            style={{
                              borderWidth: (isSelected || (isGraded && isCorrect)) ? 1.5 : 0,
                              borderColor: isGraded && isCorrect
                                ? '#22C55E'
                                : isGraded && isWrong
                                ? '#EF4444'
                                : isSelected
                                ? '#F59E0B'
                                : 'transparent',
                              backgroundColor: isGraded && isCorrect
                                ? 'rgba(34,197,94,0.1)'
                                : isGraded && isWrong
                                ? 'rgba(239,68,68,0.1)'
                                : isSelected
                                ? 'rgba(245,158,11,0.1)'
                                : '#1E2433',
                            }}
                          >
                            <View
                              className="mr-3 h-6 w-6 items-center justify-center rounded-full"
                              style={{
                                backgroundColor: isGraded && isCorrect
                                  ? '#22C55E'
                                  : isGraded && isWrong
                                  ? '#EF4444'
                                  : isSelected
                                  ? '#F59E0B'
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
                      })
                    )}

                    {/* Explanation (after grading) */}
                    {isGraded && (
                      <View
                        className="mt-2 rounded-lg p-3"
                        style={{
                          backgroundColor: userAnswers[q.id] === q.correctAnswer
                            ? 'rgba(34,197,94,0.08)'
                            : 'rgba(239,68,68,0.08)',
                        }}
                      >
                        <Text className="text-xs text-gray-300">{q.explanationVi}</Text>
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
                    colors={['#F59E0B', '#F97316']}
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
