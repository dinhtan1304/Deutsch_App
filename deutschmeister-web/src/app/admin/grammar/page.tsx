'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGrammarApi, type AdminGrammarLessonListResponse } from '@/lib/api/admin';

function IconPlus({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconTrash({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444', C2: '#EC4899',
};
const LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AdminGrammarPage() {
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<AdminGrammarLessonListResponse>({
    queryKey: ['admin-grammar', { level, page }],
    queryFn: () => adminGrammarApi.getLessons({ level: level || undefined, page, limit: 30 }),
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminGrammarApi.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grammar'] });
      setDeleteId(null);
    },
  });

  const lessons = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 2 }}>Ngữ pháp</h1>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{data ? `${total} bài học` : '...'}</p>
        </div>
        <Link href="/admin/grammar/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          <IconPlus size={14} /> Tạo bài học
        </Link>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => { setLevel(l); setPage(1); }}
            style={{
              padding: '0 12px', height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: level === l ? '1px solid #6366F1' : '1px solid var(--theme-border)',
              backgroundColor: level === l ? 'rgba(99,102,241,.15)' : 'var(--theme-bg-card)',
              color: level === l ? '#818CF8' : 'var(--theme-text-muted)',
            }}>
            {l || 'Tất cả'}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <span style={{ color: '#6366F1' }}><IconLoader size={24} /></span>
          </div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>Không tải được danh sách bài học.</div>
            <div style={{ color: 'var(--theme-text-muted)', fontSize: 12, marginBottom: 12 }}>{(error as any)?.message ?? 'Lỗi không xác định.'}</div>
            <button onClick={() => refetch()}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
              Thử lại
            </button>
          </div>
        ) : !lessons.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--theme-text-muted)', fontSize: 13 }}>Chưa có bài học nào.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                {['Level', '#', 'Tiêu đề', 'Slug', 'Bài tập', 'Thời gian', 'Hiển thị', ''].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lessons.map(lesson => (
                <tr key={lesson.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, backgroundColor: `${LEVEL_COLORS[lesson.level] || 'var(--theme-text-muted)'}20`, color: LEVEL_COLORS[lesson.level] || 'var(--theme-text-muted)' }}>
                      {lesson.level}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)', fontWeight: 700 }}>{lesson.lessonNumber}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <Link href={`/admin/grammar/${lesson.id}`} style={{ fontWeight: 600, color: 'var(--theme-text-primary)', textDecoration: 'none', display: 'block' }}>
                      {lesson.titleVi}
                    </Link>
                    <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{lesson.titleDe}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)', fontFamily: 'monospace', fontSize: 11 }}>{lesson.slug}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--theme-text-secondary)', textAlign: 'center' }}>{lesson.exerciseCount ?? 0}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>{lesson.estimatedMinutes} phút</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: lesson.isActive !== false ? 'rgba(34,197,94,.1)' : 'rgba(100,116,139,.1)', color: lesson.isActive !== false ? '#22C55E' : 'var(--theme-text-muted)' }}>
                      {lesson.isActive !== false ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Link href={`/admin/grammar/${lesson.id}`} style={{ fontSize: 11, color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}>Sửa</Link>
                      <button onClick={() => setDeleteId(lesson.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-muted)', padding: 4, display: 'flex' }}>
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>
            Trang {page} / {totalPages} {isFetching && <span style={{ color: '#6366F1' }}>· đang tải...</span>}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: page === 1 ? 'var(--theme-border)' : 'var(--theme-text-secondary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
              <IconChevronLeft size={15} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: page === totalPages ? 'var(--theme-border)' : 'var(--theme-text-secondary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
              <IconChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 340, width: '90%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 8 }}>Xóa bài học này?</h3>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 20 }}>Tất cả bài tập và tiến độ học sẽ bị xóa vĩnh viễn.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button onClick={() => deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {deleteMut.isPending && <IconLoader size={14} />} Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
