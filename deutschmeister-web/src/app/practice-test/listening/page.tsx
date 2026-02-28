'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useListeningHistory, useListeningStats, useDeleteListening } from '@/hooks/useListening';
import { ListeningHistoryItem } from '@/lib/api/listening';

function IconHeadphones({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
}
function IconPlus({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconTrash({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}
function IconChevronLeft({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}

const ACCENT = '#EC4899';
const GRADIENT = 'linear-gradient(135deg, #EC4899, #8B5CF6)';

function getScoreColor(s: number) {
  if (s >= 80) return '#22C55E';
  if (s >= 60) return '#F59E0B';
  return '#EF4444';
}

const SCRIPT_TYPE_LABELS: Record<string, string> = {
  dialogue: 'Dialog', monologue: 'Monolog', announcement: 'Ansage',
  interview: 'Interview', radio: 'Radio',
};

const CEFR_COLORS: Record<string, string> = {
  A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6',
};

function HistoryCard({ item, onDelete }: { item: ListeningHistoryItem; onDelete: () => void }) {
  const [hover, setHover] = useState(false);
  const href = item.status === 'GRADED'
    ? `/practice-test/listening/${item.id}/result`
    : `/practice-test/listening/${item.id}`;

  return (
    <div className="relative group rounded-2xl border transition-all hover:-translate-y-0.5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Link href={href} className="block p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full text-white shrink-0"
              style={{ backgroundColor: CEFR_COLORS[item.cefrLevel] || '#6366F1' }}>
              {item.cefrLevel}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              {SCRIPT_TYPE_LABELS[item.scriptType] || item.scriptType}
            </span>
          </div>
          {item.status === 'GRADED' && item.score !== undefined ? (
            <span className="text-[15px] font-extrabold shrink-0" style={{ color: getScoreColor(item.score) }}>
              {Math.round(item.score)}%
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(249,115,22,.1)', color: '#F97316' }}>Chưa nộp</span>
          )}
        </div>
        <p className="text-[13px] font-semibold mb-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>
          {item.title}
        </p>
        {item.status === 'GRADED' && (
          <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
            {item.correctCount}/{item.totalQ} câu đúng
          </p>
        )}
        <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </p>
      </Link>
      {hover && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          style={{ backgroundColor: 'rgba(239,68,68,.1)', color: '#EF4444' }}>
          <IconTrash size={13} />
        </button>
      )}
    </div>
  );
}

export default function ListeningPage() {
  const { data, isLoading, refetch } = useListeningHistory();
  const { data: stats } = useListeningStats();
  const deleteMut = useDeleteListening();

  const handleDelete = async (id: string) => {
    await deleteMut.mutateAsync(id);
    refetch();
  };

  return (
    <div className="py-6">
      {/* ─── Back ─── */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/practice-test" className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Luyện Test
        </Link>
      </div>

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: GRADIENT }}>
            <IconHeadphones size={22} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Luyện Nghe
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              AI tạo bài nghe tiếng Đức — Luyện kỹ năng nghe hiểu Goethe/TELC
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/practice-test/listening/exam"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}0d` }}>
            Theo đề chuẩn →
          </Link>
          <Link href="/practice-test/listening/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(236,72,153,.3)' }}>
            <IconPlus size={16} /> Bài nghe mới
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Tổng bài', value: stats.total },
            { label: 'Điểm TB', value: stats.graded > 0 ? `${Math.round(stats.avgScore)}%` : '—' },
            { label: 'Điểm cao', value: stats.graded > 0 ? `${Math.round(stats.bestScore)}%` : '—' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border p-3 text-center"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <p className="text-[20px] font-extrabold" style={{ color: ACCENT }}>{s.value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16" style={{ color: 'var(--theme-text-muted)' }}>Đang tải...</div>
      ) : !data?.items.length ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: GRADIENT }}>
            <IconHeadphones size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            Chưa có bài nghe nào
          </p>
          <p className="text-[13px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Tạo bài nghe đầu tiên để bắt đầu
          </p>
          <Link href="/practice-test/listening/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white"
            style={{ background: GRADIENT }}>
            <IconPlus size={16} /> Tạo bài nghe
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.items.map(item => (
            <HistoryCard key={item.id} item={item} onDelete={() => handleDelete(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
