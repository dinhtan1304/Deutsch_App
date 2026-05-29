'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTopic } from '@/lib/api/topics';
import { getApiErrorMessage } from '@/lib/api/client';

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

interface TopicForm {
  slug: string;
  nameDe: string;
  nameEn: string;
  nameVi: string;
  descriptionDe: string;
  descriptionEn: string;
  descriptionVi: string;
  icon: string;
  color: string;
  imageUrl: string;
  level: string;
  order: number;
}

const BLANK: TopicForm = {
  slug: '', nameDe: '', nameEn: '', nameVi: '',
  descriptionDe: '', descriptionEn: '', descriptionVi: '',
  icon: '', color: '', imageUrl: '', level: 'A1', order: 0,
};

export default function AdminTopicNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TopicForm>({ ...BLANK });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => createTopic({
      slug: form.slug,
      nameDe: form.nameDe,
      nameEn: form.nameEn,
      nameVi: form.nameVi,
      descriptionDe: form.descriptionDe || undefined,
      descriptionEn: form.descriptionEn || undefined,
      descriptionVi: form.descriptionVi || undefined,
      icon: form.icon || undefined,
      color: form.color || undefined,
      imageUrl: form.imageUrl || undefined,
      level: form.level,
      order: form.order,
    }),
    onSuccess: (topic) => {
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      router.push(`/admin/topics/${topic.id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Lỗi khi tạo topic. Slug có thể đã tồn tại.')),
  });

  function set(key: keyof TopicForm, value: any) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    if (!form.slug.trim()) { setError('Vui lòng nhập slug'); return; }
    if (!form.nameDe.trim()) { setError('Vui lòng nhập tên tiếng Đức'); return; }
    if (!form.nameVi.trim()) { setError('Vui lòng nhập tên tiếng Việt'); return; }
    setError('');
    create.mutate();
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/admin/topics" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
        <IconArrowLeft size={14} /> Danh sách Topics
      </Link>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 20 }}>Tạo Topic mới</h1>

      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* slug + level + order */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Slug * (URL-friendly)</label>
            <input value={form.slug} onChange={e => set('slug', e.target.value)} style={inputStyle} placeholder="vd: wohnen-und-haus" />
          </div>
          <div>
            <label style={labelStyle}>Trình độ *</label>
            <select value={form.level} onChange={e => set('level', e.target.value)} style={inputStyle}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Thứ tự</label>
            <input type="number" min={0} value={form.order} onChange={e => set('order', Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        {/* Names */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tên Tiếng Đức *</label>
            <input value={form.nameDe} onChange={e => set('nameDe', e.target.value)} style={inputStyle} placeholder="Wohnen und Haus" />
          </div>
          <div>
            <label style={labelStyle}>Tên Tiếng Anh *</label>
            <input value={form.nameEn} onChange={e => set('nameEn', e.target.value)} style={inputStyle} placeholder="Housing" />
          </div>
          <div>
            <label style={labelStyle}>Tên Tiếng Việt *</label>
            <input value={form.nameVi} onChange={e => set('nameVi', e.target.value)} style={inputStyle} placeholder="Nhà ở" />
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <label style={labelStyle}>Mô tả (Tiếng Việt)</label>
          <textarea value={form.descriptionVi} onChange={e => set('descriptionVi', e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Từ vựng về nhà ở và sinh sống..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Mô tả (Tiếng Đức)</label>
            <textarea value={form.descriptionDe} onChange={e => set('descriptionDe', e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
          <div>
            <label style={labelStyle}>Mô tả (Tiếng Anh)</label>
            <textarea value={form.descriptionEn} onChange={e => set('descriptionEn', e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
        </div>

        {/* Visual */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Icon (emoji)</label>
            <input value={form.icon} onChange={e => set('icon', e.target.value)} style={inputStyle} placeholder="🏠" />
          </div>
          <div>
            <label style={labelStyle}>Màu sắc</label>
            <input value={form.color} onChange={e => set('color', e.target.value)} style={inputStyle} placeholder="#4CAF50" />
          </div>
          <div>
            <label style={labelStyle}>URL hình ảnh</label>
            <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} style={inputStyle} placeholder="https://..." />
          </div>
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Link href="/admin/topics" style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hủy</Link>
          <button onClick={handleSubmit} disabled={create.isPending}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {create.isPending && <IconLoader size={14} />} Tạo Topic
          </button>
        </div>
      </div>
    </div>
  );
}
