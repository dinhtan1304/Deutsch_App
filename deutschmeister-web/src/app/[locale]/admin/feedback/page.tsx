'use client';

import { useState, useRef, useCallback } from 'react';
import { useAdminFeedback, useUpdateFeedbackStatus, useAdminFeedbackThread, useSendAdminFeedbackMessage } from '@/hooks/useAdmin';
import { AdminFeedbackItem } from '@/lib/api/admin';
import { compressImage } from '@/lib/compressImage';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AdminCard, AdminCardList } from '../_components/MobileCardList';

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'reviewed', label: 'Đã xem' },
  { value: 'resolved', label: 'Đã xử lý' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: 'Gợi ý' },
  { value: 'other', label: 'Khác' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  new:      { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
  reviewed: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  resolved: { bg: 'rgba(34,197,94,0.12)',  color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
};

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  bug:        { bg: 'rgba(239,68,68,0.12)',  color: '#FCA5A5', border: 'rgba(239,68,68,0.25)' },
  suggestion: { bg: 'rgba(99,102,241,0.12)', color: '#A5B4FC', border: 'rgba(99,102,241,0.25)' },
  other:      { bg: 'rgba(100,116,139,0.12)', color: 'var(--theme-text-secondary)', border: 'rgba(100,116,139,0.25)' },
};

const TYPE_LABELS: Record<string, string> = { bug: 'Bug', suggestion: 'Gợi ý', other: 'Khác' };
const STATUS_LABELS: Record<string, string> = { new: 'Mới', reviewed: 'Đã xem', resolved: 'Đã xử lý' };

// ─── Lightbox ──────────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out', padding: 24,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 36, height: 36, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,.15)', border: 'none',
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        &times;
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Feedback screenshot"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          borderRadius: 8, objectFit: 'contain', cursor: 'default',
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        }}
      />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useAdminFeedback({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    page,
  });
  const updateStatus = useUpdateFeedbackStatus();

  const handleStatusChange = (id: string, status: 'new' | 'reviewed' | 'resolved') => {
    updateStatus.mutate({ id, status });
  };
  // Row id currently being mutated (for per-row pending UI).
  const pendingRowId = updateStatus.isPending ? updateStatus.variables?.id : undefined;

  const selectStyle: React.CSSProperties = {
    backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)',
    borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Lightbox */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0 }}>Phản hồi người dùng</h1>
          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: '4px 0 0' }}>
            {data ? `${data.total} phản hồi` : 'Đang tải...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} style={selectStyle}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Mobile card list */}
      {isMobile ? (
        isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--theme-text-muted)' }}>Đang tải...</div>
        ) : isError ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>Không tải được phản hồi.</div>
            <div style={{ color: 'var(--theme-text-muted)', fontSize: 12, marginBottom: 12 }}>{(error as any)?.message ?? 'Lỗi không xác định.'}</div>
            <button onClick={() => refetch()}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
              Thử lại
            </button>
          </div>
        ) : !data?.items.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--theme-text-muted)' }}>Không có phản hồi nào</div>
        ) : (
          <AdminCardList>
            {data.items.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onStatusChange={handleStatusChange}
                onImageClick={setLightboxSrc}
                isPending={pendingRowId === item.id}
              />
            ))}
          </AdminCardList>
        )
      ) : (
      /* Table */
      <div style={{ borderRadius: 12, border: '1px solid var(--theme-border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--theme-bg-card)' }}>
              {['Loại', 'Nội dung', 'Người gửi', 'Trạng thái', 'Ngày gửi'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--theme-text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--theme-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--theme-text-muted)' }}>Đang tải...</td></tr>
            ) : isError ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>Không tải được phản hồi.</div>
                  <div style={{ color: 'var(--theme-text-muted)', fontSize: 12, marginBottom: 12 }}>{(error as any)?.message ?? 'Lỗi không xác định.'}</div>
                  <button onClick={() => refetch()}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                    Thử lại
                  </button>
                </td>
              </tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--theme-text-muted)' }}>Không có phản hồi nào</td></tr>
            ) : data.items.map((item) => (
              <FeedbackRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onStatusChange={handleStatusChange}
                onImageClick={setLightboxSrc}
                isPending={pendingRowId === item.id}
              />
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-card)', color: page <= 1 ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            Trước
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--theme-text-secondary)' }}>
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-card)', color: page >= data.totalPages ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)', fontSize: 12, cursor: page >= data.totalPages ? 'not-allowed' : 'pointer' }}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Row component ──────────────────────────────────────────────────────────

