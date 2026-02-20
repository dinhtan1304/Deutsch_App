'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { grammarApi } from '@/lib/api/grammar';
import { GrammarLessonDetail } from '@/types/grammar';
import { TheorySection } from '@/components/grammar/TheorySection';
import { ExerciseList } from '@/components/grammar/ExerciseList';
import { IconArrowLeft, IconBookOpen, IconPenLine } from '@/components/ui/Icons';
import Link from 'next/link';

// DARK-6 fix: level badge dùng semi-transparent color, readable ở cả light/dark
const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  A1: { bg: 'rgba(34,197,94,.12)',  color: '#16A34A' },
  A2: { bg: 'rgba(59,130,246,.12)', color: '#2563EB' },
  B1: { bg: 'rgba(245,158,11,.12)', color: '#D97706' },
  B2: { bg: 'rgba(139,92,246,.12)', color: '#7C3AED' },
};

export default function GrammarLessonPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [lesson, setLesson] = useState<GrammarLessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'theory' | 'exercises'>('theory');

  useEffect(() => {
    if (!slug) return;
    const fetchLesson = async () => {
      try {
        const data = await grammarApi.getLessonBySlug(slug);
        setLesson(data);
      } catch (error) {
        console.error('Failed to fetch lesson', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [slug]);

  const handleSubmitExercises = async (answers: Record<number, string | string[]>) => {
    if (!lesson) throw new Error('No lesson loaded');
    return await grammarApi.submitExercises(lesson.id, answers);
  };

  // CRIT-1 fix: JSX trong () thay vì trên dòng riêng
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-border)', borderTopColor: '#3B82F6' }} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="text-5xl">📭</div>
        <p className="text-[15px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
          Không tìm thấy bài học này.
        </p>
        <Link href="/grammar" className="text-[14px] font-semibold" style={{ color: '#3B82F6' }}>
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const levelStyle = LEVEL_STYLE[lesson.level] || LEVEL_STYLE.A1;
  const TABS = [
    { id: 'theory' as const,    label: 'Lý thuyết',              icon: IconBookOpen },
    { id: 'exercises' as const, label: `Bài tập (${lesson.exercises.length})`, icon: IconPenLine },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Back link — DARK-3 fix */}
      <Link
        href="/grammar"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-6 transition-opacity hover:opacity-70"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <IconArrowLeft size={15} /> Quay lại danh sách
      </Link>

      {/* Header — DARK-3 fix: text-gray-* → var(--theme-*) */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-2.5 py-1 rounded-lg text-[12px] font-bold"
            style={{ backgroundColor: levelStyle.bg, color: levelStyle.color }}
          >
            {lesson.level}
          </span>
          <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
            Bài {lesson.lessonNumber}
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {lesson.titleVi}
        </h1>
        <p className="text-[16px]" style={{ color: 'var(--theme-text-secondary)' }}>
          {lesson.titleDe}
        </p>
      </div>

      {/* Tabs — DARK-3 + DARK-4 fix: dùng var(--theme-border) thay border-b cứng */}
      <div className="flex gap-1.5 mb-8 p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        {TABS.map(tab => {
          const Ic = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200"
              style={isActive ? {
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(59,130,246,.3)',
              } : {
                color: 'var(--theme-text-muted)',
                backgroundColor: 'transparent',
              }}
            >
              <Ic size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content — CRIT-2 fix: min-h-125 → style={{ minHeight }} */}
      <div style={{ minHeight: '32rem' }}>
        {activeTab === 'theory' ? (
          <div>
            <TheorySection content={lesson.theoryContent} />
            <div className="mt-8 text-center">
              <button
                onClick={() => setActiveTab('exercises')}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 12px rgba(59,130,246,.25)' }}
              >
                <IconPenLine size={16} /> Chuyển sang làm bài tập
              </button>
            </div>
          </div>
        ) : (
          <ExerciseList
            exercises={lesson.exercises}
            onSubmit={handleSubmitExercises}
          />
        )}
      </div>
    </div>
  );
}
