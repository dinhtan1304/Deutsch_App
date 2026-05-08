'use client';

import { useState } from 'react';
import {
  useAdminDictationRequests,
  useApproveDictationRequest,
  useRejectDictationRequest,
} from '@/hooks/useAdmin';
import { AdminDictationRequest } from '@/lib/api/admin';

const STATUS_OPTIONS = [
  { value: 'PENDING',  label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Đã từ chối' },
  { value: '',         label: 'Tất cả' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:  { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24' },
  APPROVED: { bg: 'rgba(34,197,94,0.12)',  color: '#4ADE80' },
  REJECTED: { bg: 'rgba(239,68,68,0.12)',  color: '#FCA5A5' },
};

function formatDate(s: string) {
  return new Date(s).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Approve modal ─────────────────────────────────────────────────────────

function ApproveModal({
  request, onClose, onSuccess,
}: { request: AdminDictationRequest; onClose: () => void; onSuccess: () => void }) {
  const [cefrLevel, setCefrLevel] = useState<'A1' | 'A2' | 'B1'>(
    (request.cefrLevel as 'A1' | 'A2' | 'B1') ?? 'A2',
  );
  const [topic, setTopic] = useState('');
  const [addToLibrary, setAddToLibrary] = useState(false);
  const [error, setError] = useState('');
  const approve = useApproveDictationRequest();

  const submit = async () => {
    setError('');
    try {
      await approve.mutateAsync({
        id: request.id,
        data: { cefrLevel, topic: topic || undefined, addToLibrary },
      });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra. Cookies hết hạn?');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <h3 className="text-lg font-black mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Duyệt yêu cầu
        </h3>
        <p className="text-xs opacity-60 mb-5 break-all" style={{ color: 'var(--theme-text-primary)' }}>
          {request.youtubeUrl}
        </p>

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
          style={{ color: 'var(--theme-text-muted)' }}>Chủ đề (tùy chọn)</label>
        <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="vd: Tin tức, Du lịch, Ẩm thực..."
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium outline-none border mb-4"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }} />

        <label className="flex items-center gap-3 mb-5 cursor-pointer">
          <input type="checkbox" checked={addToLibrary}
            onChange={e => setAddToLibrary(e.target.checked)}
            className="w-4 h-4 rounded" />
          <span className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
            Thêm vào thư viện công khai
          </span>
        </label>

        {error && (
          <div className="text-xs mb-4 px-3 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={approve.isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-black border disabled:opacity-50"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            Hủy
          </button>
          <button onClick={submit} disabled={approve.isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-black text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}>
            {approve.isPending
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang fetch...</>
              : 'Fetch & Duyệt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject modal ──────────────────────────────────────────────────────────

function RejectModal({
  request, onClose, onSuccess,
}: { request: AdminDictationRequest; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState('');
  const reject = useRejectDictationRequest();

  const submit = async () => {
    if (!reason.trim()) return;
    await reject.mutateAsync({ id: request.id, reason: reason.trim() });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <h3 className="text-lg font-black mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Từ chối yêu cầu
        </h3>
        <p className="text-xs opacity-60 mb-4 break-all" style={{ color: 'var(--theme-text-primary)' }}>
          {request.youtubeUrl}
        </p>

        <label className="block text-[11px] font-black uppercase tracking-widest mb-2"
          style={{ color: 'var(--theme-text-muted)' }}>Lý do (gửi cho user)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          rows={4} placeholder="vd: Video không phù hợp với tiêu chí học, không có phụ đề Đức rõ ràng..."
          className="w-full px-4 py-3 rounded-lg text-sm outline-none border mb-5 resize-none"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }} />

        <div className="flex gap-3">
          <button onClick={onClose} disabled={reject.isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-black border disabled:opacity-50"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            Hủy
          </button>
          <button onClick={submit} disabled={reject.isPending || !reason.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-black text-white disabled:opacity-50"
            style={{ backgroundColor: '#DC2626' }}>
            {reject.isPending ? 'Đang gửi...' : 'Từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function AdminDictationRequestsPage() {
  const [status, setStatus] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<AdminDictationRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminDictationRequest | null>(null);

  const { data, isLoading, isError, error, refetch } = useAdminDictationRequests({
    status: status || undefined, page, limit: 20,
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Yêu cầu Dictation
        </h1>
        <p className="text-sm opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
          Duyệt video YouTube user đề xuất khi server không tải được tự động.
        </p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_OPTIONS.map(opt => {
          const active = status === opt.value;
          const colors = opt.value ? STATUS_COLORS[opt.value] : null;
          return (
            <button key={opt.value} onClick={() => { setStatus(opt.value); setPage(1); }}
              className="px-4 py-2 rounded-lg text-xs font-black transition-all"
              style={active
                ? colors
                  ? { backgroundColor: colors.bg, color: colors.color }
                  : { backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)' }
                : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 opacity-50" style={{ color: 'var(--theme-text-primary)' }}>
          Đang tải...
        </div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed"
          style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#FCA5A5' }}>
            Không tải được danh sách yêu cầu.
          </p>
          <p className="text-xs opacity-60 mb-4" style={{ color: 'var(--theme-text-primary)' }}>
            {(error as any)?.message ?? 'Lỗi không xác định.'}
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
            Không có yêu cầu nào.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map(req => {
            const colors = STATUS_COLORS[req.status] ?? { bg: 'transparent', color: 'inherit' };
            return (
              <div key={req.id}
                className="rounded-xl border p-4 flex items-center gap-4 flex-wrap"
                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>

                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${req.youtubeId}/default.jpg`}
                  alt=""
                  className="w-24 h-16 rounded-lg object-cover shrink-0 bg-black/20"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ backgroundColor: colors.bg, color: colors.color }}>
                      {req.status}
                    </span>
                    {req.cefrLevel && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border"
                        style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                        {req.cefrLevel}
                      </span>
                    )}
                    <span className="text-[11px] opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
                      {formatDate(req.createdAt)}
                    </span>
                  </div>
                  <a href={req.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-bold hover:underline break-all"
                    style={{ color: 'var(--theme-text-primary)' }}>
                    {req.youtubeUrl}
                  </a>
                  <div className="text-xs opacity-50 mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {req.user.name ?? req.user.email}
                    {req.video && <span> · ✓ {req.video.title}</span>}
                    {req.rejectionReason && <span> · ✗ {req.rejectionReason}</span>}
                  </div>
                </div>

                {/* Actions */}
                {req.status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setRejectTarget(req)}
                      className="px-4 py-2 rounded-lg text-xs font-black border transition-all hover:bg-red-500/10"
                      style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                      Từ chối
                    </button>
                    <button onClick={() => setApproveTarget(req)}
                      className="px-4 py-2 rounded-lg text-xs font-black text-white transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}>
                      Duyệt
                    </button>
                  </div>
                )}
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

      {approveTarget && (
        <ApproveModal request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onSuccess={() => setApproveTarget(null)} />
      )}
      {rejectTarget && (
        <RejectModal request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSuccess={() => setRejectTarget(null)} />
      )}
    </div>
  );
}
