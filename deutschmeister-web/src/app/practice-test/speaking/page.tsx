'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFreeSpeakingHistory, useFreeSpeakingStats, useDeleteFreeSpeaking } from '@/hooks/useFreeSpeaking';
import { FreeSpeakingHistoryItem } from '@/lib/api/freeSpeaking';
import { PageHeader } from '@/components/ui';

function IconMic({ size = 22, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
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
function IconLoader({ size = 28, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const ACCENT = '#F59E0B';
const GRADIENT = 'linear-gradient(135deg, #F59E0B, #EF4444)';

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
  if (s >= 80) return '#22C55E';
  if (s >= 60) return '#F59E0B';
  if (s >= 40) return '#F97316';
  return '#EF4444';
}

function HistoryCard({ item, onDelete }: { item: FreeSpeakingHistoryItem; onDelete: () => void }) {
  const isGraded  = item.status === 'GRADED';
  const isGrading = item.status === 'GRADING';
  const score = item.totalScore ?? null;
  const href = (isGraded || isGrading)
    ? `/practice-test/speaking/${item.id}/result`
    : `/practice-test/speaking/${item.id}`;

  return (
    <Link href={href}
      className="group block rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-caption font-bold"
              style={{ backgroundColor: 'rgba(245,158,11,.12)', color: ACCENT }}>
              {item.cefrLevel}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-caption font-medium"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {TOPIC_LABELS[item.topicType] ?? item.topicType}
            </span>
            <span className="text-caption px-2 py-0.5 rounded-lg font-medium"
              style={{
                backgroundColor: isGraded ? 'rgba(34,197,94,.1)' : isGrading ? 'rgba(245,158,11,.1)' : 'rgba(99,102,241,.1)',
                color: isGraded ? '#22C55E' : isGrading ? '#F59E0B' : '#6366F1',
              }}>
              {isGraded ? 'Đã chấm' : isGrading ? 'Đang chấm...' : 'Chưa nộp'}
            </span>
          </div>
          <p className="text-body font-semibold line-clamp-1" style={{ color: 'var(--theme-text-primary)' }}>
            {item.prompt}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isGraded && score !== null && (
            <span className="text-title font-extrabold" style={{ color: getScoreColor(score) }}>
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

export default function FreeSpeakingListPage() {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const params = { page, limit: 10, status: filter === 'all' ? undefined : filter };
  const { data: history, isLoading } = useFreeSpeakingHistory(params);
  const { data: stats } = useFreeSpeakingStats();
  const deleteMut = useDeleteFreeSpeaking();

  const filters = [
    { key: 'all',    label: 'Tất cả' },
    { key: 'DRAFT',  label: 'Chưa nộp' },
    { key: 'GRADED', label: 'Đã chấm' },
  ];

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test"
        title="Luyện Nói"
        subtitle="AI tạo prompt tiếng Đức, ghi âm và nhận phản hồi chi tiết"
        accent="xp"
        right={
          <div className="flex items-center gap-2">
            <Link href="/practice-test/speaking/exam"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body font-semibold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: 'rgba(245,158,11,.06)' }}>
              Theo đề chuẩn →
            </Link>
            <Link href="/practice-test/speaking/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
              <IconPlus size={16} /> Bài nói mới
            </Link>
          </div>
        }
      />

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Tổng bài', value: stats.total, color: ACCENT },
            { label: 'TB điểm',  value: stats.graded > 0 ? `${Math.round(stats.avgScore)}%`  : '—', color: getScoreColor(stats.avgScore) },
            { label: 'Cao nhất', value: stats.graded > 0 ? `${Math.round(stats.bestScore)}%` : '—', color: '#22C55E' },
          ].map((c, i) => (
            <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="text-h2 font-extrabold" style={{ color: c.color }}>{c.value}</div>
              <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={filter === f.key
              ? { background: GRADIENT, color: 'white' }
              : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <IconLoader size={28} style={{ color: ACCENT }} />
        </div>
      ) : !history?.items.length ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: GRADIENT }}>
            <IconMic size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            Chưa có bài nói nào
          </p>
          <p className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Tạo bài nói đầu tiên để bắt đầu luyện tập
          </p>
          <Link href="/practice-test/speaking/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: GRADIENT }}>
            <IconPlus size={16} /> Tạo bài nói
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
