import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProfile, useUpdateProfile, useUserStats } from '@/hooks/useUser';

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
  return (
    <View className="flex-row items-center py-3">
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text className="flex-1 text-base text-gray-400">{label}</Text>
      <Text className="text-base font-semibold text-white">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
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
      Alert.alert('Loi', 'Ten khong duoc de trong');
      return;
    }
    try {
      await updateProfile.mutateAsync({ name: editName.trim() });
      setIsEditing(false);
    } catch {
      Alert.alert('Loi', 'Khong the cap nhat ten');
    }
  }, [editName, updateProfile]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  const accuracy = stats?.accuracy ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pb-3 pt-2">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-white">Ho so</Text>
        </View>

        {/* Avatar + Name */}
        <View className="items-center px-4 py-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-500/20">
            {profile?.avatar ? (
              <Text className="text-4xl">{profile.avatar}</Text>
            ) : (
              <Ionicons name="person" size={40} color="#6366F1" />
            )}
          </View>

          {isEditing ? (
            <View className="mt-4 w-full flex-row items-center justify-center gap-2">
              <TextInput
                className="min-w-[200px] rounded-xl bg-dark-card px-4 py-2.5 text-center text-base text-white"
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhap ten cua ban"
                placeholderTextColor="#6B7280"
                autoFocus
              />
              <Pressable
                onPress={handleSaveName}
                className="rounded-xl bg-primary-500 px-4 py-2.5"
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
                className="rounded-xl bg-dark-card px-4 py-2.5"
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleEditName} className="mt-4 flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-white">
                {profile?.name || 'Chua dat ten'}
              </Text>
              <Ionicons name="pencil-outline" size={16} color="#6B7280" />
            </Pressable>
          )}
        </View>

        {/* Email (read-only) */}
        <View className="mx-4 mb-4 rounded-2xl bg-dark-card px-4 py-3">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-gray-500/20">
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Email</Text>
              <Text className="text-base text-white">{profile?.email}</Text>
            </View>
            <View className="rounded-md bg-dark-border px-2 py-0.5">
              <Text className="text-xs text-gray-500">Chi doc</Text>
            </View>
          </View>
        </View>

        {/* Member since */}
        <View className="mx-4 mb-4 rounded-2xl bg-dark-card px-4 py-3">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-primary-500/20">
              <Ionicons name="calendar-outline" size={18} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Thanh vien tu</Text>
              <Text className="text-base text-white">
                {profile?.createdAt ? formatDate(profile.createdAt) : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="mx-4 mb-4">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Thong ke
          </Text>
          <View className="rounded-2xl bg-dark-card px-4">
            <StatRow
              icon="game-controller-outline"
              label="Tro choi da choi"
              value={stats?.gamesPlayed ?? 0}
              color="#6366F1"
            />
            <View className="h-px bg-dark-border" />
            <StatRow
              icon="checkmark-circle-outline"
              label="Do chinh xac"
              value={`${Math.round(accuracy)}%`}
              color="#22C55E"
            />
            <View className="h-px bg-dark-border" />
            <StatRow
              icon="book-outline"
              label="Tu da hoc"
              value={stats?.wordsLearned ?? 0}
              color="#3B82F6"
            />
            <View className="h-px bg-dark-border" />
            <StatRow
              icon="heart-outline"
              label="Tu yeu thich"
              value={stats?.favorites ?? 0}
              color="#EF4444"
            />
            <View className="h-px bg-dark-border" />
            <StatRow
              icon="checkmark-done-outline"
              label="Tong cau tra loi dung"
              value={stats?.correctAnswers ?? 0}
              color="#F59E0B"
            />
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
