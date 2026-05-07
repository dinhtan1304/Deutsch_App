'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useShadowingHistory,
  useShadowingStats,
  useDeleteShadowing,
  useStartShadowing,
  useStartShadowingFromUrl,
} from '@/hooks/useShadowing';
import { dictationApi } from '@/lib/api/dictation';
import type { ShadowingHistoryItem } from '@/lib/api/shadowing';
import { PageHeader, GridSkeleton } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab,
};

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  return STATUS.danger;
}

// ─── Inline Icons ──────────────────────────────────────────────────────────
function IconMic({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
function IconDice({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
      <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
      <path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" />
    </svg>
  );
}
function IconLink({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconSparkles({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
function IconLibrary({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
function IconTrash({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IconCheck({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}

// ─── HistoryCard ───────────────────────────────────────────────────────────
function HistoryCard({ item, onDelete }: { item: ShadowingHistoryItem; onDelete: () => void }) {
  const isSubmitted = item.status === 'SUBMITTED';
  const score = item.overallScore ?? null;
  const href = isSubmitted
    ? `/practice-test/dictation/shadow/${item.id}/result`
    : `/practice-test/dictation/shadow/${item.id}`;

  return (
    <Link
      href={href}
      className="group block rounded-2xl p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden border border-transparent hover:border-green-500/20"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none"
        style={{ background: GRADIENT.reading }}
      />

      <div className="relative z-10 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{
            backgroundColor: `${ACCENT.reading}15`,
            border: `1px solid ${ACCENT.reading}33`,
          }}
        >
          <IconMic size={20} style={{ color: ACCENT.reading }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg text-white shadow-sm"
              style={{ backgroundColor: CEFR_COLORS[item.difficulty] || ACCENT.vocab }}
            >
              {item.difficulty}
            </span>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: isSubmitted ? `${STATUS.success}15` : `${ACCENT.games}15`,
                color: isSubmitted ? STATUS.success : ACCENT.games,
              }}
            >
              {isSubmitted ? 'Đã hoàn tất' : 'Đang luyện'}
            </span>
            {item.video.topic && (
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                {item.video.topic}
              </span>
            )}
          </div>

          <p
            className="text-base font-black tracking-tight mb-1 truncate"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {item.video.title}
          </p>

          <div
            className="flex items-center gap-3 text-[11px] font-bold opacity-40 uppercase tracking-widest"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            <span>
              {item.completedSegments} / {item.totalSegments} câu
            </span>
            <span className="w-1 h-1 rounded-full bg-current" />
            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="flex items-center gap-8 shrink-0">
          {score !== null && (
            <div className="text-right">
              <div
                className="text-2xl font-black tabular-nums tracking-tight"
                style={{ color: getScoreColor(score) }}
              >
                {Math.round(score)}
                <span className="text-sm ml-0.5">%</span>
              </div>
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
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

// ─── Main component ────────────────────────────────────────────────────────
export default function ShadowingListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [randomLevel, setRandomLevel] = useState('');
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [randomError, setRandomError] = useState('');

  // URL submission state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlLevel, setUrlLevel] = useState('');
  const [urlError, setUrlError] = useState('');

  const { data: history, isLoading } = useShadowingHistory({
    page, limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const { data: stats } = useShadowingStats();
  const deleteMutation = useDeleteShadowing();
  const startMutation = useStartShadowing();
  const startFromUrlMutation = useStartShadowingFromUrl();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  const handleStartFromUrl = async () => {
    if (!youtubeUrl.trim()) { setUrlError('Vui lòng nhập URL YouTube.'); return; }
    if (!/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch|embed|shorts|live|v)\/?)/i.test(youtubeUrl)) {
      setUrlError('URL không hợp lệ. Vui lòng dùng link YouTube.'); return;
    }
    setUrlError('');
    try {
      const session = await startFromUrlMutation.mutateAsync({
        youtubeUrl: youtubeUrl.trim(),
        cefrLevel: urlLevel || undefined,
      });
      router.push(`/practice-test/dictation/shadow/${session.id}`);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : '';
      setUrlError(msg || 'Không thể xử lý video này. Vui lòng thử URL khác.');
    }
  };

  const handleStartRandom = async () => {
    setIsLoadingRandom(true);
    setRandomError('');
    try {
      const video = await dictationApi.getRandom({ cefrLevel: randomLevel || undefined });
      const session = await startMutation.mutateAsync({ videoId: video.id });
      router.push(`/practice-test/dictation/shadow/${session.id}`);
    } catch {
      setRandomError('Không tìm thấy video phù hợp. Thử cấp độ khác!');
    } finally {
      setIsLoadingRandom(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
      <PageHeader
        backHref="/practice-test/dictation"
        title="Luyện Shadowing"
        subtitle="Nghe câu mẫu và nói theo để bắt chước phát âm + ngữ điệu native"
        accent="reading"
        right={
          <div className="flex items-center gap-3">
            <Link
              href="/practice-test/dictation/library?mode=shadowing"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-green-500/30"
              style={{ background: GRADIENT.reading }}
            >
              <IconLibrary size={20} /> Chọn video
            </Link>
          </div>
        }
      />

      {/* URL input — full width */}
      <div
        className="rounded-2xl p-5 border mb-4"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${ACCENT.reading}15`, color: ACCENT.reading }}
          >
            <IconLink size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-black tracking-tight flex items-center gap-2 flex-wrap"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              Nhập URL YouTube
              <span
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${ACCENT.reading}15`, color: ACCENT.reading }}
              >
                <IconSparkles size={10} /> AI fallback
              </span>
            </div>
            <div
              className="text-[11px] opacity-50 font-medium"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              Nếu video không có phụ đề tiếng Đức, AI sẽ tự transcribe (giới hạn 15 phút).
            </div>
          </div>
        </div>
        <input
          type="text"
          value={youtubeUrl}
          onChange={e => { setYoutubeUrl(e.target.value); setUrlError(''); }}
          onKeyDown={e => e.key === 'Enter' && !startFromUrlMutation.isPending && handleStartFromUrl()}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border transition-all mb-3"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: urlError ? STATUS.danger : 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
        {urlError && (
          <p className="text-xs mb-3 font-medium" style={{ color: STATUS.danger }}>
            {urlError}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {['', 'A1', 'A2', 'B1'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setUrlLevel(lvl)}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                style={urlLevel === lvl
                  ? { background: GRADIENT.reading, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
              >
                {lvl || 'Tất cả'}
              </button>
            ))}
          </div>
          <button
            onClick={handleStartFromUrl}
            disabled={startFromUrlMutation.isPending}
            className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 flex items-center gap-2"
            style={{ background: GRADIENT.reading, boxShadow: '0 8px 20px rgba(34,197,94,0.2)' }}
          >
            {startFromUrlMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : 'Bắt đầu →'}
          </button>
        </div>
      </div>

      {/* Quick start: library + random */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div
          className="rounded-2xl p-5 border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ACCENT.reading}15`, color: ACCENT.reading }}
            >
              <IconLibrary size={18} />
            </div>
            <div>
              <div
                className="text-sm font-black tracking-tight"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                Chọn video shadowing
              </div>
              <div
                className="text-[11px] opacity-50 font-medium"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                Mở thư viện và chọn video phù hợp
              </div>
            </div>
          </div>
          <p
            className="text-xs opacity-50 mb-4 font-medium leading-relaxed"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Tất cả video trong thư viện dictation đều có thể luyện shadowing — chỉ cần chọn 1 video bạn thích.
          </p>
          <Link
            href="/practice-test/dictation/library?mode=shadowing"
            className="w-full block text-center py-3 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: GRADIENT.reading, boxShadow: '0 8px 20px rgba(34,197,94,0.2)' }}
          >
            Mở thư viện →
          </Link>
        </div>

        {/* Random */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ACCENT.xp}15`, color: ACCENT.xp }}
            >
              <IconDice size={18} />
            </div>
            <div>
              <div
                className="text-sm font-black tracking-tight"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                Ngẫu nhiên từ thư viện
              </div>
              <div
                className="text-[11px] opacity-50 font-medium"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                Chọn cấp độ rồi thử vận may
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'A1', 'A2', 'B1'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRandomLevel(lvl)}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                style={
                  randomLevel === lvl
                    ? { background: GRADIENT.reading, color: 'white' }
                    : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }
              >
                {lvl || 'Tất cả'}
              </button>
            ))}
          </div>
          {randomError && (
            <p className="text-xs mb-3 font-medium" style={{ color: STATUS.danger }}>
              {randomError}
            </p>
          )}
          <button
            onClick={handleStartRandom}
            disabled={isLoadingRandom}
            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: GRADIENT.reading, boxShadow: '0 8px 20px rgba(34,197,94,0.2)' }}
          >
            {isLoadingRandom ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang tìm video...
              </>
            ) : (
              <>
                <IconDice size={14} /> Làm bài ngẫu nhiên
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Phiên đã luyện', value: stats.total, color: ACCENT.reading, icon: <IconMic size={20} /> },
            { label: 'Điểm trung bình', value: stats.avgScore ? `${Math.round(stats.avgScore)}%` : '—', color: ACCENT.xp, icon: <IconDice size={20} /> },
            { label: 'Điểm cao nhất', value: stats.bestScore ? `${Math.round(stats.bestScore)}%` : '—', color: STATUS.success, icon: <IconCheck size={20} /> },
          ].map((s, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl px-5 py-4 border shadow-sm flex items-center gap-4 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              }}
            >
              <div
                className="absolute -right-4 -bottom-4 w-20 h-20 blur-2xl opacity-20"
                style={{ backgroundColor: s.color }}
              />
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${s.color}15`, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="relative z-10 min-w-0">
                <div
                  className="text-[10px] font-black uppercase tracking-widest opacity-40"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {s.label}
                </div>
                <div
                  className="text-2xl font-black tracking-tight"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDeleteId && (
        <div
          className="mb-10 rounded-[2.5rem] border-2 p-8 flex items-center justify-between gap-8 flex-wrap"
          style={{ borderColor: `${STATUS.danger}40`, backgroundColor: `${STATUS.danger}05` }}
        >
          <div>
            <h4
              className="text-xl font-black mb-1.5"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              Xác nhận xóa?
            </h4>
            <p
              className="text-base opacity-50 font-medium"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-6 py-3 rounded-xl text-xs font-black border transition-all hover:bg-white/5"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
            >
              Hủy
            </button>
            <button
              onClick={confirmDelete}
              className="px-6 py-3 rounded-xl text-xs font-black text-white transition-all hover:brightness-110 shadow-xl shadow-red-500/30"
              style={{ backgroundColor: STATUS.danger }}
            >
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-5 mb-10">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {['', 'A1', 'A2', 'B1'].map((lvl) => {
            const isActive = filterLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => { setFilterLevel(lvl); setPage(1); }}
                className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
                style={isActive
                  ? { background: GRADIENT.reading, color: 'white', boxShadow: '0 10px 20px rgba(34,197,94,0.3)' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
              >
                {lvl || 'Tất cả trình độ'}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: '', label: 'Tất cả trạng thái' },
            { id: 'DRAFT', label: 'Đang luyện' },
            { id: 'SUBMITTED', label: 'Đã hoàn tất' },
          ].map((status) => {
            const isActive = filterStatus === status.id;
            const color = status.id === '' ? ACCENT.reading : status.id === 'SUBMITTED' ? STATUS.success : ACCENT.games;
            return (
              <button
                key={status.id}
                onClick={() => { setFilterStatus(status.id); setPage(1); }}
                className="px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 border shadow-sm"
                style={isActive
                  ? { background: 'var(--theme-bg-card)', borderColor: color, color, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }
                  : { backgroundColor: 'transparent', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <GridSkeleton cols={1} count={4} height="h-44" gap="gap-8" />
      ) : !history?.items.length ? (
        <div
          className="text-center py-28 rounded-[3.5rem] border-2 border-dashed"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div
            className="w-24 h-24 rounded-4xl mx-auto flex items-center justify-center mb-8 shadow-2xl"
            style={{ background: GRADIENT.reading }}
          >
            <IconMic size={40} style={{ color: 'white' }} />
          </div>
          <h3
            className="text-2xl font-black mb-3"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Chưa có phiên shadowing nào
          </h3>
          <p className="text-base opacity-50 mb-10 max-w-xs mx-auto font-medium">
            Chọn 1 video từ thư viện và bắt đầu luyện phát âm theo native ngay nhé!
          </p>
          <Link
            href="/practice-test/dictation/library?mode=shadowing"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-base font-black text-white shadow-2xl shadow-green-500/30 transition-all hover:scale-105 active:scale-95"
            style={{ background: GRADIENT.reading }}
          >
            Mở thư viện
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {history.items.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onDelete={() => setConfirmDeleteId(item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {history && history.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-16">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-green-500/20"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
            }}
          >
            <IconChevronLeft size={18} /> TRƯỚC
          </button>
          <div
            className="px-8 py-3 rounded-xl bg-black/3 dark:bg-white/5 text-xs font-black tracking-widest"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {page} / {history.totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(history.totalPages, p + 1))}
            disabled={page === history.totalPages}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-green-500/20"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
            }}
          >
            SAU <IconChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
