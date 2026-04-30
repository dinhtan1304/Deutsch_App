'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useListeningHistory, useListeningStats, useDeleteListening } from '@/hooks/useListening';
import { ListeningHistoryItem } from '@/lib/api/listening';
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
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab,
};

function HistoryCard({ item, onDelete }: { item: ListeningHistoryItem; onDelete: () => void }) {
  const [hover, setHover] = useState(false);
  const href = item.status === 'GRADED'
    ? `/practice-test/listening/${item.id}/result`
    : `/practice-test/listening/${item.id}`;

  return (
    <div className="relative group rounded-2xl border transition-all hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: hover ? '0 8px 24px rgba(0,0,0,.08)' : '0 2px 8px rgba(0,0,0,.04)'
      }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Link href={href} className="flex p-4 gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: GRADIENT.listening, opacity: 0.9 }}>
          <IconHeadphones size={20} style={{ color: 'white' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg text-white"
              style={{ backgroundColor: CEFR_COLORS[item.cefrLevel] || ACCENT.vocab }}>
              {item.cefrLevel}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg border uppercase tracking-wider"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              {SCRIPT_TYPE_LABELS[item.scriptType] || item.scriptType}
            </span>
          </div>

          <p className="text-body font-bold mb-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>
            {item.title}
          </p>

          <div className="flex items-center gap-3 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
            {item.status === 'GRADED' && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                {item.correctCount}/{item.totalQ} câu đúng
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end justify-center shrink-0 pl-2">
          {item.status === 'GRADED' && item.score !== undefined ? (
            <div className="text-right">
              <span className="text-title font-black block leading-none" style={{ color: getScoreColor(item.score) }}>
                {Math.round(item.score)}%
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${ACCENT.games}1A`, color: ACCENT.games }}>Chưa nộp</span>
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

export default function ListeningPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');

  const { data, isLoading, refetch } = useListeningHistory({
    page,
    limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined
  });

  const { data: stats } = useListeningStats();
  const deleteMut = useDeleteListening();

  const handleDelete = async (id: string) => {
    await deleteMut.mutateAsync(id);
    refetch();
  };

  const filtersStatus = [
    { key: '', label: 'Tất cả trạng thái' },
    { key: 'DRAFT', label: 'Chưa làm' },
    { key: 'GRADED', label: 'Đã chấm' },
  ];

  const filtersLevel = [
    { key: '', label: 'Tất cả trình độ' },
    { key: 'A1', label: 'A1' },
    { key: 'A2', label: 'A2' },
    { key: 'B1', label: 'B1' },
    { key: 'B2', label: 'B2' },
  ];

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test"
        title="Luyện Nghe"
        subtitle="AI tạo bài nghe tiếng Đức — Luyện kỹ năng nghe hiểu Goethe/TELC"
        accent="listening"
        right={
          <div className="flex items-center gap-2">
            <Link href="/practice-test/listening/exam"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body font-semibold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: ACCENT.listening, color: ACCENT.listening, backgroundColor: `${ACCENT.listening}0D` }}>
              Theo đề chuẩn →
            </Link>
            <Link href="/practice-test/listening/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: GRADIENT.listening, boxShadow: `0 4px 12px ${ACCENT.listening}4D` }}>
              <IconPlus size={16} /> Bài nghe mới
            </Link>
          </div>
        }
      />

      {stats && stats.total > 0 && (
        <div className="flex items-center gap-3 mb-5 overflow-x-auto no-scrollbar">
          {[
            { label: 'Tổng bài', value: stats.total, color: ACCENT.listening },
            { label: 'TB điểm', value: stats.graded > 0 ? `${Math.round(stats.avgScore)}%` : '—', color: STATUS.warning },
            { label: 'Cao nhất', value: stats.graded > 0 ? `${Math.round(stats.bestScore)}%` : '—', color: ACCENT.srs },
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
        <div className="text-center py-16" style={{ color: 'var(--theme-text-muted)' }}>Đang tải...</div>
      ) : !data?.items.length ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: GRADIENT.listening }}>
            <IconHeadphones size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            Chưa có bài nghe nào
          </p>
          <p className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Tạo bài nghe đầu tiên để bắt đầu
          </p>
          <Link href="/practice-test/listening/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: GRADIENT.listening }}>
            <IconPlus size={16} /> Tạo bài nghe
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map(item => (
            <HistoryCard key={item.id} item={item} onDelete={() => handleDelete(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
