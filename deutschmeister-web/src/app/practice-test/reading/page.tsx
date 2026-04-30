'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReadingHistory, useReadingStats, useDeleteReading } from '@/hooks/useReading';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import {
  IconBookOpen, IconDice, IconTrash,
  IconChevronLeft, IconChevronRight,
} from './icons';
import { PageHeader, GridSkeleton } from '@/components/ui';

const TEXT_TYPE_LABELS: Record<string, { de: string; vi: string }> = {
  anzeige:       { de: 'Anzeige',      vi: 'Thông báo' },
  kurznachricht: { de: 'Kurznachricht', vi: 'Tin nhắn' },
  brief:         { de: 'Brief/E-Mail', vi: 'Thư/Email' },
  artikel:       { de: 'Artikel',      vi: 'Bài báo' },
  dialog:        { de: 'Dialog',       vi: 'Hội thoại' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:  { label: 'Chưa làm', color: 'var(--theme-text-muted)', bg: 'var(--theme-bg-secondary)' },
  GRADED: { label: 'Đã chấm',  color: STATUS.success, bg: `${STATUS.success}1A` },
};

const STATUS_BUTTON_STYLES: Record<string, { background: string; shadow: string }> = {
  DRAFT:  { background: `linear-gradient(135deg, #6B7280, #4B5563)`, shadow: `0 4px 12px #6B728030` },
  GRADED: { background: `linear-gradient(135deg, ${STATUS.success}, ${STATUS.success}cc)`, shadow: `0 4px 12px ${STATUS.success}30` },
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
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatsBanner() {
  const { data: stats, isLoading } = useReadingStats();
  if (isLoading || !stats || stats.totalSessions === 0) return null;

  const items = [
    { label: 'Bài đọc', value: stats.totalSessions,                              color: ACCENT.reading },
    { label: 'TB điểm', value: stats.averageScore ? `${stats.averageScore}%` : '—', color: ACCENT.xp },
    { label: 'Cao nhất', value: stats.bestScore    ? `${stats.bestScore}%`    : '—', color: ACCENT.srs },
  ];

  return (
    <div className="flex items-center gap-3 mb-5 overflow-x-auto">
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
          style={{ backgroundColor: `${s.color}1A` }}>
          <span className="text-base font-extrabold" style={{ color: s.color }}>{s.value}</span>
          <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReadingListPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: history, isLoading } = useReadingHistory({
    page, limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const deleteMutation = useDeleteReading();

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  return (
    <div className="py-6">

      <PageHeader
        backHref="/practice-test"
        title="Luyện Đọc"
        subtitle="AI tạo bài đọc tiếng Đức — Luyện kỹ năng đọc hiểu Goethe/TELC"
        accent="reading"
        right={
          <div className="flex items-center gap-2">
            <Link href="/practice-test/reading/exam"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body font-semibold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: `${ACCENT.reading}66`, color: ACCENT.reading, backgroundColor: `${ACCENT.reading}0F` }}>
              Theo đề chuẩn →
            </Link>
            <Link href="/practice-test/reading/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: GRADIENT.reading, boxShadow: `0 4px 12px ${ACCENT.reading}4D` }}>
              <IconDice size={16} /> Bài đọc mới
            </Link>
          </div>
        }
      />

      <StatsBanner />

      {/* Inline delete confirm */}
      {confirmDeleteId && (
        <div className="mb-5 rounded-2xl border-2 p-4 flex items-center justify-between gap-3 flex-wrap"
          role="alert"
          style={{ borderColor: `${STATUS.danger}40`, backgroundColor: `${STATUS.danger}08` }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Xóa bài đọc này?</p>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Không thể hoàn tác.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setConfirmDeleteId(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              Hủy
            </button>
            <button onClick={confirmDelete}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
              style={{ backgroundColor: STATUS.danger }}>
              Xóa
            </button>
          </div>
        </div>
      )}

      {/* ─── Filter ─── */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['', 'A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => {
            const isActive = filterLevel === lvl;
            return (
              <button key={lvl}
                onClick={() => { setFilterLevel(lvl); setPage(1); }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200"
                style={isActive
                  ? { background: GRADIENT.reading, color: 'white', boxShadow: `0 4px 12px ${ACCENT.reading}4D` }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                {lvl || 'TẤT CẢ TRÌNH ĐỘ'}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['', 'DRAFT', 'GRADED'].map(status => {
            const isActive = filterStatus === status;
            const activeStyle = status === ''
              ? { background: GRADIENT.reading, boxShadow: `0 4px 12px ${ACCENT.reading}30` }
              : STATUS_BUTTON_STYLES[status] ?? {};
            return (
              <button key={status}
                onClick={() => { setFilterStatus(status); setPage(1); }}
                className="px-4 py-2 rounded-xl text-body font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5"
                style={isActive
                  ? { ...activeStyle, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                {status === '' ? 'Tất cả trạng thái' : STATUS_CONFIG[status]?.label || status}
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
            style={{ background: GRADIENT.reading }}>
            <IconBookOpen size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Bạn chưa có bài đọc nào</p>
          <Link href="/practice-test/reading/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: GRADIENT.reading }}>
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
                className="flex items-center gap-4 p-4 rounded-card border shadow-card transition-all duration-200 hover:-translate-y-0.5 group"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${ACCENT.reading}14` }}>
                  <IconBookOpen size={18} style={{ color: ACCENT.reading }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                      {item.title || item.topic}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-caption font-bold shrink-0"
                      style={{ backgroundColor: `${ACCENT.reading}1A`, color: ACCENT.reading }}>
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
                    <span>{item.totalQuestions} câu</span>
                    {item.status === 'GRADED' && item.correctCount !== undefined && (
                      <><span>·</span><span>{item.correctCount}/{item.totalQuestions} đúng</span></>
                    )}
                    <span>·</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>

                {item.score !== null && item.score !== undefined && (
                  <div className="text-right shrink-0">
                    <div className="text-h2 font-extrabold" style={{ color: getScoreColor(item.score) }}>
                      {Math.round(item.score)}%
                    </div>
                  </div>
                )}

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
