'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWritingSession } from '@/hooks/useWriting';
import type { WritingError } from '@/lib/api/writing';

// ── Helpers ──

function getScoreGrade(score: number) {
  if (score >= 90) return { label: 'Ausgezeichnet!', labelVi: 'Xuất sắc!', emoji: '🏆', color: 'text-green-500' };
  if (score >= 80) return { label: 'Sehr gut!', labelVi: 'Rất tốt!', emoji: '🌟', color: 'text-green-500' };
  if (score >= 70) return { label: 'Gut!', labelVi: 'Tốt!', emoji: '👍', color: 'text-blue-500' };
  if (score >= 60) return { label: 'Befriedigend', labelVi: 'Khá', emoji: '📝', color: 'text-yellow-500' };
  if (score >= 40) return { label: 'Ausreichend', labelVi: 'Đạt', emoji: '💪', color: 'text-orange-500' };
  return { label: 'Weiter üben!', labelVi: 'Cần cố gắng thêm!', emoji: '📚', color: 'text-red-500' };
}

const ERROR_TYPE_INFO: Record<string, { label: string; labelVi: string; icon: string; color: string }> = {
  article: { label: 'Artikel', labelVi: 'Mạo từ', icon: '🔤', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  grammar: { label: 'Grammatik', labelVi: 'Ngữ pháp', icon: '📐', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  word_order: { label: 'Wortstellung', labelVi: 'Trật tự từ', icon: '🔀', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  conjugation: { label: 'Konjugation', labelVi: 'Chia động từ', icon: '🔄', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  case: { label: 'Kasus', labelVi: 'Cách', icon: '📊', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  spelling: { label: 'Rechtschreibung', labelVi: 'Chính tả', icon: '✏️', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  vocabulary: { label: 'Wortschatz', labelVi: 'Từ vựng', icon: '📖', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const SEVERITY_STYLES: Record<string, { label: string; dot: string; bg: string; border: string }> = {
  error: { label: 'Lỗi', dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800' },
  warning: { label: 'Cảnh báo', dot: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10', border: 'border-yellow-200 dark:border-yellow-800' },
  suggestion: { label: 'Gợi ý', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800' },
};

// ── Score Ring Component ──

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const grade = getScoreGrade(score);

  const strokeColor =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#3b82f6' :
    score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
            className="text-gray-200 dark:text-gray-700" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={strokeColor} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(score)}
          </span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-2xl">{grade.emoji}</span>
        <p className={`font-bold ${grade.color}`}>{grade.label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{grade.labelVi}</p>
      </div>
    </div>
  );
}

// ── Error Card Component ──

function ErrorCard({ error, index }: { error: WritingError; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = ERROR_TYPE_INFO[error.errorType] || {
    label: error.errorType, labelVi: error.errorType, icon: '❓',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  const severity = SEVERITY_STYLES[error.severity] || SEVERITY_STYLES.error;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`w-full text-left p-4 rounded-xl border ${severity.border} ${severity.bg} transition-all hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        {/* Severity dot */}
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${severity.dot}`} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
              {typeInfo.icon} {typeInfo.labelVi}
            </span>
            <span className="text-xs text-gray-400">{severity.label}</span>
          </div>

          {/* Error text */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="line-through text-red-500 dark:text-red-400 font-medium">
              {error.originalText}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {error.correctedText}
            </span>
          </div>

          {/* Expanded explanations */}
          {expanded && (
            <div className="mt-3 space-y-2 border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">🇩🇪 Deutsch</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                  {error.explanationDe}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">🇻🇳 Tiếng Việt</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                  {error.explanationVi}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expand indicator */}
        <span className={`text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>
    </button>
  );
}

// ── Main Page ──

export default function WritingResultPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, isLoading, isError } = useWritingSession(id);
  const [showOriginal, setShowOriginal] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex gap-6">
            <div className="h-40 w-40 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !session || session.status !== 'GRADED') {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-20">
        <span className="text-5xl mb-4 block">🔍</span>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {session?.status === 'GRADING'
            ? 'Bài viết đang được chấm... Vui lòng đợi.'
            : 'Không tìm thấy kết quả'}
        </p>
        <Link href="/practice-test/writing" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const errors = session.errors || [];
  const filteredErrors = filterType
    ? errors.filter((e) => e.errorType === filterType)
    : errors;

  // Group errors by type for stats
  const errorsByType: Record<string, number> = {};
  errors.forEach((e) => {
    errorsByType[e.errorType] = (errorsByType[e.errorType] || 0) + 1;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/practice-test/writing"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1"
        >
          ← Quay lại
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
          📊 Kết quả chấm bài
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {session.topic} · {session.cefrLevel} · {new Date(session.gradedAt!).toLocaleDateString('vi-VN')}
        </p>
      </div>

      {/* ── Score + Feedback Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Score ring */}
        <div className="flex justify-center items-center p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <ScoreRing score={session.overallScore || 0} />
        </div>

        {/* Strengths & Improvements */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
              ✅ Stärken / Điểm mạnh
            </h3>
            <ul className="space-y-1.5">
              {(session.strengths as string[] || []).map((s, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
              📈 Verbesserungen / Cần cải thiện
            </h3>
            <ul className="space-y-1.5">
              {(session.improvements as string[] || []).map((s, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── General Feedback ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            🇩🇪 Feedback auf Deutsch
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {session.feedbackDe}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            🇻🇳 Nhận xét tiếng Việt
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {session.feedbackVi}
          </p>
        </div>
      </div>

      {/* ── Text Comparison ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📝 Bài viết</h2>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setShowOriginal(true)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                showOriginal ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              Bài gốc
            </button>
            <button
              onClick={() => setShowOriginal(false)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                !showOriginal ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              Bài đã sửa
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
            {showOriginal ? session.userText : session.correctedText}
          </p>
        </div>
      </div>

      {/* ── Error Details ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            🔍 Chi tiết lỗi ({errors.length})
          </h2>
        </div>

        {/* Error type filter chips */}
        {Object.keys(errorsByType).length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilterType('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !filterType
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Tất cả ({errors.length})
            </button>
            {Object.entries(errorsByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const info = ERROR_TYPE_INFO[type];
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type === filterType ? '' : type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterType === type
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {info?.icon || '❓'} {info?.labelVi || type} ({count})
                  </button>
                );
              })}
          </div>
        )}

        {/* Error list */}
        {filteredErrors.length === 0 ? (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <span className="text-4xl mb-2 block">🎉</span>
            <p className="text-gray-500 dark:text-gray-400">Không có lỗi nào!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredErrors.map((error, i) => (
              <ErrorCard key={error.id} error={error} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/practice-test/writing/new"
          className="flex-1 min-w-35 py-3 rounded-xl bg-blue-600 text-white font-medium text-center hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>🎲</span>
          Viết bài mới
        </Link>
        <Link
          href="/practice-test/writing"
          className="flex-1 min-w-35 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <span>📋</span>
          Xem lịch sử
        </Link>
      </div>
    </div>
  );
}
