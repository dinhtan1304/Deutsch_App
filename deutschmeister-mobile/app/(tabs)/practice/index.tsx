import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useReadingHistory } from '@/hooks/useReading';
import { useWritingHistory } from '@/hooks/useWriting';

// ── Types ──

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface SkillCard {
  key: string;
  name: string;
  nameDe: string;
  description: string;
  icon: IoniconsName;
  colors: [string, string];
  freeRoute: string;
  examRoute?: string;
}

interface ExamCard {
  key: string;
  name: string;
  nameDe: string;
  description: string;
  icon: IoniconsName;
  colors: [string, string];
  route: string;
}

// ── Data ──

const SKILL_CARDS: SkillCard[] = [
  {
    key: 'reading',
    name: 'Luyện Đọc',
    nameDe: 'Leseübung',
    description: 'Tạo bài đọc tiếng Đức, trả lời câu hỏi',
    icon: 'book-outline',
    colors: ['#22C55E', '#14B8A6'],
    freeRoute: '/(tabs)/practice/reading',
  },
  {
    key: 'writing',
    name: 'Luyện Viết',
    nameDe: 'Schreibübung',
    description: 'Viết bài tiếng Đức, AI chấm điểm',
    icon: 'create-outline',
    colors: ['#6366F1', '#8B5CF6'],
    freeRoute: '/(tabs)/practice/writing',
  },
  {
    key: 'listening',
    name: 'Luyện Nghe',
    nameDe: 'Hörübung',
    description: 'Nghe tiếng Đức, trả lời câu hỏi',
    icon: 'ear-outline',
    colors: ['#F59E0B', '#F97316'],
    freeRoute: '/(tabs)/practice/listening',
  },
  {
    key: 'speaking',
    name: 'Luyện Nói',
    nameDe: 'Sprechübung',
    description: 'Nói tiếng Đức, AI chấm phát âm',
    icon: 'mic-outline',
    colors: ['#EF4444', '#F97316'],
    freeRoute: '/(tabs)/practice/speaking',
  },
];

const EXAM_CARDS: ExamCard[] = [
  {
    key: 'exam-reading',
    name: 'Đọc Theo Đề',
    nameDe: 'Prüfungslesen',
    description: 'Goethe & TELC A1/A2/B1',
    icon: 'book-outline',
    colors: ['#22C55E', '#0EA5E9'],
    route: '/(tabs)/practice/reading',
  },
  {
    key: 'exam-writing',
    name: 'Viết Theo Đề',
    nameDe: 'Prüfungsschreiben',
    description: 'Goethe & TELC A1/A2/B1',
    icon: 'create-outline',
    colors: ['#A855F7', '#6366F1'],
    route: '/(tabs)/practice/writing',
  },
  {
    key: 'exam-listening',
    name: 'Nghe Theo Đề',
    nameDe: 'Prüfungshören',
    description: 'Goethe & TELC A1/A2/B1',
    icon: 'ear-outline',
    colors: ['#EC4899', '#A855F7'],
    route: '/(tabs)/practice/listening',
  },
  {
    key: 'exam-speaking',
    name: 'Nói Theo Đề',
    nameDe: 'Prüfungssprechen',
    description: 'Goethe & TELC A1/A2/B1',
    icon: 'mic-outline',
    colors: ['#F59E0B', '#EF4444'],
    route: '/(tabs)/practice/speaking',
  },
];

// ── Helpers ──

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

// ── Screen ──

