import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { spacing, radius, typography, component } from '@/theme';
import { GenderBadge } from '@/components/ui/GenderBadge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GhostButton } from '@/components/ui/GhostButton';
import type { Gender } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

// ── Types ─────────────────────────────────────────────
export type Word = {
  text: string;
  phonetic: string;
  gender: Gender;
  meaning: string;
  example: string;
  conjugations?: { pronoun: string; form: string; highlight?: boolean }[];
};

type Props = {
  word: Word;
  progress: { current: number; total: number };
  onNext: () => void;
  onReview: () => void;
  onBack: () => void;
};

// ── Component ─────────────────────────────────────────
export function LessonScreen({ word, progress, onNext, onReview, onBack }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const pct = (progress.current / progress.total) * 100;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Nav Bar ── */}
      <View style={s.nav}>
        <Animated.View entering={FadeInRight.duration(300)}>
          <View style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text.primary} onPress={onBack} />
          </View>
        </Animated.View>
        <View style={s.progressOuter}>
          <Animated.View
            entering={FadeInRight.duration(400)}
            style={[s.progressInner, { width: `${pct}%` as any }]}
          />
        </View>
        <Text style={s.progressLabel}>{progress.current}/{progress.total}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ── Word Hero Card ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.wordCard}>
          <GenderBadge gender={word.gender} />

          <Text style={s.wordText}>{word.text}</Text>
          <Text style={s.phonetic}>{word.phonetic}</Text>
          <Text style={s.meaning}>{word.meaning}</Text>

          {word.example ? (
            <View style={s.examplePill}>
              <Text style={s.exampleText}>„{word.example}"</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* ── Conjugation Section ── */}
        {word.conjugations && word.conjugations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={s.sectionLabel}>KONJUGATION</Text>
            <View style={s.conjCard}>
              {word.conjugations.map((c, i) => (
                <View key={i} style={[s.conjRow, i < word.conjugations!.length - 1 && s.conjRowBorder]}>
                  <Text style={s.conjPronoun}>{c.pronoun}</Text>
                  <Text style={s.conjForm}>{c.form}</Text>
                  {c.highlight && (
                    <View style={s.conjTag}>
                      <Text style={s.conjTagText}>hay dùng</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom Buttons ── */}
      <Animated.View entering={FadeInDown.delay(300).duration(300)} style={s.bottomBar}>
        <GhostButton label="Xem lại" onPress={onReview} style={s.ghostBtn} />
        <PrimaryButton label="Tiếp theo →" onPress={onNext} style={s.primaryBtn} />
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────
const createS = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.b0 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.screenH },

  // Nav
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screenH, paddingVertical: spacing.md, gap: spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.bg.b2, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
  progressOuter: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.bg.b3, overflow: 'hidden' },
  progressInner: { height: 6, borderRadius: 3, backgroundColor: colors.pastel.lime.base },
  progressLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.secondary, minWidth: 32, textAlign: 'right', fontFamily: typography.fontFamily.bodySemibold },

  // Word Card
  wordCard: {
    backgroundColor: colors.bg.b2, borderRadius: radius['2xl'], borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: component.heroCard.padding.vertical,
    paddingHorizontal: component.heroCard.padding.horizontal,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  wordText: { fontSize: typography.fontSize.word, fontWeight: typography.fontWeight.black, color: colors.text.primary, letterSpacing: typography.letterSpacing.tight, marginTop: spacing.sm, fontFamily: typography.fontFamily.heading },
  phonetic: { fontSize: typography.fontSize.md, fontStyle: 'italic', color: colors.text.tertiary },
  meaning: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.medium, color: colors.text.secondary, marginTop: spacing.xs, fontFamily: typography.fontFamily.bodyMedium },
  examplePill: { backgroundColor: colors.bg.b3, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.sm },
  exampleText: { fontSize: typography.fontSize.base, color: colors.text.secondary, fontStyle: 'italic', fontFamily: typography.fontFamily.body },

  // Conjugation
  sectionLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.text.tertiary, letterSpacing: typography.letterSpacing.widest, textTransform: 'uppercase', marginTop: spacing['2xl'], marginBottom: spacing.md, fontFamily: typography.fontFamily.heading },
  conjCard: { backgroundColor: colors.bg.b2, borderRadius: radius.stone, borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden' },
  conjRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  conjRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  conjPronoun: { fontSize: typography.fontSize.base, color: colors.text.tertiary, width: 50 },
  conjForm: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text.primary, flex: 1, fontFamily: typography.fontFamily.heading },
  conjTag: { backgroundColor: colors.pastel.peach.dim, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, borderWidth: 1, borderColor: colors.pastel.peach.base + '33' },
  conjTagText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.pastel.peach.base, fontFamily: typography.fontFamily.bodySemibold },

  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.screenH, paddingBottom: 34, paddingTop: spacing.md, backgroundColor: colors.bg.b0, borderTopWidth: 1, borderTopColor: colors.border.subtle },
  ghostBtn: { flex: 1 },
  primaryBtn: { flex: 2 },
});
