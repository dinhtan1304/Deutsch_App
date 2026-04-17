'use client';

import { useState } from 'react';
import { useAdminFeedback, useUpdateFeedbackStatus } from '@/hooks/useAdmin';
import { AdminFeedbackItem } from '@/lib/api/admin';

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
  other:      { bg: 'rgba(100,116,139,0.12)', color: '#94A3B8', border: 'rgba(100,116,139,0.25)' },
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
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const { data, isLoading } = useAdminFeedback({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    page,
  });
  const updateStatus = useUpdateFeedbackStatus();

  const handleStatusChange = (id: string, status: 'new' | 'reviewed' | 'resolved') => {
    updateStatus.mutate({ id, status });
  };

  const selectStyle: React.CSSProperties = {
    backgroundColor: '#0F172A', color: '#F1F5F9', border: '1px solid #334155',
    borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Lightbox */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Phản hồi người dùng</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
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

      {/* Table */}
      <div style={{ borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#1E293B' }}>
              {['Loại', 'Nội dung', 'Người gửi', 'Trạng thái', 'Ngày gửi'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#94A3B8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #334155' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Đang tải...</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Không có phản hồi nào</td></tr>
            ) : data.items.map((item) => (
              <FeedbackRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onStatusChange={handleStatusChange}
                onImageClick={setLightboxSrc}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1E293B', color: page <= 1 ? '#475569' : '#F1F5F9', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            Trước
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#94A3B8' }}>
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1E293B', color: page >= data.totalPages ? '#475569' : '#F1F5F9', fontSize: 12, cursor: page >= data.totalPages ? 'not-allowed' : 'pointer' }}
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
  item, expanded, onToggle, onStatusChange, onImageClick,
}: {
  item: AdminFeedbackItem;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: 'new' | 'reviewed' | 'resolved') => void;
  onImageClick: (src: string) => void;
}) {
  const typeStyle = TYPE_COLORS[item.type] ?? TYPE_COLORS.other;
  const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.new;
  const date = new Date(item.createdAt);
  const hasImages = item.imageUrls && item.imageUrls.length > 0;

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer', backgroundColor: expanded ? 'rgba(99,102,241,0.04)' : 'transparent', transition: 'background 0.15s' }}
      >
        {/* Type badge */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}>
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
        </td>

        {/* Content preview */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', color: '#F1F5F9', maxWidth: 400 }}>
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
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: 12 }}>
          {item.user ? (item.user.name || item.user.email) : <span style={{ color: '#475569', fontStyle: 'italic' }}>Ẩn danh</span>}
        </td>

        {/* Status */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
        </td>

        {/* Date */}
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>
          {date.toLocaleDateString('vi-VN')} {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={5} style={{ padding: '0 14px 16px', borderBottom: '1px solid #334155', backgroundColor: 'rgba(99,102,241,0.03)' }}>
            <div style={{ padding: '16px', borderRadius: 10, background: '#0F172A', border: '1px solid #1E293B', marginTop: 8 }}>
              {/* Full content */}
              <p style={{ color: '#F1F5F9', fontSize: 13, lineHeight: 1.7, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
                {item.content}
              </p>

              {/* Images */}
              {hasImages && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>
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
                          borderRadius: 8, border: '1px solid #334155',
                          cursor: 'zoom-in', transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366F1')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                {item.user && (
                  <span>Email: <span style={{ color: '#94A3B8' }}>{item.user.email}</span></span>
                )}
                {item.pageUrl && (
                  <span>Trang: <span style={{ color: '#818CF8' }}>{item.pageUrl}</span></span>
                )}
              </div>

              {/* Status actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                {(['new', 'reviewed', 'resolved'] as const).map(s => {
                  const active = item.status === s;
                  const sc = STATUS_COLORS[s];
                  return (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); if (!active) onStatusChange(item.id, s); }}
                      style={{
                        padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: active ? 'default' : 'pointer',
                        border: `1px solid ${active ? sc.border : '#334155'}`,
                        background: active ? sc.bg : 'transparent',
                        color: active ? sc.color : '#64748B',
                        opacity: active ? 1 : 0.7,
                        transition: 'all 0.15s',
                      }}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
