import { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Word, GenderInfo } from '@/types';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

interface WordCardProps {
  word: Word;
  onPress: () => void;
}

export default function WordCard({ word, onPress }: WordCardProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [speaking, setSpeaking] = useState(false);
  const genderInfo = GenderInfo[word.gender];

  const levelColors: Record<string, { base: string; dim: string }> = useMemo(() => ({
    A1: { base: colors.pastel.mint.base, dim: colors.pastel.mint.dim },
    A2: { base: colors.pastel.sky.base, dim: colors.pastel.sky.dim },
    B1: { base: colors.pastel.peach.base, dim: colors.pastel.peach.dim },
  }), [colors]);

  const genderColors: Record<string, { base: string; dim: string }> = useMemo(() => ({
    masculine: { base: colors.pastel.sky.base, dim: colors.pastel.sky.dim },
    feminine: { base: colors.pastel.rose.base, dim: colors.pastel.rose.dim },
    neuter: { base: colors.pastel.mint.base, dim: colors.pastel.mint.dim },
  }), [colors]);

  const level = levelColors[word.level] || { base: colors.text.secondary, dim: colors.bg.b3 };
  const gender = genderColors[word.gender] || { base: colors.text.secondary, dim: colors.bg.b3 };

  const handleSpeak = useCallback(() => {
    if (speaking) return;
    setSpeaking(true);
    const fullWord = word.article ? `${word.article} ${word.word}` : word.word;
    Speech.speak(fullWord, {
      language: 'de-DE',
      rate: 0.8,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  }, [speaking, word.article, word.word]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.card}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.wordContent}>
          <View style={styles.articleRow}>
            <Text style={[styles.article, { color: gender.base }]}>
              {word.article}{' '}
            </Text>
            <Text style={styles.wordText}>{word.word}</Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                handleSpeak();
              }}
              hitSlop={4}
              accessibilityLabel="Nghe phát âm"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.speakBtn,
                pressed && styles.speakBtnPressed,
                speaking && styles.speakBtnActive,
              ]}
            >
              <Ionicons
                name={speaking ? 'volume-high' : 'volume-medium-outline'}
                size={18}
                color={colors.pastel.lavender.base}
              />
            </Pressable>
          </View>
          <Text style={styles.translationEn} numberOfLines={1}>
            {word.translationEn}
          </Text>
          {word.translationVi ? (
            <Text style={styles.translationVi} numberOfLines={1}>
              {word.translationVi}
            </Text>
          ) : null}
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <View style={[styles.levelBadge, { backgroundColor: level.dim, borderColor: level.base + '30' }]}>
            <Text style={[styles.levelText, { color: level.base }]}>{word.level}</Text>
          </View>
          <View style={[styles.genderBadge, { backgroundColor: gender.dim, borderColor: gender.base + '30' }]}>
            <Text style={[styles.genderText, { color: gender.base }]}>
              {genderInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom tags */}
      <View style={styles.bottomRow}>
        <View style={styles.tagPill}>
          <Ionicons name="folder-outline" size={11} color={colors.text.tertiary} />
          <Text style={styles.tagText}>{word.category}</Text>
        </View>
        {word.plural ? (
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>Pl: {word.plural}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: radius.stone,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordContent: {
    flex: 1,
    marginRight: 12,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'nowrap',
  },
  speakBtn: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  speakBtnPressed: {
    backgroundColor: colors.pastel.lavender.dim,
  },
  speakBtnActive: {
    backgroundColor: colors.pastel.lavender.dim,
  },
  article: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: typography.fontFamily.bodyBold,
  },
  wordText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  translationEn: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  translationVi: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  levelBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamily.bodyBold,
  },
  genderBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  genderText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fontFamily.bodySemibold,
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg.b3,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
  },
});
