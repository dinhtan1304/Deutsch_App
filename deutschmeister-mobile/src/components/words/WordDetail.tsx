import { useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Word, GenderInfo } from '@/types';
import { useCheckFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { useAddToHistory } from '@/hooks/useHistory';
import { useAuthStore } from '@/stores/authStore';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

interface WordDetailProps {
  word: Word;
}

export default function WordDetail({ word }: WordDetailProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const genderInfo = GenderInfo[word.gender];

  const levelColors: Record<string, string> = useMemo(() => ({
    A1: colors.pastel.mint.base,
    A2: colors.pastel.sky.base,
    B1: colors.pastel.peach.base,
    B2: colors.pastel.rose.base,
    C1: colors.pastel.lavender.base,
    C2: colors.pastel.rose.base,
  }), [colors]);

  const levelColor = levelColors[word.level] || colors.text.tertiary;

  const { isAuthenticated } = useAuthStore();
  const { data: favoriteData } = useCheckFavorite(word.id);
  const { toggle, isLoading: toggleLoading } = useToggleFavorite();
  const addToHistory = useAddToHistory();

  const hasAddedToHistory = useRef(false);

  // Add to history on mount
  useEffect(() => {
    if (isAuthenticated && !hasAddedToHistory.current) {
      hasAddedToHistory.current = true;
      addToHistory.mutate(word.id);
    }
  }, [word.id, isAuthenticated]);

  const isFavorite = favoriteData?.isFavorite ?? false;

  const handleSpeak = () => {
    const fullWord = `${word.article} ${word.word}`;
    Speech.speak(fullWord, { language: 'de-DE', rate: 0.8 });
  };

  const handleToggleFavorite = () => {
    if (!isAuthenticated || toggleLoading) return;
    toggle(word.id, isFavorite);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header card */}
      <View style={styles.headerCard}>
        {/* Gender color bar */}
        <View
          style={[styles.genderBar, { backgroundColor: genderInfo.color }]}
        />

        {/* Article + Word */}
        <View style={styles.centerItems}>
          <Text
            style={[styles.genderLabel, { color: genderInfo.color }]}
          >
            {genderInfo.label}
          </Text>
          <View style={styles.articleRow}>
            <Text
              style={[styles.articleText, { color: genderInfo.color }]}
            >
              {word.article}{' '}
            </Text>
            <Text style={styles.wordText}>{word.word}</Text>
          </View>

          {/* Pronunciation + speaker */}
          <View style={styles.pronunciationRow}>
            {word.pronunciation && (
              <Text style={styles.pronunciationText}>
                [{word.pronunciation}]
              </Text>
            )}
            <Pressable
              onPress={handleSpeak}
              style={[styles.speakButton, { backgroundColor: `${genderInfo.color}20` }]}
            >
              <Ionicons name="volume-high" size={22} color={genderInfo.color} />
            </Pressable>
          </View>
        </View>

        {/* Favorite button */}
        {isAuthenticated && (
          <Pressable
            onPress={handleToggleFavorite}
            style={styles.favoriteButton}
            disabled={toggleLoading}
          >
            {toggleLoading ? (
              <ActivityIndicator size="small" color={colors.pastel.rose.base} />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={26}
                color={isFavorite ? colors.pastel.rose.base : colors.text.tertiary}
              />
            )}
          </Pressable>
        )}
      </View>

      {/* Translations */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>
          Translation
        </Text>

        <View style={styles.translationRow}>
          <View style={styles.langBadgeBlue}>
            <Text style={styles.langBadgeBlueText}>EN</Text>
          </View>
          <Text style={styles.translationText}>{word.translationEn}</Text>
        </View>

        {word.translationVi && (
          <View style={styles.translationRowVi}>
            <View style={styles.langBadgeAmber}>
              <Text style={styles.langBadgeAmberText}>VI</Text>
            </View>
            <Text style={styles.translationTextVi}>{word.translationVi}</Text>
          </View>
        )}
      </View>

      {/* Info: Plural, Level, Category */}
      <View style={styles.infoRow}>
        {/* Level */}
        <View style={styles.infoCardLeft}>
          <Text style={styles.infoLabel}>Level</Text>
          <View
            style={[styles.levelBadge, { backgroundColor: `${levelColor}20` }]}
          >
            <Text style={[styles.levelText, { color: levelColor }]}>
              {word.level}
            </Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.infoCardRight}>
          <Text style={styles.infoLabel}>Category</Text>
          <View style={styles.categoryBadge}>
            <Ionicons name="folder-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.categoryText}>{word.category}</Text>
          </View>
        </View>
      </View>

      {/* Plural */}
      {word.plural && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            Plural
          </Text>
          <Text style={styles.pluralText}>
            die{' '}
            <Text style={styles.pluralBold}>{word.plural}</Text>
          </Text>
        </View>
      )}

      {/* Examples */}
      {word.examples && word.examples.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.sectionHeaderLabel}>
              Examples
            </Text>
          </View>
          {word.examples.map((example, index) => (
            <View
              key={index}
              style={[
                styles.exampleRow,
                index > 0 && styles.exampleRowBorder,
              ]}
            >
              <View
                style={[styles.exampleNumber, { backgroundColor: `${genderInfo.color}20` }]}
              >
                <Text
                  style={[styles.exampleNumberText, { color: genderInfo.color }]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.exampleText}>
                {example}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Tips */}
      {word.tips && word.tips.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={16} color={colors.pastel.peach.base} />
            <Text style={styles.sectionHeaderLabel}>
              Tips
            </Text>
          </View>
          {word.tips.map((tip, index) => (
            <View
              key={index}
              style={[
                styles.tipRow,
                index > 0 && styles.exampleRowBorder,
              ]}
            >
              <Ionicons
                name="sparkles"
                size={14}
                color={colors.pastel.peach.base}
                style={{ marginTop: 3, marginRight: spacing.sm }}
              />
              <Text style={styles.exampleText}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.b2,
    padding: spacing.xl,
  },
  genderBar: {
    marginBottom: spacing.lg,
    height: 4,
    width: 64,
    alignSelf: 'center',
    borderRadius: radius.pill,
  },
  centerItems: {
    alignItems: 'center',
  },
  genderLabel: {
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  articleRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  articleText: {
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  wordText: {
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  pronunciationRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pronunciationText: {
    marginRight: spacing.sm,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  speakButton: {
    borderRadius: radius.pill,
    padding: spacing.sm,
  },
  favoriteButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    borderRadius: radius.pill,
    padding: spacing.sm,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    color: colors.text.tertiary,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBadgeBlue: {
    marginRight: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.pastel.sky.dim,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  langBadgeBlueText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.sky.base,
  },
  translationText: {
    flexShrink: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  translationRowVi: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBadgeAmber: {
    marginRight: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.pastel.peach.dim,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  langBadgeAmberText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  translationTextVi: {
    flexShrink: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  infoRow: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
  },
  infoCardLeft: {
    marginRight: spacing.sm,
    flex: 1,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
  },
  infoCardRight: {
    marginLeft: spacing.sm,
    flex: 1,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.b2,
    padding: spacing.lg,
  },
  infoLabel: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
  },
  levelBadge: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  levelText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  categoryBadge: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    textTransform: 'capitalize',
    color: colors.text.secondary,
  },
  pluralText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  pluralBold: {
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderLabel: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    color: colors.text.tertiary,
  },
  exampleRow: {
    flexDirection: 'row',
  },
  exampleRowBorder: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.strong,
    paddingTop: spacing.md,
  },
  exampleNumber: {
    marginRight: spacing.md,
    marginTop: 4,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  exampleNumberText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  exampleText: {
    flexShrink: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    color: colors.text.secondary,
  },
  tipRow: {
    flexDirection: 'row',
  },
});
