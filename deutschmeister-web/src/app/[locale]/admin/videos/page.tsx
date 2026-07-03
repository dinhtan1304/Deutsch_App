'use client';

import { useEffect, useState } from 'react';
import {
  useAdminVideos,
  useUpdateAdminVideo,
  useDeleteAdminVideo,
  useRenormalizeAdminVideo,
} from '@/hooks/useAdmin';
import { AdminVideoItem } from '@/lib/api/admin';

const ACTIVE_OPTIONS = [
  { value: '',      label: 'Tất cả' },
  { value: 'true',  label: 'Đang hiện' },
  { value: 'false', label: 'Đang ẩn' },
];

// Ngưỡng đồng bộ với german-detect.util.ts bên API (source of truth)
const GERMAN_OK = 0.25;
const GERMAN_REJECT = 0.15;

const BADGE_COLORS = {
  green: { bg: 'rgba(34,197,94,0.12)',  color: '#4ADE80' },
  amber: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24' },
  red:   { bg: 'rgba(239,68,68,0.12)',  color: '#FCA5A5' },
};

function GermanBadge({ score }: { score: number }) {
  const tone = score >= GERMAN_OK ? 'green' : score >= GERMAN_REJECT ? 'amber' : 'red';
  const label = tone === 'green' ? 'DE' : tone === 'amber' ? 'Nghi ngờ' : 'Không phải DE';
  const c = BADGE_COLORS[tone];
  return (
    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
      style={{ backgroundColor: c.bg, color: c.color }}
      title={`Điểm heuristic tiếng Đức của phụ đề: ${score.toFixed(2)} (≥${GERMAN_OK} = ổn, <${GERMAN_REJECT} = bị chặn khi thêm mới)`}>
      {label} {score.toFixed(2)}
    </span>
  );
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Edit modal ────────────────────────────────────────────────────────────

function EditModal({
  video, onClose,
}: { video: AdminVideoItem; onClose: () => void }) {
  const [title, setTitle] = useState(video.title);
  const [cefrLevel, setCefrLevel] = useState<'A1' | 'A2' | 'B1'>(
    (video.cefrLevel as 'A1' | 'A2' | 'B1') ?? 'A2',
  );
  const [topic, setTopic] = useState(video.topic ?? '');
  const [error, setError] = useState('');
  const update = useUpdateAdminVideo();

  const submit = async () => {
    setError('');
    try {
      await update.mutateAsync({
        id: video.id,
        data: { title: title.trim() || video.title, cefrLevel, topic },
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <h3 className="text-lg font-black mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Sửa video
        </h3>
        <p className="text-xs opacity-60 mb-5 break-all" style={{ color: 'var(--theme-text-primary)' }}>
          {video.youtubeId}
        </p>

        <label className="block text-[11px] font-black uppercase tracking-widest mb-2"
          style={{ color: 'var(--theme-text-muted)' }}>Tiêu đề</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium outline-none border mb-4"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }} />

        <label className="block text-[11px] font-black uppercase tracking-widest mb-2"
          style={{ color: 'var(--theme-text-muted)' }}>Cấp độ CEFR</label>
        <div className="flex gap-2 mb-4">
          {(['A1', 'A2', 'B1'] as const).map(lvl => (
            <button key={lvl} onClick={() => setCefrLevel(lvl)}
              className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
              style={cefrLevel === lvl
                ? { background: 'linear-gradient(135deg, #06B6D4, #0891B2)', color: 'white' }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {lvl}
            </button>
          ))}
        </div>

        <label className="block text-[11px] font-black uppercase tracking-widest mb-2"
          style={{ color: 'var(--theme-text-muted)' }}>Chủ đề (để trống để xóa)</label>
        <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="vd: Tin tức, Du lịch, Ẩm thực..."
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium outline-none border mb-5"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }} />

        {error && (
          <div className="text-xs mb-4 px-3 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={update.isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-black border disabled:opacity-50"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            Hủy
          </button>
          <button onClick={submit} disabled={update.isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-black text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}>
            {update.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm modal (renormalize / delete) ──────────────────────────────────

function ConfirmModal({
  title, description, confirmLabel, danger, isPending, error, onClose, onConfirm,
}: {
  title: string; description: string; confirmLabel: string; danger?: boolean;
  isPending: boolean; error: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <h3 className="text-lg font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          {title}
        </h3>
        <p className="text-sm opacity-70 mb-5" style={{ color: 'var(--theme-text-primary)' }}>
          {description}
        </p>

        {error && (
          <div className="text-xs mb-4 px-3 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-black border disabled:opacity-50"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            Hủy
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-black text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={danger
              ? { backgroundColor: '#DC2626' }
              : { background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}>
            {isPending
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function AdminVideosPage() {
  const [activeFilter, setActiveFilter] = useState('');
  const [cefrLevel, setCefrLevel] = useState('');
  const [source, setSource] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [editTarget, setEditTarget] = useState<AdminVideoItem | null>(null);
  const [renormTarget, setRenormTarget] = useState<AdminVideoItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminVideoItem | null>(null);
  const [modalError, setModalError] = useState('');

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useAdminVideos({
    search: search || undefined,
    cefrLevel: cefrLevel || undefined,
    isActive: activeFilter || undefined,
    transcriptSource: source || undefined,
    page,
    limit: 20,
  });

  const update = useUpdateAdminVideo();
  const renormalize = useRenormalizeAdminVideo();
  const del = useDeleteAdminVideo();

  const toggleActive = (v: AdminVideoItem) =>
    update.mutate({ id: v.id, data: { isActive: !v.isActive } });

  const selectStyle = {
    backgroundColor: 'var(--theme-bg-secondary)',
    borderColor: 'var(--theme-border)',
    color: 'var(--theme-text-primary)',
  } as const;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Thư viện Video
        </h1>
        <p className="text-sm opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
          Quản lý video dùng chung cho Chép chính tả & Shadowing — ẩn/hiện, sửa, tách lại câu, xóa.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {ACTIVE_OPTIONS.map(opt => {
          const active = activeFilter === opt.value;
          return (
            <button key={opt.value} onClick={() => { setActiveFilter(opt.value); setPage(1); }}
              className="px-4 py-2 rounded-lg text-xs font-black transition-all"
              style={active
                ? { backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)' }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {opt.label}
            </button>
          );
        })}

        <select value={cefrLevel} onChange={e => { setCefrLevel(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-xs font-black border outline-none" style={selectStyle}>
          <option value="">Mọi cấp độ</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
        </select>

        <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-xs font-black border outline-none" style={selectStyle}>
          <option value="">Mọi nguồn</option>
          <option value="youtube">Phụ đề YouTube</option>
          <option value="ai">Phụ đề AI</option>
        </select>

        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
          placeholder="Tìm tiêu đề / youtubeId / kênh..."
          className="flex-1 min-w-45 px-4 py-2 rounded-lg text-xs font-medium outline-none border"
          style={selectStyle} />
      </div>

      {data && (
        <p className="text-xs opacity-50 mb-4" style={{ color: 'var(--theme-text-primary)' }}>
          {data.total} video
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 opacity-50" style={{ color: 'var(--theme-text-primary)' }}>
          Đang tải...
        </div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed"
          style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#FCA5A5' }}>
            Không tải được thư viện video.
          </p>
          <p className="text-xs opacity-60 mb-4" style={{ color: 'var(--theme-text-primary)' }}>
            {(error as Error)?.message ?? 'Lỗi không xác định.'}
          </p>
          <button onClick={() => refetch()}
            className="px-4 py-2 rounded-lg text-xs font-black border"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
            Thử lại
          </button>
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed"
          style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-sm opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
            Không có video nào khớp bộ lọc.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map(v => {
            const usage = v._count.sessions + v._count.shadowingSessions;
            return (
              <div key={v.id}
                className="rounded-xl border p-4 flex items-center gap-4 flex-wrap"
                style={{
                  backgroundColor: 'var(--theme-bg-card)',
                  borderColor: 'var(--theme-border)',
                  opacity: v.isActive ? 1 : 0.65,
                }}>

                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`}
                  alt=""
                  className="w-24 h-16 rounded-lg object-cover shrink-0 bg-black/20"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                      style={v.isActive ? BADGE_COLORS.green : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                      {v.isActive ? 'Hiện' : 'Ẩn'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border"
                      style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                      {v.cefrLevel}
                    </span>
                    {v.transcriptSource === 'ai' && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                        style={BADGE_COLORS.amber}>
                        AI
                      </span>
                    )}
                    <GermanBadge score={v.germanScore} />
                    {v.pathological && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                        style={BADGE_COLORS.red}
                        title="Segments trông hỏng (câu quá dài hoặc quá ít câu) — nên Tách lại câu">
                        ⚠ Câu hỏng
                      </span>
                    )}
                  </div>
                  <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-bold hover:underline"
                    style={{ color: 'var(--theme-text-primary)' }}>
                    {v.title}
                  </a>
                  <div className="text-xs opacity-50 mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {v.channelName && <span>{v.channelName} · </span>}
                    {formatDuration(v.durationSec)} · {v.segmentsCount} câu · {usage} phiên luyện
                    {v.topic && <span> · {v.topic}</span>}
                    <span> · {formatDate(v.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <button onClick={() => toggleActive(v)} disabled={update.isPending}
                    className="px-3 py-2 rounded-lg text-xs font-black border transition-all disabled:opacity-50"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                    {v.isActive ? 'Ẩn' : 'Hiện'}
                  </button>
                  <button onClick={() => setEditTarget(v)}
                    className="px-3 py-2 rounded-lg text-xs font-black border transition-all"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                    Sửa
                  </button>
                  <button
                    onClick={() => { setModalError(''); setRenormTarget(v); }}
                    disabled={v.transcriptSource === 'ai'}
                    title={v.transcriptSource === 'ai' ? 'Video phụ đề AI không re-fetch được' : 'Fetch lại phụ đề và tách câu lại'}
                    className="px-3 py-2 rounded-lg text-xs font-black border transition-all disabled:opacity-30"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                    Tách lại câu
                  </button>
                  <button
                    onClick={() => { setModalError(''); setDeleteTarget(v); }}
                    disabled={usage > 0}
                    title={usage > 0 ? 'Đã có phiên luyện tập — chỉ có thể ẩn' : 'Xóa hẳn video khỏi thư viện'}
                    className="px-3 py-2 rounded-lg text-xs font-black border transition-all hover:bg-red-500/10 disabled:opacity-30"
                    style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg text-xs font-black border disabled:opacity-30"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
            ← Trước
          </button>
          <span className="text-xs font-black" style={{ color: 'var(--theme-text-muted)' }}>
            {page} / {data.totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 rounded-lg text-xs font-black border disabled:opacity-30"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
            Sau →
          </button>
        </div>
      )}

      {editTarget && (
        <EditModal video={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {renormTarget && (
        <ConfirmModal
          title="Tách lại câu"
          description={`Fetch lại phụ đề YouTube của "${renormTarget.title}" và tách câu bằng bộ tách mới. Session đang luyện dở trên video này sẽ cần bắt đầu lại.`}
          confirmLabel="Tách lại"
          isPending={renormalize.isPending}
          error={modalError}
          onClose={() => setRenormTarget(null)}
          onConfirm={async () => {
            setModalError('');
            try {
              await renormalize.mutateAsync(renormTarget.id);
              setRenormTarget(null);
            } catch (e: unknown) {
              setModalError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
            }
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Xóa video"
          description={`Xóa hẳn "${deleteTarget.title}" khỏi thư viện? Hành động này không hoàn tác được.`}
          confirmLabel="Xóa"
          danger
          isPending={del.isPending}
          error={modalError}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            setModalError('');
            try {
              await del.mutateAsync(deleteTarget.id);
              setDeleteTarget(null);
            } catch (e: unknown) {
              setModalError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
            }
          }}
        />
      )}
    </div>
  );
}
