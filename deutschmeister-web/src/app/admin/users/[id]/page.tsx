'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminUser, useUpdateAdminUser, useDeleteAdminUser } from '@/hooks/useAdmin';

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const STAT_LABELS: Record<string, string> = {
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
  examReading: 'Exam Reading',
  examWriting: 'Exam Writing',
  examListening: 'Exam Listening',
  examSpeaking: 'Exam Speaking',
  freeSpeaking: 'Free Speaking',
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading } = useAdminUser(id);
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Populate fields when data loads
  const displayName = editing ? name : (user?.name ?? '');
  const displayRole = editing ? role : (user?.role ?? 'user');

  function startEdit() {
    setName(user?.name ?? '');
    setRole(user?.role ?? 'user');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    updateUser.mutate({ id, data: { name: name || undefined, role } }, {
      onSuccess: () => setEditing(false),
    });
  }

  function toggleActive() {
    if (!user) return;
    updateUser.mutate({ id, data: { isActive: !user.isActive } });
  }

  function handleDelete() {
    deleteUser.mutate(id, {
      onSuccess: () => router.push('/admin/users'),
    });
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <span style={{ color: '#6366F1' }}><IconLoader size={28} /></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: '#64748B', fontSize: 14 }}>Không tìm thấy người dùng.</p>
        <Link href="/admin/users" style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none' }}>← Quay lại</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Back */}
      <Link href="/admin/users" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
        <IconArrowLeft size={14} /> Danh sách người dùng
      </Link>

      {/* Profile card */}
      <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#fff',
            }}>
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9' }}>{user.name || <span style={{ color: '#475569', fontStyle: 'italic' }}>Chưa đặt tên</span>}</p>
              <p style={{ fontSize: 13, color: '#64748B' }}>{user.email}</p>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {editing ? (
              <>
                <button onClick={cancelEdit} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 12, cursor: 'pointer' }}>Hủy</button>
                <button onClick={saveEdit} disabled={updateUser.isPending} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {updateUser.isPending && <IconLoader size={13} />} Lưu
                </button>
              </>
            ) : (
              <button onClick={startEdit} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 12, cursor: 'pointer' }}>Chỉnh sửa</button>
            )}
          </div>
        </div>

        {/* Edit fields */}
        {editing && (
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Tên hiển thị</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Vai trò</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
        )}

        {/* Status row */}
        {!editing && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              backgroundColor: user.role === 'admin' ? 'rgba(99,102,241,.15)' : 'rgba(100,116,139,.1)',
              color: user.role === 'admin' ? '#818CF8' : '#64748B',
            }}>
              {user.role.toUpperCase()}
            </span>
            <button
              onClick={toggleActive}
              style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', border: 'none',
                backgroundColor: user.isActive ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)',
                color: user.isActive ? '#22C55E' : '#EF4444',
              }}
            >
              {user.isActive ? 'ACTIVE' : 'INACTIVE'}
            </button>
            {(() => {
              const sub = user.subscription;
              const isPremium = sub?.plan === 'premium' && sub?.status === 'active' &&
                (!sub?.expiresAt || new Date(sub.expiresAt) > new Date());
              return isPremium ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                  backgroundColor: 'rgba(99,102,241,.15)', color: '#818CF8',
                }}>
                  ⭐ PREMIUM
                  {sub?.expiresAt && (
                    <span style={{ fontWeight: 400, marginLeft: 4 }}>
                      · hết {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </span>
              ) : (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                  backgroundColor: 'rgba(100,116,139,.1)', color: '#64748B',
                }}>
                  FREE
                </span>
              );
            })()}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Thống kê học tập</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
          <div style={{ backgroundColor: '#0F172A', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#6366F1' }}>{user.stats.totalSessions}</p>
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Tổng phiên</p>
          </div>
          <div style={{ backgroundColor: '#0F172A', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B' }}>
              {user.stats.avgScore > 0 ? `${user.stats.avgScore}%` : '—'}
            </p>
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Điểm TB</p>
          </div>
          {Object.entries(STAT_LABELS).map(([key, label]) => {
            const val = user.stats[key as keyof typeof user.stats] as number;
            if (val === undefined) return null;
            return (
              <div key={key} style={{ backgroundColor: '#0F172A', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#94A3B8' }}>{val}</p>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Vùng nguy hiểm</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>Xóa tài khoản này</p>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Tất cả dữ liệu học tập sẽ bị xóa vĩnh viễn.</p>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Xóa người dùng
          </button>
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 24, maxWidth: 360, width: '90%', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Xóa người dùng?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              Xóa <strong style={{ color: '#F1F5F9' }}>{user.email}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDelete(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleDelete} disabled={deleteUser.isPending} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {deleteUser.isPending && <IconLoader size={14} />} Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
