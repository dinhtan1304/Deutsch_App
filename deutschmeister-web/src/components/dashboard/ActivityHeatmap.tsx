'use client';

import { useMemo, useState } from 'react';
import type { ActivityHeatmap as HeatmapData, ActivityDay } from '@/types/dashboard';

interface ActivityHeatmapProps {
  data: HeatmapData;
}

// Color levels (0-4)
const LEVEL_COLORS = [
  'var(--heatmap-0, #ebedf0)',
  'var(--heatmap-1, #9be9a8)',
  'var(--heatmap-2, #40c463)',
  'var(--heatmap-3, #30a14e)',
  'var(--heatmap-4, #216e39)',
];

const DARK_LEVEL_COLORS = [
  '#161b22',
  '#0e4429',
  '#006d32',
  '#26a641',
  '#39d353',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Group data by weeks
  const weeks = useMemo(() => {
    const result: ActivityDay[][] = [];
    let currentWeek: ActivityDay[] = [];

    // Get first day of the year (or first data point)
    const firstDate = new Date(data.data[0]?.date);
    const firstDayOfWeek = firstDate.getDay();

    // Add empty cells for days before first data point
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1, level: -1 });
    }

    data.data.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [data.data]);

  // Get month labels positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; position: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.date);
      if (firstValidDay) {
        const date = new Date(firstValidDay.date);
        const month = date.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], position: weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks]);

  const handleMouseEnter = (day: ActivityDay, e: React.MouseEvent) => {
    if (day.count >= 0) {
      setHoveredDay(day);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          📅 Hoạt động trong năm
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-orange-500 font-bold">🔥 {data.currentStreak}</span>
            <span className="text-gray-500">ngày liên tiếp</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-500 font-bold">{data.totalActiveDays}</span>
            <span className="text-gray-500">ngày hoạt động</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-gray-500"
                style={{
                  position: 'relative',
                  left: `${label.position * 14}px`,
                  marginRight: i < monthLabels.length - 1 ? 
                    `${(monthLabels[i + 1]?.position - label.position - 3) * 14}px` : 0,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-2">
              {DAYS.map((day, i) => (
                <div
                  key={i}
                  className="text-xs text-gray-500 h-3.25 flex items-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-0.75">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.75">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-2.75 h-2.75 rounded-sm transition-all cursor-pointer
                        ${day.count >= 0 ? 'hover:ring-2 hover:ring-offset-1 hover:ring-blue-400' : ''}`}
                      style={{
                        backgroundColor:
                          day.count < 0
                            ? 'transparent'
                            : LEVEL_COLORS[day.level],
                      }}
                      onMouseEnter={(e) => handleMouseEnter(day, e)}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-gray-500">Ít</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            className="w-2.75 h-2.75 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span className="text-xs text-gray-500">Nhiều</span>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 text-sm rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid var(--theme-border)',
          }}
        >
          <div className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>
            {hoveredDay.count} hoạt động
          </div>
          <div className="text-xs text-gray-500">{formatDate(hoveredDay.date)}</div>
        </div>
      )}
    </div>
  );
}