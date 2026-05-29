'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGrammarApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/client';
import type { GrammarLessonDetail } from '@/types/grammar';

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const inputStyle = {
  width: '100%', padding: '8px 10px', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)',
  borderRadius: 8, color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
};
const labelStyle = { fontSize: 11, color: 'var(--theme-text-muted)', display: 'block', marginBottom: 4 } as const;

export default function AdminGrammarEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery<GrammarLessonDetail>({
    queryKey: ['admin-grammar-detail', id],
    queryFn: () => adminGrammarApi.getLessonById<GrammarLessonDetail>(id),
    enabled: !!id,
  });

  const [slug, setSlug] = useState('');
  const [level, setLevel] = useState('A1');
  const [lessonNumber, setLessonNumber] = useState(1);
  const [titleDe, setTitleDe] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [objectivesJson, setObjectivesJson] = useState('{}');
  const [theoryJson, setTheoryJson] = useState('{}');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (lesson) {
      setSlug(lesson.slug);
      setLevel(lesson.level);
      setLessonNumber(lesson.lessonNumber);
      setTitleDe(lesson.titleDe);
      setTitleEn(lesson.titleEn);
      setTitleVi(lesson.titleVi);
      setEstimatedMinutes(lesson.estimatedMinutes);
      setIsActive(lesson.isActive ?? true);
      setObjectivesJson(JSON.stringify(lesson.objectives, null, 2));
      setTheoryJson(JSON.stringify(lesson.theoryContent, null, 2));
    }
  }, [lesson]);

  const saveMut = useMutation({
    mutationFn: () => {
      let objectives: any, theoryContent: any;
      try { objectives = JSON.parse(objectivesJson); } catch { throw new Error('objectives JSON không hợp lệ'); }
      try { theoryContent = JSON.parse(theoryJson); } catch { throw new Error('theoryContent JSON không hợp lệ'); }
      return adminGrammarApi.updateLesson(id, { slug, level, lessonNumber, titleDe, titleEn, titleVi, objectives, theoryContent, estimatedMinutes, order, isActive });
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['admin-grammar'] });
      queryClient.invalidateQueries({ queryKey: ['admin-grammar-detail', id] });
    },
    onError: (e) => setError(getApiErrorMessage(e, 'Lỗi khi lưu.')),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminGrammarApi.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grammar'] });
      router.push('/admin/grammar');
    },
  });

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><span style={{ color: '#6366F1' }}><IconLoader size={28} /></span></div>;
  }
  if (!lesson) {
    return <div style={{ textAlign: 'center', padding: '60px 0' }}><p style={{ color: 'var(--theme-text-muted)', fontSize: 14 }}>Không tìm thấy bài học.</p><Link href="/admin/grammar" style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none' }}>← Quay lại</Link></div>;
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/admin/grammar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
        <IconArrowLeft size={14} /> Danh sách bài học
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)' }}>
          Sửa: <span style={{ color: '#818CF8' }}>[{lesson.level}] {lesson.titleVi}</span>
        </h1>
        <span style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginLeft: 'auto' }}>
          {lesson.exerciseCount ?? 0} bài tập
        </span>
      </div>

      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', padding: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Slug</label><input value={slug} onChange={e => { setSlug(e.target.value); setSaved(false); }} style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Trình độ</label>
            <select value={level} onChange={e => { setLevel(e.target.value); setSaved(false); }} style={inputStyle}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Số bài</label><input type="number" min={1} value={lessonNumber} onChange={e => { setLessonNumber(Number(e.target.value)); setSaved(false); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>Thứ tự</label><input type="number" min={0} value={order} onChange={e => { setOrder(Number(e.target.value)); setSaved(false); }} style={inputStyle} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Tiêu đề Tiếng Việt</label><input value={titleVi} onChange={e => { setTitleVi(e.target.value); setSaved(false); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>Thời gian (phút)</label><input type="number" min={5} value={estimatedMinutes} onChange={e => { setEstimatedMinutes(Number(e.target.value)); setSaved(false); }} style={inputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Tiêu đề Tiếng Đức</label><input value={titleDe} onChange={e => { setTitleDe(e.target.value); setSaved(false); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>Tiêu đề Tiếng Anh</label><input value={titleEn} onChange={e => { setTitleEn(e.target.value); setSaved(false); }} style={inputStyle} /></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Hiển thị</label>
          <button onClick={() => { setIsActive(v => !v); setSaved(false); }}
            style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: isActive ? '#22C55E' : 'var(--theme-border)', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 2, left: isActive ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>

        <div>
          <label style={labelStyle}>Mục tiêu (JSON)</label>
          <textarea value={objectivesJson} onChange={e => { setObjectivesJson(e.target.value); setSaved(false); }} rows={4}
            style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' as const }} />
        </div>
        <div>
          <label style={labelStyle}>Nội dung lý thuyết (JSON)</label>
          <textarea value={theoryJson} onChange={e => { setTheoryJson(e.target.value); setSaved(false); }} rows={8}
            style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' as const }} />
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}
        {saved && <p style={{ color: '#22C55E', fontSize: 13 }}>Đã lưu thành công.</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saveMut.isPending && <IconLoader size={14} />} Lưu
          </button>
        </div>
      </div>

      {/* Exercises preview */}
      {lesson.exercises && lesson.exercises.length > 0 && (
        <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Bài tập ({lesson.exercises.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lesson.exercises.map((ex, i) => (
              <div key={ex.id} style={{ backgroundColor: 'var(--theme-bg-body)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', flexShrink: 0 }}>#{i + 1}</span>
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(99,102,241,.15)', color: '#818CF8', fontWeight: 600, flexShrink: 0 }}>{ex.exerciseType}</span>
                <span style={{ fontSize: 12, color: 'var(--theme-text-secondary)' }}>{ex.questionVi || ex.questionDe || ex.questionEn || '—'}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--theme-text-muted)' }}>{ex.points}pt</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginTop: 10 }}>
            Để quản lý bài tập chi tiết, sử dụng API trực tiếp hoặc Swagger UI.
          </p>
        </div>
      )}

      {/* Danger zone */}
      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Vùng nguy hiểm</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--theme-text-secondary)', fontWeight: 600 }}>Xóa bài học này</p>
            <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginTop: 2 }}>Tất cả bài tập và tiến độ học sẽ bị xóa vĩnh viễn.</p>
          </div>
          <button onClick={() => setShowDelete(true)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Xóa bài học
          </button>
        </div>
      </div>

      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 360, width: '90%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 8 }}>Xóa bài học?</h3>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 20 }}>Xóa <strong style={{ color: 'var(--theme-text-primary)' }}>{lesson.titleVi}</strong>? Thao tác này không thể hoàn tác.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDelete(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
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
