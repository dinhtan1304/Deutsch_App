'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWritingSession } from '@/hooks/useWriting';
import type { WritingError } from '@/lib/api/writing';

// ─── Inline SVG Icons ───
function IconChevronLeft({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconDice({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
      <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
      <path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" />
    </svg>
  );
}
function IconList({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function IconChevronDown({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Helpers ───
function getScoreGrade(score: number) {
  if (score >= 90) return { label: 'Ausgezeichnet!', labelVi: 'Xuất sắc!', color: '#22C55E' };
  if (score >= 80) return { label: 'Sehr gut!', labelVi: 'Rất tốt!', color: '#22C55E' };
  if (score >= 70) return { label: 'Gut!', labelVi: 'Tốt!', color: '#3B82F6' };
  if (score >= 60) return { label: 'Befriedigend', labelVi: 'Khá', color: '#F59E0B' };
  if (score >= 40) return { label: 'Ausreichend', labelVi: 'Đạt', color: '#F97316' };
  return { label: 'Weiter üben!', labelVi: 'Cần cố gắng thêm!', color: '#EF4444' };
}

const ERROR_TYPE_INFO: Record<string, { labelVi: string; color: string }> = {
  article:     { labelVi: 'Mạo từ',       color: '#EF4444' },
  grammar:     { labelVi: 'Ngữ pháp',     color: '#8B5CF6' },
  word_order:  { labelVi: 'Trật tự từ',   color: '#3B82F6' },
  conjugation: { labelVi: 'Chia động từ', color: '#14B8A6' },
  case:        { labelVi: 'Cách',         color: '#6366F1' },
  spelling:    { labelVi: 'Chính tả',     color: '#F97316' },
  vocabulary:  { labelVi: 'Từ vựng',      color: '#22C55E' },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  error:      { label: 'Lỗi',      color: '#EF4444' },
  warning:    { label: 'Cảnh báo', color: '#F59E0B' },
  suggestion: { label: 'Gợi ý',    color: '#3B82F6' },
};

// ─── Score Ring ───
function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const grade = getScoreGrade(score);
  const strokeColor = grade.color;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" style={{ stroke: 'var(--theme-border)' }} />
          <circle cx="60" cy="60" r="54" fill="none" stroke={strokeColor} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{Math.round(score)}</span>
          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>/100</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-[15px] font-bold" style={{ color: strokeColor }}>{grade.label}</p>
        <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{grade.labelVi}</p>
      </div>
    </div>
  );
}

// ─── Error Card ───
function ErrorCard({ error }: { error: WritingError }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = ERROR_TYPE_INFO[error.errorType] || { labelVi: error.errorType, color: '#6B7280' };
  const severity = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.error;

  return (
    <button onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="flex items-start gap-3">
        <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: severity.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold"
              style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>
              {typeInfo.labelVi}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{severity.label}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] flex-wrap">
            <span className="line-through font-medium" style={{ color: '#EF4444' }}>{error.originalText}</span>
            <span style={{ color: 'var(--theme-text-muted)' }}>→</span>
            <span className="font-medium" style={{ color: '#22C55E' }}>{error.correctedText}</span>
          </div>
          {expanded && (
            <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div>
                <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>Deutsch</span>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{error.explanationDe}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>Tiếng Việt</span>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{error.explanationVi}</p>
              </div>
            </div>
          )}
        </div>
        <span className="shrink-0 transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--theme-text-muted)' }}>
          <IconChevronDown size={16} />
        </span>
      </div>
    </button>
  );
}

// ─── Main Page ───
export default function WritingResultPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, isLoading, isError } = useWritingSession(id);
  const [showOriginal, setShowOriginal] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-6 space-y-6">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          <div className="flex gap-6">
            <div className="h-40 w-40 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            <div className="flex-1 space-y-3">
              <div className="h-6 rounded w-3/4 animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
              <div className="h-6 rounded w-1/2 animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError || !session || session.status !== 'GRADED') {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <IconList size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-[14px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            {session?.status === 'GRADING' ? 'Bài viết đang được chấm... Vui lòng đợi.' : 'Không tìm thấy kết quả'}
          </p>
          <Link href="/practice-test/writing" className="text-[13px] font-medium" style={{ color: '#3B82F6' }}>
            ← Quay lại danh sách
          </Link>
        </div>
      </MainLayout>
    );
  }

  const errors = (session.errors || []) as WritingError[];
  const errorsByType: Record<string, number> = {};
  errors.forEach(e => { errorsByType[e.errorType] = (errorsByType[e.errorType] || 0) + 1; });
  const filteredErrors = filterType ? errors.filter(e => e.errorType === filterType) : errors;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-6">

        {/* Header */}
        <div className="mb-6">
          <Link href="/practice-test/writing"
            className="flex items-center gap-1 text-[13px] font-medium mb-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={14} /> Quay lại
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Kết quả chấm bài
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
            {session.topic} · {session.cefrLevel} · {new Date(session.gradedAt!).toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Score + Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Score ring */}
          <div className="flex justify-center items-center p-6 rounded-2xl border"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <ScoreRing score={session.overallScore || 0} />
          </div>

          {/* Strengths & Improvements */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(34,197,94,.2)', backgroundColor: 'rgba(34,197,94,.04)' }}>
              <h3 className="text-[12px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: '#22C55E' }}>
                Stärken / Điểm mạnh
              </h3>
              <ul className="space-y-1.5">
                {(session.strengths as string[] || []).map((s, i) => (
                  <li key={i} className="text-[12px] flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span style={{ color: '#22C55E' }}>•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(245,158,11,.2)', backgroundColor: 'rgba(245,158,11,.04)' }}>
              <h3 className="text-[12px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: '#F59E0B' }}>
                Verbesserungen / Cần cải thiện
              </h3>
              <ul className="space-y-1.5">
                {(session.improvements as string[] || []).map((s, i) => (
                  <li key={i} className="text-[12px] flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span style={{ color: '#F59E0B' }}>•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* General Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
              Feedback auf Deutsch
            </h3>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{session.feedbackDe}</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
              Nhận xét tiếng Việt
            </h3>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{session.feedbackVi}</p>
          </div>
        </div>

        {/* Text Comparison */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>Bài viết</h2>
            <div className="flex rounded-lg p-0.5" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              {['Bài gốc', 'Bài đã sửa'].map((label, idx) => {
                const isActive = idx === 0 ? showOriginal : !showOriginal;
                return (
                  <button key={label} onClick={() => setShowOriginal(idx === 0)}
                    className="px-3 py-1 rounded-md text-[12px] font-medium transition-colors"
                    style={isActive
                      ? { backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                      : { color: 'var(--theme-text-muted)' }
                    }>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-5 rounded-xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text-primary)' }}>
              {showOriginal ? session.userText : session.correctedText}
            </p>
          </div>
        </div>

        {/* Error Details */}
        <div className="mb-6">
          <h2 className="text-[16px] font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Chi tiết lỗi ({errors.length})
          </h2>

          {Object.keys(errorsByType).length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button onClick={() => setFilterType('')}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={!filterType
                  ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                Tất cả ({errors.length})
              </button>
              {Object.entries(errorsByType).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                const info = ERROR_TYPE_INFO[type];
                return (
                  <button key={type} onClick={() => setFilterType(type === filterType ? '' : type)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                    style={filterType === type
                      ? { background: `linear-gradient(135deg, ${info?.color || '#6B7280'}, ${info?.color || '#6B7280'}cc)`, color: 'white' }
                      : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                    }>
                    {info?.labelVi || type} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {filteredErrors.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
              <p className="text-[18px] mb-1">🎉</p>
              <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>Không có lỗi nào!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredErrors.map(error => <ErrorCard key={error.id} error={error} />)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          <Link href="/practice-test/writing/new"
            className="flex-1 min-w-35 py-3 rounded-xl font-bold text-[14px] text-white text-center transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }}>
            <IconDice size={16} /> Viết bài mới
          </Link>
          <Link href="/practice-test/writing"
            className="flex-1 min-w-35 py-3 rounded-xl border-2 font-semibold text-[14px] text-center transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconList size={16} /> Xem lịch sử
          </Link>
        </div>

      </div>
    </MainLayout>
  );
}