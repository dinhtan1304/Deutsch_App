'use client';
// UI_REFRESH_FORCE_SYNC: 2026-05-01_v3

import { useState } from 'react';
import Link from 'next/link';
import { useWritingHistory, useWritingStats, useDeleteWriting } from '@/hooks/useWriting';
import { PageHeader, GridSkeleton } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconPenLine({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
}
function IconPlus({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconDice({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><rect width="12" height="12" x="2" y="10" rx="2" ry="2" /><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" /><path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" /></svg>;
}
function IconCheck({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconTrash({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>;
}
function IconChevronLeft({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}

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

const STATUS_CONFIG = {
  DRAFT:     { label: 'Nháp',        color: 'var(--theme-text-muted)', bg: 'rgba(107,114,128,.1)' },
  SUBMITTED: { label: 'Đã nộp',     color: STATUS.info,               bg: 'rgba(59, 130, 246, 0.1)' },
  GRADING:   { label: 'Đang chấm…', color: STATUS.warning,            bg: 'rgba(245, 158, 11, 0.1)' },
  GRADED:    { label: 'Đã chấm',    color: STATUS.success,            bg: 'rgba(34, 197, 94, 0.1)' },
  ERROR:     { label: 'Lỗi',        color: STATUS.danger,             bg: 'rgba(239, 68, 68, 0.1)' },
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

// ─── Main Component: WritingListPage ────────────────────────────────────────
export default function WritingListPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: history, isLoading } = useWritingHistory({
    page, limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const deleteMutation = useDeleteWriting();
  const { data: stats } = useWritingStats();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
      <PageHeader
        backHref="/practice-test"
        title="Luyện Viết"
        subtitle="AI tạo đề bài tiếng Đức — Viết và nhận phản hồi chi tiết"
        accent="writing"
        right={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link href="/practice-test/writing/exam"
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black border transition-all hover:bg-black/3 dark:hover:bg-white/5 whitespace-nowrap"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
              Theo đề chuẩn →
            </Link>
            <Link href="/practice-test/writing/new"
              className="flex items-center gap-2 px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-500/30 whitespace-nowrap"
              style={{ background: GRADIENT.writing }}>
              <IconPlus size={18} /> Bài viết mới
            </Link>
          </div>
        }
      />

      {/* Stats Dashboard */}
      {stats && stats.totalSessions > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tổng bài viết', value: stats.totalSessions, color: ACCENT.writing, icon: <IconPenLine size={20} /> },
            { label: 'TB điểm số', value: stats.averageScore ? `${stats.averageScore}%` : '—', color: ACCENT.xp, icon: <IconDice size={20} /> },
            { label: 'Thành tích cao', value: stats.totalErrors ? `${stats.totalErrors}%` : '—', color: STATUS.success, icon: <IconCheck size={20} /> },
          ].map((s, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl px-5 py-4 border shadow-sm backdrop-blur-xl flex items-center gap-4 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
              }}>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 blur-2xl opacity-20" style={{ backgroundColor: s.color }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
              <div className="relative z-10 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--theme-text-primary)' }}>{s.label}</div>
                <div className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Banner for Deletion */}
      {confirmDeleteId && (
        <div className="mb-10 rounded-[2.5rem] border-2 p-8 flex items-center justify-between gap-8 flex-wrap animate-in fade-in slide-in-from-top-4 duration-500"
          style={{ borderColor: `${STATUS.danger}40`, backgroundColor: `${STATUS.danger}05` }}>
          <div>
            <h4 className="text-xl font-black mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Xác nhận xóa?</h4>
            <p className="text-base opacity-50 font-medium" style={{ color: 'var(--theme-text-primary)' }}>Bạn sẽ không thể khôi phục lại kết quả luyện tập này.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setConfirmDeleteId(null)} className="px-6 py-3 rounded-xl text-xs font-black border transition-all hover:bg-white/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>Hủy</button>
            <button onClick={confirmDelete} className="px-6 py-3 rounded-xl text-xs font-black text-white transition-all hover:brightness-110 shadow-xl shadow-red-500/30"
              style={{ backgroundColor: STATUS.danger }}>Xóa vĩnh viễn</button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-5 mb-10">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {['', 'A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => {
            const isActive = filterLevel === lvl;
            return (
              <button key={lvl} onClick={() => { setFilterLevel(lvl); setPage(1); }}
                className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
                style={isActive
                  ? { background: GRADIENT.writing, color: 'white', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>{lvl || 'Tất cả trình độ'}</button>
            );
          })}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: '', label: 'Tất cả trạng thái' },
            { id: 'DRAFT', label: 'Nháp' },
            { id: 'SUBMITTED', label: 'Đã nộp' },
            { id: 'GRADING', label: 'Đang chấm' },
            { id: 'GRADED', label: 'Đã chấm' },
          ].map(status => {
            const isActive = filterStatus === status.id;
            const color = status.id === '' ? ACCENT.writing : STATUS_CONFIG[status.id as keyof typeof STATUS_CONFIG]?.color || ACCENT.writing;
            return (
              <button key={status.id} onClick={() => { setFilterStatus(status.id); setPage(1); }}
                className="px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 border shadow-sm"
                style={isActive
                  ? { background: 'var(--theme-bg-card)', borderColor: color, color: color, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }
                  : { backgroundColor: 'transparent', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }
                }>{status.label}</button>
            );
          })}
        </div>
      </div>

      {/* List Content */}
      {isLoading ? (
        <GridSkeleton cols={1} count={4} height="h-40" gap="gap-8" />
      ) : !history?.data.length ? (
        <div className="text-center py-28 rounded-[3.5rem] border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-24 h-24 rounded-4xl mx-auto flex items-center justify-center mb-8 shadow-2xl" style={{ background: GRADIENT.writing }}>
            <IconPenLine size={40} style={{ color: 'white' }} />
          </div>
          <h3 className="text-2xl font-black mb-3" style={{ color: 'var(--theme-text-primary)' }}>Chưa có bài viết nào</h3>
          <p className="text-base opacity-50 mb-10 max-w-xs mx-auto font-medium">Bạn chưa thực hiện bài luyện viết nào. Hãy bắt đầu ngay nhé!</p>
          <Link href="/practice-test/writing/new" className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-base font-black text-white shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            style={{ background: GRADIENT.writing }}>Bắt đầu ngay</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {history.data.map(item => {
            const typeInfo = WRITING_TYPE_LABELS[item.writingType] || { de: item.writingType, vi: item.writingType, color: 'var(--theme-text-muted)' };
            const statusCfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.DRAFT;
            const targetHref = item.status === 'GRADED' ? `/practice-test/writing/${item.id}/result` : `/practice-test/writing/${item.id}`;

            return (
              <Link key={item.id} href={targetHref}
                className="group block rounded-4xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl relative overflow-hidden border border-transparent hover:border-indigo-500/20"
                style={{ 
                  backgroundColor: 'var(--theme-bg-card)', 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.05)' 
                }}>
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none" 
                  style={{ background: GRADIENT.writing }} />

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `${ACCENT.writing}15`, border: `1px solid ${ACCENT.writing}33` }}>
                    <IconPenLine size={22} style={{ color: ACCENT.writing }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: ACCENT.writing }}>{item.cefrLevel}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border bg-black/3 dark:bg-white/5"
                        style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>{typeInfo.vi}</span>
                    </div>

                    <p className="text-base font-black tracking-tight mb-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>{item.topic}</p>

                    <div className="flex items-center gap-3 text-[11px] font-bold opacity-40 uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>
                      <span>Loại: {typeInfo.vi}</span>
                      <span className="w-1 h-1 rounded-full bg-current" />
                      {item.status === 'GRADED' && (
                        <>
                          <span className="text-emerald-500">Đã chấm điểm</span>
                          <span className="w-1 h-1 rounded-full bg-current" />
                        </>
                      )}
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 shrink-0">
                    {item.overallScore !== null && (
                      <div className="text-right">
                        <div className="text-2xl font-black tracking-tight" style={{ color: getScoreColor(item.overallScore) }}>
                          {Math.round(item.overallScore)}<span className="text-sm ml-0.5">%</span>
                        </div>
                      </div>
                    )}
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(item.id); }}
                      className="w-12 h-12 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500"
                      style={{ color: 'var(--theme-text-muted)' }}><IconTrash size={20} /></button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {history && history.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-16">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-indigo-500/20"
            style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
            <IconChevronLeft size={18} /> TRƯỚC
          </button>
          <div className="px-8 py-3 rounded-xl bg-black/3 dark:bg-white/5 text-xs font-black tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>
            {page} / {history.totalPages}
          </div>
          <button onClick={() => setPage(p => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-indigo-500/20"
            style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
            SAU <IconChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
