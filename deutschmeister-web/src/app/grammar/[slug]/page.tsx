'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGrammarLesson, useGrammarProgress, useSubmitGrammarExercises } from '@/hooks/useGrammar';
import { TheorySection } from '@/components/grammar/TheorySection';
import { ExerciseList } from '@/components/grammar/ExerciseList';
import { IconArrowLeft, IconBookOpen, IconPenLine, IconSearch, IconCheck } from '@/components/ui/Icons';
import { usePronunciation } from '@/hooks/usePronunciation';
import Link from 'next/link';

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  A1: { bg: 'rgba(34,197,94,.12)',  color: '#16A34A' },
  A2: { bg: 'rgba(59,130,246,.12)', color: '#2563EB' },
  B1: { bg: 'rgba(245,158,11,.12)', color: '#D97706' },
  B2: { bg: 'rgba(139,92,246,.12)', color: '#7C3AED' },
};

function ProgressRing({ pct }: { pct: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="shrink-0">
      <svg width={60} height={60} viewBox="0 0 60 60">
        <circle cx={30} cy={30} r={r} fill="none" stroke="var(--theme-bg-secondary)" strokeWidth={4.5} />
        <circle
          cx={30} cy={30} r={r} fill="none"
          stroke={pct >= 100 ? '#22C55E' : '#3B82F6'} strokeWidth={4.5}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={30} y={34} textAnchor="middle" fontSize={11} fontWeight={700}
          fill={pct >= 100 ? '#22C55E' : 'var(--theme-text-primary)'}>
          {pct}%
        </text>
      </svg>
    </div>
  );
}

export default function GrammarLessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<'theory' | 'exercises'>('theory');
  const [theoryDone, setTheoryDone] = useState(false);
  const { speak } = usePronunciation();

  const { data: lesson, isLoading: loading } = useGrammarLesson(slug);
  const { data: progressList } = useGrammarProgress();
  const submitMutation = useSubmitGrammarExercises();

  const handleSubmitExercises = async (answers: Record<number, string | string[]>) => {
    if (!lesson) throw new Error('No lesson loaded');
    return await submitMutation.mutateAsync({ lessonId: lesson.id, answers });
  };

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
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.12),rgba(139,92,246,.06))' }}>
          <IconSearch size={26} style={{ color: '#8B5CF6' }} />
        </div>
        <p className="text-[15px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
          Không tìm thấy bài học này.
        </p>
        <Link href="/grammar"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: '#8B5CF6' }}>
          <IconArrowLeft size={15} /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const levelStyle = LEVEL_STYLE[lesson.level] || LEVEL_STYLE.A1;
  const lessonProgress = progressList?.find(p => p.lessonSlug === slug);
  const isCompleted = lessonProgress?.status === 'completed';
  const correctCount = lessonProgress?.correctCount ?? 0;
  const totalExercises = lesson.exercises.length;

  // Progress ring: theory 30% + exercises 70%
  const exercisePct = totalExercises > 0 ? (correctCount / totalExercises) * 70 : 0;
  const progressPct = isCompleted ? 100
    : theoryDone ? Math.round(30 + exercisePct)
    : Math.round(exercisePct * 0.5);

  const theoryTabDone = theoryDone || isCompleted;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" style={{ paddingBottom: 96 }}>

      {/* ── Back link ── */}
      <Link
        href="/grammar"
        className="inline-flex items-center gap-1.5 text-body font-medium mb-5 transition-opacity hover:opacity-70"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <IconArrowLeft size={15} /> Quay lại danh sách
      </Link>

      {/* ── Lesson header ── */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ backgroundColor: levelStyle.bg, color: levelStyle.color }}>
              {lesson.level}
            </span>
            <span className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
              Bài {lesson.lessonNumber}
            </span>
            <span style={{ color: 'var(--theme-border)' }}>·</span>
            <span className="flex items-center gap-1 text-body" style={{ color: 'var(--theme-text-muted)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              ~{lesson.estimatedMinutes} phút
            </span>
          </div>

          {/* Title */}
          <h1 className="text-h1 font-extrabold leading-tight mb-1"
            style={{ color: 'var(--theme-text-primary)' }}>
            {lesson.titleVi}
          </h1>

          {/* Subtitle + audio */}
          <div className="flex items-center gap-2">
            <span className="text-[15px]" style={{ color: 'var(--theme-text-secondary)' }}>
              {lesson.titleDe}
            </span>
            <button
              onClick={() => speak(lesson.titleDe)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
              title="Nghe phát âm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress ring */}
        <ProgressRing pct={progressPct} />
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1.5 mb-7 p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        {/* Theory tab */}
        <button
          onClick={() => setActiveTab('theory')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-body font-semibold transition-all duration-200"
          style={activeTab === 'theory' ? {
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(59,130,246,.3)',
          } : { color: 'var(--theme-text-muted)', backgroundColor: 'transparent' }}
        >
          <IconBookOpen size={16} />
          Lý thuyết
          {theoryTabDone && (
            <span className="ml-0.5 text-caption font-bold opacity-90">✓</span>
          )}
        </button>

        {/* Exercises tab */}
        <button
          onClick={() => setActiveTab('exercises')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-body font-semibold transition-all duration-200"
          style={activeTab === 'exercises' ? {
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(59,130,246,.3)',
          } : { color: 'var(--theme-text-muted)', backgroundColor: 'transparent' }}
        >
          <IconPenLine size={16} />
          Bài tập
          {totalExercises > 0 && (
            <span
              className="ml-0.5 px-1.5 py-0.5 rounded-md text-caption font-bold"
              style={activeTab === 'exercises'
                ? { backgroundColor: 'rgba(255,255,255,.25)', color: 'white' }
                : { backgroundColor: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-muted)' }
              }
            >
              {correctCount}/{totalExercises}
            </span>
          )}
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ minHeight: '24rem' }}>
        {activeTab === 'theory' ? (
          <TheorySection content={lesson.theoryContent} />
        ) : (
          <ExerciseList
            exercises={lesson.exercises}
            onSubmit={handleSubmitExercises}
            onBackToTheory={() => setActiveTab('theory')}
          />
        )}
      </div>

      {/* ── Sticky bottom action bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--theme-bg-card) 95%, transparent)',
          borderColor: 'var(--theme-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex gap-3">
          {/* Mark theory done */}
          {activeTab === 'theory' && (
            <button
              onClick={() => setTheoryDone(!theoryDone)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all border"
              style={theoryDone ? {
                backgroundColor: 'rgba(34,197,94,.1)',
                borderColor: 'rgba(34,197,94,.3)',
                color: '#22C55E',
              } : {
                backgroundColor: 'var(--theme-bg-secondary)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
            >
              <IconCheck size={16} />
              {theoryDone ? 'Đã học lý thuyết' : 'Đánh dấu đã học'}
            </button>
          )}

          {/* Primary CTA — only show on theory tab */}
          {activeTab === 'theory' && (
            <button
              onClick={() => setActiveTab('exercises')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 12px rgba(59,130,246,.3)' }}
            >
              Sang bài tập <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
