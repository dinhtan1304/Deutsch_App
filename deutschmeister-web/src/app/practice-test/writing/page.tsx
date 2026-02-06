'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWritingHistory, useWritingStats, useDeleteWriting } from '@/hooks/useWriting';

// ─── Inline SVG Icons ───
function IconPenLine({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
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
function IconSearch({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconStar({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconAlertTriangle({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}
function IconTrash({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
function IconChevronLeft({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconChevronRight({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ─── Helpers ───
const WRITING_TYPE_LABELS: Record<string, { de: string; vi: string; color: string }> = {
  email:         { de: 'E-Mail',        vi: 'Email',      color: '#3B82F6' },
  brief:         { de: 'Brief',         vi: 'Thư',        color: '#8B5CF6' },
  beschreibung:  { de: 'Beschreibung',  vi: 'Mô tả',     color: '#6366F1' },
  tagebuch:      { de: 'Tagebuch',      vi: 'Nhật ký',    color: '#EC4899' },
  dialog:        { de: 'Dialog',        vi: 'Hội thoại',  color: '#14B8A6' },
  aufsatz:       { de: 'Aufsatz',       vi: 'Bài luận',   color: '#F59E0B' },
  einladung:     { de: 'Einladung',     vi: 'Thư mời',    color: '#22C55E' },
  beschwerde:    { de: 'Beschwerde',    vi: 'Khiếu nại',  color: '#EF4444' },
  bewerbung:     { de: 'Bewerbung',     vi: 'Xin việc',   color: '#0EA5E9' },
  formular:      { de: 'Formular',      vi: 'Mẫu đơn',   color: '#6B7280' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'Nháp',        color: '#6B7280', bg: 'rgba(107,114,128,.1)' },
  SUBMITTED: { label: 'Đã nộp',     color: '#3B82F6', bg: 'rgba(59,130,246,.1)' },
  GRADING:   { label: 'Đang chấm…', color: '#F59E0B', bg: 'rgba(245,158,11,.1)' },
  GRADED:    { label: 'Đã chấm',    color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
  ERROR:     { label: 'Lỗi',        color: '#EF4444', bg: 'rgba(239,68,68,.1)' },
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
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Stats Overview ───
function StatsOverview() {
  const { data: stats, isLoading } = useWritingStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        ))}
      </div>
    );
  }
  if (!stats) return null;

  const cards = [
    { label: 'Tổng bài viết', value: stats.totalSessions, color: '#3B82F6', icon: IconPenLine },
    { label: 'Điểm TB', value: stats.averageScore || '—', color: '#F59E0B', icon: IconStar },
    { label: 'Tổng lỗi', value: stats.totalErrors, color: '#EF4444', icon: IconSearch },
    { label: 'Lỗi phổ biến', value: stats.topErrors[0]?.label.vi || '—', color: '#8B5CF6', icon: IconAlertTriangle },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
export default function WritingListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const { data: history, isLoading } = useWritingHistory({
    page, limit: 10, status: filterStatus || undefined,
  });
  const deleteMutation = useDeleteWriting();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <MainLayout>
      <div className="py-6">

        {/* ─── Header ─── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <IconPenLine size={22} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Luyện Viết
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                AI tạo đề bài tiếng Đức — Viết và nhận phản hồi chi tiết
              </p>
            </div>
          </div>
          <Link href="/practice-test/writing/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }}>
            <IconDice size={16} /> Tạo đề mới
          </Link>
        </div>

        {/* ─── Stats ─── */}
        <StatsOverview />

        {/* ─── Filter ─── */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {['', 'DRAFT', 'GRADED', 'ERROR'].map(status => {
            const isActive = filterStatus === status;
            const cfg = status ? STATUS_CONFIG[status] : null;
            const label = status === '' ? 'Tất cả' : cfg?.label || status;
            const color = cfg?.color || '#6B7280';
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
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <IconPenLine size={28} style={{ color: 'white' }} />
            </div>
            <p className="text-[14px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>Bạn chưa có bài viết nào</p>
            <Link href="/practice-test/writing/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <IconDice size={16} /> Bắt đầu viết bài đầu tiên
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {history.data.map(item => {
              const typeInfo = WRITING_TYPE_LABELS[item.writingType] || { de: item.writingType, vi: item.writingType, color: '#6B7280' };
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;

              return (
                <Link key={item.id}
                  href={item.status === 'GRADED' ? `/practice-test/writing/${item.id}/result` : `/practice-test/writing/${item.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 group"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${typeInfo.color}18, ${typeInfo.color}08)` }}>
                    <IconPenLine size={18} style={{ color: typeInfo.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                        {item.topic}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>
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
                      <span>{formatDate(item.createdAt)}</span>
                      {item.wordCount && (<><span>·</span><span>{item.wordCount} từ</span></>)}
                    </div>
                  </div>

                  {/* Score */}
                  {item.overallScore !== null && (
                    <div className="text-right shrink-0">
                      <div className="text-[22px] font-extrabold" style={{ color: getScoreColor(item.overallScore) }}>
                        {Math.round(item.overallScore)}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>/100</div>
                    </div>
                  )}

                  {/* Delete */}
                  <button onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    style={{ color: 'var(--theme-text-muted)' }}
                    title="Xóa bài viết">
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
    </MainLayout>
  );
}