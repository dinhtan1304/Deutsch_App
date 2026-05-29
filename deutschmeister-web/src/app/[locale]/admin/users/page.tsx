'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser } from '@/hooks/useAdmin';
import { AdminUserItem } from '@/lib/api/admin';

function IconSearch({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconTrash({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const PAID_PLANS = new Set(['premium_lite', 'premium', 'lifetime', 'exam_bundle']);

function isPaidActive(u: AdminUserItem): boolean {
  const sub = u.subscription;
  if (!sub || !PAID_PLANS.has(sub.plan) || sub.status !== 'active') return false;
  if (sub.expiresAt && new Date(sub.expiresAt) <= new Date()) return false;
  return true;
}

function isLifetimeActive(u: AdminUserItem): boolean {
  const sub = u.subscription;
  return !!sub && sub.plan === 'lifetime' && sub.status === 'active';
}

interface PlanStyle { label: string; bg: string; color: string; border: string }
const PLAN_STYLES: Record<string, PlanStyle> = {
  lifetime:     { label: '👑 Lifetime',    bg: 'linear-gradient(90deg, rgba(245,158,11,.25), rgba(234,179,8,.2))', color: '#FCD34D', border: 'rgba(245,158,11,.3)' },
  premium:      { label: '⭐ Premium',     bg: 'linear-gradient(90deg, rgba(99,102,241,.25), rgba(139,92,246,.2))', color: '#A5B4FC', border: 'rgba(99,102,241,.3)' },
  premium_lite: { label: '🌱 Lite',        bg: 'linear-gradient(90deg, rgba(16,185,129,.25), rgba(20,184,166,.2))', color: '#6EE7B7', border: 'rgba(16,185,129,.3)' },
  exam_bundle:  { label: '🎯 Exam Bundle', bg: 'linear-gradient(90deg, rgba(168,85,247,.25), rgba(217,70,239,.2))', color: '#D8B4FE', border: 'rgba(168,85,247,.3)' },
};

function PlanBadge({ user }: { user: AdminUserItem }) {
  const sub = user.subscription;
  if (!isPaidActive(user)) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
        backgroundColor: 'rgba(71,85,105,.15)', color: 'var(--theme-text-muted)',
        border: '1px solid var(--theme-border)',
      }}>
        Free
      </span>
    );
  }
  const style = PLAN_STYLES[sub!.plan] ?? PLAN_STYLES.premium!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
        background: style.bg, color: style.color, border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}>
        {style.label}
      </span>
      {sub?.expiresAt && sub.plan !== 'lifetime' && (
        <span style={{ fontSize: 10, color: style.color, opacity: 0.85, paddingLeft: 2 }}>
          hết {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}
        </span>
      )}
    </div>
  );
}

