import { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHistory, useClearHistory } from '@/hooks/useHistory';
import type { HistoryItem } from '@/types';
import { GenderInfo } from '@/types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return 'Hom nay';
  if (isSameDay(date, yesterday)) return 'Hom qua';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface HistorySection {
  title: string;
  data: HistoryItem[];
}

export default function HistoryScreen() {
  const router = useRouter();
  const { data: history, isLoading, refetch, isRefetching } = useHistory(100);
  const clearHistory = useClearHistory();

  const sections = useMemo<HistorySection[]>(() => {
    if (!history || history.length === 0) return [];

    const grouped: Record<string, HistoryItem[]> = {};
    for (const item of history) {
      const key = formatDate(item.viewedAt);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    return Object.entries(grouped).map(([title, data]) => ({
      title,
      data,
    }));
  }, [history]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Xoa lich su',
      'Ban co chac muon xoa toan bo lich su xem tu vung?',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Xoa tat ca',
          style: 'destructive',
          onPress: () => clearHistory.mutate(),
        },
      ],
    );
  }, [clearHistory]);

  const renderItem = useCallback(({ item }: { item: HistoryItem }) => {
    const genderInfo = item.word.gender ? GenderInfo[item.word.gender] : null;

    return (
      <View className="mb-1.5 rounded-xl bg-dark-card px-4 py-3">
        <View className="flex-row items-center">
          {genderInfo && (
            <View
              className="mr-3 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: genderInfo.color }}
            />
          )}
          <View className="flex-1">
            <View className="flex-row items-baseline gap-1.5">
              {item.word.article && (
                <Text
                  className="text-sm"
                  style={{ color: genderInfo?.color ?? '#9CA3AF' }}
                >
                  {item.word.article}
                </Text>
              )}
              <Text className="text-base font-semibold text-white">
                {item.word.word}
              </Text>
            </View>
            <Text className="mt-0.5 text-sm text-gray-500">
              {item.word.translationVi || item.word.translationEn}
            </Text>
          </View>
          <Text className="text-xs text-gray-600">{formatTime(item.viewedAt)}</Text>
        </View>
      </View>
    );
  }, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: HistorySection }) => (
      <View className="bg-dark-bg pb-2 pt-4">
        <Text className="text-sm font-semibold text-gray-400">
          {section.title}
        </Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">Lich su</Text>
        {history && history.length > 0 && (
          <Pressable
            onPress={handleClear}
            className="flex-row items-center gap-1.5 rounded-lg bg-dark-card px-3 py-1.5"
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text className="text-xs font-medium text-red-400">Xoa</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-dark-card">
            <Ionicons name="time-outline" size={40} color="#4B5563" />
          </View>
          <Text className="text-lg font-semibold text-gray-400">
            Chua co lich su
          </Text>
          <Text className="mt-1 max-w-[240px] text-center text-sm text-gray-600">
            Cac tu vung ban da xem se xuat hien o day
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
