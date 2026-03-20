import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useGameHistory } from '@/hooks/useGames';
import { GameType } from '@/types';
import { spacing, radius, typography } from '@/theme';
import { PastelCard } from '@/components/ui/PastelCard';
import { useXPStore } from '@/stores/xpStore';
import type { PastelKey } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const { width } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (width - spacing.screenH * 2 - CARD_GAP) / 2;

interface GameCardConfig {
  type: GameType | string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  pastel: PastelKey;
  route: string;
}

const GAME_CARDS: GameCardConfig[] = [
  {
    type: 'flashcard',
    name: 'Flashcards',
    description: 'Lật thẻ học từ vựng',
    icon: 'albums-outline',
    pastel: 'mint',
    route: '/(tabs)/games/setup?game=flashcards',
  },
  {
    type: 'quick-quiz',
    name: 'Quick Quiz',
    description: 'Trắc nghiệm nhanh',
    icon: 'help-circle-outline',
    pastel: 'lavender',
    route: '/(tabs)/games/setup?game=quick-quiz',
  },
  {
    type: 'matching',
    name: 'Word Match',
    description: 'Nối từ với nghĩa',
    icon: 'git-compare-outline',
    pastel: 'peach',
    route: '/(tabs)/games/setup?game=matching',
  },
  {
    type: 'timed-challenge',
    name: 'Time Challenge',
    description: 'Trả lời nhanh nhất',
    icon: 'timer-outline',
    pastel: 'peach',
    route: '/(tabs)/games/setup?game=timed-challenge',
  },
  {
    type: 'fill-blank',
    name: 'Fill in Blank',
    description: 'Điền từ còn thiếu',
    icon: 'text-outline',
    pastel: 'sky',
    route: '/(tabs)/games/setup?game=fill-blank',
  },
  {
    type: 'spelling',
    name: 'Spelling',
    description: 'Đánh vần từ tiếng Đức',
    icon: 'pencil-outline',
    pastel: 'sky',
    route: '/(tabs)/games/setup?game=spelling',
  },
  {
    type: 'gender-quiz',
    name: 'Gender Quiz',
    description: 'Đoán giống der/die/das',
    icon: 'male-female-outline',
    pastel: 'rose',
    route: '/(tabs)/games/setup?game=gender-quiz',
  },
  {
    type: 'listening',
    name: 'Listening',
    description: 'Nghe và chọn đáp án',
    icon: 'ear-outline',
    pastel: 'lavender',
    route: '/(tabs)/games/setup?game=listening',
  },
];

function getGameLabel(gameType: string): string {
  const card = GAME_CARDS.find((c) => c.type === gameType);
  return card?.name ?? gameType;
}

function getGameIcon(gameType: string): keyof typeof Ionicons.glyphMap {
  const card = GAME_CARDS.find((c) => c.type === gameType);
  return card?.icon ?? 'game-controller-outline';
}

function getGamePastel(gameType: string): PastelKey {
  const card = GAME_CARDS.find((c) => c.type === gameType);
  return card?.pastel ?? 'lavender';
}

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

export default function GamesHubScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data: history } = useGameHistory(5);
  const getBestScore = useXPStore((s) => s.getBestScore);
  const xpLevel = useXPStore((s) => s.level);
  const xpTotalXP = useXPStore((s) => s.totalXP);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400).springify()}
          style={styles.header}
        >
          <View style={styles.headerIconWrap}>
            <Ionicons
              name="game-controller"
              size={22}
              color={colors.pastel.lavender.base}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.headerTitle}>Trò chơi</Text>
            <Text style={styles.headerSubtitle}>
              Học từ vựng qua các mini game thú vị
            </Text>
          </View>
          {xpTotalXP > 0 && (
            <View style={styles.xpBadge}>
              <Ionicons name="flash" size={13} color={colors.pastel.peach.base} />
              <Text style={styles.xpBadgeText}>Lv.{xpLevel}</Text>
            </View>
          )}
        </Animated.View>

        {/* Section label */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(400).springify()}
          style={styles.sectionLabelWrap}
        >
          <Text style={styles.sectionLabel}>TẤT CẢ TRÒ CHƠI</Text>
        </Animated.View>

        {/* Game Grid */}
        <View style={styles.gameGrid}>
          {GAME_CARDS.map((game, index) => {
            const pastelColor = colors.pastel[game.pastel];
            return (
              <Animated.View
                key={game.type}
                entering={FadeInDown.delay(120 + index * 60)
                  .duration(400)
                  .springify()}
                style={{ width: CARD_WIDTH }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(game.route as any)}
                >
                  <PastelCard color={game.pastel} style={styles.gameCard}>
                    <View
                      style={[
                        styles.gameIconWrap,
                        { backgroundColor: pastelColor.base + '1A' },
                      ]}
                    >
                      <Ionicons
                        name={game.icon}
                        size={22}
                        color={pastelColor.base}
                      />
                    </View>
                    <Text style={styles.gameName}>{game.name}</Text>
                    <Text style={styles.gameDescription} numberOfLines={2}>
                      {game.description}
                    </Text>
                    {getBestScore(game.type) > 0 && (
                      <View style={styles.bestScoreRow}>
                        <Ionicons name="trophy" size={11} color={colors.pastel.peach.base} />
                        <Text style={styles.bestScoreText}>
                          {getBestScore(game.type)}
                        </Text>
                      </View>
                    )}
                  </PastelCard>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Recent History */}
        {history && history.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600).duration(400).springify()}
            style={styles.historySection}
          >
            <Text style={styles.sectionLabel}>LỊCH SỬ GẦN ĐÂY</Text>
            {history.map((session, idx) => {
              const pastelKey = getGamePastel(session.gameType);
              const pastelColor = colors.pastel[pastelKey];
              return (
                <Animated.View
                  key={session.id}
                  entering={FadeInDown.delay(660 + idx * 50)
                    .duration(400)
                    .springify()}
                >
                  <View style={styles.historyCard}>
                    <View
                      style={[
                        styles.historyIcon,
                        { backgroundColor: pastelColor.dim },
                      ]}
                    >
                      <Ionicons
                        name={getGameIcon(session.gameType)}
                        size={20}
                        color={pastelColor.base}
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.historyName}>
                        {getGameLabel(session.gameType)}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {session.correctAnswers}/{session.totalQuestions} đúng
                        {session.startedAt
                          ? ` · ${formatTimeAgo(session.startedAt)}`
                          : ''}
                      </Text>
                    </View>
                    <View style={styles.historyScoreWrap}>
                      <Text style={styles.historyScore}>{session.score}</Text>
                      <Text style={styles.historyScoreLabel}>điểm</Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
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
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sectionLabelWrap: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenH,
    gap: CARD_GAP,
  },
  gameCard: {
    height: 148,
    justifyContent: 'flex-start',
  },
  gameIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gameName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  gameDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },
  bestScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  bestScoreText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.peach.base,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.pastel.peach.dim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  xpBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.pastel.peach.base,
  },
  historySection: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.b2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  historyName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  historyMeta: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  historyScoreWrap: {
    alignItems: 'flex-end',
  },
  historyScore: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  historyScoreLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  bottomSpacer: {
    height: spacing.lg,
  },
});
