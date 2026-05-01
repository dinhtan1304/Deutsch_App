'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGrammarLesson, useGrammarProgress, useSubmitGrammarExercises } from '@/hooks/useGrammar';
import { TheorySection } from '@/components/grammar/TheorySection';
import { ExerciseList } from '@/components/grammar/ExerciseList';
import { ACCENT, STATUS } from '@/lib/tokens';
import { IconArrowLeft, IconBookOpen, IconPenLine, IconSearch, IconCheck } from '@/components/ui/Icons';
import { usePronunciation } from '@/hooks/usePronunciation';
import Link from 'next/link';

const LEVEL_STYLE = {
  A1: { bg: `${ACCENT.reading}12`, color: ACCENT.reading, gradient: `linear-gradient(135deg, ${ACCENT.reading}, #16A34A)`, glow: `${ACCENT.reading}33` },
  A2: { bg: `${ACCENT.srs}12`,     color: ACCENT.srs,     gradient: `linear-gradient(135deg, ${ACCENT.srs}, #2563EB)`,     glow: `${ACCENT.srs}33` },
  B1: { bg: `${ACCENT.xp}12`,      color: ACCENT.xp,      gradient: `linear-gradient(135deg, ${ACCENT.xp}, #D97706)`,      glow: `${ACCENT.xp}33` },
  B2: { bg: `${ACCENT.vocab}12`,   color: ACCENT.vocab,   gradient: `linear-gradient(135deg, ${ACCENT.vocab}, #7C3AED)`,   glow: `${ACCENT.vocab}33` },
};

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="shrink-0">
      <svg width={54} height={54} viewBox="0 0 54 54">
        <circle cx={27} cy={27} r={r} fill="none" stroke="var(--theme-bg-secondary)" strokeWidth={4} />
        <circle
          cx={27} cy={27} r={r} fill="none"
          stroke={pct >= 100 ? STATUS.success : color}
          strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 27 27)"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
        <text x={27} y={31} textAnchor="middle" fontSize={10} fontWeight={700}
          fill={pct >= 100 ? STATUS.success : 'var(--theme-text-primary)'}>
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
          style={{ borderColor: 'var(--theme-border)', borderTopColor: ACCENT.vocab }} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <IconSearch size={26} style={{ color: ACCENT.vocab }} />
        </div>
        <p className="text-base font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
          Không tìm thấy bài học này.
        </p>
        <Link href="/grammar"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: ACCENT.vocab }}>
          <IconArrowLeft size={15} /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const ls = LEVEL_STYLE[lesson.level as keyof typeof LEVEL_STYLE] ?? LEVEL_STYLE.A1;
  const lessonProgress = progressList?.find(p => p.lessonSlug === slug);
  const isCompleted = lessonProgress?.status === 'completed';
  const correctCount = lessonProgress?.correctCount ?? 0;
  const totalExercises = lesson.exercises.length;

  const exercisePct = totalExercises > 0 ? (correctCount / totalExercises) * 70 : 0;
  const progressPct = isCompleted ? 100
    : theoryDone ? Math.round(30 + exercisePct)
    : Math.round(exercisePct * 0.5);

  const theoryTabDone = theoryDone || isCompleted;

  return (
    <div className="max-w-4xl mx-auto px-4" style={{ paddingBottom: 100 }}>

      {/* ─── Immersive Header ─── */}
      <div
        className="relative -mx-4 mb-6 px-4 pt-5 pb-6 overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${ls.bg} 0%, transparent 100%)` }}
      >
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{ background: `radial-gradient(circle at 80% 10%, ${ls.glow}, transparent 60%)` }} />

        {/* Back */}
        <Link
          href="/grammar"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconArrowLeft size={15} /> Quay lại
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Meta */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: ls.bg, color: ls.color, border: `1px solid ${ls.color}30` }}>
                {lesson.level}
              </span>
              <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                Bài {lesson.lessonNumber}
              </span>
              <span style={{ color: 'var(--theme-border)' }}>·</span>
              <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                ~{lesson.estimatedMinutes} phút
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-extrabold leading-tight mb-1"
              style={{ color: 'var(--theme-text-primary)' }}>
              {lesson.titleVi}
            </h1>

            {/* German subtitle + audio */}
            <div className="flex items-center gap-2">
              <span className="text-base italic" style={{ color: ls.color }}>
                {lesson.titleDe}
              </span>
              <button
                onClick={() => speak(lesson.titleDe)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: ls.bg, color: ls.color }}
                title="Nghe phát âm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress ring */}
          <ProgressRing pct={progressPct} color={ls.color} />
        </div>
      </div>

      {/* ─── Tab bar ─── */}
      <div className="flex gap-1.5 mb-6 p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        {/* Theory tab */}
        <button
          onClick={() => setActiveTab('theory')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          style={activeTab === 'theory' ? {
            background: ls.gradient,
            color: 'white',
            boxShadow: `0 2px 10px ${ls.glow}`,
          } : { color: 'var(--theme-text-muted)', backgroundColor: 'transparent' }}>
          <IconBookOpen size={15} />
          Lý thuyết
          {theoryTabDone && (
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,.25)' }}>
              <IconCheck size={9} />
            </span>
          )}
        </button>

        {/* Exercises tab */}
        <button
          onClick={() => setActiveTab('exercises')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          style={activeTab === 'exercises' ? {
            background: ls.gradient,
            color: 'white',
            boxShadow: `0 2px 10px ${ls.glow}`,
          } : { color: 'var(--theme-text-muted)', backgroundColor: 'transparent' }}>
          <IconPenLine size={15} />
          Bài tập
          {totalExercises > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
              style={activeTab === 'exercises'
                ? { backgroundColor: 'rgba(255,255,255,.25)', color: 'white' }
                : { backgroundColor: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-muted)' }}>
              {correctCount}/{totalExercises}
            </span>
          )}
        </button>
      </div>

      {/* ─── Content ─── */}
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

      {/* ─── Floating Action Bar ─── */}
      {/* ─── Floating Action Bar ─── */}
      {/* Theory tab: full-width bar */}
      {activeTab === 'theory' && (
        <div className="fixed bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
          <div
            className="w-full max-w-xl pointer-events-auto rounded-2xl border px-4 py-3 flex gap-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--theme-bg-card) 90%, transparent)',
              borderColor: `${ls.color}25`,
              backdropFilter: 'blur(16px)',
              boxShadow: `0 8px 32px rgba(0,0,0,.12), 0 0 0 1px ${ls.color}15`,
            }}>
            <button
              onClick={() => setTheoryDone(!theoryDone)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border"
              style={theoryDone ? {
                backgroundColor: `${STATUS.success}1A`,
                borderColor: `${STATUS.success}4D`,
                color: STATUS.success,
              } : {
                backgroundColor: 'var(--theme-bg-secondary)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}>
              <IconCheck size={15} />
              {theoryDone ? 'Đã học' : 'Đánh dấu'}
            </button>

            <button
              onClick={() => setActiveTab('exercises')}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: ls.gradient, boxShadow: `0 4px 14px ${ls.glow}` }}>
              Sang bài tập
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Exercise tab: small floating back button (bottom-left) */}
      {activeTab === 'exercises' && (
        <div className="fixed bottom-4 left-4 z-20">
          <button
            onClick={() => setActiveTab('theory')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 border"
            style={{
              color: 'var(--theme-text-secondary)',
              backgroundColor: 'color-mix(in srgb, var(--theme-bg-card) 90%, transparent)',
              backdropFilter: 'blur(16px)',
              borderColor: 'var(--theme-border)',
              boxShadow: '0 4px 16px rgba(0,0,0,.1)',
            }}>
            <IconArrowLeft size={14} /> Lý thuyết
          </button>
        </div>
      )}

    </div>
  );
}
