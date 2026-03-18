import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import type { Plan, MySubscription, BankInfo } from '@/lib/api/subscriptions';

const PREMIUM = '#A855F7';

function FeatureRow({
  text,
  included,
}: {
  text: string;
  included: boolean;
}) {
  return (
    <View className="flex-row items-center py-2">
      <View
        className="mr-3 h-6 w-6 items-center justify-center rounded-full"
        style={{
          backgroundColor: included ? '#22C55E20' : '#EF444420',
        }}
      >
        <Ionicons
          name={included ? 'checkmark' : 'close'}
          size={14}
          color={included ? '#22C55E' : '#EF4444'}
        />
      </View>
      <Text
        className="flex-1 text-sm"
        style={{ color: included ? '#FFFFFF' : '#6B7280' }}
      >
        {text}
      </Text>
    </View>
  );
}

function BankInfoCard({ bankInfo }: { bankInfo: BankInfo }) {
  return (
    <View className="mt-4 rounded-2xl bg-dark-card p-4">
      <Text className="mb-3 text-base font-semibold text-white">
        Thong tin chuyen khoan
      </Text>
      <View className="space-y-2">
        <View className="flex-row justify-between py-1">
          <Text className="text-sm text-gray-400">Ngan hang</Text>
          <Text className="text-sm font-medium text-white">{bankInfo.bankName}</Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-sm text-gray-400">So tai khoan</Text>
          <Text className="text-sm font-medium text-white">{bankInfo.accountNumber}</Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-sm text-gray-400">Chu tai khoan</Text>
          <Text className="text-sm font-medium text-white">{bankInfo.accountName}</Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-sm text-gray-400">Noi dung</Text>
          <Text className="text-sm font-bold" style={{ color: PREMIUM }}>
            {bankInfo.content}
          </Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-sm text-gray-400">So tien</Text>
          <Text className="text-sm font-bold" style={{ color: '#22C55E' }}>
            {bankInfo.amount.toLocaleString('vi-VN')} VND
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PricingScreen() {
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
        'Yeu cau nang cap',
        'Vui long chuyen khoan theo thong tin ben duoi de hoan tat nang cap.'
      );
    },
    onError: () => {
      Alert.alert('Loi', 'Khong the yeu cau nang cap. Vui long thu lai.');
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
      'Nang cap Premium',
      `Ban muon nang cap goi ${selectedPeriod === 'monthly' ? 'thang' : 'nam'} voi gia ${displayPrice.toLocaleString('vi-VN')} VND?`,
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Nang cap',
          onPress: () => upgradeMutation.mutate(selectedPeriod),
        },
      ]
    );
  }, [selectedPeriod, displayPrice, upgradeMutation]);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">Goi dang ky</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={PREMIUM}
            colors={[PREMIUM]}
          />
        }
      >
        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color={PREMIUM} />
          </View>
        ) : (
          <>
            {/* Current Plan Badge */}
            <View className="mb-4 rounded-2xl bg-dark-card p-4">
              <View className="flex-row items-center">
                <LinearGradient
                  colors={isPremium ? ['#A855F7', '#6366F1'] : ['#4B5563', '#374151']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={isPremium ? 'diamond' : 'person'}
                    size={22}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-white">
                    {isPremium ? 'Premium' : 'Free'}
                  </Text>
                  <Text className="text-sm text-gray-400">
                    {isPremium
                      ? mySub?.expiresAt
                        ? `Het han: ${new Date(mySub.expiresAt).toLocaleDateString('vi-VN')}`
                        : 'Vinh vien'
                      : 'Goi co ban'}
                  </Text>
                </View>
                {isPremium && (
                  <View className="rounded-lg px-3 py-1" style={{ backgroundColor: `${PREMIUM}20` }}>
                    <Text className="text-xs font-bold" style={{ color: PREMIUM }}>
                      ACTIVE
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Period Toggle (only if not premium) */}
            {!isPremium && premiumPlan && (
              <View className="mb-4 flex-row overflow-hidden rounded-xl bg-dark-card p-1">
                <Pressable
                  onPress={() => setSelectedPeriod('monthly')}
                  className={`flex-1 items-center rounded-lg py-2.5 ${
                    selectedPeriod === 'monthly' ? '' : ''
                  }`}
                  style={{
                    backgroundColor: selectedPeriod === 'monthly' ? PREMIUM : 'transparent',
                  }}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedPeriod === 'monthly' ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    Thang
                  </Text>
                  <Text
                    className={`text-xs ${
                      selectedPeriod === 'monthly' ? 'text-white/80' : 'text-gray-500'
                    }`}
                  >
                    {premiumPlan.monthlyPrice.toLocaleString('vi-VN')} VND
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedPeriod('yearly')}
                  className="flex-1 items-center rounded-lg py-2.5"
                  style={{
                    backgroundColor: selectedPeriod === 'yearly' ? PREMIUM : 'transparent',
                  }}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedPeriod === 'yearly' ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    Nam
                  </Text>
                  <Text
                    className={`text-xs ${
                      selectedPeriod === 'yearly' ? 'text-white/80' : 'text-gray-500'
                    }`}
                  >
                    {premiumPlan.yearlyPrice.toLocaleString('vi-VN')} VND
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Plan Comparison */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                So sanh goi
              </Text>

              {/* Free Plan */}
              <View className="mb-3 rounded-2xl bg-dark-card p-4">
                <View className="mb-3 flex-row items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20">
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-base font-bold text-white">Free</Text>
                    <Text className="text-xs text-gray-500">Mien phi</Text>
                  </View>
                </View>
                {freePlan?.features.map((feature, idx) => (
                  <FeatureRow key={idx} text={feature} included={true} />
                )) ?? (
                  <>
                    <FeatureRow text="Hoc tu vung co ban" included={true} />
                    <FeatureRow text="Tro choi co ban" included={true} />
                    <FeatureRow text="Gioi han luyen tap moi ngay" included={true} />
                    <FeatureRow text="Bai thi thu" included={false} />
                    <FeatureRow text="AI grading" included={false} />
                  </>
                )}
              </View>

              {/* Premium Plan */}
              <View
                className="mb-3 overflow-hidden rounded-2xl p-4"
                style={{ backgroundColor: `${PREMIUM}10`, borderWidth: 1, borderColor: `${PREMIUM}40` }}
              >
                <View className="mb-3 flex-row items-center">
                  <LinearGradient
                    colors={['#A855F7', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="diamond" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-white">Premium</Text>
                    <Text className="text-xs" style={{ color: PREMIUM }}>
                      Tat ca tinh nang
                    </Text>
                  </View>
                  {!isPremium && (
                    <Text className="text-lg font-bold" style={{ color: PREMIUM }}>
                      {displayPrice.toLocaleString('vi-VN')}
                      <Text className="text-xs text-gray-400">
                        /{selectedPeriod === 'monthly' ? 'thang' : 'nam'}
                      </Text>
                    </Text>
                  )}
                </View>
                {premiumPlan?.features.map((feature, idx) => (
                  <FeatureRow key={idx} text={feature} included={true} />
                )) ?? (
                  <>
                    <FeatureRow text="Hoc tu vung co ban" included={true} />
                    <FeatureRow text="Tro choi khong gioi han" included={true} />
                    <FeatureRow text="Luyen tap khong gioi han" included={true} />
                    <FeatureRow text="Bai thi thu day du" included={true} />
                    <FeatureRow text="AI grading" included={true} />
                    <FeatureRow text="Ho tro uu tien" included={true} />
                  </>
                )}
              </View>
            </View>

            {/* Upgrade Button */}
            {!isPremium && (
              <Pressable
                onPress={handleUpgrade}
                disabled={upgradeMutation.isPending}
                className="mb-4 overflow-hidden rounded-2xl active:opacity-80"
              >
                <LinearGradient
                  colors={['#A855F7', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                    borderRadius: 16,
                  }}
                >
                  {upgradeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View className="flex-row items-center">
                      <Ionicons name="diamond" size={20} color="#FFFFFF" />
                      <Text className="ml-2 text-base font-bold text-white">
                        Nang cap Premium
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
              <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Lich su thanh toan
                </Text>
                {mySub.payments.map((payment) => (
                  <View key={payment.id} className="mb-2 rounded-2xl bg-dark-card p-4">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-sm font-medium text-white">
                          {payment.plan === 'premium' ? 'Premium' : 'Free'} -{' '}
                          {payment.period === 'monthly' ? 'Thang' : 'Nam'}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                      <View
                        className="rounded-lg px-2.5 py-1"
                        style={{
                          backgroundColor:
                            payment.status === 'confirmed'
                              ? '#22C55E20'
                              : payment.status === 'rejected'
                                ? '#EF444420'
                                : '#F59E0B20',
                        }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{
                            color:
                              payment.status === 'confirmed'
                                ? '#22C55E'
                                : payment.status === 'rejected'
                                  ? '#EF4444'
                                  : '#F59E0B',
                          }}
                        >
                          {payment.status === 'confirmed'
                            ? 'Da xac nhan'
                            : payment.status === 'rejected'
                              ? 'Tu choi'
                              : 'Dang cho'}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-1 text-sm font-semibold" style={{ color: '#22C55E' }}>
                      {payment.amount.toLocaleString('vi-VN')} VND
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
