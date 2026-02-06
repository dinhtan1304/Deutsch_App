'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWritingHistory, useWritingStats, useDeleteWriting } from '@/hooks/useWriting';

// ── Helpers ──

const WRITING_TYPE_LABELS: Record<string, { de: string; vi: string; icon: string }> = {
  email: { de: 'E-Mail', vi: 'Email', icon: '📧' },
  brief: { de: 'Brief', vi: 'Thư', icon: '✉️' },
  beschreibung: { de: 'Beschreibung', vi: 'Mô tả', icon: '🖼️' },
  tagebuch: { de: 'Tagebuch', vi: 'Nhật ký', icon: '📔' },
  dialog: { de: 'Dialog', vi: 'Hội thoại', icon: '💬' },
  aufsatz: { de: 'Aufsatz', vi: 'Bài luận', icon: '📝' },
  einladung: { de: 'Einladung', vi: 'Thư mời', icon: '🎫' },
  beschwerde: { de: 'Beschwerde', vi: 'Khiếu nại', icon: '😤' },
  bewerbung: { de: 'Bewerbung', vi: 'Xin việc', icon: '💼' },
  formular: { de: 'Formular', vi: 'Mẫu đơn', icon: '📋' },
};

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  DRAFT: { label: 'Nháp', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  SUBMITTED: { label: 'Đã nộp', class: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  GRADING: { label: 'Đang chấm...', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  GRADED: { label: 'Đã chấm', class: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  ERROR: { label: 'Lỗi', class: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

function getScoreColor(score: number | null) {
  if (score === null) return 'text-gray-400';
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Components ──

function StatsOverview() {
  const { data: stats, isLoading } = useWritingStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Tổng bài viết', value: stats.totalSessions, icon: '📝' },
    { label: 'Điểm trung bình', value: stats.averageScore || '—', icon: '⭐' },
    { label: 'Tổng lỗi', value: stats.totalErrors, icon: '🔍' },
    {
      label: 'Lỗi phổ biến nhất',
      value: stats.topErrors[0]?.label.vi || '—',
      icon: '⚠️',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="flex items-center gap-2 mb-1">
            <span>{card.icon}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{card.label}</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function WritingListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const { data: history, isLoading } = useWritingHistory({
    page,
    limit: 10,
    status: filterStatus || undefined,
  });
  const deleteMutation = useDeleteWriting();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">✍️ Luyện Viết</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            AI tạo đề bài tiếng Đức — Viết và nhận phản hồi chi tiết
          </p>
        </div>
        <Link
          href="/practice-test/writing/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <span>🎲</span>
          <span>Tạo đề mới</span>
        </Link>
      </div>

      {/* Stats */}
      <StatsOverview />

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'DRAFT', 'GRADED', 'ERROR'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {status === '' ? 'Tất cả' : STATUS_BADGES[status]?.label || status}
          </button>
        ))}
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : !history?.data.length ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <span className="text-5xl mb-4 block">✍️</span>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Bạn chưa có bài viết nào</p>
          <Link
            href="/practice-test/writing/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Bắt đầu viết bài đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.data.map((item) => {
            const typeInfo = WRITING_TYPE_LABELS[item.writingType] || {
              de: item.writingType,
              vi: item.writingType,
              icon: '📝',
            };
            const statusBadge = STATUS_BADGES[item.status] || STATUS_BADGES.DRAFT;

            return (
              <Link
                key={item.id}
                href={
                  item.status === 'GRADED'
                    ? `/practice-test/writing/${item.id}/result`
                    : `/practice-test/writing/${item.id}`
                }
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xl shrink-0">
                  {typeInfo.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {item.topic}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                      {item.cefrLevel}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusBadge.class}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{typeInfo.vi}</span>
                    <span>·</span>
                    <span>{formatDate(item.createdAt)}</span>
                    {item.wordCount && (
                      <>
                        <span>·</span>
                        <span>{item.wordCount} từ</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score */}
                {item.overallScore !== null && (
                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-bold ${getScoreColor(item.overallScore)}`}>
                      {Math.round(item.overallScore)}
                    </div>
                    <div className="text-xs text-gray-400">/100</div>
                  </div>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Xóa bài viết"
                >
                  🗑️
                </button>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {history && history.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 disabled:opacity-40"
          >
            ← Trước
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page} / {history.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(history.totalPages, p + 1))}
            disabled={page === history.totalPages}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 disabled:opacity-40"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
