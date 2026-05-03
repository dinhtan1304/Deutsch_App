'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExamWritingHistory, useExamWritingStats, useDeleteExamWriting } from '@/hooks/useExamWriting';
import { ExamWritingHistoryItem } from '@/lib/api/examWriting';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── Inline icons ─────────────────────────────────────────────────────────────
function IconPenLine({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L18 5Z" /><path d="M14 2v4a1 1 0 0 0 1 1h4" /><path d="M8 10h8" /><path d="M8 14h8" /><path d="M8 18h5" /></svg>;
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
function IconLoader({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  if (s >= 40) return ACCENT.games;
  return STATUS.danger;
}

function ExamBadge({ examType, cefrLevel }: { examType: string; cefrLevel: string }) {
  const color = examType === 'GOETHE' ? ACCENT.srs : ACCENT.vocab;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-caption font-bold"
      style={{ backgroundColor: `${color}18`, color }}>
      {examType} · {cefrLevel}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    DRAFT:   { label: 'Chưa nộp',  color: ACCENT.writing, bg: `${ACCENT.writing}1A` },
    GRADING: { label: 'Đang chấm', color: STATUS.warning,  bg: `${STATUS.warning}1A` },
    GRADED:  { label: 'Đã chấm',   color: STATUS.success,  bg: `${STATUS.success}1A` },
    ERROR:   { label: 'Lỗi',       color: STATUS.danger,   bg: `${STATUS.danger}1A` },
  };
  const s = (map as unknown as Record<string, typeof map.DRAFT>)[status] ?? map.DRAFT;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-caption font-medium"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  );
}

function HistoryCard({ item, onDelete }: { item: ExamWritingHistoryItem; onDelete: () => void }) {
  const isGraded = item.status === 'GRADED';
  const isGrading = item.status === 'GRADING';
  const href = (isGraded || isGrading)
    ? `/practice-test/writing/exam/${item.id}/result`
    : `/practice-test/writing/exam/${item.id}`;

  return (
    <Link href={href}
      className="group block rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--theme-bg-card)', 
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.1)' 
      }}>
      
      {/* Background Glow on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none" 
        style={{ background: GRADIENT.examWriting }} />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <ExamBadge examType={item.examType} cefrLevel={item.cefrLevel} />
            <StatusBadge status={item.status} />
          </div>
          <p className="text-lg font-bold tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            Luyện Viết Theo Đề Chuẩn
          </p>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>
            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
            {item.gradedAt && (
              <>
                <span className="opacity-30">·</span>
                <span>Chấm lúc {new Date(item.gradedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {isGraded && item.totalScore != null && (
            <div className="text-right">
              <div className="text-3xl font-black tracking-tighter" style={{ color: getScoreColor(item.totalScore) }}>
                {Math.round(item.totalScore)}<span className="text-sm ml-0.5">%</span>
              </div>
            </div>
          )}
          <button onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconTrash size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function ExamWritingListPage() {
  return <ExamWritingListContent />;
}

function ExamWritingListContent() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const { data: history, isLoading } = useExamWritingHistory({
    page,
    limit: 10,
    status: filterStatus === 'all' ? undefined : filterStatus,
    cefrLevel: filterLevel === 'all' ? undefined : filterLevel
  });
  const { data: stats } = useExamWritingStats();
  const deleteMut = useDeleteExamWriting();

  const filtersStatus = [
    { key: 'all', label: 'Tất cả trạng thái' },
    { key: 'DRAFT', label: 'Chưa nộp' },
    { key: 'GRADED', label: 'Đã chấm' },
    { key: 'ERROR', label: 'Lỗi' },
  ];

  const filtersLevel = [
    { key: 'all', label: 'Tất cả trình độ' },
    { key: 'A1', label: 'A1' },
    { key: 'A2', label: 'A2' },
    { key: 'B1', label: 'B1' },
    { key: 'B2', label: 'B2' },
  ];

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/writing"
        title="Luyện Viết Theo Đề Chuẩn"
        subtitle="Goethe & TELC · A1 / A2 / B1 · AI chấm bài"
        accent="writing"
        right={
          <Link href="/practice-test/writing/exam/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENT.examWriting, boxShadow: `0 4px 12px ${ACCENT.examWriting}40` }}>
            <IconPlus size={14} /> Làm bài mới
          </Link>
        }
      />

      {/* Stats Banner */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tổng bài thi', value: stats.total, color: ACCENT.examWriting, icon: <IconPenLine size={24} /> },
            { label: 'TB điểm số', value: stats.graded > 0 ? `${Math.round(stats.avgScore)}%` : '—', color: getScoreColor(stats.avgScore), icon: <IconDice size={24} /> },
            { label: 'Thành tích cao', value: stats.graded > 0 ? `${Math.round(stats.bestScore)}%` : '—', color: STATUS.success, icon: <IconCheck size={24} /> },
          ].map((s, i) => (
            <div key={i} className="relative overflow-hidden rounded-3xl p-5 border shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
              style={{ 
                backgroundColor: `${s.color}0A`, 
                borderColor: 'var(--theme-border)',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
              }}>
              <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12" style={{ color: s.color }}>
                {s.icon}
              </div>
              <div className="relative z-10">
                <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</div>
                <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filtersLevel.map(f => {
            const isActive = filterLevel === f.key;
            return (
              <button key={f.key}
                onClick={() => { setFilterLevel(f.key); setPage(1); }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200"
                style={isActive
                  ? { background: GRADIENT.examWriting, color: 'white', boxShadow: `0 4px 12px ${ACCENT.examWriting}30` }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filtersStatus.map(f => {
            const isActive = filterStatus === f.key;
            return (
              <button key={f.key}
                onClick={() => { setFilterStatus(f.key); setPage(1); }}
                className="px-4 py-2 rounded-xl text-body font-semibold whitespace-nowrap transition-all duration-200"
                style={isActive
                  ? { background: `linear-gradient(135deg, ${ACCENT.examWriting}, ${ACCENT.examWriting}cc)`, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <IconLoader size={28} style={{ color: ACCENT.examWriting }} />
        </div>
      ) : !history?.items.length ? (
        <div className="text-center py-12">
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Chưa có bài thi nào.</p>
          <Link href="/practice-test/writing/exam/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: GRADIENT.examWriting }}>
            <IconPlus size={14} /> Làm bài đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.items.map(item => (
            <HistoryCard key={item.id} item={item} onDelete={() => deleteMut.mutate(item.id)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {history && history.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: history.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className="w-8 h-8 rounded-xl text-body font-bold transition-all"
              style={page === p
                ? { background: GRADIENT.examWriting, color: 'white' }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
