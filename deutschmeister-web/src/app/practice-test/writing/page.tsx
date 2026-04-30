'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWritingHistory, useWritingStats, useDeleteWriting } from '@/hooks/useWriting';
import { IconAlertTriangle, IconChevronLeft, IconChevronRight, IconDice, IconPenLine, IconSearch, IconStar, IconTrash } from './icons';
import { PageHeader, GridSkeleton } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── Helpers ───
const WRITING_TYPE_LABELS: Record<string, { de: string; vi: string; color: string }> = {
  email:         { de: 'E-Mail',        vi: 'Email',      color: ACCENT.srs },
  brief:         { de: 'Brief',         vi: 'Thư',        color: ACCENT.vocab },
  beschreibung:  { de: 'Beschreibung',  vi: 'Mô tả',     color: ACCENT.writing },
  tagebuch:      { de: 'Tagebuch',      vi: 'Nhật ký',    color: ACCENT.listening },
  dialog:        { de: 'Dialog',        vi: 'Hội thoại',  color: ACCENT.teal },
  aufsatz:       { de: 'Aufsatz',       vi: 'Bài luận',   color: ACCENT.xp },
  einladung:     { de: 'Einladung',     vi: 'Thư mời',    color: STATUS.success },
  beschwerde:    { de: 'Beschwerde',    vi: 'Khiếu nại',  color: STATUS.danger },
  bewerbung:     { de: 'Bewerbung',     vi: 'Xin việc',   color: STATUS.info },
  formular:      { de: 'Formular',      vi: 'Mẫu đơn',   color: 'var(--theme-text-muted)' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'Nháp',        color: 'var(--theme-text-muted)', bg: 'rgba(107,114,128,.1)' },
  SUBMITTED: { label: 'Đã nộp',     color: STATUS.info,               bg: `${STATUS.info}1A` },
  GRADING:   { label: 'Đang chấm…', color: STATUS.warning,            bg: `${STATUS.warning}1A` },
  GRADED:    { label: 'Đã chấm',    color: STATUS.success,            bg: `${STATUS.success}1A` },
  ERROR:     { label: 'Lỗi',        color: STATUS.danger,             bg: `${STATUS.danger}1A` },
};

