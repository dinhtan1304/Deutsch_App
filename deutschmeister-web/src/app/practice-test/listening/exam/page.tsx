'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExamListeningHistory, useExamListeningStats, useDeleteExamListening } from '@/hooks/useExamListening';
import { ExamListeningHistoryItem, TeilScore } from '@/lib/api/examListening';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

function IconHeadphones({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
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
      style={{ backgroundColor: `${color}1A`, color }}>
      {examType} · {cefrLevel}
    </span>
  );
}

function HistoryCard({ item, onDelete }: { item: ExamListeningHistoryItem; onDelete: () => void }) {
  const [hover, setHover] = useState(false);
  const score = item.score ?? null;
  const isGraded = item.status === 'GRADED';
  const teilScores = (item.teilScores as TeilScore[] | null) ?? [];

  return (
    <div className="relative group rounded-2xl border transition-all hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: hover ? '0 8px 24px rgba(0,0,0,.08)' : '0 2px 8px rgba(0,0,0,.04)'
      }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Link href={isGraded ? `/practice-test/listening/exam/${item.id}/result` : `/practice-test/listening/exam/${item.id}`}
        className="flex p-4 gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: GRADIENT.listening, opacity: 0.9 }}>
          <IconHeadphones size={20} style={{ color: 'white' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <ExamBadge examType={item.examType} cefrLevel={item.cefrLevel} />
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg border uppercase tracking-wider"
              style={{
                backgroundColor: isGraded ? `${STATUS.success}14` : 'var(--theme-bg-secondary)',
                color: isGraded ? STATUS.success : 'var(--theme-text-muted)',
                borderColor: isGraded ? `${STATUS.success}33` : 'var(--theme-border)'
              }}>
              {isGraded ? 'Đã chấm' : 'Chưa nộp'}
            </span>
          </div>

          <p className="text-body font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            Luyện Nghe Theo Đề
          </p>

          <div className="flex items-center gap-3 text-caption mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            <span>{item.totalQuestions} câu</span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-current opacity-30" />
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>

          {isGraded && teilScores.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {teilScores.map(ts => (
                <span key={ts.teil} className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                  style={{ backgroundColor: `${getScoreColor((ts.correct / ts.total) * 100)}12`, color: getScoreColor((ts.correct / ts.total) * 100) }}>
                  T{ts.teil}: {ts.correct}/{ts.total}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-center shrink-0 pl-2">
          {isGraded && score !== null ? (
            <span className="text-title font-black block leading-none" style={{ color: getScoreColor(score) }}>
              {Math.round(score)}%
            </span>
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center opacity-20">
              <span className="text-[10px]">?</span>
            </div>
          )}
        </div>
      </Link>

      <button onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: STATUS.danger, zIndex: 10 }}>
        <IconTrash size={12} />
      </button>
    </div>
  );
}

export default function ExamListeningListPage() {
  return <ExamListeningListContent />;
}

function ExamListeningListContent() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const { data: history, isLoading } = useExamListeningHistory({
    page, limit: 10,
    status: filterStatus === 'all' ? undefined : filterStatus,
    cefrLevel: filterLevel === 'all' ? undefined : filterLevel
  });
  const { data: stats } = useExamListeningStats();
  const deleteMut = useDeleteExamListening();

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
        backHref="/practice-test/listening"
        title="Luyện Nghe Theo Đề Chuẩn"
        subtitle="Goethe & TELC · A1 / A2 / B1 · Đầy đủ tất cả Teile"
        accent="listening"
        right={
          <Link href="/practice-test/listening/exam/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENT.listening, boxShadow: `0 4px 12px ${ACCENT.listening}40` }}>
            <IconPlus size={14} /> Làm bài mới
          </Link>
        }
      />

      {stats && stats.total > 0 && (
        <div className="flex items-center gap-3 mb-5 overflow-x-auto">
          {[
            { label: 'Tổng bài', value: stats.total,                                              color: ACCENT.vocab },
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

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filtersLevel.map(f => {
            const isActive = filterLevel === f.key;
            return (
              <button key={f.key}
                onClick={() => { setFilterLevel(f.key); setPage(1); }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200"
                style={isActive
                  ? { background: GRADIENT.listening, color: 'white', boxShadow: `0 4px 12px ${ACCENT.listening}4D` }
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
                  ? { background: GRADIENT.listening, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <IconLoader size={28} style={{ color: ACCENT.listening }} />
        </div>
      ) : !history?.items.length ? (
        <div className="text-center py-12">
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Chưa có bài nghe theo đề nào.</p>
          <Link href="/practice-test/listening/exam/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: GRADIENT.listening }}>
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
                ? { background: GRADIENT.listening, color: 'white' }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
