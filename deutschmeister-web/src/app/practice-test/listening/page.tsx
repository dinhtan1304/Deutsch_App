'use client';
// UI_REFRESH_FORCE_SYNC: 2026-05-01_v3

import { useState } from 'react';
import Link from 'next/link';
import { useListeningHistory, useListeningStats, useDeleteListening } from '@/hooks/useListening';
import { ListeningHistoryItem } from '@/lib/api/listening';
import { PageHeader, GridSkeleton } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconHeadphones({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
}
function IconDice({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><rect width="12" height="12" x="2" y="10" rx="2" ry="2" /><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" /><path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" /></svg>;
}
function IconCheck({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconPlus({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconTrash({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  return STATUS.danger;
}

const SCRIPT_TYPE_LABELS: Record<string, string> = {
  dialogue: 'Dialog', monologue: 'Monolog', announcement: 'Ansage',
  interview: 'Interview', radio: 'Radio',
};

const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab, B2: ACCENT.xp, C1: ACCENT.writing,
};

// ─── Component: HistoryCard ──────────────────────────────────────────────────
function HistoryCard({ item, onDelete }: { item: ListeningHistoryItem; onDelete: () => void }) {
  const isGraded = item.status === 'GRADED';
  const href = isGraded
    ? `/practice-test/listening/${item.id}/result`
    : `/practice-test/listening/${item.id}`;

  return (
    <Link href={href}
      className="group block rounded-[2.5rem] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl relative overflow-hidden border border-transparent hover:border-blue-500/20"
      style={{ 
        backgroundColor: 'var(--theme-bg-card)', 
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' 
      }}>
      
      {/* Premium Hover Aura */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none" 
        style={{ background: GRADIENT.listening }} />

      <div className="relative z-10 flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ 
            background: isGraded ? GRADIENT.listening : 'var(--theme-bg-secondary)',
            color: isGraded ? 'white' : ACCENT.listening,
            boxShadow: isGraded ? '0 10px 20px rgba(59, 130, 246, 0.2)' : 'none'
          }}>
          <IconHeadphones size={28} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2.5 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg text-white shadow-sm"
              style={{ backgroundColor: CEFR_COLORS[item.cefrLevel] || ACCENT.vocab }}>
              {item.cefrLevel}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
              style={{ 
                backgroundColor: isGraded ? `${STATUS.success}15` : `${ACCENT.games}15`, 
                color: isGraded ? STATUS.success : ACCENT.games 
              }}>
              {isGraded ? 'Đã chấm' : 'Chưa nộp'}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border bg-black/3 dark:bg-white/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              {SCRIPT_TYPE_LABELS[item.scriptType] || item.scriptType}
            </span>
          </div>

          <p className="text-xl font-black tracking-tight mb-1.5 truncate" style={{ color: 'var(--theme-text-primary)' }}>
            {item.title}
          </p>
          
          <div className="flex items-center gap-3 text-[11px] font-bold opacity-40 uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>
            <span>Audio AI Format</span>
            <span className="w-1 h-1 rounded-full bg-current" />
            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="flex items-center gap-8 shrink-0">
          {isGraded && (
            <div className="text-right">
              <div className="text-4xl font-black tracking-tighter" style={{ color: getScoreColor(item.score || 0) }}>
                {Math.round(item.score || 0)}<span className="text-sm ml-0.5">%</span>
              </div>
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            className="w-12 h-12 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <IconTrash size={20} />
          </button>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component: ListeningListPage ──────────────────────────────────────
export default function ListeningListPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: history, isLoading } = useListeningHistory({
    page, limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const deleteMutation = useDeleteListening();
  const { data: stats } = useListeningStats();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
      <PageHeader
        backHref="/practice-test"
        title="Luyện Nghe"
        subtitle="AI tạo bài nghe tiếng Đức — Luyện kỹ năng nghe hiểu Goethe/TELC"
        accent="listening"
        right={
          <div className="flex items-center gap-3">
            <Link href="/practice-test/listening/exam"
              className="px-6 py-3 rounded-xl text-sm font-black border transition-all hover:bg-black/3 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
              Theo đề chuẩn →
            </Link>
            <Link href="/practice-test/listening/new"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/30"
              style={{ background: GRADIENT.listening }}>
              <IconPlus size={20} /> Bài nghe mới
            </Link>
          </div>
        }
      />

      {/* Stats Dashboard */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
          {[
            { label: 'Tổng bài nghe', value: stats.total, color: ACCENT.listening, icon: <IconHeadphones size={28} /> },
            { label: 'TB điểm số', value: stats.avgScore ? `${stats.avgScore}%` : '—', color: ACCENT.xp, icon: <IconDice size={28} /> },
            { label: 'Thành tích cao', value: stats.bestScore ? `${stats.bestScore}%` : '—', color: STATUS.success, icon: <IconCheck size={28} /> },
          ].map((s, i) => (
            <div key={i} className="relative overflow-hidden rounded-[2.5rem] p-8 border shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5"
              style={{ 
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.04)'
              }}>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 blur-3xl opacity-20" style={{ backgroundColor: s.color }} />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                    {s.icon}
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--theme-text-primary)' }}>{s.label}</div>
                </div>
                <div className="text-4xl font-black tracking-tighter" style={{ color: 'var(--theme-text-primary)' }}>{s.value}</div>
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
            <p className="text-base opacity-50 font-medium" style={{ color: 'var(--theme-text-primary)' }}>Hành động này không thể hoàn tác.</p>
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
          {['', 'A1', 'A2', 'B1', 'B2'].map(lvl => {
            const isActive = filterLevel === lvl;
            return (
              <button key={lvl} onClick={() => { setFilterLevel(lvl); setPage(1); }}
                className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
                style={isActive
                  ? { background: GRADIENT.listening, color: 'white', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>{lvl || 'Tất cả trình độ'}</button>
            );
          })}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: '', label: 'Tất cả trạng thái' },
            { id: 'DRAFT', label: 'Chưa nộp' },
            { id: 'GRADED', label: 'Đã chấm' },
          ].map(status => {
            const isActive = filterStatus === status.id;
            const color = status.id === '' ? ACCENT.listening : status.id === 'GRADED' ? STATUS.success : ACCENT.games;
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
      ) : !history?.items.length ? (
        <div className="text-center py-28 rounded-[3.5rem] border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-24 h-24 rounded-4xl mx-auto flex items-center justify-center mb-8 shadow-2xl" style={{ background: GRADIENT.listening }}>
            <IconHeadphones size={40} style={{ color: 'white' }} />
          </div>
          <h3 className="text-2xl font-black mb-3" style={{ color: 'var(--theme-text-primary)' }}>Chưa có bài nghe nào</h3>
          <p className="text-base opacity-50 mb-10 max-w-xs mx-auto font-medium">Bạn chưa thực hiện bài luyện nghe nào. Hãy bắt đầu ngay nhé!</p>
          <Link href="/practice-test/listening/new" className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-base font-black text-white shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
            style={{ background: GRADIENT.listening }}>Bắt đầu ngay</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {history.items.map((item: ListeningHistoryItem) => (
            <HistoryCard key={item.id} item={item} onDelete={() => setConfirmDeleteId(item.id)} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {history && history.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-16">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-blue-500/20"
            style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
            <IconChevronLeft size={18} /> TRƯỚC
          </button>
          <div className="px-8 py-3 rounded-xl bg-black/3 dark:bg-white/5 text-xs font-black tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>
            {page} / {history.totalPages}
          </div>
          <button onClick={() => setPage(p => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-blue-500/20"
            style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
            SAU <IconChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
