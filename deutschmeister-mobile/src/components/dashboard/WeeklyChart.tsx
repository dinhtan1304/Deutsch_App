import { useMemo } from 'react';
import { View, Text } from 'react-native';
import type { WeeklyProgress } from '@/types/dashboard';

interface WeeklyChartProps {
  data: WeeklyProgress[];
}

const DAY_LABELS: Record<string, string> = {
  Mon: 'T2',
  Tue: 'T3',
  Wed: 'T4',
  Thu: 'T5',
  Fri: 'T6',
  Sat: 'T7',
  Sun: 'CN',
};

function isToday(dateStr: string): boolean {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return dateStr === today;
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxWords = useMemo(
    () => Math.max(...data.map((d) => d.wordsLearned), 1),
    [data],
  );

  const totals = useMemo(
    () => ({
      words: data.reduce((s, d) => s + d.wordsLearned, 0),
      games: data.reduce((s, d) => s + d.gamesPlayed, 0),
      minutes: data.reduce((s, d) => s + d.minutes, 0),
    }),
    [data],
  );

  const BAR_MAX_HEIGHT = 100;

  return (
    <View className="mx-4 rounded-2xl bg-dark-card p-4">
      {/* Header */}
      <View className="mb-1 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-base">📊</Text>
          <Text className="text-sm font-bold text-white">
            Tiến độ 7 ngày qua
          </Text>
        </View>
      </View>

      {/* Summary row */}
      <View className="mb-4 flex-row gap-4">
        <View className="flex-row items-center gap-1">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: '#6366F1' }}
          />
          <Text className="text-xs text-gray-400">
            {totals.words} từ
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: '#22C55E' }}
          />
          <Text className="text-xs text-gray-400">
            {totals.games} games
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: '#A855F7' }}
          />
          <Text className="text-xs text-gray-400">
            {totals.minutes} phút
          </Text>
        </View>
      </View>

      {/* Chart bars */}
      <View
        className="flex-row items-end justify-between"
        style={{ height: BAR_MAX_HEIGHT + 24 }}
      >
        {data.map((day) => {
          const barHeight = Math.max(
            (day.wordsLearned / maxWords) * BAR_MAX_HEIGHT,
            4,
          );
          const today = isToday(day.date);
          const barColor = today ? '#6366F1' : '#374151';
          const labelVi = DAY_LABELS[day.day] ?? day.day;

          return (
            <View key={day.date} className="flex-1 items-center">
              {/* Value label */}
              {day.wordsLearned > 0 && (
                <Text
                  className="mb-1 text-center text-xs font-semibold"
                  style={{ color: today ? '#6366F1' : '#9CA3AF' }}
                >
                  {day.wordsLearned}
                </Text>
              )}
              {/* Bar */}
              <View
                className="w-7 rounded-lg"
                style={{
                  height: barHeight,
                  backgroundColor: barColor,
                  ...(today && {
                    shadowColor: '#6366F1',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 4,
                  }),
                }}
              />
              {/* Day label */}
              <Text
                className="mt-2 text-xs font-medium"
                style={{ color: today ? '#FFFFFF' : '#6B7280' }}
              >
                {labelVi}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function WeeklyChartSkeleton() {
  return (
    <View className="mx-4 rounded-2xl bg-dark-card p-4">
      <View className="mb-4 h-5 w-40 rounded bg-dark-secondary" />
      <View
        className="flex-row items-end justify-between"
        style={{ height: 124 }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} className="flex-1 items-center">
            <View
              className="w-7 rounded-lg bg-dark-secondary"
              style={{ height: 20 + Math.random() * 60 }}
            />
            <View className="mt-2 h-3 w-5 rounded bg-dark-secondary" />
          </View>
        ))}
      </View>
    </View>
  );
}
