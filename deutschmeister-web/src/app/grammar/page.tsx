'use client';

import { useState } from 'react';
import { useGrammarLessons, useGrammarProgress } from '@/hooks/useGrammar';
import { GrammarLessonCard } from '@/components/grammar/GrammarLessonCard';
import { IconBook, IconGraduationCap, IconCheck, IconTarget } from '@/components/ui/Icons';

const LEVELS = ['ALL', 'A1', 'A2', 'B1'] as const;

const LEVEL_COLORS: Record<string, { color: string; gradient: string }> = {
  A1: { color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)' },
  A2: { color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
  B1: { color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
};

export default function GrammarDashboardPage() {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const { data: lessons = [], isLoading: lessonsLoading } = useGrammarLessons();
  const { data: progress = [] } = useGrammarProgress();

  const filteredLessons = (
    filterLevel === 'ALL' ? lessons : lessons.filter(l => l.level === filterLevel)
  ).sort((a, b) => a.lessonNumber - b.lessonNumber);

  const getLessonProgress = (lessonId: string) => progress.find(p => p.lessonId === lessonId);

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const totalCount = lessons.length;
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (lessonsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          <div className="h-20 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
            <IconBook size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Ngữ pháp tiếng Đức
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
              Lộ trình học ngữ pháp từ A1 đến B1
            </p>
          </div>
        </div>

        {/* Level filter */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          {LEVELS.map(level => {
            const isActive = filterLevel === level;
            const lc = level !== 'ALL' ? LEVEL_COLORS[level] : null;
            return (
              <button key={level} onClick={() => setFilterLevel(level)}
                className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200"
                style={isActive ? {
                  background: lc ? lc.gradient : 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                  color: 'white',
                  boxShadow: `0 2px 8px ${lc ? lc.color : '#8B5CF6'}30`,
                } : {
                  color: 'var(--theme-text-muted)',
                  backgroundColor: 'transparent',
                }}>
                {level === 'ALL' ? 'Tất cả' : level}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Stats bar ─── */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: IconGraduationCap, label: 'Tổng bài học', value: totalCount, color: '#8B5CF6', bg: 'linear-gradient(135deg,rgba(139,92,246,.12),rgba(139,92,246,.06))' },
            { icon: IconCheck,         label: 'Hoàn thành',   value: completedCount, color: '#22C55E', bg: 'linear-gradient(135deg,rgba(34,197,94,.12),rgba(34,197,94,.06))' },
            { icon: IconTarget,        label: 'Tiến độ',      value: `${overallPct}%`, color: '#3B82F6', bg: 'linear-gradient(135deg,rgba(59,130,246,.12),rgba(59,130,246,.06))' },
          ].map((s, i) => {
            const Ic = s.icon;
            return (
              <div key={i} className="relative overflow-hidden p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                style={{ background: s.bg }}>
                <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full"
                  style={{ backgroundColor: s.color, opacity: 0.06 }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}>
                  <Ic size={16} className="text-white" />
                </div>
                <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[12px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overall progress bar */}
      {totalCount > 0 && (
        <div className="p-4 rounded-2xl border mb-6"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex justify-between mb-2 text-[13px]">
            <span style={{ color: 'var(--theme-text-secondary)' }}>Tiến độ tổng thể</span>
            <span className="font-bold" style={{ color: '#8B5CF6' }}>{overallPct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, #8B5CF6, #6366F1)' }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            <span>{completedCount} bài hoàn thành</span>
            <span>{totalCount} tổng</span>
          </div>
        </div>
      )}

      {/* ─── Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLessons.map(lesson => (
          <GrammarLessonCard
            key={lesson.id}
            lesson={lesson}
            progress={getLessonProgress(lesson.id)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredLessons.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.12),rgba(139,92,246,.06))' }}>
            <IconBook size={26} style={{ color: '#8B5CF6' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Chưa có bài học nào
          </p>
          <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
            Chọn cấp độ khác hoặc quay lại sau
          </p>
        </div>
      )}
    </div>
  );
}
