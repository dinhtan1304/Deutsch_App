import { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHistory, useClearHistory } from '@/hooks/useHistory';
import type { HistoryItem } from '@/types';
import { GenderInfo } from '@/types';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return 'Hôm nay';
  if (isSameDay(date, yesterday)) return 'Hôm qua';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface HistorySection {
  title: string;
  data: HistoryItem[];
}

export default function HistoryScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { data: history, isLoading, refetch, isRefetching } = useHistory(100);
  const clearHistory = useClearHistory();

  const sections = useMemo<HistorySection[]>(() => {
    if (!history || history.length === 0) return [];

    const grouped: Record<string, HistoryItem[]> = {};
    for (const item of history) {
      const key = formatDate(item.viewedAt);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    return Object.entries(grouped).map(([title, data]) => ({
      title,
      data,
    }));
  }, [history]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có chắc muốn xóa toàn bộ lịch sử xem từ vựng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => clearHistory.mutate(),
        },
      ],
    );
  }, [clearHistory]);

  const renderItem = useCallback(({ item }: { item: HistoryItem }) => {
    const genderInfo = item.word.gender ? GenderInfo[item.word.gender] : null;

    return (
      <View style={s.itemCard}>
        <View style={s.itemRow}>
          {genderInfo && (
            <View
              style={[s.genderDot, { backgroundColor: genderInfo.color }]}
            />
          )}
          <View style={s.flex1}>
            <View style={s.wordRow}>
              {item.word.article && (
                <Text
                  style={[
                    s.articleText,
                    { color: genderInfo?.color ?? colors.text.secondary },
                  ]}
                >
                  {item.word.article}
                </Text>
              )}
              <Text style={s.wordText}>{item.word.word}</Text>
            </View>
            <Text style={s.translationText}>
              {item.word.translationVi || item.word.translationEn}
            </Text>
          </View>
          <Text style={s.timeText}>{formatTime(item.viewedAt)}</Text>
        </View>
      </View>
    );
  }, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: HistorySection }) => (
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Lịch sử</Text>
        {history && history.length > 0 && (
          <Pressable onPress={handleClear} style={s.clearBtn}>
            <Ionicons name="trash-outline" size={14} color={colors.pastel.rose.base} />
            <Text style={s.clearText}>Xóa</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
        </View>
      ) : sections.length === 0 ? (
        <View style={s.centered}>
          <View style={s.emptyIcon}>
            <Ionicons name="time-outline" size={40} color={colors.text.tertiary} />
          </View>
          <Text style={s.emptyTitle}>Chưa có lịch sử</Text>
          <Text style={s.emptySubtitle}>
            Các từ vựng bạn đã xem sẽ xuất hiện ở đây
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.pastel.lavender.base}
              colors={[colors.pastel.lavender.base]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.pastel.rose.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: spacing.lg,
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: colors.bg.b2,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.secondary,
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    maxWidth: 240,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  sectionHeader: {
    backgroundColor: colors.bg.b0,
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.secondary,
  },
  itemCard: {
    marginBottom: 6,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderDot: {
    marginRight: spacing.md,
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  flex1: {
    flex: 1,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  articleText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
  },
  wordText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  translationText: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
});
