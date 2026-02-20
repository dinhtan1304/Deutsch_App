'use client';

import { useState, useEffect } from 'react';
import { grammarApi } from '@/lib/api/grammar';
import { GrammarLesson, GrammarProgress } from '@/types/grammar';
import { GrammarLessonCard } from '@/components/grammar/GrammarLessonCard';

function IconBook({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" /><path d="M8 11h8" />
    </svg>
  );
}

const LEVELS = ['ALL', 'A1', 'A2', 'B1'] as const;

export default function GrammarDashboardPage() {
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [progress, setProgress] = useState<GrammarProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonsData, progressData] = await Promise.all([
          grammarApi.getLessons(),
          grammarApi.getUserProgress().catch(() => []),
        ]);
        setLessons(lessonsData);
        setProgress(progressData);
      } catch (error) {
        console.error('Failed to fetch grammar data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLessons = (
    filterLevel === 'ALL' ? lessons : lessons.filter(l => l.level === filterLevel)
  ).sort((a, b) => a.lessonNumber - b.lessonNumber);

  const getLessonProgress = (lessonId: string) =>
    progress.find(p => p.lessonId === lessonId);

  // CRIT-1 fix: JSX phải cùng dòng với return hoặc trong ()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-border)', borderTopColor: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            <IconBook size={22} />
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

        {/* STYLE-3 fix: Filter tabs match design language (gradient pill giống settings/dashboard) */}
        {/* DARK-1 fix: dùng var(--theme-*) thay bg-gray-100/bg-white */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          {LEVELS.map(level => {
            const isActive = filterLevel === level;
            return (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200"
                style={isActive ? {
                  background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(59,130,246,.3)',
                } : {
                  color: 'var(--theme-text-muted)',
                  backgroundColor: 'transparent',
                }}
              >
                {level === 'ALL' ? 'Tất cả' : level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map(lesson => (
          <GrammarLessonCard
            key={lesson.id}
            lesson={lesson}
            progress={getLessonProgress(lesson.id)}
          />
        ))}
      </div>

      {/* DARK-2 fix: empty state dùng theme var */}
      {filteredLessons.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-[15px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
            Chưa có bài học nào cho trình độ này.
          </p>
        </div>
      )}
    </div>
  );
}
