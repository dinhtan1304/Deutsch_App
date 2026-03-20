import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReadingHistory } from '@/hooks/useReading';
import { useWritingHistory } from '@/hooks/useWriting';
import { spacing, radius, typography } from '@/theme';
import { PastelCard } from '@/components/ui/PastelCard';
import type { PastelKey } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

// ── Types ──

const { width } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (width - spacing.screenH * 2 - CARD_GAP) / 2;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface SkillCard {
  key: string;
  name: string;
  nameDe: string;
  description: string;
  icon: IoniconsName;
  pastel: PastelKey;
  freeRoute: string;
  examRoute?: string;
}

interface ExamCard {
  key: string;
  name: string;
  nameDe: string;
  description: string;
  icon: IoniconsName;
  pastel: PastelKey;
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
    pastel: 'sky',
    freeRoute: '/(tabs)/practice/reading',
  },
  {
    key: 'writing',
    name: 'Luyện Viết',
    nameDe: 'Schreibübung',
    description: 'Viết bài tiếng Đức, AI chấm điểm',
    icon: 'create-outline',
    pastel: 'lavender',
    freeRoute: '/(tabs)/practice/writing',
  },
  {
    key: 'listening',
    name: 'Luyện Nghe',
    nameDe: 'Hörübung',
    description: 'Nghe tiếng Đức, trả lời câu hỏi',
    icon: 'ear-outline',
    pastel: 'mint',
    freeRoute: '/(tabs)/practice/listening',
  },
  {
    key: 'speaking',
    name: 'Luyện Nói',
    nameDe: 'Sprechübung',
    description: 'Nói tiếng Đức, AI chấm phát âm',
    icon: 'mic-outline',
    pastel: 'peach',
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
    pastel: 'sky',
    route: '/(tabs)/practice/reading',
  },
  {
    key: 'exam-writing',
    name: 'Viết Theo Đề',
    nameDe: 'Prüfungsschreiben',
    description: 'Goethe & TELC A1/A2/B1',
    icon: 'create-outline',
    pastel: 'lavender',
    route: '/(tabs)/practice/writing',
  },
  {
    key: 'exam-listening',
    name: 'Nghe Theo Đề',
    nameDe: 'Prüfungshören',
    description: 'Goethe & TELC A1/A2/B1',
    icon: 'ear-outline',
    pastel: 'mint',
    route: '/(tabs)/practice/listening',
  },
  {
    key: 'exam-speaking',
    name: 'Nói Theo Đề',
    nameDe: 'Prüfungssprechen',
    description: 'Goethe & TELC A1/A2/B1',
    icon: 'mic-outline',
    pastel: 'peach',
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

const HISTORY_PASTEL: Record<string, PastelKey> = {
  reading: 'sky',
  writing: 'lavender',
};

// ── Screen ──

export default function PracticeHubScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
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
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        style={s.flex1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.pastel.lavender.base}
            colors={[colors.pastel.lavender.base]}
          />
        }
      >
        {/* ====== Header ====== */}
        <Animated.View entering={FadeInDown.duration(400).delay(0)} style={s.header}>
          <View style={s.headerIconWrap}>
            <Ionicons name="school" size={24} color={colors.pastel.lavender.base} />
          </View>
          <View>
            <Text style={s.headerTitle}>Luyện tập</Text>
            <Text style={s.headerSubtitle}>Rèn luyện kỹ năng tiếng Đức mỗi ngày</Text>
          </View>
        </Animated.View>

        {/* ====== Free Practice Section ====== */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={s.section}>
          <Text style={s.sectionLabel}>LUYỆN TỰ DO</Text>
          <Text style={s.sectionHint}>AI tạo đề ngẫu nhiên</Text>

          <View style={s.cardGrid}>
            {SKILL_CARDS.map((card, index) => (
              <Animated.View
                key={card.key}
                entering={FadeInDown.duration(350).delay(150 + index * 70)}
                style={{ width: CARD_WIDTH }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(card.freeRoute as any)}
                >
                  <PastelCard color={card.pastel} style={s.skillCard}>
                    <View
                      style={[
                        s.skillIconWrap,
                        { backgroundColor: colors.pastel[card.pastel].base + '22' },
                      ]}
                    >
                      <Ionicons
                        name={card.icon}
                        size={22}
                        color={colors.pastel[card.pastel].base}
                      />
                    </View>
                    <Text
                      style={[s.skillNameDe, { color: colors.pastel[card.pastel].base }]}
                    >
                      {card.nameDe}
                    </Text>
                    <Text style={s.skillName}>{card.name}</Text>
                    <Text style={s.skillDesc} numberOfLines={2}>
                      {card.description}
                    </Text>
                  </PastelCard>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ====== Divider ====== */}
        <Animated.View entering={FadeInDown.duration(400).delay(450)} style={s.dividerRow}>
          <View style={s.dividerLine} />
          <View style={s.dividerBadge}>
            <Text style={s.dividerText}>ĐỀ CHUẨN</Text>
          </View>
          <View style={s.dividerLine} />
        </Animated.View>

        {/* ====== Exam Practice Section ====== */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={s.section}>
          <View style={s.examLabelRow}>
            <Text style={s.sectionLabel}>THEO ĐỀ CHUẨN</Text>
            <View style={s.examBadge}>
              <Text style={s.examBadgeText}>Goethe & TELC</Text>
            </View>
          </View>
          <Text style={s.sectionHint}>Đầy đủ tất cả Teile</Text>

          <View style={s.cardGrid}>
            {EXAM_CARDS.map((card, index) => (
              <Animated.View
                key={card.key}
                entering={FadeInDown.duration(350).delay(550 + index * 70)}
                style={{ width: CARD_WIDTH }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(card.route as any)}
                >
                  <PastelCard color={card.pastel} style={s.examCard}>
                    <View
                      style={[
                        s.examIconWrap,
                        { backgroundColor: colors.pastel[card.pastel].base + '22' },
                      ]}
                    >
                      <Ionicons
                        name={card.icon}
                        size={18}
                        color={colors.pastel[card.pastel].base}
                      />
                    </View>
                    <Text
                      style={[s.examNameDe, { color: colors.pastel[card.pastel].base }]}
                    >
                      {card.nameDe}
                    </Text>
                    <Text style={s.examName}>{card.name}</Text>
                    <Text style={s.examDesc} numberOfLines={1}>
                      {card.description}
                    </Text>
                  </PastelCard>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ====== Grammar Section ====== */}
        <Animated.View entering={FadeInDown.duration(400).delay(830)} style={s.grammarSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/practice/grammar' as any)}
          >
            <PastelCard color="rose" style={s.grammarCard}>
              <View style={s.grammarIconWrap}>
                <Ionicons name="library-outline" size={24} color={colors.pastel.rose.base} />
              </View>
              <View style={s.flex1}>
                <Text style={s.grammarNameDe}>Grammatik</Text>
                <Text style={s.grammarName}>Ngữ pháp</Text>
                <Text style={s.grammarDesc}>Bài học + bài tập ngữ pháp theo cấp độ</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </PastelCard>
          </TouchableOpacity>
        </Animated.View>

        {/* ====== Recent History ====== */}
        {recentHistory.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(900)} style={s.historySection}>
            <Text style={s.historyTitle}>Luyện tập gần đây</Text>
            {recentHistory.map((item, index) => {
              const pastel = HISTORY_PASTEL[item.type] || 'lavender';
              const accentColor = colors.pastel[pastel].base;
              const icon: IoniconsName =
                item.type === 'reading' ? 'book-outline' : 'create-outline';

              return (
                <Animated.View
                  key={`${item.type}-${item.id}`}
                  entering={FadeInDown.duration(300).delay(950 + index * 60)}
                >
                  <View style={s.historyRow}>
                    <View
                      style={[s.historyIcon, { backgroundColor: accentColor + '18' }]}
                    >
                      <Ionicons name={icon} size={20} color={accentColor} />
                    </View>
                    <View style={s.flex1}>
                      <Text style={s.historyItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={s.historyItemMeta}>
                        {item.level} ·{' '}
                        {item.status === 'GRADED' ? 'Đã chấm' : 'Nháp'} ·{' '}
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                    {item.score != null && (
                      <View style={s.historyScore}>
                        <Text style={[s.historyScoreNum, { color: accentColor }]}>
                          {Math.round(item.score)}%
                        </Text>
                        <Text style={s.historyScoreLabel}>điểm</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──

const createS = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  flex1: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.pastel.lavender.dim,
    borderWidth: 1,
    borderColor: colors.pastel.lavender.base + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Section
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.screenH,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },

  // Card grid
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // Skill cards (free practice)
  skillCard: {
    height: 160,
  },
  skillIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  skillNameDe: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    marginBottom: 2,
  },
  skillName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  skillDesc: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.screenH,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dividerBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dividerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },

  // Exam label row
  examLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  examBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.pastel.peach.dim,
    borderWidth: 1,
    borderColor: colors.pastel.peach.base + '33',
  },
  examBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.bodyBlack,
    color: colors.pastel.peach.base,
  },

  // Exam cards
  examCard: {
    height: 130,
  },
  examIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  examNameDe: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    marginBottom: 2,
  },
  examName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  examDesc: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Grammar section
  grammarSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.screenH,
  },
  grammarCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grammarIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.pastel.rose.base + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  grammarNameDe: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.rose.base,
  },
  grammarName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  grammarDesc: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Recent history
  historySection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing['2xl'],
  },
  historyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  historyItemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  historyItemMeta: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  historyScore: {
    alignItems: 'flex-end',
  },
  historyScoreNum: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  historyScoreLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
});
