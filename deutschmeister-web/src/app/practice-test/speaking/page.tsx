'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFreeSpeakingHistory, useFreeSpeakingStats, useDeleteFreeSpeaking } from '@/hooks/useFreeSpeaking';
import { FreeSpeakingHistoryItem } from '@/lib/api/freeSpeaking';
import { PageHeader, GridSkeleton } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconMic({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
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
function IconChevronLeft({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const TOPIC_LABELS: Record<string, string> = {
  sich_vorstellen: 'Sich vorstellen',
  alltag:          'Alltag & Freizeit',
  wohnen:          'Wohnen',
  arbeit:          'Arbeit & Beruf',
  familie:         'Familie & Freunde',
  reisen:          'Reisen',
  einkaufen:       'Einkaufen',
  gesundheit:      'Gesundheit & Sport',
  meinung:         'Meinungen',
};

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return ACCENT.xp;
  if (s >= 40) return ACCENT.games;
  return STATUS.danger;
}

// ─── Component: HistoryCard ──────────────────────────────────────────────────
function HistoryCard({ item, onDelete }: { item: FreeSpeakingHistoryItem; onDelete: () => void }) {
  const isGraded  = item.status === 'GRADED';
  const isGrading = item.status === 'GRADING';
  const score = item.totalScore ?? null;
  const href = (isGraded || isGrading)
    ? `/practice-test/speaking/${item.id}/result`
    : `/practice-test/speaking/${item.id}`;

  return (
    <Link href={href}
      className="group block rounded-2xl p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden border border-transparent hover:border-indigo-500/20"
      style={{ 
        backgroundColor: 'var(--theme-bg-card)', 
        boxShadow: '0 4px 16px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.05)' 
      }}>
      
      {/* Premium Hover Aura */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none" 
        style={{ background: GRADIENT.speaking }} />

      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ 
            background: isGraded ? GRADIENT.writing : 'var(--theme-bg-secondary)',
            color: isGraded ? 'white' : ACCENT.xp,
            boxShadow: isGraded ? '0 10px 20px rgba(99, 102, 241, 0.3)' : 'none'
          }}>
          <IconMic size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg text-white shadow-sm"
              style={{ backgroundColor: ACCENT.xp }}>
              {item.cefrLevel}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border bg-black/3 dark:bg-white/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              {TOPIC_LABELS[item.topicType] ?? item.topicType.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: isGraded ? `${STATUS.success}15` : isGrading ? `${ACCENT.xp}15` : `${ACCENT.writing}15`,
                color: isGraded ? STATUS.success : isGrading ? ACCENT.xp : ACCENT.writing,
              }}>
              {isGraded ? 'Đã chấm' : isGrading ? 'Đang chấm...' : 'Chưa nộp'}
            </span>
          </div>

          <p className="text-base font-black tracking-tight mb-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>
            {item.prompt}
          </p>
          
          <div className="flex items-center gap-3 text-[11px] font-bold opacity-40 uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>
            <span>Goethe/TELC Format</span>
            <span className="w-1 h-1 rounded-full bg-current" />
            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="flex items-center gap-8 shrink-0">
          {score !== null && (
            <div className="text-right">
              <div className="text-2xl font-black tracking-tight" style={{ color: getScoreColor(score) }}>
                {Math.round(score)}<span className="text-sm ml-0.5">%</span>
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

export default function PremiumSpeakingListPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: history, isLoading } = useFreeSpeakingHistory({
    page, limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const deleteMutation = useDeleteFreeSpeaking();
  const { data: stats } = useFreeSpeakingStats();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
      <PageHeader
        backHref="/practice-test"
        title="Luyện Nói"
        subtitle="AI tạo prompt tiếng Đức, ghi âm và nhận phản hồi chi tiết (v3)"
        accent="speaking"
        right={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link href="/practice-test/speaking/exam"
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black border transition-all hover:bg-black/3 dark:hover:bg-white/5 whitespace-nowrap"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
              Theo đề chuẩn →
            </Link>
            <Link href="/practice-test/speaking/new"
              className="flex items-center gap-2 px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-500/30 whitespace-nowrap"
              style={{ background: GRADIENT.speaking }}>
              <IconPlus size={18} /> Bài nói mới
            </Link>
          </div>
        }
      />

      {/* Stats Dashboard */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tổng bài nói', value: stats.total, color: ACCENT.xp, icon: <IconMic size={20} /> },
            { label: 'Độ chính xác', value: stats.avgScore ? `${stats.avgScore}%` : '—', color: ACCENT.games, icon: <IconDice size={20} /> },
            { label: 'Cao nhất', value: stats.bestScore ? `${stats.bestScore}%` : '—', color: STATUS.success, icon: <IconCheck size={20} /> },
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
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>Hủy bỏ</button>
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
                  ? { background: GRADIENT.speaking, color: 'white', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>{lvl || 'Tất cả trình độ'}</button>
            );
          })}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: '', label: 'Tất cả trạng thái' },
            { id: 'DRAFT', label: 'Chưa nộp' },
            { id: 'GRADING', label: 'Đang chấm' },
            { id: 'GRADED', label: 'Đã chấm' },
          ].map(status => {
            const isActive = filterStatus === status.id;
            return (
              <button key={status.id} onClick={() => { setFilterStatus(status.id); setPage(1); }}
                className="px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 border shadow-sm"
                style={isActive
                  ? { background: 'var(--theme-bg-card)', borderColor: ACCENT.xp, color: ACCENT.xp, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }
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
          <div className="w-24 h-24 rounded-4xl mx-auto flex items-center justify-center mb-8 shadow-2xl" style={{ background: GRADIENT.speaking }}>
            <IconMic size={40} style={{ color: 'white' }} />
          </div>
          <h3 className="text-2xl font-black mb-3" style={{ color: 'var(--theme-text-primary)' }}>Chưa có bài luyện tập nào</h3>
          <p className="text-base opacity-50 mb-10 max-w-xs mx-auto font-medium">Hãy tạo bài nói đầu tiên để AI bắt đầu chấm điểm và nhận xét cho bạn nhé!</p>
          <Link href="/practice-test/speaking/new" className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-base font-black text-white shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            style={{ background: GRADIENT.speaking }}>Bắt đầu ngay</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {history.items.map(item => (
            <HistoryCard key={item.id} item={item} onDelete={() => setConfirmDeleteId(item.id)} />
          ))}
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
