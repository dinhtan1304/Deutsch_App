'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { grammarApi } from '@/lib/api/grammar';
import { adminGrammarApi } from '@/lib/api/admin';
import type { GrammarLesson } from '@/types/grammar';

function IconPlus({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconTrash({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444', C2: '#EC4899',
};
const LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AdminGrammarPage() {
  const [level, setLevel] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading } = useQuery<GrammarLesson[]>({
    queryKey: ['admin-grammar', level],
    queryFn: () => grammarApi.getLessons(level || undefined),
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminGrammarApi.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grammar'] });
      setDeleteId(null);
    },
  });

  // Group by level for display
  const grouped = lessons.reduce<Record<string, GrammarLesson[]>>((acc, l) => {
    (acc[l.level] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', marginBottom: 2 }}>Ngữ pháp</h1>
          <p style={{ fontSize: 12, color: '#64748B' }}>{lessons.length} bài học</p>
        </div>
        <Link href="/admin/grammar/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          <IconPlus size={14} /> Tạo bài học
        </Link>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)}
            style={{
              padding: '0 12px', height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: level === l ? '1px solid #6366F1' : '1px solid #334155',
              backgroundColor: level === l ? 'rgba(99,102,241,.15)' : '#1E293B',
              color: level === l ? '#818CF8' : '#64748B',
            }}>
            {l || 'Tất cả'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <span style={{ color: '#6366F1' }}><IconLoader size={24} /></span>
        </div>
      ) : !lessons.length ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>Chưa có bài học nào.</div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([lvl, items]) => (
          <div key={lvl} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, backgroundColor: `${LEVEL_COLORS[lvl] || '#475569'}20`, color: LEVEL_COLORS[lvl] || '#475569' }}>{lvl}</span>
              <span style={{ fontSize: 12, color: '#475569' }}>{items.length} bài</span>
            </div>
            <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    {['#', 'Tiêu đề', 'Slug', 'Bài tập', 'Thời gian', 'Hiển thị', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.sort((a, b) => a.lessonNumber - b.lessonNumber).map(lesson => (
                    <tr key={lesson.id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>{lesson.lessonNumber}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Link href={`/admin/grammar/${lesson.id}`} style={{ fontWeight: 600, color: '#F1F5F9', textDecoration: 'none', display: 'block' }}>
                          {lesson.titleVi}
                        </Link>
                        <span style={{ fontSize: 11, color: '#475569' }}>{lesson.titleDe}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontFamily: 'monospace', fontSize: 11 }}>{lesson.slug}</td>
                      <td style={{ padding: '10px 14px', color: '#94A3B8', textAlign: 'center' }}>{lesson.exerciseCount ?? 0}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{lesson.estimatedMinutes} phút</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: lesson.isActive !== false ? 'rgba(34,197,94,.1)' : 'rgba(100,116,139,.1)', color: lesson.isActive !== false ? '#22C55E' : '#64748B' }}>
                          {lesson.isActive !== false ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Link href={`/admin/grammar/${lesson.id}`} style={{ fontSize: 11, color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}>Sửa</Link>
                          <button onClick={() => setDeleteId(lesson.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, display: 'flex' }}>
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 24, maxWidth: 340, width: '90%', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Xóa bài học này?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Tất cả bài tập và tiến độ học sẽ bị xóa vĩnh viễn.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
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
