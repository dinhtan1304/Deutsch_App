'use client';

import { GrammarLesson } from '@/types/grammar';
import Link from 'next/link';

interface GrammarLessonCardProps {
  lesson: GrammarLesson;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score?: number;
  };
}

// DARK-6 fix: semi-transparent badge — readable ở cả light và dark mode
const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  A1: { bg: 'rgba(34,197,94,.12)',  color: '#16A34A' },
  A2: { bg: 'rgba(59,130,246,.12)', color: '#2563EB' },
  B1: { bg: 'rgba(245,158,11,.12)', color: '#D97706' },
  B2: { bg: 'rgba(139,92,246,.12)', color: '#7C3AED' },
};

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconLock({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export const GrammarLessonCard = ({ lesson, progress }: GrammarLessonCardProps) => {
  const isLocked = lesson.isActive === false;
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const levelStyle = LEVEL_STYLE[lesson.level] || LEVEL_STYLE.A1;

  return (
    // STYLE-1 fix: không dùng Card generic + hover:shadow-lg (hardcode)
    // Dùng inline style + var(--theme-*) giống các card khác trong dự án
    <div
      className="flex flex-col rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: isCompleted ? '0 0 0 2px rgba(34,197,94,.2)' : 'none',
      }}
    >
      {/* Card Header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* DARK-6 fix: level badge */}
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
            style={{ backgroundColor: levelStyle.bg, color: levelStyle.color }}
          >
            {lesson.level} · Bài {lesson.lessonNumber}
          </span>

          {isCompleted && (
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(34,197,94,.12)', color: '#22C55E' }}
            >
              <IconCheck size={13} />
            </span>
          )}
        </div>

        <h3 className="text-[15px] font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {lesson.titleVi}
        </h3>

        {/* DARK-5 fix: text-gray-500 → var(--theme-text-muted) */}
        <p className="text-[12px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {lesson.titleDe}
        </p>

        {/* Objectives — DARK-5 fix: text-gray-600 → var(--theme-text-secondary) */}
        {lesson.objectives?.vi?.length > 0 && (
          <ul className="space-y-1">
            {lesson.objectives.vi.slice(0, 2).map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]"
                style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="mt-1 shrink-0" style={{ color: levelStyle.color }}>•</span>
                {obj}
              </li>
            ))}
            {lesson.objectives.vi.length > 2 && (
              <li className="text-[11px] italic" style={{ color: 'var(--theme-text-muted)' }}>
                + {lesson.objectives.vi.length - 2} mục tiêu khác
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Card Footer — STYLE-2 fix: border-t dùng var(--theme-border) */}
      <div
        className="px-5 py-4 border-t"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        {isLocked ? (
          <div
            className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
          >
            <IconLock size={14} /> Đang khóa
          </div>
        ) : (
          <Link
            href={`/grammar/${lesson.slug}`}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={isCompleted ? {
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-secondary)',
              border: '2px solid var(--theme-border)',
            } : {
              background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(59,130,246,.25)',
            }}
          >
            {isCompleted ? 'Ôn tập lại' : isInProgress ? 'Tiếp tục' : 'Bắt đầu học'}
          </Link>
        )}
      </div>
    </div>
  );
};