const FILTER_OPTS = [
  { value: '', label: 'Tất cả' },
  { value: 'free', label: 'Free' },
  { value: 'premium_lite', label: '🌱 Lite' },
  { value: 'premium', label: '⭐ Premium' },
  { value: 'exam_bundle', label: '🎯 Exam Bundle' },
  { value: 'lifetime', label: '👑 Lifetime' },
  { value: 'admin', label: 'Admin' },
  { value: 'inactive', label: 'Không hoạt động' },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [roleChange, setRoleChange] = useState<{ userId: string; userLabel: string; from: string; to: string } | null>(null);

  const roleFilter = filter === 'admin' ? 'admin' : undefined;
  const isActiveFilter = filter === 'inactive' ? 'false' : undefined;
  const planFilter = ['free', 'premium_lite', 'premium', 'lifetime', 'exam_bundle'].includes(filter) ? filter : undefined;

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminUsers({
    search: search || undefined,
    role: roleFilter,
    isActive: isActiveFilter,
    plan: planFilter,
    page,
    limit: 20,
  });

  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  function handleToggleActive(id: string, current: boolean) {
    updateUser.mutate({ id, data: { isActive: !current } });
  }

  function requestRoleChange(user: AdminUserItem, newRole: string) {
    if (newRole === user.role) return;
    setRoleChange({
      userId: user.id,
      userLabel: user.name || user.email,
      from: user.role,
      to: newRole,
    });
  }

  function confirmRoleChange() {
    if (!roleChange) return;
    updateUser.mutate(
      { id: roleChange.userId, data: { role: roleChange.to } },
      { onSettled: () => setRoleChange(null) },
    );
  }

  function handleDelete(id: string) {
    deleteUser.mutate(id, { onSuccess: () => setDeleteId(null) });
  }

  const totalPages = data?.totalPages ?? 1;
  const paidCount = data?.items?.filter(isPaidActive).length ?? 0;
  const lifetimeCount = data?.items?.filter(isLifetimeActive).length ?? 0;
  const filterStyle = planFilter ? PLAN_STYLES[planFilter] : undefined;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 2 }}>Người dùng</h1>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>
            {data ? (
              <>
                {data.total} người dùng
                {planFilter && paidCount > 0 && filterStyle && (
                  <span style={{ marginLeft: 8, color: filterStyle.color, fontWeight: 600 }}>· {paidCount} {filterStyle.label.replace(/^[^\s]+\s/, '')}</span>
                )}
                {planFilter === 'lifetime' && lifetimeCount > 0 && lifetimeCount !== paidCount && (
                  <span style={{ marginLeft: 8, color: '#FCD34D', fontWeight: 600 }}>· {lifetimeCount} Lifetime</span>
                )}
              </>
            ) : '...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-text-muted)' }}>
            <IconSearch size={14} />
          </span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm tên, email..."
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, height: 36,
              backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8,
              color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setPage(1); }}
              style={{
                padding: '0 14px', height: 36, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: filter === opt.value ? '1px solid #6366F1' : '1px solid var(--theme-border)',
                backgroundColor: filter === opt.value
                  ? (opt.value === 'premium' ? 'rgba(99,102,241,.2)' : 'rgba(99,102,241,.15)')
                  : 'var(--theme-bg-card)',
                color: filter === opt.value ? '#818CF8' : 'var(--theme-text-muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <span style={{ color: '#6366F1' }}><IconLoader size={24} /></span>
          </div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>Không tải được danh sách người dùng.</div>
            <div style={{ color: 'var(--theme-text-muted)', fontSize: 12, marginBottom: 12 }}>{(error as any)?.message ?? 'Lỗi không xác định.'}</div>
            <button onClick={() => refetch()}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
              Thử lại
            </button>
          </div>
        ) : !data?.items?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--theme-text-muted)', fontSize: 13 }}>
            Không tìm thấy người dùng nào.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                {['Người dùng', 'Email', 'Loại tài khoản', 'Vai trò', 'Hoạt động', 'Ngày tạo', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => {
                const paid = isPaidActive(u);
                const planStyle = paid && u.subscription ? PLAN_STYLES[u.subscription.plan] : undefined;
                return (
                  <tr key={u.id} style={{
                    borderTop: '1px solid var(--theme-border)',
                    backgroundColor: planStyle ? `${planStyle.color}0F` : 'transparent',
                    borderLeft: planStyle ? `3px solid ${planStyle.color}` : '3px solid transparent',
                  }}>
                    {/* Name */}
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={`/admin/users/${u.id}`} style={{ color: 'var(--theme-text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                        {u.name || <span style={{ color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>Chưa đặt tên</span>}
                      </Link>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '10px 14px', color: 'var(--theme-text-secondary)' }}>{u.email}</td>
                    {/* Plan badge */}
                    <td style={{ padding: '10px 14px' }}>
                      <PlanBadge user={u} />
                    </td>
                    {/* Role */}
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        value={u.role}
                        onChange={e => requestRoleChange(u, e.target.value)}
                        style={{
                          backgroundColor: u.role === 'admin' ? 'rgba(99,102,241,.15)' : 'transparent',
                          color: u.role === 'admin' ? '#818CF8' : 'var(--theme-text-muted)',
                          border: '1px solid var(--theme-border)', borderRadius: 6, padding: '2px 6px',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="user" style={{ backgroundColor: 'var(--theme-bg-card)' }}>user</option>
                        <option value="admin" style={{ backgroundColor: 'var(--theme-bg-card)' }}>admin</option>
                      </select>
                    </td>
                    {/* Active toggle */}
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        style={{
                          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                          backgroundColor: u.isActive ? '#22C55E' : 'var(--theme-border)',
                          position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: 2, left: u.isActive ? 18 : 2,
                          width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff',
                          transition: 'left 0.2s',
                        }} />
                      </button>
                    </td>
                    {/* Date */}
                    <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Link href={`/admin/users/${u.id}`}
                          style={{ fontSize: 11, color: '#6366F1', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          Chi tiết
                        </Link>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-muted)', padding: 4, display: 'flex' }}
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>
            Trang {page} / {totalPages} {isFetching && <span style={{ color: '#6366F1' }}>· đang tải...</span>}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-card)',
                color: page === 1 ? 'var(--theme-border)' : 'var(--theme-text-secondary)', cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <IconChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-card)',
                color: page === totalPages ? 'var(--theme-border)' : 'var(--theme-text-secondary)', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <IconChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Role change confirm modal */}
      {roleChange && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 8 }}>
              {roleChange.to === 'admin' ? 'Cấp quyền admin?' : 'Thu hồi quyền admin?'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Đổi vai trò của <strong style={{ color: 'var(--theme-text-primary)' }}>{roleChange.userLabel}</strong> từ{' '}
              <span style={{ color: 'var(--theme-text-secondary)' }}>{roleChange.from}</span> →{' '}
              <span style={{ color: roleChange.to === 'admin' ? '#818CF8' : 'var(--theme-text-secondary)', fontWeight: 600 }}>{roleChange.to}</span>.
              {roleChange.to === 'admin' && ' Người dùng sẽ có toàn quyền quản trị.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRoleChange(null)}
                disabled={updateUser.isPending}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                onClick={confirmRoleChange}
                disabled={updateUser.isPending}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: roleChange.to === 'admin' ? '#6366F1' : 'var(--theme-text-muted)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {updateUser.isPending && <IconLoader size={14} />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 360, width: '90%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 8 }}>Xóa người dùng?</h3>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 20 }}>
              Thao tác này không thể hoàn tác. Tất cả dữ liệu của người dùng sẽ bị xóa.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleteUser.isPending}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {deleteUser.isPending && <IconLoader size={14} />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