function getScoreColor(score: number | null) {
  if (score === null) return 'var(--theme-text-muted)';
  if (score >= 80) return STATUS.success;
  if (score >= 60) return STATUS.warning;
  if (score >= 40) return ACCENT.games;
  return STATUS.danger;
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
    { label: 'Tổng bài viết', value: stats.totalSessions, color: ACCENT.srs,     icon: IconPenLine },
    { label: 'Điểm TB',       value: stats.averageScore || '—', color: ACCENT.xp, icon: IconStar },
    { label: 'Tổng lỗi',      value: stats.totalErrors,  color: STATUS.danger,   icon: IconSearch },
    { label: 'Lỗi phổ biến',  value: stats.topErrors[0]?.label.vi || '—', color: ACCENT.vocab, icon: IconAlertTriangle },
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
              <span className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{card.label}</span>
            </div>
            <div className="text-title font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
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
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const { data: history, isLoading } = useWritingHistory({
    page, limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const deleteMutation = useDeleteWriting();
  const { data: stats } = useWritingStats();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Mutation error already shown via global handleGlobalError toast
    }
  };

  return (
      <div className="py-6">

        <PageHeader
          backHref="/practice-test"
          title="Luyện Viết"
          subtitle="AI tạo đề bài tiếng Đức — Viết và nhận phản hồi chi tiết"
          accent="writing"
          right={
            <div className="flex items-center gap-2">
              <Link href="/practice-test/writing/exam"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body font-semibold border transition-all hover:-translate-y-0.5"
                style={{ borderColor: `${ACCENT.examWriting}40`, color: ACCENT.examWriting, backgroundColor: `${ACCENT.examWriting}0A` }}>
                Theo đề chuẩn →
              </Link>
              <Link href="/practice-test/writing/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: GRADIENT.writing, boxShadow: `0 4px 12px ${ACCENT.writing}33` }}>
                <IconDice size={16} /> Tạo đề mới
              </Link>
            </div>
          }
        />

        {/* ─── Stats Banner ─── */}
        {stats && (
          <div className="flex items-center gap-3 mb-5 overflow-x-auto no-scrollbar">
            {[
              { label: 'Tổng bài', value: stats.totalSessions, color: ACCENT.writing },
              { label: 'TB điểm', value: stats.averageScore ? `${Math.round(stats.averageScore)}%` : '—', color: ACCENT.xp },
              { label: 'Tổng lỗi', value: stats.totalErrors, color: STATUS.danger },
              { label: 'Lỗi phổ biến', value: stats.topErrors[0]?.label.vi || '—', color: ACCENT.vocab },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
                style={{ backgroundColor: `${s.color}1A` }}>
                <span className="text-base font-extrabold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Filters ─── */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['', 'A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => {
              const isActive = filterLevel === lvl;
              return (
                <button key={lvl}
                  onClick={() => { setFilterLevel(lvl); setPage(1); }}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200"
                  style={isActive
                    ? { background: GRADIENT.writing, color: 'white', boxShadow: `0 4px 12px ${ACCENT.writing}33` }
                    : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                  }>
                  {lvl || 'TẤT CẢ TRÌNH ĐỘ'}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['', 'DRAFT', 'GRADED', 'ERROR'].map(status => {
              const isActive = filterStatus === status;
              const cfg = status ? STATUS_CONFIG[status] : null;
              const label = status === '' ? 'Tất cả trạng thái' : cfg?.label || status;
              const color = cfg?.color || 'var(--theme-text-muted)';
              return (
                <button key={status}
                  onClick={() => { setFilterStatus(status); setPage(1); }}
                  className="px-4 py-2 rounded-xl text-body font-semibold whitespace-nowrap transition-all duration-200"
                  style={isActive
                    ? { background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', boxShadow: `0 4px 12px ${color}30` }
                    : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                  }>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── History List ─── */}
        {isLoading ? (
          <GridSkeleton cols={1} count={3} height="h-20" gap="gap-3" />
        ) : !history?.data.length ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'var(--theme-border)' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: GRADIENT.writing }}>
              <IconPenLine size={28} style={{ color: 'white' }} />
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Bạn chưa có bài viết nào</p>
            <Link href="/practice-test/writing/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: GRADIENT.writing }}>
              <IconDice size={16} /> Bắt đầu viết bài đầu tiên
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {history.data.map(item => {
              const typeInfo = WRITING_TYPE_LABELS[item.writingType] || { de: item.writingType, vi: item.writingType, color: 'var(--theme-text-muted)' };
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
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                        {item.topic}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-caption font-bold shrink-0"
                        style={{ backgroundColor: `${STATUS.info}1A`, color: STATUS.info }}>
                        {item.cefrLevel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-caption font-bold shrink-0"
                        style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      <span>{typeInfo.vi}</span>
                      <span>·</span>
                      <span>{formatDate(item.createdAt)}</span>
                      {item.wordCount && (<><span>·</span><span>{item.wordCount} từ</span></>)}
                    </div>
                  </div>

                  {/* Score */}
                  {item.overallScore !== null && (
                    <div className="text-right shrink-0">
                      <div className="text-title font-extrabold" style={{ color: getScoreColor(item.overallScore) }}>
                        {Math.round(item.overallScore)}%
                      </div>
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-body font-medium disabled:opacity-40 transition-all"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
              <IconChevronLeft size={14} /> Trước
            </button>
            <span className="text-body font-medium px-3" style={{ color: 'var(--theme-text-muted)' }}>
              {page} / {history.totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-body font-medium disabled:opacity-40 transition-all"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
              Sau <IconChevronRight size={14} />
            </button>
          </div>
        )}

      </div>
  );
}