export default function PracticeHubScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: readingHistory, refetch: refetchReading } = useReadingHistory({ limit: 3 });
  const { data: writingHistory, refetch: refetchWriting } = useWritingHistory({ limit: 3 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchReading(), refetchWriting()]);
    setRefreshing(false);
  }, [refetchReading, refetchWriting]);

  // Merge recent history from reading and writing
  const recentHistory = [
    ...(readingHistory?.data || []).map((item) => ({
      id: item.id,
      type: 'reading' as const,
      title: item.title,
      level: item.cefrLevel,
      score: item.score,
      status: item.status,
      createdAt: item.createdAt,
    })),
    ...(writingHistory?.data || []).map((item) => ({
      id: item.id,
      type: 'writing' as const,
      title: item.topic,
      level: item.cefrLevel,
      score: item.overallScore,
      status: item.status,
      createdAt: item.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {/* ====== Header ====== */}
        <View className="px-4 pb-2 pt-4">
          <View className="flex-row items-center gap-3">
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-11 w-11 items-center justify-center rounded-2xl"
            >
              <Ionicons name="school" size={22} color="#FFFFFF" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-white">Luyện Test</Text>
              <Text className="mt-0.5 text-xs text-gray-400">
                Luyện tập tự do hoặc theo đề chuẩn Goethe & TELC
              </Text>
            </View>
          </View>
        </View>

        {/* ====== Free Practice Section ====== */}
        <View className="mt-5 px-4">
          <View className="mb-4 flex-row items-center gap-2.5">
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-8 w-8 items-center justify-center rounded-xl"
            >
              <Ionicons name="flash" size={16} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text className="text-sm font-bold text-white">Luyện tự do</Text>
              <Text className="text-xs text-gray-500">AI tạo đề ngẫu nhiên</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap" style={{ gap: CARD_GAP }}>
            {SKILL_CARDS.map((card) => (
              <TouchableOpacity
                key={card.key}
                activeOpacity={0.8}
                onPress={() => router.push(card.freeRoute as any)}
                style={{ width: CARD_WIDTH }}
              >
                <LinearGradient
                  colors={card.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16, minHeight: 150 }}
                >
                  <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Ionicons name={card.icon} size={22} color="#FFFFFF" />
                  </View>
                  <Text className="text-[10px] font-semibold text-white/60">{card.nameDe}</Text>
                  <Text className="text-base font-bold text-white">{card.name}</Text>
                  <Text className="mt-1 text-xs text-white/70" numberOfLines={2}>
                    {card.description}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ====== Divider ====== */}
        <View className="mx-4 my-6 flex-row items-center gap-3">
          <View className="flex-1 h-px bg-dark-border" />
          <View className="rounded-full bg-dark-secondary px-3 py-1">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Đề chuẩn
            </Text>
          </View>
          <View className="flex-1 h-px bg-dark-border" />
        </View>

        {/* ====== Exam Practice Section ====== */}
        <View className="px-4">
          <View className="mb-4 flex-row items-center gap-2.5">
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-8 w-8 items-center justify-center rounded-xl"
            >
              <Ionicons name="trophy" size={16} color="#FFFFFF" />
            </LinearGradient>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-bold text-white">Theo đề chuẩn</Text>
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
                  <Text className="text-[9px] font-extrabold text-amber-400">Đề chuẩn</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500">
                Goethe & TELC · Đầy đủ tất cả Teile
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap" style={{ gap: CARD_GAP }}>
            {EXAM_CARDS.map((card) => (
              <TouchableOpacity
                key={card.key}
                activeOpacity={0.8}
                onPress={() => router.push(card.route as any)}
                style={{ width: CARD_WIDTH }}
              >
                <View
                  className="rounded-2xl border border-dark-border bg-dark-card p-4"
                  style={{ minHeight: 120 }}
                >
                  <LinearGradient
                    colors={card.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="mb-3 h-9 w-9 items-center justify-center rounded-lg"
                  >
                    <Ionicons name={card.icon} size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text className="text-[10px] font-semibold text-gray-500">{card.nameDe}</Text>
                  <Text className="text-sm font-bold text-white">{card.name}</Text>
                  <Text className="mt-1 text-[11px] text-gray-400" numberOfLines={1}>
                    {card.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ====== Grammar Section ====== */}
        <View className="mt-6 px-4">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/practice/grammar' as any)}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-row items-center rounded-2xl p-4"
            >
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                <Ionicons name="library-outline" size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-semibold text-white/60">Grammatik</Text>
                <Text className="text-base font-bold text-white">Ngữ pháp</Text>
                <Text className="mt-0.5 text-xs text-white/70">
                  Bài học + bài tập ngữ pháp theo cấp độ
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ====== Recent History ====== */}
        {recentHistory.length > 0 && (
          <View className="mt-6 px-4 pb-8">
            <Text className="mb-3 text-lg font-bold text-white">Luyện tập gần đây</Text>
            {recentHistory.map((item) => {
              const isReading = item.type === 'reading';
              const color = isReading ? '#22C55E' : '#6366F1';
              const icon: IoniconsName = isReading ? 'book-outline' : 'create-outline';

              return (
                <View
                  key={`${item.type}-${item.id}`}
                  className="mb-2 flex-row items-center rounded-xl bg-dark-card p-3"
                >
                  <View
                    className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: color + '20' }}
                  >
                    <Ionicons name={icon} size={20} color={color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {item.level} · {item.status === 'GRADED' ? 'Đã chấm' : 'Nháp'} · {formatTimeAgo(item.createdAt)}
                    </Text>
                  </View>
                  {item.score != null && (
                    <View className="items-end">
                      <Text className="text-sm font-bold text-white">{Math.round(item.score)}%</Text>
                      <Text className="text-xs text-gray-500">điểm</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Bottom spacer */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
