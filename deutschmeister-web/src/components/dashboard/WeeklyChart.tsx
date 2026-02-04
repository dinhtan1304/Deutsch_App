'use client';

import { useMemo } from 'react';
import type { WeeklyProgress } from '@/types/dashboard';

interface WeeklyChartProps {
  data: WeeklyProgress[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  // Calculate max values for scaling
  const maxWords = useMemo(
    () => Math.max(...data.map((d) => d.wordsLearned), 1),
    [data]
  );
  const maxGames = useMemo(
    () => Math.max(...data.map((d) => d.gamesPlayed), 1),
    [data]
  );

  // Calculate totals
  const totals = useMemo(
    () => ({
      words: data.reduce((sum, d) => sum + d.wordsLearned, 0),
      games: data.reduce((sum, d) => sum + d.gamesPlayed, 0),
      minutes: data.reduce((sum, d) => sum + d.minutes, 0),
    }),
    [data]
  );

  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0];
  };

  return (
    <div
      className="p-6 rounded-2xl border"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          📊 Tiến độ 7 ngày qua
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-500">Từ vựng</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-500">Games</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between h-48 gap-2 mb-4">
        {data.map((day, index) => {
          const wordHeight = (day.wordsLearned / maxWords) * 100;
          const gameHeight = (day.gamesPlayed / maxGames) * 100;
          const today = isToday(day.date);

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              {/* Bars container */}
              <div className="w-full flex items-end justify-center gap-1 h-40">
                {/* Words bar */}
                <div
                  className="w-5 rounded-t-md transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                  style={{
                    height: `${Math.max(wordHeight, 4)}%`,
                    backgroundColor: '#3B82F6',
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.wordsLearned} từ
                  </div>
                </div>

                {/* Games bar */}
                <div
                  className="w-5 rounded-t-md transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                  style={{
                    height: `${Math.max(gameHeight, 4)}%`,
                    backgroundColor: '#10B981',
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.gamesPlayed} game
                  </div>
                </div>
              </div>

              {/* Day label */}
              <div
                className={`text-xs font-medium px-2 py-1 rounded-full transition-colors
                  ${today ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-500'}`}
              >
                {day.day}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{totals.words}</div>
          <div className="text-xs text-gray-500">Từ đã học</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{totals.games}</div>
          <div className="text-xs text-gray-500">Games đã chơi</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-500">
            {totals.minutes < 60 ? `${totals.minutes}m` : `${Math.floor(totals.minutes / 60)}h ${totals.minutes % 60}m`}
          </div>
          <div className="text-xs text-gray-500">Thời gian học</div>
        </div>
      </div>
    </div>
  );
}