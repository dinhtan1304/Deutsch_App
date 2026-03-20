import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useMemo } from 'react';
import { Difficulty, CATEGORIES } from '@/types';
import { spacing, radius, typography, featureGradient } from '@/theme';
import type { FeatureKey } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

type GameKey =
  | 'flashcards'
  | 'quick-quiz'
  | 'matching'
  | 'timed-challenge'
  | 'fill-blank'
  | 'spelling'
  | 'gender-quiz'
  | 'listening';

const GAME_META: Record<
  GameKey,
  { name: string; icon: keyof typeof Ionicons.glyphMap; featureKey: FeatureKey; route: string }
> = {
  flashcards: {
    name: 'Flashcards',
    icon: 'albums-outline',
    featureKey: 'flashcards',
    route: '/(tabs)/games/flashcards',
  },
  'quick-quiz': {
    name: 'Quick Quiz',
    icon: 'help-circle-outline',
    featureKey: 'quick-quiz',
    route: '/(tabs)/games/quick-quiz',
  },
  matching: {
    name: 'Word Match',
    icon: 'git-compare-outline',
    featureKey: 'matching',
    route: '/(tabs)/games/matching',
  },
  'timed-challenge': {
    name: 'Time Challenge',
    icon: 'timer-outline',
    featureKey: 'timed-challenge',
    route: '/(tabs)/games/timed-challenge',
  },
  'fill-blank': {
    name: 'Fill in Blank',
    icon: 'text-outline',
    featureKey: 'fill-blank',
    route: '/(tabs)/games/fill-blank',
  },
  spelling: {
    name: 'Spelling',
    icon: 'pencil-outline',
    featureKey: 'spelling',
    route: '/(tabs)/games/spelling',
  },
  'gender-quiz': {
    name: 'Gender Quiz',
    icon: 'male-female-outline',
    featureKey: 'gender-quiz',
    route: '/(tabs)/games/gender-quiz',
  },
  listening: {
    name: 'Listening',
    icon: 'ear-outline',
    featureKey: 'listening-game',
    route: '/(tabs)/games/listening',
  },
};

const DIFFICULTIES: { value: Difficulty; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'beginner', label: 'Cơ bản', description: 'A1 - A2', icon: 'leaf-outline' },
  { value: 'intermediate', label: 'Trung bình', description: 'B1 - B2', icon: 'flame-outline' },
  { value: 'advanced', label: 'Nâng cao', description: 'C1 - C2', icon: 'diamond-outline' },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

const CATEGORY_LABELS: Record<string, string> = {
  animals: 'Động vật',
  body: 'Cơ thể',
  clothing: 'Quần áo',
  colors: 'Màu sắc',
  education: 'Giáo dục',
  family: 'Gia đình',
  food: 'Thực phẩm',
  health: 'Sức khỏe',
  home: 'Nhà cửa',
  nature: 'Thiên nhiên',
  numbers: 'Số đếm',
  occupations: 'Nghề nghiệp',
  places: 'Địa điểm',
  sports: 'Thể thao',
  technology: 'Công nghệ',
  time: 'Thời gian',
  transport: 'Giao thông',
  travel: 'Du lịch',
  weather: 'Thời tiết',
  other: 'Khác',
};

