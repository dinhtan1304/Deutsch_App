'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGrammarApi } from '@/lib/api/admin';

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const inputStyle = {
  width: '100%', padding: '8px 10px', backgroundColor: '#0F172A', border: '1px solid #334155',
  borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
};
const labelStyle = { fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 } as const;

const DEFAULT_OBJECTIVES = JSON.stringify({ de: ["Lernziel 1"], en: ["Learning goal 1"], vi: ["Mục tiêu 1"] }, null, 2);
const DEFAULT_THEORY = JSON.stringify({ sections: [{ titleVi: "Giới thiệu", content: "Nội dung lý thuyết..." }] }, null, 2);

export default function AdminGrammarNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState('');
  const [level, setLevel] = useState('A1');
  const [lessonNumber, setLessonNumber] = useState(1);
  const [titleDe, setTitleDe] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [order, setOrder] = useState(0);
  const [objectivesJson, setObjectivesJson] = useState(DEFAULT_OBJECTIVES);
  const [theoryJson, setTheoryJson] = useState(DEFAULT_THEORY);
  const [jsonError, setJsonError] = useState('');
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => {
      let objectives: any, theoryContent: any;
      try { objectives = JSON.parse(objectivesJson); } catch { throw new Error('objectives JSON không hợp lệ'); }
      try { theoryContent = JSON.parse(theoryJson); } catch { throw new Error('theoryContent JSON không hợp lệ'); }
      return adminGrammarApi.createLesson({ slug, level, lessonNumber, titleDe, titleEn, titleVi, objectives, theoryContent, estimatedMinutes, order });
    },
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: ['admin-grammar'] });
      router.push(`/admin/grammar/${lesson.id}`);
    },
    onError: (e: any) => setError(e.message || 'Lỗi khi tạo bài học.'),
  });

  function handleSubmit() {
    if (!slug.trim()) { setError('Vui lòng nhập slug'); return; }
    if (!titleVi.trim()) { setError('Vui lòng nhập tiêu đề tiếng Việt'); return; }
    try { JSON.parse(objectivesJson); JSON.parse(theoryJson); setJsonError(''); } catch (e: any) { setJsonError(e.message); return; }
    setError('');
    create.mutate();
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/admin/grammar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
        <IconArrowLeft size={14} /> Danh sách bài học
      </Link>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', marginBottom: 20 }}>Tạo bài học mới</h1>

      <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Slug *</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} style={inputStyle} placeholder="a1-l01-alphabet" />
          </div>
          <div>
            <label style={labelStyle}>Trình độ *</label>
            <select value={level} onChange={e => setLevel(e.target.value)} style={inputStyle}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Số bài</label>
            <input type="number" min={1} value={lessonNumber} onChange={e => setLessonNumber(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Thứ tự</label>
            <input type="number" min={0} value={order} onChange={e => setOrder(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        {/* Titles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tiêu đề Tiếng Việt *</label>
            <input value={titleVi} onChange={e => setTitleVi(e.target.value)} style={inputStyle} placeholder="Bảng chữ cái và phát âm" />
          </div>
          <div>
            <label style={labelStyle}>Thời gian ước tính (phút)</label>
            <input type="number" min={5} value={estimatedMinutes} onChange={e => setEstimatedMinutes(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tiêu đề Tiếng Đức</label>
            <input value={titleDe} onChange={e => setTitleDe(e.target.value)} style={inputStyle} placeholder="Das Alphabet" />
          </div>
          <div>
            <label style={labelStyle}>Tiêu đề Tiếng Anh</label>
            <input value={titleEn} onChange={e => setTitleEn(e.target.value)} style={inputStyle} placeholder="The Alphabet" />
          </div>
        </div>

        {/* JSON fields */}
        <div>
          <label style={labelStyle}>Mục tiêu (JSON — {`{ de: [], en: [], vi: [] }`})</label>
          <textarea value={objectivesJson} onChange={e => setObjectivesJson(e.target.value)} rows={4}
            style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' as const }} />
        </div>
        <div>
          <label style={labelStyle}>Nội dung lý thuyết (JSON)</label>
          <textarea value={theoryJson} onChange={e => setTheoryJson(e.target.value)} rows={6}
            style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' as const }} />
        </div>

        {jsonError && <p style={{ color: '#F59E0B', fontSize: 12, fontFamily: 'monospace' }}>JSON lỗi: {jsonError}</p>}
        {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Link href="/admin/grammar" style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #334155', color: '#94A3B8', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hủy</Link>
          <button onClick={handleSubmit} disabled={create.isPending}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {create.isPending && <IconLoader size={14} />} Tạo bài học
          </button>
        </div>
      </div>
    </div>
  );
}
