'use client';

import { GRADIENT } from '@/lib/tokens';

interface Props {
  difficulty: string;
  answeredCount: number;
  totalBlanks: number;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function DictationHeader({ difficulty, answeredCount, totalBlanks, onSubmit, isSubmitting }: Props) {
  const pct = totalBlanks > 0 ? Math.round((answeredCount / totalBlanks) * 100) : 0;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
          style={{ background: GRADIENT.dictation }}
        >
          Độ khó: {difficulty}
        </span>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border"
          style={{ color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}
        >
          Hoàn thành: {pct}%
        </span>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
        style={{ background: GRADIENT.dictation }}
      >
        {isSubmitting ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        )}
        Kiểm tra đáp án
      </button>
    </div>
  );
}