export default function GameSetupScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { game } = useLocalSearchParams<{ game: GameKey }>();
  const meta = game ? GAME_META[game] : null;

  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [questionCount, setQuestionCount] = useState(10);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [showCategories, setShowCategories] = useState(false);

  if (!meta) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.textPrimary}>Game không tồn tại</Text>
      </SafeAreaView>
    );
  }

  const handleStart = () => {
    const params: Record<string, string> = {
      difficulty,
      count: questionCount.toString(),
    };
    if (category) params.category = category;

    router.push({
      pathname: meta.route as any,
      params,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thiết lập game</Text>
        </View>

        {/* Game Info Card */}
        <View style={styles.sectionMx}>
          <LinearGradient
            colors={featureGradient(colors, meta.featureKey)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gameInfoGradient}
          >
            <View style={styles.gameIconContainer}>
              <Ionicons name={meta.icon} size={28} color={colors.text.primary} />
            </View>
            <Text style={styles.gameInfoName}>{meta.name}</Text>
          </LinearGradient>
        </View>

        {/* Difficulty Selection */}
        <View style={styles.sectionMxMt}>
          <Text style={styles.sectionLabel}>Độ khó</Text>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.value}
              activeOpacity={0.7}
              onPress={() => setDifficulty(d.value)}
              style={[
                styles.difficultyItem,
                difficulty === d.value
                  ? styles.difficultyItemActive
                  : styles.difficultyItemInactive,
              ]}
            >
              <View
                style={[
                  styles.difficultyIcon,
                  difficulty === d.value
                    ? styles.difficultyIconActive
                    : styles.difficultyIconInactive,
                ]}
              >
                <Ionicons
                  name={d.icon}
                  size={20}
                  color={difficulty === d.value ? colors.pastel.lavender.base : colors.text.secondary}
                />
              </View>
              <View style={styles.flex1}>
                <Text
                  style={[
                    styles.difficultyLabel,
                    { color: difficulty === d.value ? colors.pastel.lavender.base : colors.text.primary },
                  ]}
                >
                  {d.label}
                </Text>
                <Text style={styles.difficultyDesc}>{d.description}</Text>
              </View>
              {difficulty === d.value && (
                <Ionicons name="checkmark-circle" size={22} color={colors.pastel.lavender.base} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Question Count */}
        <View style={styles.sectionMxMt5}>
          <Text style={styles.sectionLabel}>Số câu hỏi</Text>
          <View style={styles.countRow}>
            {QUESTION_COUNTS.map((count) => (
              <TouchableOpacity
                key={count}
                activeOpacity={0.7}
                onPress={() => setQuestionCount(count)}
                style={[
                  styles.countItem,
                  questionCount === count
                    ? styles.countItemActive
                    : styles.countItemInactive,
                ]}
              >
                <Text
                  style={[
                    styles.countNumber,
                    { color: questionCount === count ? colors.pastel.lavender.base : colors.text.primary },
                  ]}
                >
                  {count}
                </Text>
                <Text style={styles.countLabel}>câu</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Filter (Optional) */}
        <View style={styles.sectionMxMt5}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowCategories(!showCategories)}
            style={styles.categoryToggle}
          >
            <Text style={styles.sectionLabelNoMargin}>
              Chủ đề {category ? `(${CATEGORY_LABELS[category] || category})` : '(Tất cả)'}
            </Text>
            <Ionicons
              name={showCategories ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.categoryWrap}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setCategory(undefined);
                  setShowCategories(false);
                }}
                style={[
                  styles.categoryChip,
                  !category ? styles.categoryChipActive : styles.categoryChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: !category ? colors.pastel.lavender.base : colors.text.secondary },
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategories(false);
                  }}
                  style={[
                    styles.categoryChip,
                    category === cat ? styles.categoryChipActive : styles.categoryChipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: category === cat ? colors.pastel.lavender.base : colors.text.secondary },
                    ]}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Start Button */}
        <View style={styles.startSection}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleStart}>
            <LinearGradient
              colors={featureGradient(colors, meta.featureKey)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startGradient}
            >
              <Ionicons name="play" size={22} color={colors.text.primary} />
              <Text style={styles.startText}>Bắt đầu chơi</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.b0,
  },
  textPrimary: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: {
    marginRight: spacing.md,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.bg.b2,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  sectionMx: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  gameInfoGradient: {
    borderRadius: radius.stone,
    padding: spacing.xl,
    alignItems: 'center',
  },
  gameIconContainer: {
    marginBottom: spacing.md,
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.stone,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gameInfoName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  sectionMxMt: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
  },
  sectionLabel: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  sectionLabelNoMargin: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  difficultyItem: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  difficultyItemActive: {
    borderWidth: 1,
    borderColor: colors.pastel.lavender.base,
    backgroundColor: colors.pastel.lavender.dim,
  },
  difficultyItemInactive: {
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  difficultyIcon: {
    marginRight: spacing.md,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  difficultyIconActive: {
    backgroundColor: colors.pastel.lavender.dim,
  },
  difficultyIconInactive: {
    backgroundColor: colors.bg.b3,
  },
  difficultyLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  difficultyDesc: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  sectionMxMt5: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  countItemActive: {
    borderWidth: 1,
    borderColor: colors.pastel.lavender.base,
    backgroundColor: colors.pastel.lavender.dim,
  },
  countItemInactive: {
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  countNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  countLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  categoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryWrap: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipActive: {
    borderWidth: 1,
    borderColor: colors.pastel.lavender.base,
    backgroundColor: colors.pastel.lavender.dim,
  },
  categoryChipInactive: {
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  categoryChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  startSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['3xl'],
    marginBottom: spacing['3xl'],
  },
  startGradient: {
    borderRadius: radius.stone,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
});
