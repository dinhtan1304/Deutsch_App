import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import type { Plan, MySubscription, BankInfo } from '@/lib/api/subscriptions';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

function FeatureRow({
  text,
  included,
}: {
  text: string;
  included: boolean;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.featureIcon,
          { backgroundColor: included ? `${colors.pastel.mint.base}20` : `${colors.pastel.rose.base}20` },
        ]}
      >
        <Ionicons
          name={included ? 'checkmark' : 'close'}
          size={14}
          color={included ? colors.pastel.mint.base : colors.pastel.rose.base}
        />
      </View>
      <Text
        style={[styles.featureText, { color: included ? colors.text.primary : colors.text.tertiary }]}
      >
        {text}
      </Text>
    </View>
  );
}

function BankInfoCard({ bankInfo }: { bankInfo: BankInfo }) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.bankCard}>
      <Text style={styles.bankTitle}>
        Thông tin chuyển khoản
      </Text>
      <View style={{ gap: 8 }}>
        <View style={styles.bankRow}>
          <Text style={styles.bankLabel}>Ngân hàng</Text>
          <Text style={styles.bankValue}>{bankInfo.bankName}</Text>
        </View>
        <View style={styles.bankRow}>
          <Text style={styles.bankLabel}>Số tài khoản</Text>
          <Text style={styles.bankValue}>{bankInfo.accountNumber}</Text>
        </View>
        <View style={styles.bankRow}>
          <Text style={styles.bankLabel}>Chủ tài khoản</Text>
          <Text style={styles.bankValue}>{bankInfo.accountName}</Text>
        </View>
        <View style={styles.bankRow}>
          <Text style={styles.bankLabel}>Nội dung</Text>
          <Text style={[styles.bankValueBold, { color: colors.pastel.lavender.base }]}>
            {bankInfo.content}
          </Text>
        </View>
        <View style={styles.bankRow}>
          <Text style={styles.bankLabel}>Số tiền</Text>
          <Text style={[styles.bankValueBold, { color: colors.pastel.mint.base }]}>
            {bankInfo.amount.toLocaleString('vi-VN')} VND
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PricingScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);

  const {
    data: plans,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: subscriptionsApi.getPlans,
    staleTime: 5 * 60_000,
  });

  const {
    data: mySub,
    isLoading: subLoading,
    refetch: refetchSub,
    isRefetching,
  } = useQuery({
    queryKey: ['subscriptions', 'me'],
    queryFn: subscriptionsApi.getMySubscription,
    staleTime: 60_000,
  });

  const upgradeMutation = useMutation({
    mutationFn: (period: 'monthly' | 'yearly') => subscriptionsApi.requestUpgrade(period),
    onSuccess: (data) => {
      setBankInfo(data.bankInfo);
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'me'] });
      Alert.alert(
        'Yêu cầu nâng cấp',
        'Vui lòng chuyển khoản theo thông tin bên dưới để hoàn tất nâng cấp.'
      );
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể yêu cầu nâng cấp. Vui lòng thử lại.');
    },
  });

  const isLoading = plansLoading || subLoading;
  const isPremium = mySub?.plan === 'premium';

  const premiumPlan = plans?.find((p) => p.code === 'premium');
  const freePlan = plans?.find((p) => p.code === 'free');

  const displayPrice =
    premiumPlan && selectedPeriod === 'monthly'
      ? premiumPlan.monthlyPrice
      : premiumPlan?.yearlyPrice ?? 0;

  const onRefresh = useCallback(() => {
    refetchPlans();
    refetchSub();
  }, [refetchPlans, refetchSub]);

  const handleUpgrade = useCallback(() => {
    Alert.alert(
      'Nâng cấp Premium',
      `Bạn muốn nâng cấp gói ${selectedPeriod === 'monthly' ? 'tháng' : 'năm'} với giá ${displayPrice.toLocaleString('vi-VN')} VND?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Nâng cấp',
          onPress: () => upgradeMutation.mutate(selectedPeriod),
        },
      ]
    );
  }, [selectedPeriod, displayPrice, upgradeMutation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Gói đăng ký</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
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
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
          </View>
        ) : (
          <>
            {/* Current Plan Badge */}
            <View style={styles.card}>
              <View style={styles.planBadgeRow}>
                <LinearGradient
                  colors={isPremium ? ['#B8A9D4', '#8EAD92'] : ['#4B5563', '#374151']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.planGradientIcon}
                >
                  <Ionicons
                    name={isPremium ? 'diamond' : 'person'}
                    size={22}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>
                    {isPremium ? 'Premium' : 'Free'}
                  </Text>
                  <Text style={styles.planDesc}>
                    {isPremium
                      ? mySub?.expiresAt
                        ? `Hết hạn: ${new Date(mySub.expiresAt).toLocaleDateString('vi-VN')}`
                        : 'Vĩnh viễn'
                      : 'Gói cơ bản'}
                  </Text>
                </View>
                {isPremium && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>
                      ACTIVE
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Period Toggle (only if not premium) */}
            {!isPremium && premiumPlan && (
              <View style={styles.periodToggle}>
                <Pressable
                  onPress={() => setSelectedPeriod('monthly')}
                  style={[
                    styles.periodBtn,
                    { backgroundColor: selectedPeriod === 'monthly' ? colors.pastel.lavender.base : 'transparent' },
                  ]}
                >
                  <Text
                    style={[
                      styles.periodBtnLabel,
                      { color: selectedPeriod === 'monthly' ? colors.text.primary : colors.text.secondary },
                    ]}
                  >
                    Tháng
                  </Text>
                  <Text
                    style={[
                      styles.periodBtnPrice,
                      { color: selectedPeriod === 'monthly' ? 'rgba(255,255,255,0.8)' : colors.text.tertiary },
                    ]}
                  >
                    {premiumPlan.monthlyPrice.toLocaleString('vi-VN')} VND
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedPeriod('yearly')}
                  style={[
                    styles.periodBtn,
                    { backgroundColor: selectedPeriod === 'yearly' ? colors.pastel.lavender.base : 'transparent' },
                  ]}
                >
                  <Text
                    style={[
                      styles.periodBtnLabel,
                      { color: selectedPeriod === 'yearly' ? colors.text.primary : colors.text.secondary },
                    ]}
                  >
                    Năm
                  </Text>
                  <Text
                    style={[
                      styles.periodBtnPrice,
                      { color: selectedPeriod === 'yearly' ? 'rgba(255,255,255,0.8)' : colors.text.tertiary },
                    ]}
                  >
                    {premiumPlan.yearlyPrice.toLocaleString('vi-VN')} VND
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Plan Comparison */}
            <View style={styles.comparisonSection}>
              <Text style={styles.sectionLabel}>
                So sánh gói
              </Text>

              {/* Free Plan */}
              <View style={styles.comparisonCard}>
                <View style={styles.comparisonHeader}>
                  <View style={styles.freeIconBox}>
                    <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
                  </View>
                  <View style={{ marginLeft: spacing.md }}>
                    <Text style={styles.comparisonTitle}>Free</Text>
                    <Text style={styles.comparisonSubtitle}>Miễn phí</Text>
                  </View>
                </View>
                {freePlan?.features.map((feature, idx) => (
                  <FeatureRow key={idx} text={feature} included={true} />
                )) ?? (
                  <>
                    <FeatureRow text="Học từ vựng cơ bản" included={true} />
                    <FeatureRow text="Trò chơi cơ bản" included={true} />
                    <FeatureRow text="Giới hạn luyện tập mỗi ngày" included={true} />
                    <FeatureRow text="Bài thi thử" included={false} />
                    <FeatureRow text="AI grading" included={false} />
                  </>
                )}
              </View>

              {/* Premium Plan */}
              <View style={styles.premiumCard}>
                <View style={styles.comparisonHeader}>
                  <LinearGradient
                    colors={['#B8A9D4', '#8EAD92']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.premiumIconGradient}
                  >
                    <Ionicons name="diamond" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.premiumInfo}>
                    <Text style={styles.comparisonTitle}>Premium</Text>
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.pastel.lavender.base }}>,
                    fontFamily: typography.fontFamily.body,
                      Tất cả tính năng
                    </Text>
                  </View>
                  {!isPremium && (
                    <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.pastel.lavender.base }}>,
                    fontFamily: typography.fontFamily.bodyBold,
                      {displayPrice.toLocaleString('vi-VN')}
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>,
                        /{selectedPeriod === 'monthly' ? 'tháng' : 'năm'}
                      </Text>
                    </Text>
                  )}
                </View>
                {premiumPlan?.features.map((feature, idx) => (
                  <FeatureRow key={idx} text={feature} included={true} />
                )) ?? (
                  <>
                    <FeatureRow text="Học từ vựng cơ bản" included={true} />
                    <FeatureRow text="Trò chơi không giới hạn" included={true} />
                    <FeatureRow text="Luyện tập không giới hạn" included={true} />
                    <FeatureRow text="Bài thi thử đầy đủ" included={true} />
                    <FeatureRow text="AI grading" included={true} />
                    <FeatureRow text="Hỗ trợ ưu tiên" included={true} />
                  </>
                )}
              </View>
            </View>

            {/* Upgrade Button */}
            {!isPremium && (
              <Pressable
                onPress={handleUpgrade}
                disabled={upgradeMutation.isPending}
                style={styles.upgradeBtn}
              >
                <LinearGradient
                  colors={['#B8A9D4', '#8EAD92']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeGradient}
                >
                  {upgradeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.upgradeBtnContent}>
                      <Ionicons name="diamond" size={20} color="#FFFFFF" />
                      <Text style={styles.upgradeBtnText}>
                        Nâng cấp Premium
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            )}

            {/* Bank Info (shown after upgrade request) */}
            {bankInfo && <BankInfoCard bankInfo={bankInfo} />}

            {/* Pending Payments */}
            {mySub?.payments && mySub.payments.length > 0 && (
              <View style={styles.paymentsSection}>
                <Text style={styles.sectionLabel}>
                  Lịch sử thanh toán
                </Text>
                {mySub.payments.map((payment) => (
                  <View key={payment.id} style={styles.paymentCard}>
                    <View style={styles.paymentRow}>
                      <View>
                        <Text style={styles.paymentName}>
                          {payment.plan === 'premium' ? 'Premium' : 'Free'} -{' '}
                          {payment.period === 'monthly' ? 'Tháng' : 'Năm'}
                        </Text>
                        <Text style={styles.paymentDate}>
                          {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.paymentStatusBadge,
                          {
                            backgroundColor:
                              payment.status === 'confirmed'
                                ? `${colors.pastel.mint.base}20`
                                : payment.status === 'rejected'
                                  ? `${colors.pastel.rose.base}20`
                                  : `${colors.pastel.peach.base}20`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.paymentStatusText,
                            {
                              color:
                                payment.status === 'confirmed'
                                  ? colors.pastel.mint.base
                                  : payment.status === 'rejected'
                                    ? colors.pastel.rose.base
                                    : colors.pastel.peach.base,
                            },
                          ]}
                        >
                          {payment.status === 'confirmed'
                            ? 'Đã xác nhận'
                            : payment.status === 'rejected'
                              ? 'Từ chối'
                              : 'Đang chờ'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.paymentAmount}>
                      {payment.amount.toLocaleString('vi-VN')} VND
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  card: {
    marginBottom: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planGradientIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  planName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  planDesc: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  activeBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.pastel.lavender.dim,
  },
  activeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lavender.base,
  },
  periodToggle: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.sm,
    paddingVertical: 10,
  },
  periodBtnLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  periodBtnPrice: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
  },
  comparisonSection: {
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
  comparisonCard: {
    marginBottom: spacing.md,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
  },
  comparisonHeader: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeIconBox: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: `${colors.text.secondary}20`,
  },
  comparisonTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  comparisonSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  premiumCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.stone,
    padding: spacing.lg,
    backgroundColor: `${colors.pastel.lavender.base}10`,
    borderWidth: 1,
    borderColor: `${colors.pastel.lavender.base}40`,
  },
  premiumIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    marginRight: spacing.md,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
  },
  upgradeBtn: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderRadius: radius.stone,
  },
  upgradeGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.stone,
  },
  upgradeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeBtnText: {
    marginLeft: 8,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  bankCard: {
    marginTop: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
  },
  bankTitle: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bankLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  bankValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.primary,
  },
  bankValueBold: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
  },
  paymentsSection: {
    marginBottom: spacing.lg,
  },
  paymentCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.primary,
  },
  paymentDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  paymentStatusBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paymentStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  paymentAmount: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.pastel.mint.base,
  },
});
