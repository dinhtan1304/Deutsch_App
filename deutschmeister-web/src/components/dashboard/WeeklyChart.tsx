'use client';
/* eslint-disable no-restricted-syntax */

import { useMemo } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import type { WeeklyProgress } from '@/types/dashboard';

interface WeeklyChartProps {
  data: WeeklyProgress[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxWords = useMemo(() => Math.max(...data.map(d => d.wordsLearned), 1), [data]);
  const maxGames = useMemo(() => Math.max(...data.map(d => d.gamesPlayed), 1), [data]);

  const totals = useMemo(() => ({
    words: data.reduce((s, d) => s + d.wordsLearned, 0),
    games: data.reduce((s, d) => s + d.gamesPlayed, 0),
    minutes: data.reduce((s, d) => s + d.minutes, 0),
  }), [data]);

  const isToday = (date: string) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return date === today;
  };

  return (
    <div
      className="p-5 rounded-card border shadow-card"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-title font-bold flex items-center gap-2"
          style={{ color: 'var(--theme-text-primary)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.15), rgba(99,102,241,.1))' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          </span>
          Tiến độ 7 ngày qua
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }} />
            <span style={{ color: 'var(--theme-text-muted)' }}>Từ vựng</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }} />
            <span style={{ color: 'var(--theme-text-muted)' }}>Games</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between gap-2 mb-3 h-48">
        {data.map((day, i) => {
          const wH = (day.wordsLearned / maxWords) * 100;
          const gH = (day.gamesPlayed / maxGames) * 100;
          const today = isToday(day.date);

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="w-full flex-1 flex items-end justify-center gap-1 min-h-0">
                {/* Words bar */}
                <div className="relative w-5 group cursor-pointer self-stretch flex flex-col justify-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-500 hover:opacity-85"
                    style={{
                      height: day.wordsLearned > 0 ? `${Math.max(wH, 8)}%` : '2px',
                      background: 'linear-gradient(180deg, #6366F1, #3B82F6)',
                      opacity: day.wordsLearned > 0 ? 1 : 0.15,
                    }}
                  />
                  {day.wordsLearned > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                      text-caption font-medium rounded-md shadow-lg pointer-events-none
                      opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10
                      text-white"
                      style={{ backgroundColor: ACCENT.srs }}>
                      {day.wordsLearned} từ
                    </div>
                  )}
                </div>

                {/* Games bar */}
                <div className="relative w-5 group cursor-pointer self-stretch flex flex-col justify-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-500 hover:opacity-85"
                    style={{
                      height: day.gamesPlayed > 0 ? `${Math.max(gH, 8)}%` : '2px',
                      background: 'linear-gradient(180deg, #34D399, #10B981)',
                      opacity: day.gamesPlayed > 0 ? 1 : 0.15,
                    }}
                  />
                  {day.gamesPlayed > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                      text-caption font-medium rounded-md shadow-lg pointer-events-none
                      opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10
                      text-white"
                      style={{ backgroundColor: '#10B981' }}>
                      {day.gamesPlayed} game
                    </div>
                  )}
                </div>
              </div>

              {/* Day label */}
              <div
                className={`text-caption font-semibold px-2.5 py-1 rounded-full transition-colors
                  ${today
                    ? 'text-white shadow-sm'
                    : ''
                  }`}
                style={today
                  ? { background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }
                  : { color: 'var(--theme-text-muted)' }}
              >
                {day.day}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
        {[
          { value: totals.words, label: 'Từ đã học', color: ACCENT.srs },
          { value: totals.games, label: 'Games đã chơi', color: '#10B981' },
          {
            value: totals.minutes < 60
              ? `${totals.minutes}m`
              : `${Math.floor(totals.minutes / 60)}h ${totals.minutes % 60}m`,
            label: 'Thời gian học',
            color: ACCENT.vocab,
          },
        ].map((item, i) => (
          <div key={i} className="text-center">
            <div className="text-xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}