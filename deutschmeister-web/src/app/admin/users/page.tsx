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

function isPremiumActive(u: AdminUserItem): boolean {
  const sub = u.subscription;
  if (!sub || sub.plan !== 'premium' || sub.status !== 'active') return false;
  if (sub.expiresAt && new Date(sub.expiresAt) <= new Date()) return false;
  return true;
}

function PlanBadge({ user }: { user: AdminUserItem }) {
  const premium = isPremiumActive(user);
  const sub = user.subscription;
  if (premium) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
          background: 'linear-gradient(90deg, rgba(99,102,241,.25), rgba(139,92,246,.2))',
          color: '#A5B4FC', border: '1px solid rgba(99,102,241,.3)',
          whiteSpace: 'nowrap',
        }}>
          ⭐ Premium
        </span>
        {sub?.expiresAt && (
          <span style={{ fontSize: 10, color: '#6366F1', paddingLeft: 2 }}>
            hết {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>
    );
  }
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      backgroundColor: 'rgba(71,85,105,.15)', color: '#64748B',
      border: '1px solid #334155',
    }}>
      Free
    </span>
  );
}

const FILTER_OPTS = [
  { value: '', label: 'Tất cả' },
  { value: 'premium', label: '⭐ Premium' },
  { value: 'admin', label: 'Admin' },
  { value: 'inactive', label: 'Không hoạt động' },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const roleFilter = filter === 'admin' ? 'admin' : undefined;
  const isActiveFilter = filter === 'inactive' ? 'false' : undefined;
  const planFilter = filter === 'premium' ? 'premium' : undefined;

  const { data, isLoading, isFetching } = useAdminUsers({
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

  function handleRoleChange(id: string, role: string) {
    updateUser.mutate({ id, data: { role } });
  }

  function handleDelete(id: string) {
    deleteUser.mutate(id, { onSuccess: () => setDeleteId(null) });
  }

  const totalPages = data?.totalPages ?? 1;
  const premiumCount = data?.items?.filter(isPremiumActive).length ?? 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', marginBottom: 2 }}>Người dùng</h1>
          <p style={{ fontSize: 12, color: '#64748B' }}>
            {data ? (
              <>
                {data.total} người dùng
                {planFilter === 'premium' && premiumCount > 0 && (
                  <span style={{ marginLeft: 8, color: '#818CF8', fontWeight: 600 }}>· {premiumCount} Premium</span>
                )}
              </>
            ) : '...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }}>
            <IconSearch size={14} />
          </span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm tên, email..."
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, height: 36,
              backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8,
              color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
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
                border: filter === opt.value ? '1px solid #6366F1' : '1px solid #334155',
                backgroundColor: filter === opt.value
                  ? (opt.value === 'premium' ? 'rgba(99,102,241,.2)' : 'rgba(99,102,241,.15)')
                  : '#1E293B',
                color: filter === opt.value ? '#818CF8' : '#64748B',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <span style={{ color: '#6366F1' }}><IconLoader size={24} /></span>
          </div>
        ) : !data?.items?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>
            Không tìm thấy người dùng nào.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', backgroundColor: '#172033' }}>
                {['Người dùng', 'Email', 'Loại tài khoản', 'Vai trò', 'Hoạt động', 'Ngày tạo', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => {
                const premium = isPremiumActive(u);
                return (
                  <tr key={u.id} style={{
                    borderTop: '1px solid #334155',
                    backgroundColor: premium ? 'rgba(99,102,241,.04)' : 'transparent',
                    borderLeft: premium ? '3px solid #6366F1' : '3px solid transparent',
                  }}>
                    {/* Name */}
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={`/admin/users/${u.id}`} style={{ color: '#F1F5F9', fontWeight: 600, textDecoration: 'none' }}>
                        {u.name || <span style={{ color: '#475569', fontStyle: 'italic' }}>Chưa đặt tên</span>}
                      </Link>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{u.email}</td>
                    {/* Plan badge */}
                    <td style={{ padding: '10px 14px' }}>
                      <PlanBadge user={u} />
                    </td>
                    {/* Role */}
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={{
                          backgroundColor: u.role === 'admin' ? 'rgba(99,102,241,.15)' : 'transparent',
                          color: u.role === 'admin' ? '#818CF8' : '#64748B',
                          border: '1px solid #334155', borderRadius: 6, padding: '2px 6px',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="user" style={{ backgroundColor: '#1E293B' }}>user</option>
                        <option value="admin" style={{ backgroundColor: '#1E293B' }}>admin</option>
                      </select>
                    </td>
                    {/* Active toggle */}
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        style={{
                          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                          backgroundColor: u.isActive ? '#22C55E' : '#334155',
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
                    <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap', fontSize: 12 }}>
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, display: 'flex' }}
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: '#475569' }}>
            Trang {page} / {totalPages} {isFetching && <span style={{ color: '#6366F1' }}>· đang tải...</span>}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, border: '1px solid #334155', backgroundColor: '#1E293B',
                color: page === 1 ? '#334155' : '#94A3B8', cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <IconChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, border: '1px solid #334155', backgroundColor: '#1E293B',
                color: page === totalPages ? '#334155' : '#94A3B8', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <IconChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 24, maxWidth: 360, width: '90%', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Xóa người dùng?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              Thao tác này không thể hoàn tác. Tất cả dữ liệu của người dùng sẽ bị xóa.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}
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
