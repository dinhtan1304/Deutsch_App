'use client';
/* eslint-disable no-restricted-syntax */

import { useMemo, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { ACCENT } from '@/lib/tokens';
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

// Fixed pixel geometry so the month labels line up with their week columns.
const CELL = 12;  // dot size
const GAP = 3;    // gap between dots (rows + week columns)
const PITCH = CELL + GAP; // per-week / per-row pitch
const GUTTER = 30; // width of the Mon/Wed/Fri label column

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const t = useTranslations('dashboard.activityHeatmap');
  const formatter = useFormatter();
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Parse a YYYY-MM-DD string as local date (avoid UTC midnight → wrong day in GMT+7)
  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  };

  const weeks = useMemo(() => {
    const result: ActivityDay[][] = []
    let currentWeek: ActivityDay[] = []
    const firstDate = parseLocalDate(data.data[0]?.date ?? '')
    const firstDayOfWeek = firstDate.getDay()

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1, level: -1 })
    }

    data.data.forEach((day) => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    })

    if (currentWeek.length > 0) result.push(currentWeek)
    return result
  }, [data.data])

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = []
    let lastMonth = -1
    // Scan every day (not just the first of each week) so a month that starts
    // mid-week — e.g. the current month — still gets labelled at its column.
    weeks.forEach((week, weekIndex) => {
      for (const d of week) {
        if (!d.date) continue
        const month = parseLocalDate(d.date).getMonth()
        if (month !== lastMonth) {
          const prev = labels[labels.length - 1]
          // keep labels at least 2 columns apart so the 3-char text never overlaps
          if (!prev || weekIndex - prev.weekIndex >= 2) {
            labels.push({ month: MONTHS[month]!, weekIndex })
          }
          lastMonth = month
        }
      }
    })
    return labels
  }, [weeks])

  const handleMouseEnter = (day: ActivityDay, e: React.MouseEvent) => {
    if (day.count >= 0) {
      setHoveredDay(day);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    return formatter.dateTime(new Date(parts[0]!, parts[1]! - 1, parts[2]!), {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div
      className="p-5 rounded-card border shadow-card"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', minHeight: '16.5rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title font-bold flex items-center gap-2"
          style={{ color: 'var(--theme-text-primary)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,.15), rgba(52,211,153,.1))' }}>
            📅
          </span>
          {t('title')}
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <IconFlame size={14} style={{ color: ACCENT.games }} />
            <span className="font-bold" style={{ color: ACCENT.games }}>{data.currentStreak}</span>
            <span style={{ color: 'var(--theme-text-muted)' }}>{t('streakLabel')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold" style={{ color: '#10B981' }}>{data.totalActiveDays}</span>
            <span style={{ color: 'var(--theme-text-muted)' }}>{t('daysActiveLabel')}</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto pb-1">
        <div style={{ position: 'relative', minWidth: GUTTER + weeks.length * PITCH }}>
          {/* Month labels — absolutely positioned over their week column */}
          <div style={{ position: 'relative', height: 16, marginLeft: GUTTER }}>
            {monthLabels.map((label, i) => (
              <span
                key={i}
                className="text-caption font-medium"
                style={{ position: 'absolute', left: label.weekIndex * PITCH, color: 'var(--theme-text-muted)' }}
              >
                {label.month}
              </span>
            ))}
          </div>

          <div className="flex">
            {/* Mon / Wed / Fri gutter — same row pitch as the dots */}
            <div className="flex flex-col" style={{ width: GUTTER, gap: GAP }}>
              {DAYS.map((day, i) => (
                <div key={i} className="flex items-center text-[10px] leading-none"
                  style={{ height: CELL, color: 'var(--theme-text-muted)' }}>
                  {day}
                </div>
              ))}
            </div>

            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`rounded-full transition-all ${day.count >= 0 ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-400/50' : ''}`}
                      style={{
                        width: CELL,
                        height: CELL,
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
        <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('less')}</span>
        {LEVEL_COLORS.map((color, i) => (
          <div key={i} className="rounded-full" style={{ width: CELL, height: CELL, backgroundColor: color }} />
        ))}
        <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('more')}</span>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 text-xs rounded-xl shadow-xl pointer-events-none
            transform -translate-x-1/2 -translate-y-full border"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {t('activityCount', { count: hoveredDay.count })}
          </div>
          <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {formatDate(hoveredDay.date)}
          </div>
        </div>
      )}
    </div>
  );
}