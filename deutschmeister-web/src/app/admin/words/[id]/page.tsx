'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminWordKeys, useUpdateWord, useDeleteWord } from '@/hooks/useAdmin';
import { apiGet, getApiErrorMessage } from '@/lib/api/client';
import { AdminWordItem, CreateWordPayload } from '@/lib/api/admin';

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconPlus({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconX({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const inputStyle = {
  width: '100%', padding: '8px 10px', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)',
  borderRadius: 8, color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
};
const labelStyle = { fontSize: 11, color: 'var(--theme-text-muted)', display: 'block', marginBottom: 4 } as const;

function ArrayField({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {values.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            <input value={v} onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => onChange(values.filter((_, j) => j !== i))}
              style={{ width: 32, height: 36, borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconX size={13} />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...values, ''])}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px dashed var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-muted)', fontSize: 12, cursor: 'pointer', alignSelf: 'flex-start' }}>
          <IconPlus size={12} /> Thêm
        </button>
      </div>
    </div>
  );
}

export default function AdminWordEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: word, isLoading } = useQuery<AdminWordItem>({
    queryKey: adminWordKeys.detail(id),
    queryFn: () => apiGet<AdminWordItem>(`/words/${id}`),
    enabled: !!id,
  });

  const updateWord = useUpdateWord();
  const deleteWord = useDeleteWord();

  const [form, setForm] = useState<Partial<CreateWordPayload>>({});
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function snapshotFromWord(w: AdminWordItem): Partial<CreateWordPayload> {
    return {
      word: w.word,
      article: w.article,
      gender: w.gender,
      plural: w.plural ?? '',
      pronunciation: w.pronunciation ?? '',
      translationEn: w.translationEn,
      translationVi: w.translationVi ?? '',
      imageUrl: w.imageUrl ?? '',
      category: w.category,
      level: w.level,
      frequency: w.frequency,
      examples: w.examples ?? [],
      tips: w.tips ?? [],
    };
  }

  useEffect(() => {
    if (word) setForm(snapshotFromWord(word));
  }, [word]);

  function set(key: keyof CreateWordPayload, value: any) {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    if (!form.word?.trim()) { setError('Vui lòng nhập từ'); return; }
    if (!form.translationEn?.trim()) { setError('Vui lòng nhập nghĩa tiếng Anh'); return; }
    setError('');

    const payload: Partial<CreateWordPayload> = {
      ...form,
      plural: form.plural || undefined,
      pronunciation: form.pronunciation || undefined,
      translationVi: form.translationVi || undefined,
      imageUrl: form.imageUrl || undefined,
      examples: form.examples?.filter(Boolean),
      tips: form.tips?.filter(Boolean),
    };

    updateWord.mutate({ id, data: payload }, {
      onSuccess: () => setSaved(true),
      onError: (err) => {
        // Restore form to the last-known-good server state so the user
        // can see what was actually persisted (vs. their failed edits).
        if (word) setForm(snapshotFromWord(word));
        setError(getApiErrorMessage(err, 'Lỗi khi lưu. Vui lòng thử lại.'));
      },
    });
  }

  function handleDelete() {
    deleteWord.mutate(id, {
      onSuccess: () => router.push('/admin/words'),
    });
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <span style={{ color: '#6366F1' }}><IconLoader size={28} /></span>
      </div>
    );
  }

  if (!word) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--theme-text-muted)', fontSize: 14 }}>Không tìm thấy từ này.</p>
        <Link href="/admin/words" style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none' }}>← Quay lại</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/admin/words" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
        <IconArrowLeft size={14} /> Danh sách từ
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)' }}>
          Sửa: <span style={{ color: '#818CF8' }}>{word.article} {word.word}</span>
        </h1>
        <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>
          Cập nhật: {new Date(word.updatedAt).toLocaleString('vi-VN')}
        </span>
      </div>

      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Từ *</label>
            <input value={form.word ?? ''} onChange={e => set('word', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Mạo từ *</label>
            <select value={form.article ?? 'der'} onChange={e => set('article', e.target.value)} style={inputStyle}>
              <option value="der">der</option>
              <option value="die">die</option>
              <option value="das">das</option>
              <option value="-">- (kein)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Giống *</label>
            <select value={form.gender ?? 'masculine'} onChange={e => set('gender', e.target.value)} style={inputStyle}>
              <option value="masculine">masculine</option>
              <option value="feminine">feminine</option>
              <option value="neuter">neuter</option>
              <option value="plural">plural</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Số nhiều</label>
            <input value={form.plural ?? ''} onChange={e => set('plural', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phiên âm</label>
            <input value={form.pronunciation ?? ''} onChange={e => set('pronunciation', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Nghĩa tiếng Anh *</label>
            <input value={form.translationEn ?? ''} onChange={e => set('translationEn', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Nghĩa tiếng Việt</label>
            <input value={form.translationVi ?? ''} onChange={e => set('translationVi', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Danh mục *</label>
            <input value={form.category ?? ''} onChange={e => set('category', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Trình độ *</label>
            <select value={form.level ?? 'A1'} onChange={e => set('level', e.target.value)} style={inputStyle}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tần suất (1–10)</label>
            <input type="number" min={1} max={10} value={form.frequency ?? 5} onChange={e => set('frequency', Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>URL hình ảnh</label>
          <input value={form.imageUrl ?? ''} onChange={e => set('imageUrl', e.target.value)} style={inputStyle} />
        </div>

        <ArrayField label="Câu ví dụ" values={form.examples ?? []} onChange={v => set('examples', v)} />
        <ArrayField label="Ghi chú / Tips" values={form.tips ?? []} onChange={v => set('tips', v)} />

        {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}
        {saved && <p style={{ color: '#22C55E', fontSize: 13 }}>Đã lưu thành công.</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Link href="/admin/words" style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hủy</Link>
          <button onClick={handleSave} disabled={updateWord.isPending}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {updateWord.isPending && <IconLoader size={14} />} Lưu
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', padding: 20, marginTop: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Vùng nguy hiểm</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--theme-text-secondary)', fontWeight: 600 }}>Xóa từ này</p>
            <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginTop: 2 }}>Xóa khỏi tất cả topics, game answers vĩnh viễn.</p>
          </div>
          <button onClick={() => setShowDelete(true)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Xóa từ
          </button>
        </div>
      </div>

      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 360, width: '90%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 8 }}>Xóa từ "{word.word}"?</h3>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 20 }}>Thao tác này không thể hoàn tác.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDelete(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleDelete} disabled={deleteWord.isPending}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {deleteWord.isPending && <IconLoader size={14} />} Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
