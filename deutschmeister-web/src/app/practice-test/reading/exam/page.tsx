'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExamReadingHistory, useExamReadingStats, useDeleteExamReading } from '@/hooks/useExamReading';
import { ExamReadingHistoryItem, TeilScore } from '@/lib/api/examReading';

// ─── Inline icons ─────────────────────────────────────────────────────────────
function IconBookOpen({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function IconPlus({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconTrash({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
function IconLoader({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

const ACCENT = '#22C55E';
const GRADIENT = 'linear-gradient(135deg, #22C55E, #14B8A6)';

function getScoreColor(s: number) {
  if (s >= 80) return '#22C55E';
  if (s >= 60) return '#F59E0B';
  if (s >= 40) return '#F97316';
  return '#EF4444';
}

function ExamBadge({ examType, cefrLevel }: { examType: string; cefrLevel: string }) {
  const color = examType === 'GOETHE' ? '#3B82F6' : '#8B5CF6';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold"
      style={{ backgroundColor: `${color}18`, color }}>
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
      className="group block rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <ExamBadge examType={item.examType} cefrLevel={item.cefrLevel} />
            <span className="text-[11px] px-2 py-0.5 rounded-lg font-medium"
              style={{
                backgroundColor: isGraded ? 'rgba(34,197,94,.1)' : 'rgba(99,102,241,.1)',
                color: isGraded ? '#22C55E' : '#6366F1',
              }}>
              {isGraded ? 'Đã chấm' : 'Chưa nộp'}
            </span>
          </div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Luyện Đọc Theo Đề
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {item.totalQuestions} câu · {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </p>
          {/* Per-Teil mini bars */}
          {isGraded && teilScores.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {teilScores.map(ts => (
                <span key={ts.teil} className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                  style={{ backgroundColor: `${getScoreColor((ts.correct / ts.total) * 100)}18`, color: getScoreColor((ts.correct / ts.total) * 100) }}>
                  T{ts.teil}: {ts.correct}/{ts.total}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {isGraded && score !== null && (
            <span className="text-[18px] font-extrabold" style={{ color: getScoreColor(score) }}>
              {Math.round(score)}%
            </span>
          )}
          <button onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
            style={{ backgroundColor: 'rgba(239,68,68,.1)', color: '#EF4444' }}>
            <IconTrash size={13} />
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function ExamReadingListPage() {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const params = {
    page,
    limit: 10,
    status: filter === 'all' ? undefined : filter,
  };
  const { data: history, isLoading } = useExamReadingHistory(params);
  const { data: stats } = useExamReadingStats();
  const deleteMut = useDeleteExamReading();

  const filters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'DRAFT', label: 'Chưa nộp' },
    { key: 'GRADED', label: 'Đã chấm' },
  ];

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/practice-test/reading" className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Luyện đọc
        </Link>
        <div className="flex-1" />
        <Link href="/practice-test/reading/exam/new"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(34,197,94,.25)' }}>
          <IconPlus size={14} /> Làm bài mới
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: GRADIENT }}>
          <IconBookOpen size={22} style={{ color: 'white' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Luyện Đọc Theo Đề Chuẩn</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>Goethe & TELC · A1 / A2 / B1 · Đầy đủ tất cả Teile</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Tổng bài', value: stats.total, color: '#6366F1' },
            { label: 'TB điểm', value: stats.graded > 0 ? `${Math.round(stats.avgScore)}%` : '—', color: getScoreColor(stats.avgScore) },
            { label: 'Cao nhất', value: stats.graded > 0 ? `${Math.round(stats.bestScore)}%` : '—', color: '#22C55E' },
          ].map((c, i) => (
            <div key={i} className="rounded-xl p-3 text-center"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="text-[20px] font-extrabold" style={{ color: c.color }}>{c.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={filter === f.key
              ? { background: GRADIENT, color: 'white' }
              : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <IconLoader size={28} style={{ color: ACCENT }} />
        </div>
      ) : !history?.items.length ? (
        <div className="text-center py-12">
          <p className="text-[14px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>Chưa có bài thi nào.</p>
          <Link href="/practice-test/reading/exam/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-[14px] text-white"
            style={{ background: GRADIENT }}>
            <IconPlus size={14} /> Làm bài đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.items.map(item => (
            <HistoryCard
              key={item.id}
              item={item}
              onDelete={() => deleteMut.mutate(item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {history && history.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: history.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className="w-8 h-8 rounded-xl text-[13px] font-bold transition-all"
              style={page === p
                ? { background: GRADIENT, color: 'white' }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
