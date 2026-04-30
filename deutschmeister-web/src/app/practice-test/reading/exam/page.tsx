'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExamReadingHistory, useExamReadingStats, useDeleteExamReading } from '@/hooks/useExamReading';
import { ExamReadingHistoryItem, TeilScore } from '@/lib/api/examReading';
import { PageHeader } from '@/components/ui';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import { IconBookOpen, IconPlus, IconTrash, IconLoader } from '../icons';

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
      className="group block rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <ExamBadge examType={item.examType} cefrLevel={item.cefrLevel} />
            <span className="text-caption px-2 py-0.5 rounded-lg font-medium"
              style={{
                backgroundColor: isGraded ? `${STATUS.success}1A` : `${ACCENT.writing}1A`,
                color: isGraded ? STATUS.success : ACCENT.writing,
              }}>
              {isGraded ? 'Đã chấm' : 'Chưa nộp'}
            </span>
          </div>
          <p className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Luyện Đọc Theo Đề
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {item.totalQuestions} câu · {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </p>
          {isGraded && teilScores.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {teilScores.map(ts => (
                <span key={ts.teil} className="text-caption px-1.5 py-0.5 rounded-md font-medium"
                  style={{ backgroundColor: `${getScoreColor((ts.correct / ts.total) * 100)}1A`, color: getScoreColor((ts.correct / ts.total) * 100) }}>
                  T{ts.teil}: {ts.correct}/{ts.total}
                </span>
              ))}
            </div>
          )}
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

export default function ExamReadingListPage() {
  return <ExamReadingListContent />;
}

function ExamReadingListContent() {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const params = { page, limit: 10, status: filter === 'all' ? undefined : filter };
  const { data: history, isLoading } = useExamReadingHistory(params);
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

      {stats && stats.total > 0 && (
        <div className="flex items-center gap-3 mb-5 overflow-x-auto">
          {[
            { label: 'Tổng bài', value: stats.total,                                           color: ACCENT.writing },
            { label: 'TB điểm',  value: stats.graded > 0 ? `${Math.round(stats.avgScore)}%`  : '—', color: getScoreColor(stats.avgScore) },
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

      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={filter === f.key
              ? { background: GRADIENT.reading, color: 'white' }
              : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <IconLoader size={28} style={{ color: ACCENT.reading }} />
        </div>
      ) : !history?.items.length ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: GRADIENT.reading }}>
            <IconBookOpen size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Chưa có bài thi nào.</p>
          <Link href="/practice-test/reading/exam/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: GRADIENT.reading }}>
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

      {history && history.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: history.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className="w-8 h-8 rounded-xl text-body font-bold transition-all"
              style={page === p
                ? { background: GRADIENT.reading, color: 'white' }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
