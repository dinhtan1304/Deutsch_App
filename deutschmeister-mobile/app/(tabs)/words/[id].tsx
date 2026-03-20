import { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWord } from '@/hooks/useWords';
import WordDetail from '@/components/words/WordDetail';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

export default function WordDetailScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: word, isLoading, isError, error } = useWord(id!);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Word Detail
        </Text>
      </View>

      {/* Content */}
      {isLoading && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
          <Text style={styles.loadingText}>Loading word...</Text>
        </View>
      )}

      {isError && (
        <View style={styles.errorContent}>
          <Ionicons name="warning-outline" size={48} color={colors.pastel.rose.base} />
          <Text style={styles.errorText}>
            Failed to load word
          </Text>
          <Text style={styles.errorDetail}>
            {(error as Error)?.message || 'Unknown error'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.goBackButton}
          >
            <Text style={styles.goBackText}>Go Back</Text>
          </Pressable>
        </View>
      )}

      {word && <WordDetail word={word} />}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b2,
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  errorText: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  errorDetail: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  goBackButton: {
    marginTop: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.pastel.lavender.base,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  goBackText: {
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.pastel.lavender.on,
    fontSize: typography.fontSize.base,
  },
});
