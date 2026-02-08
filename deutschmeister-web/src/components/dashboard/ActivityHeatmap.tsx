'use client';

import { useMemo, useState } from 'react';
import type { ActivityHeatmap as HeatmapData, ActivityDay } from '@/types/dashboard';
import { IconFlame } from '@/components/ui/Icons';

interface ActivityHeatmapProps {
  data: HeatmapData;
}

const LEVEL_COLORS = [
  'var(--heatmap-0, #ebedf0)',
  'var(--heatmap-1, #9be9a8)',
  'var(--heatmap-2, #40c463)',
  'var(--heatmap-3, #30a14e)',
  'var(--heatmap-4, #216e39)',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const weeks = useMemo(() => {
    const result: ActivityDay[][] = [];
    let currentWeek: ActivityDay[] = [];
    const firstDate = new Date(data.data[0]?.date);
    const firstDayOfWeek = firstDate.getDay();

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

    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
  }, [data.data]);

  const monthLabels = useMemo(() => {
    const labels: { month: string; position: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.date);
      if (firstValidDay) {
        const month = new Date(firstValidDay.date).getMonth();
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
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div
      className="p-5 rounded-2xl border h-66"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold flex items-center gap-2"
          style={{ color: 'var(--theme-text-primary)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,.15), rgba(52,211,153,.1))' }}>
            📅
          </span>
          Hoạt động trong năm
        </h3>
        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5">
            <IconFlame size={14} style={{ color: '#F97316' }} />
            <span className="font-bold" style={{ color: '#F97316' }}>{data.currentStreak}</span>
            <span style={{ color: 'var(--theme-text-muted)' }}>ngày liên tiếp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold" style={{ color: '#10B981' }}>{data.totalActiveDays}</span>
            <span style={{ color: 'var(--theme-text-muted)' }}>ngày hoạt động</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex mb-1 ml-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-[10px] font-medium"
                style={{
                  color: 'var(--theme-text-muted)',
                  position: 'relative',
                  left: `${label.position * 14}px`,
                  marginRight: i < monthLabels.length - 1
                    ? `${(monthLabels[i + 1]?.position - label.position - 3) * 14}px` : 0,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex">
            <div className="flex flex-col mr-2">
              {DAYS.map((day, i) => (
                <div key={i} className="text-[10px] h-3.5 flex items-center"
                  style={{ color: 'var(--theme-text-muted)' }}>
                  {day}
                </div>
              ))}
            </div>

            <div className="flex gap-px">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-px">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm transition-all cursor-pointer
                        ${day.count >= 0 ? 'hover:ring-2 hover:ring-offset-1 hover:ring-blue-400/50' : ''}`}
                      style={{
                        backgroundColor: day.count < 0 ? 'transparent' : LEVEL_COLORS[day.level],
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
      <div className="flex items-center justify-end gap-1.5 mt-4">
        <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Ít</span>
        {LEVEL_COLORS.map((color, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Nhiều</span>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 text-[12px] rounded-xl shadow-xl pointer-events-none
            transform -translate-x-1/2 -translate-y-full border"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {hoveredDay.count} hoạt động
          </div>
          <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            {formatDate(hoveredDay.date)}
          </div>
        </div>
      )}
    </div>
  );
}