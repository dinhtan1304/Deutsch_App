'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExamReadingHistory, useExamReadingStats, useDeleteExamReading } from '@/hooks/useExamReading';
import { ExamReadingHistoryItem, TeilScore } from '@/lib/api/examReading';
import { PageHeader, GridSkeleton } from '@/components/ui';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconBookOpen({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
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
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>;
}
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
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
      style={{ backgroundColor: `${color}1A`, color }}>
      {examType} · {cefrLevel}
    </span>
  );
}

function HistoryCard({ item, onDelete }: { item: ExamReadingHistoryItem; onDelete: () => void }) {
  const score = item.score ?? null;
  const isGraded = item.status === 'GRADED';
  const teilScores = (item.teilScores as TeilScore[] | null) ?? [];

  return (
    <Link href={isGraded ? `/practice-test/reading/exam/${item.id}/result` : `/practice-test/reading/exam/${item.id}`}
      className="group block rounded-2xl p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--theme-bg-card)', 
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 10px rgba(0, 0, 0, 0.08)' 
      }}>
      
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none" 
        style={{ background: GRADIENT.reading }} />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <ExamBadge examType={item.examType} cefrLevel={item.cefrLevel} />
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg"
              style={{
                backgroundColor: isGraded ? `${STATUS.success}1A` : `${ACCENT.writing}1A`,
                color: isGraded ? STATUS.success : ACCENT.writing,
              }}>
              {isGraded ? 'Đã chấm' : 'Chưa nộp'}
            </span>
          </div>
          <p className="text-base font-bold tracking-tight mb-0.5 truncate" style={{ color: 'var(--theme-text-primary)' }}>
            Luyện Đọc Theo Đề Chuẩn
          </p>
          <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="flex items-center gap-1">{item.totalQuestions} câu hỏi</span>
            <span className="opacity-30">·</span>
            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
          
          {isGraded && teilScores.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {teilScores.map(ts => (
                <span key={ts.teil} className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                  style={{ 
                    backgroundColor: `${getScoreColor((ts.correct / ts.total) * 100)}0A`, 
                    color: getScoreColor((ts.correct / ts.total) * 100),
                    border: `1px solid ${getScoreColor((ts.correct / ts.total) * 100)}20`
                  }}>
                  T{ts.teil}: {ts.correct}/{ts.total}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {isGraded && score !== null && (
            <div className="text-right">
              <div className="text-2xl font-black tracking-tighter" style={{ color: getScoreColor(score) }}>
                {Math.round(score)}<span className="text-xs ml-0.5">%</span>
              </div>
            </div>
          )}
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconTrash size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function ExamReadingListPage() {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: history, isLoading } = useExamReadingHistory({ page, limit: 10, status: filter === 'all' ? undefined : filter });
  const { data: stats } = useExamReadingStats();
  const deleteMut = useDeleteExamReading();

  const filters = [
    { key: 'all',    label: 'Tất cả' },
    { key: 'DRAFT',  label: 'Chưa nộp' },
    { key: 'GRADED', label: 'Đã chấm' },
  ];

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/reading"
        title="Luyện Đọc Theo Đề Chuẩn"
        subtitle="Goethe & TELC · A1 / A2 / B1 · Đầy đủ tất cả Teile"
        accent="reading"
        right={
          <Link href="/practice-test/reading/exam/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENT.reading, boxShadow: `0 4px 12px ${ACCENT.reading}40` }}>
            <IconPlus size={14} /> Làm bài mới
          </Link>
        }
      />

      {/* Stats Banner */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tổng bài thi', value: stats.total, color: ACCENT.writing, icon: <IconBookOpen size={24} /> },
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
      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={filter === f.key
              ? { background: GRADIENT.reading, color: 'white', boxShadow: `0 4px 12px ${ACCENT.reading}40` }
              : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <GridSkeleton cols={1} count={3} height="h-24" gap="gap-4" />
      ) : !history?.items.length ? (
        <div className="text-center py-16 rounded-3xl border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: GRADIENT.reading }}>
            <IconBookOpen size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Chưa có bài thi nào.</p>
          <Link href="/practice-test/reading/exam/new" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: GRADIENT.reading }}>Làm bài ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.items.map(item => (
            <HistoryCard key={item.id} item={item} onDelete={() => deleteMut.mutate(item.id)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {history && history.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-body font-medium disabled:opacity-40"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}><IconChevronLeft size={14} /> Trước</button>
          <span className="text-body font-medium px-4" style={{ color: 'var(--theme-text-muted)' }}>{page} / {history.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-body font-medium disabled:opacity-40"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>Sau <IconChevronRight size={14} /></button>
        </div>
      )}
    </div>
  );
}