function FeedbackRow({
  item, expanded, onToggle, onStatusChange, onImageClick, isPending,
}: {
  item: AdminFeedbackItem;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: 'new' | 'reviewed' | 'resolved') => void;
  onImageClick: (src: string) => void;
  isPending: boolean;
}) {
  const typeStyle = TYPE_COLORS[item.type] ?? TYPE_COLORS.other!;
  const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.new!;
  const date = new Date(item.createdAt);
  const hasImages = item.imageUrls && item.imageUrls.length > 0;

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer', backgroundColor: expanded ? 'rgba(99,102,241,0.04)' : 'transparent', transition: 'background 0.15s' }}
      >
        {/* Type badge */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--theme-border)' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}>
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
        </td>

        {/* Content preview */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {item.content}
            </div>
            {hasImages && (
              <span style={{
                flexShrink: 0, fontSize: 9, fontWeight: 700,
                padding: '2px 6px', borderRadius: 4,
                backgroundColor: 'rgba(99,102,241,.15)', color: '#818CF8',
              }}>
                {item.imageUrls.length} ảnh
              </span>
            )}
          </div>
        </td>

        {/* User */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontSize: 12 }}>
          {item.user ? (item.user.name || item.user.email) : <span style={{ color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>Ẩn danh</span>}
        </td>

        {/* Status */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--theme-border)' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
        </td>

        {/* Date */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
          {date.toLocaleDateString('vi-VN')} {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={5} style={{ padding: '0 14px 16px', borderBottom: '1px solid var(--theme-border)', backgroundColor: 'rgba(99,102,241,0.03)' }}>
            <div style={{ marginTop: 8 }}>
              <FeedbackDetail item={item} onImageClick={onImageClick} onStatusChange={onStatusChange} isPending={isPending} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Expanded detail (shared by table row + mobile card) ─────────────────────

function FeedbackDetail({
  item, onImageClick, onStatusChange, isPending,
}: {
  item: AdminFeedbackItem;
  onImageClick: (src: string) => void;
  onStatusChange: (id: string, status: 'new' | 'reviewed' | 'resolved') => void;
  isPending: boolean;
}) {
  const hasImages = item.imageUrls && item.imageUrls.length > 0;
  return (
    <div style={{ padding: '16px', borderRadius: 10, background: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)' }}>
      {/* Full content */}
      <p style={{ color: 'var(--theme-text-primary)', fontSize: 13, lineHeight: 1.7, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
        {item.content}
      </p>

      {/* Images */}
      {hasImages && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--theme-text-muted)', marginBottom: 8 }}>
            Ảnh đính kèm ({item.imageUrls.length})
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {item.imageUrls.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Screenshot ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); onImageClick(src); }}
                style={{
                  width: 140, height: 100, objectFit: 'cover',
                  borderRadius: 8, border: '1px solid var(--theme-border)',
                  cursor: 'zoom-in', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366F1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--theme-border)')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 16 }}>
        {item.user && (
          <span>Email: <span style={{ color: 'var(--theme-text-secondary)' }}>{item.user.email}</span></span>
        )}
        {item.pageUrl && (
          <span style={{ wordBreak: 'break-all' }}>Trang: <span style={{ color: '#818CF8' }}>{item.pageUrl}</span></span>
        )}
      </div>

      {/* Status actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['new', 'reviewed', 'resolved'] as const).map(s => {
          const active = item.status === s;
          const sc = STATUS_COLORS[s]!;
          const disabled = active || isPending;
          return (
            <button
              key={s}
              disabled={disabled}
              onClick={(e) => { e.stopPropagation(); if (!disabled) onStatusChange(item.id, s); }}
              style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: disabled ? (active ? 'default' : 'wait') : 'pointer',
                border: `1px solid ${active ? sc.border : 'var(--theme-border)'}`,
                background: active ? sc.bg : 'transparent',
                color: active ? sc.color : 'var(--theme-text-muted)',
                opacity: isPending ? 0.4 : (active ? 1 : 0.7),
                transition: 'all 0.15s',
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      {/* Conversation thread + reply composer */}
      <AdminFeedbackThread feedbackId={item.id} onImageClick={onImageClick} />
    </div>
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function FeedbackCard({
  item, expanded, onToggle, onStatusChange, onImageClick, isPending,
}: {
  item: AdminFeedbackItem;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: 'new' | 'reviewed' | 'resolved') => void;
  onImageClick: (src: string) => void;
  isPending: boolean;
}) {
  const typeStyle = TYPE_COLORS[item.type] ?? TYPE_COLORS.other!;
  const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.new!;
  const date = new Date(item.createdAt);
  const hasImages = item.imageUrls && item.imageUrls.length > 0;

  return (
    <AdminCard>
      <div onClick={onToggle} style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}>
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
          {hasImages && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(99,102,241,.15)', color: '#818CF8' }}>
              {item.imageUrls.length} ảnh
            </span>
          )}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>
            {date.toLocaleDateString('vi-VN')}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--theme-text-primary)', margin: 0, display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.content}
        </p>
        <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', margin: 0 }}>
          {item.user ? (item.user.name || item.user.email) : <span style={{ fontStyle: 'italic' }}>Ẩn danh</span>}
        </p>
      </div>
      {expanded && <FeedbackDetail item={item} onImageClick={onImageClick} onStatusChange={onStatusChange} isPending={isPending} />}
    </AdminCard>
  );
}

// ─── Conversation thread (admin reply) ───────────────────────────────────────

const MAX_IMAGES = 3;
const MAX_SIZE_MB = 2;

function AdminFeedbackThread({ feedbackId, onImageClick }: { feedbackId: string; onImageClick: (src: string) => void }) {
  const { data: thread, isLoading } = useAdminFeedbackThread(feedbackId, true);
  const send = useSendAdminFeedbackMessage(feedbackId);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imgError, setImgError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setImgError('');
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setImgError(`Tối đa ${MAX_IMAGES} ảnh`); return; }
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith('image/')) { setImgError('Tệp không phải ảnh'); continue; }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) { setImgError(`Ảnh tối đa ${MAX_SIZE_MB}MB`); continue; }
      try { const uri = await compressImage(file); setImages(prev => [...prev, uri]); }
      catch { setImgError('Không xử lý được ảnh'); }
    }
  }, [images.length]);

  const canSend = (text.trim().length > 0 || images.length > 0) && !send.isPending;
  const submit = () => {
    if (!canSend) return;
    send.mutate({ content: text.trim(), imageUrls: images }, { onSuccess: () => { setText(''); setImages([]); setImgError(''); } });
  };

  // The original report is message #0; only follow-up messages live in the thread.
  const replies = thread?.messages ?? [];

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--theme-border)', paddingTop: 14 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
        Trao đổi {replies.length > 0 ? `(${replies.length})` : ''}
      </p>

      {isLoading && !thread ? (
        <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Đang tải...</p>
      ) : replies.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', margin: '0 0 12px' }}>Chưa có trao đổi nào. Gửi tin nhắn để hỏi thêm về lỗi.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {replies.map(m => {
            const admin = m.senderRole === 'admin';
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: admin ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: 10, color: 'var(--theme-text-muted)', marginBottom: 2 }}>
                  {admin ? 'Admin' : 'Người dùng'} · {new Date(m.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </span>
                <div style={{ maxWidth: '78%', padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: admin ? 'rgba(99,102,241,0.16)' : 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
                  {m.content}
                  {m.imageUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {m.imageUrls.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={src} alt={`Ảnh ${i + 1}`} onClick={() => onImageClick(src)} style={{ width: 90, height: 64, objectFit: 'cover', borderRadius: 6, cursor: 'zoom-in', border: '1px solid var(--theme-border)' }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Composer */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: 'relative', width: 52, height: 52 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--theme-border)' }} />
              <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
      {imgError && <p style={{ fontSize: 11, color: '#F87171', margin: '0 0 6px' }}>{imgError}</p>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
        <button onClick={() => fileRef.current?.click()} title="Đính kèm ảnh" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-body)', color: 'var(--theme-text-secondary)', cursor: 'pointer', fontSize: 16 }}>＋</button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          rows={1}
          placeholder="Nhập câu trả lời..."
          style={{ flex: 1, resize: 'none', maxHeight: 96, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none' }}
        />
        <button onClick={submit} disabled={!canSend} style={{ flexShrink: 0, padding: '0 16px', height: 36, borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, color: '#fff', background: canSend ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'var(--theme-bg-card)', cursor: canSend ? 'pointer' : 'not-allowed' }}>
          {send.isPending ? 'Đang gửi...' : 'Gửi'}
        </button>
      </div>
    </div>
  );
}
