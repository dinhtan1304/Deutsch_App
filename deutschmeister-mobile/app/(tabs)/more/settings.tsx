import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettings, useUpdateSettings } from '@/hooks/useUser';
import { useAuthStore } from '@/stores/authStore';
import type { Settings, UpdateSettingsPayload } from '@/lib/api/users';

type ThemeOption = 'light' | 'dark' | 'system';
type LevelOption = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all';

const THEME_OPTIONS: Array<{ value: ThemeOption; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
  { value: 'dark', label: 'Toi', icon: 'moon' },
  { value: 'light', label: 'Sang', icon: 'sunny' },
  { value: 'system', label: 'He thong', icon: 'phone-portrait-outline' },
];

const DAILY_GOALS = [5, 10, 15, 20, 30, 50];

const LEVELS: Array<{ value: LevelOption; label: string }> = [
  { value: 'all', label: 'Tat ca' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
];

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-5 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {title}
    </Text>
  );
}

function SettingRow({
  icon,
  label,
  children,
  color = '#9CA3AF',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <View className="flex-row items-center px-4 py-3.5">
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text className="flex-1 text-base text-white">{label}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const logout = useAuthStore((s) => s.logout);

  const [localSettings, setLocalSettings] = useState<Partial<Settings>>({});

  // Sync server settings to local state
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleUpdate = useCallback(
    (patch: UpdateSettingsPayload) => {
      setLocalSettings((prev) => ({ ...prev, ...patch }));
      updateSettings.mutate(patch);
    },
    [updateSettings],
  );

  const handleLogout = useCallback(() => {
    Alert.alert('Dang xuat', 'Ban co chac muon dang xuat khoi tai khoan?', [
      { text: 'Huy', style: 'cancel' },
      {
        text: 'Dang xuat',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login' as any);
        },
      },
    ]);
  }, [logout, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  const theme = (localSettings.theme as ThemeOption) ?? 'dark';
  const soundEnabled = localSettings.soundEnabled ?? true;
  const vibrationEnabled = localSettings.vibrationEnabled ?? true;
  const dailyGoal = localSettings.dailyGoal ?? 10;
  const preferredLevel = (localSettings.preferredLevel as LevelOption) ?? 'all';
  const showVietnamese = localSettings.showVietnamese ?? true;

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pb-1 pt-2">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-white">Cai dat</Text>
        </View>

        {/* ===== Appearance ===== */}
        <SectionTitle title="Giao dien" />
        <View className="mx-4 overflow-hidden rounded-2xl bg-dark-card">
          <View className="px-4 py-3">
            <Text className="mb-2.5 text-base text-white">Che do hien thi</Text>
            <View className="flex-row gap-2">
              {THEME_OPTIONS.map((opt) => {
                const isActive = theme === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleUpdate({ theme: opt.value })}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                      isActive ? 'bg-primary-500' : 'bg-dark-border'
                    }`}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isActive ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ===== Sound & Haptics ===== */}
        <SectionTitle title="Am thanh & Rung" />
        <View className="mx-4 overflow-hidden rounded-2xl bg-dark-card">
          <SettingRow icon="volume-high-outline" label="Am thanh" color="#3B82F6">
            <Switch
              value={soundEnabled}
              onValueChange={(val) => handleUpdate({ soundEnabled: val })}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
          <View className="ml-16 h-px bg-dark-border" />
          <SettingRow icon="phone-portrait-outline" label="Rung" color="#8B5CF6">
            <Switch
              value={vibrationEnabled}
              onValueChange={(val) => handleUpdate({ vibrationEnabled: val })}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </View>

        {/* ===== Learning ===== */}
        <SectionTitle title="Hoc tap" />
        <View className="mx-4 overflow-hidden rounded-2xl bg-dark-card">
          {/* Daily Goal */}
          <View className="px-4 py-3">
            <View className="mb-2 flex-row items-center">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-green-500/20">
                <Ionicons name="flag-outline" size={18} color="#22C55E" />
              </View>
              <Text className="flex-1 text-base text-white">Muc tieu hang ngay</Text>
              <Text className="text-base font-bold text-primary-400">{dailyGoal} tu</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingLeft: 48 }}
            >
              {DAILY_GOALS.map((goal) => {
                const isActive = dailyGoal === goal;
                return (
                  <Pressable
                    key={goal}
                    onPress={() => handleUpdate({ dailyGoal: goal })}
                    className={`rounded-full px-4 py-1.5 ${
                      isActive ? 'bg-primary-500' : 'bg-dark-border'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {goal}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View className="ml-16 h-px bg-dark-border" />

          {/* Preferred Level */}
          <View className="px-4 py-3">
            <View className="mb-2 flex-row items-center">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/20">
                <Ionicons name="school-outline" size={18} color="#F59E0B" />
              </View>
              <Text className="flex-1 text-base text-white">Trinh do uu tien</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingLeft: 48 }}
            >
              {LEVELS.map((lvl) => {
                const isActive = preferredLevel === lvl.value;
                return (
                  <Pressable
                    key={lvl.value}
                    onPress={() => handleUpdate({ preferredLevel: lvl.value })}
                    className={`rounded-full px-4 py-1.5 ${
                      isActive ? 'bg-primary-500' : 'bg-dark-border'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {lvl.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View className="ml-16 h-px bg-dark-border" />

          {/* Show Vietnamese */}
          <SettingRow icon="language-outline" label="Hien tieng Viet" color="#14B8A6">
            <Switch
              value={showVietnamese}
              onValueChange={(val) => handleUpdate({ showVietnamese: val })}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </View>

        {/* ===== Logout ===== */}
        <View className="mx-4 mt-8 mb-12">
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-red-500/10 py-4 active:bg-red-500/20"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-base font-semibold text-red-500">
              Dang xuat
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
