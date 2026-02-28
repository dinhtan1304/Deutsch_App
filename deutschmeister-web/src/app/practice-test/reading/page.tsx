'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReadingHistory, useReadingStats, useDeleteReading } from '@/hooks/useReading';
import {
  IconBookOpen, IconDice, IconStar, IconTrash,
  IconChevronLeft, IconChevronRight, IconList,
} from './icons';

// ─── Helpers ───

const ACCENT = '#22C55E';
const GRADIENT = 'linear-gradient(135deg, #22C55E, #14B8A6)';

const TEXT_TYPE_LABELS: Record<string, { de: string; vi: string }> = {
  anzeige:      { de: 'Anzeige',      vi: 'Thông báo' },
  kurznachricht: { de: 'Kurznachricht', vi: 'Tin nhắn' },
  brief:        { de: 'Brief/E-Mail', vi: 'Thư/Email' },
  artikel:      { de: 'Artikel',      vi: 'Bài báo' },
  dialog:       { de: 'Dialog',       vi: 'Hội thoại' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:   { label: 'Chưa làm', color: '#6B7280', bg: 'rgba(107,114,128,.1)' },
  GRADED:  { label: 'Đã chấm',  color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
};

function getScoreColor(score: number | null) {
  if (score === null) return 'var(--theme-text-muted)';
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Stats Overview ───
function StatsOverview() {
  const { data: stats, isLoading } = useReadingStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        ))}
      </div>
    );
  }
  if (!stats || stats.totalSessions === 0) return null;

  const cards = [
    { label: 'Tổng bài đọc', value: stats.totalSessions, color: ACCENT, icon: IconList },
    { label: 'Điểm trung bình', value: stats.averageScore ? `${stats.averageScore}%` : '—', color: '#F59E0B', icon: IconStar },
    { label: 'Điểm cao nhất', value: stats.bestScore ? `${stats.bestScore}%` : '—', color: '#3B82F6', icon: IconStar },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      {cards.map((card, i) => {
        const Ic = card.icon;
        return (
          <div key={i} className="rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)` }}>
                <Ic size={12} style={{ color: 'white' }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{card.label}</span>
            </div>
            <div className="text-[18px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───
export default function ReadingListPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const { data: history, isLoading } = useReadingHistory({
    page, limit: 10, status: filterStatus || undefined,
  });
  const deleteMutation = useDeleteReading();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bài đọc này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (e) {
      console.warn('Failed to delete reading:', e);
    }
  };

  return (
    <div className="py-6">

      {/* ─── Back ─── */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/practice-test" className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Luyện Test
        </Link>
      </div>

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: GRADIENT }}>
            <IconBookOpen size={22} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Luyện Đọc
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              AI tạo bài đọc tiếng Đức — Luyện kỹ năng đọc hiểu Goethe/TELC
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/practice-test/reading/exam"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'rgba(34,197,94,.4)', color: '#22C55E', backgroundColor: 'rgba(34,197,94,.06)' }}>
            Theo đề chuẩn →
          </Link>
          <Link href="/practice-test/reading/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(34,197,94,.3)' }}>
            <IconDice size={16} /> Bài đọc mới
          </Link>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <StatsOverview />

      {/* ─── Filter ─── */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {['', 'DRAFT', 'GRADED'].map(status => {
          const isActive = filterStatus === status;
          const cfg = status ? STATUS_CONFIG[status] : null;
          const label = status === '' ? 'Tất cả' : cfg?.label || status;
          const color = cfg?.color || ACCENT;
          return (
            <button key={status}
              onClick={() => { setFilterStatus(status); setPage(1); }}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5"
              style={isActive
                ? { background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', boxShadow: `0 4px 12px ${color}30` }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
              }>
              {label}
            </button>
          );
        })}
      </div>

      {/* ─── History List ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl animate-pulse"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          ))}
        </div>
      ) : !history?.data.length ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed"
          style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: GRADIENT }}>
            <IconBookOpen size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-[14px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>Bạn chưa có bài đọc nào</p>
          <Link href="/practice-test/reading/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white"
            style={{ background: GRADIENT }}>
            <IconDice size={16} /> Bắt đầu bài đọc đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {history.data.map(item => {
            const typeInfo = TEXT_TYPE_LABELS[item.textType] || { de: item.textType, vi: item.textType };
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
            const targetHref = item.status === 'GRADED'
              ? `/practice-test/reading/${item.id}/result`
              : `/practice-test/reading/${item.id}`;

            return (
              <Link key={item.id} href={targetHref}
                className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 group"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

                {/* Icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,197,94,.08)' }}>
                  <IconBookOpen size={18} style={{ color: ACCENT }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                      {item.title || item.topic}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: 'rgba(34,197,94,.1)', color: ACCENT }}>
                      {item.cefrLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                    <span>{typeInfo.vi}</span>
                    <span>·</span>
                    <span>{item.totalQuestions} câu</span>
                    {item.status === 'GRADED' && item.correctCount !== undefined && (
                      <><span>·</span><span>{item.correctCount}/{item.totalQuestions} đúng</span></>
                    )}
                    <span>·</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>

                {/* Score */}
                {item.score !== null && item.score !== undefined && (
                  <div className="text-right shrink-0">
                    <div className="text-[22px] font-extrabold" style={{ color: getScoreColor(item.score) }}>
                      {Math.round(item.score)}%
                    </div>
                  </div>
                )}

                {/* Delete */}
                <button onClick={(e) => handleDelete(item.id, e)}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  style={{ color: 'var(--theme-text-muted)' }}
                  title="Xóa bài đọc">
                  <IconTrash size={16} />
                </button>
              </Link>
            );
          })}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {history && history.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-medium disabled:opacity-40 transition-all"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
            <IconChevronLeft size={14} /> Trước
          </button>
          <span className="text-[13px] font-medium px-3" style={{ color: 'var(--theme-text-muted)' }}>
            {page} / {history.totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-medium disabled:opacity-40 transition-all"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
            Sau <IconChevronRight size={14} />
          </button>
        </div>
      )}

    </div>
  );
}
