'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExamSpeakingHistory, useExamSpeakingStats, useDeleteExamSpeaking } from '@/hooks/useExamSpeaking';
import { ExamSpeakingHistoryItem } from '@/lib/api/examSpeaking';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

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
  if (s >= 60) return ACCENT.xp;
  if (s >= 40) return ACCENT.games;
  return STATUS.danger;
}

function ExamBadge({ examType, cefrLevel }: { examType: string; cefrLevel: string }) {
  const color = examType === 'GOETHE' ? ACCENT.srs : ACCENT.vocab;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-caption font-bold"
      style={{ backgroundColor: `${color}1F`, color }}>
      {examType} · {cefrLevel}
    </span>
  );
}

function HistoryCard({ item, onDelete }: { item: ExamSpeakingHistoryItem; onDelete: () => void }) {
  const isGraded = item.status === 'GRADED';
  const isGrading = item.status === 'GRADING';
  const score = item.totalScore ?? null;

  return (
    <Link href={(isGraded || isGrading) ? `/practice-test/speaking/exam/${item.id}/result` : `/practice-test/speaking/exam/${item.id}`}
      className="group block rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <ExamBadge examType={item.examType} cefrLevel={item.cefrLevel} />
            <span className="text-caption px-2 py-0.5 rounded-lg font-medium"
              style={{
                backgroundColor: isGraded ? `${STATUS.success}1A` : isGrading ? `${ACCENT.xp}1A` : `${ACCENT.writing}1A`,
                color: isGraded ? STATUS.success : isGrading ? ACCENT.xp : ACCENT.writing,
              }}>
              {isGraded ? 'Đã chấm' : isGrading ? 'Đang chấm...' : 'Chưa nộp'}
            </span>
          </div>
          <p className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Luyện Nói Theo Đề
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isGraded && score !== null && (
            <span className="text-title font-extrabold" style={{ color: getScoreColor(score) }}>
              {Math.round(score)}%
            </span>
          )}
          <button onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
            style={{ backgroundColor: `${STATUS.danger}1A`, color: STATUS.danger }}>
            <IconTrash size={13} />
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function ExamSpeakingListPage() {
  return <ExamSpeakingListContent />;
}

function ExamSpeakingListContent() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const { data: history, isLoading } = useExamSpeakingHistory({
    page,
    limit: 10,
    status: filterStatus === 'all' ? undefined : filterStatus,
    cefrLevel: filterLevel === 'all' ? undefined : filterLevel
  });
  const { data: stats } = useExamSpeakingStats();
  const deleteMut = useDeleteExamSpeaking();

  const filtersStatus = [
    { key: 'all', label: 'Tất cả trạng thái' },
    { key: 'DRAFT', label: 'Chưa nộp' },
    { key: 'GRADED', label: 'Đã chấm' },
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
        backHref="/practice-test/speaking"
        title="Luyện Nói Theo Đề Chuẩn"
        subtitle="Goethe & TELC · A1 / A2 / B1 · Đầy đủ tất cả Teile Sprechen"
        accent="xp"
        right={
          <Link href="/practice-test/speaking/exam/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENT.speaking, boxShadow: `0 4px 12px ${ACCENT.xp}40` }}>
            <IconPlus size={14} /> Làm bài mới
          </Link>
        }
      />

      {/* Stats Banner */}
      {stats && (
        <div className="flex items-center gap-3 mb-5 overflow-x-auto no-scrollbar">
          {[
            { label: 'Tổng bài', value: stats.total, color: ACCENT.vocab },
            { label: 'TB điểm', value: stats.graded > 0 ? `${Math.round(stats.avgScore)}%` : '—', color: getScoreColor(stats.avgScore) },
            { label: 'Cao nhất', value: stats.graded > 0 ? `${Math.round(stats.bestScore)}%` : '—', color: STATUS.success },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
              style={{ backgroundColor: `${s.color}1A` }}>
              <span className="text-base font-extrabold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</span>
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
                  ? { background: GRADIENT.speaking, color: 'white', boxShadow: `0 4px 12px ${ACCENT.xp}4D` }
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
                  ? { background: `linear-gradient(135deg, ${ACCENT.xp}, ${ACCENT.xp}CC)`, color: 'white' }
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
          <IconLoader size={28} style={{ color: ACCENT.xp }} />
        </div>
      ) : !history?.items.length ? (
        <div className="text-center py-12">
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Chưa có bài nói theo đề nào.</p>
          <Link href="/practice-test/speaking/exam/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: GRADIENT.speaking }}>
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
                ? { background: GRADIENT.speaking, color: 'white' }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
