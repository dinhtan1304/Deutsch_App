import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProfile, useUpdateProfile, useUserStats } from '@/hooks/useUser';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
  color: string;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.statRow}>
      <View
        style={[styles.statIconBox, { backgroundColor: `${color}20` }]}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data: profile, isLoading, refetch, isRefetching } = useProfile();
  const { data: stats } = useUserStats();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const handleEditName = useCallback(() => {
    setEditName(profile?.name ?? '');
    setIsEditing(true);
  }, [profile]);

  const handleSaveName = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }
    try {
      await updateProfile.mutateAsync({ name: editName.trim() });
      setIsEditing(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật tên');
    }
  }, [editName, updateProfile]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
      </SafeAreaView>
    );
  }

  const accuracy = stats?.accuracy ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.pastel.lavender.base}
            colors={[colors.pastel.lavender.base]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {profile?.avatar ? (
              <Text style={styles.avatarEmoji}>{profile.avatar}</Text>
            ) : (
              <Ionicons name="person" size={40} color={colors.pastel.lavender.base} />
            )}
          </View>

          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập tên của bạn"
                placeholderTextColor={colors.text.tertiary}
                autoFocus
              />
              <Pressable
                onPress={handleSaveName}
                style={styles.saveBtn}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </Pressable>
              <Pressable
                onPress={() => setIsEditing(false)}
                style={styles.cancelBtn}
              >
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleEditName} style={styles.nameRow}>
              <Text style={styles.profileName}>
                {profile?.name || 'Chưa đặt tên'}
              </Text>
              <Ionicons name="pencil-outline" size={16} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>

        {/* Email (read-only) */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.statIconBox, { backgroundColor: `${colors.text.secondary}20` }]}>
              <Ionicons name="mail-outline" size={18} color={colors.text.secondary} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyText}>Chỉ đọc</Text>
            </View>
          </View>
        </View>

        {/* Member since */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.statIconBox, { backgroundColor: colors.pastel.lavender.dim }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.pastel.lavender.base} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.infoLabel}>Thành viên từ</Text>
              <Text style={styles.infoValue}>
                {profile?.createdAt ? formatDate(profile.createdAt) : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionLabel}>
            Thống kê
          </Text>
          <View style={styles.statsCard}>
            <StatRow
              icon="game-controller-outline"
              label="Trò chơi đã chơi"
              value={stats?.gamesPlayed ?? 0}
              color={colors.pastel.lavender.base}
            />
            <View style={styles.statDivider} />
            <StatRow
              icon="checkmark-circle-outline"
              label="Độ chính xác"
              value={`${Math.round(accuracy)}%`}
              color={colors.pastel.mint.base}
            />
            <View style={styles.statDivider} />
            <StatRow
              icon="book-outline"
              label="Từ đã học"
              value={stats?.wordsLearned ?? 0}
              color={colors.pastel.sky.base}
            />
            <View style={styles.statDivider} />
            <StatRow
              icon="heart-outline"
              label="Từ yêu thích"
              value={stats?.favorites ?? 0}
              color={colors.pastel.rose.base}
            />
            <View style={styles.statDivider} />
            <StatRow
              icon="checkmark-done-outline"
              label="Tổng câu trả lời đúng"
              value={stats?.correctAnswers ?? 0}
              color={colors.pastel.peach.base}
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.b0,
  },
  flex1: {
    flex: 1,
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
  avatarSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 24,
  },
  avatarCircle: {
    height: 96,
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    backgroundColor: colors.pastel.lavender.dim,
  },
  avatarEmoji: {
    fontSize: 36,
    fontFamily: typography.fontFamily.body,
  },
  editRow: {
    marginTop: spacing.lg,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editInput: {
    minWidth: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  saveBtn: {
    borderRadius: radius.lg,
    backgroundColor: colors.pastel.lavender.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  cancelBtn: {
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b2,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  nameRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  readOnlyBadge: {
    borderRadius: radius.md,
    backgroundColor: colors.border.strong,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  readOnlyText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  statsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    color: colors.text.tertiary,
  },
  statsCard: {
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingHorizontal: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statIconBox: {
    marginRight: spacing.md,
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  statLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  statDivider: {
    height: 1,
    backgroundColor: colors.border.strong,
  },
});
