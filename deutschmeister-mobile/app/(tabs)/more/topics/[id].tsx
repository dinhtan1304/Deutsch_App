import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '@/theme';
import { useTopic, useUserTopicsProgress } from '@/hooks/useTopics';
import type { TopicWord } from '@/types/topic';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

function buildGenderColor(colors: ThemeColors): Record<string, { base: string; dim: string }> {
  return {
    masculine: { base: colors.pastel.sky.base, dim: colors.pastel.sky.dim },
    feminine: { base: colors.pastel.rose.base, dim: colors.pastel.rose.dim },
    neuter: { base: colors.pastel.mint.base, dim: colors.pastel.mint.dim },
  };
}

const GENDER_ARTICLE: Record<string, string> = {
  masculine: 'der',
  feminine: 'die',
  neuter: 'das',
};

function WordItem({ item }: { item: TopicWord }) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const genderColor = useMemo(() => buildGenderColor(colors), [colors]);
  const gc = genderColor[item.gender] || genderColor.neuter;
  const article = GENDER_ARTICLE[item.gender] || '';

  return (
    <View style={s.wordCard}>
      <View style={s.wordRow}>
        <View style={s.wordLeft}>
          {article ? (
            <View style={[s.articleBadge, { backgroundColor: gc.dim }]}>
              <Text style={[s.articleText, { color: gc.base }]}>{article}</Text>
            </View>
          ) : null}
          <View style={s.wordTextWrap}>
            <Text style={s.wordText}>{item.word}</Text>
            {item.plural ? (
              <Text style={s.pluralText}>Pl. {item.plural}</Text>
            ) : null}
          </View>
        </View>
        {item.isCore && (
          <View style={s.coreBadge}>
            <Text style={s.coreText}>Core</Text>
          </View>
        )}
      </View>

      {item.translationVi ? (
        <Text style={s.translationVi}>{item.translationVi}</Text>
      ) : null}
      <Text style={s.translationEn}>{item.translationEn}</Text>

      {item.pronunciation ? (
        <Text style={s.pronunciation}>/{item.pronunciation}/</Text>
      ) : null}

      {item.examples && item.examples.length > 0 && (
        <View style={s.exampleBox}>
          <Text style={s.exampleText}>"{item.examples[0]}"</Text>
        </View>
      )}
    </View>
  );
}

export default function TopicDetailScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: topic, isLoading } = useTopic(id!, true);
  const { data: progressList } = useUserTopicsProgress();

  const progress = progressList?.find?.((p: any) => p.topicId === id);
  const words: TopicWord[] = (topic as any)?.words || [];

  if (isLoading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color={colors.pastel.mint.base} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!topic) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>Không tìm thấy chủ đề</Text>
        </View>
      </SafeAreaView>
    );
  }

  const learnedCount = progress?.wordsLearned || 0;
  const totalCount = topic.wordCount || words.length;
  const progressPct = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {topic.nameVi || topic.nameEn}
        </Text>
        <View style={[s.levelBadge, { backgroundColor: colors.pastel.lavender.dim }]}>
          <Text style={[s.levelText, { color: colors.pastel.lavender.base }]}>{topic.level}</Text>
        </View>
      </View>

      {/* Topic info card */}
      <View style={s.infoCard}>
        <View style={s.infoTop}>
          <Text style={s.topicIcon}>{topic.icon || '📚'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.topicNameDe}>{topic.nameDe}</Text>
            <Text style={s.topicNameVi}>{topic.nameVi || topic.nameEn}</Text>
          </View>
        </View>
        <View style={s.progressRow}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.min(progressPct, 100)}%` }]} />
          </View>
          <Text style={s.progressLabel}>
            {learnedCount}/{totalCount} đã học
          </Text>
        </View>
      </View>

      {/* Section label */}
      <Text style={s.sectionLabel}>{words.length} TỪ VỰNG</Text>

      {/* Word list */}
      <FlatList
        data={words}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => <WordItem item={item} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="book-outline" size={48} color={colors.text.tertiary} />
            <Text style={s.emptyText}>Chưa có từ vựng trong chủ đề này</Text>
          </View>
        }
      />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bg.b2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  levelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
    fontFamily: typography.fontFamily.bodyBold,
  },
  infoCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bg.b2,
    borderRadius: radius.stone,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  topicIcon: {
    fontSize: 32,
    fontFamily: typography.fontFamily.body,
  },
  topicNameDe: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  topicNameVi: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bg.b3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.pastel.lime.base,
  },
  progressLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  wordCard: {
    backgroundColor: colors.bg.b2,
    borderRadius: radius.stone,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  articleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  articleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
    fontFamily: typography.fontFamily.bodyBold,
  },
  wordTextWrap: {
    flex: 1,
  },
  wordText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  pluralText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  coreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.pastel.lime.dim,
  },
  coreText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold as any,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.base,
  },
  translationVi: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
    marginBottom: 2,
  },
  translationEn: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  pronunciation: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  exampleBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.bg.b3,
    borderRadius: radius.md,
  },
  exampleText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
});
