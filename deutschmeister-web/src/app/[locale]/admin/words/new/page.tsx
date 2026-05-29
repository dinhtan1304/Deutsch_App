'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateWord } from '@/hooks/useAdmin';
import { CreateWordPayload } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/client';

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
            <input
              value={v}
              onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }}
              style={{ ...inputStyle, flex: 1 }}
            />
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

const BLANK: CreateWordPayload = {
  word: '', article: 'der', gender: 'masculine', translationEn: '',
  category: 'noun', level: 'A1',
  plural: '', pronunciation: '', translationVi: '', imageUrl: '',
  frequency: 5, examples: [], tips: [],
};

export default function AdminWordNewPage() {
  const router = useRouter();
  const createWord = useCreateWord();
  const [form, setForm] = useState<CreateWordPayload>({ ...BLANK });
  const [error, setError] = useState('');

  function set(key: keyof CreateWordPayload, value: any) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    if (!form.word.trim()) { setError('Vui lòng nhập từ'); return; }
    if (!form.translationEn.trim()) { setError('Vui lòng nhập nghĩa tiếng Anh'); return; }
    setError('');

    const payload: CreateWordPayload = {
      ...form,
      plural: form.plural || undefined,
      pronunciation: form.pronunciation || undefined,
      translationVi: form.translationVi || undefined,
      imageUrl: form.imageUrl || undefined,
      examples: form.examples?.filter(Boolean),
      tips: form.tips?.filter(Boolean),
    };

    createWord.mutate(payload, {
      onSuccess: (word) => router.push(`/admin/words/${word.id}`),
      onError: (err) => setError(getApiErrorMessage(err, 'Lỗi khi tạo từ. Vui lòng thử lại.')),
    });
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/admin/words" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
        <IconArrowLeft size={14} /> Danh sách từ
      </Link>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 20 }}>Thêm từ mới</h1>

      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Row 1: word + article + gender */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Từ *</label>
            <input value={form.word} onChange={e => set('word', e.target.value)} style={inputStyle} placeholder="z.B. Hund" />
          </div>
          <div>
            <label style={labelStyle}>Mạo từ *</label>
            <select value={form.article} onChange={e => set('article', e.target.value)} style={inputStyle}>
              <option value="der">der</option>
              <option value="die">die</option>
              <option value="das">das</option>
              <option value="-">- (kein)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Giống *</label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)} style={inputStyle}>
              <option value="masculine">masculine</option>
              <option value="feminine">feminine</option>
              <option value="neuter">neuter</option>
              <option value="plural">plural</option>
            </select>
          </div>
        </div>

        {/* Row 2: plural + pronunciation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Số nhiều</label>
            <input value={form.plural ?? ''} onChange={e => set('plural', e.target.value)} style={inputStyle} placeholder="z.B. Hunde" />
          </div>
          <div>
            <label style={labelStyle}>Phiên âm</label>
            <input value={form.pronunciation ?? ''} onChange={e => set('pronunciation', e.target.value)} style={inputStyle} placeholder="z.B. /hʊnt/" />
          </div>
        </div>

        {/* Row 3: translations */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Nghĩa tiếng Anh *</label>
            <input value={form.translationEn} onChange={e => set('translationEn', e.target.value)} style={inputStyle} placeholder="dog" />
          </div>
          <div>
            <label style={labelStyle}>Nghĩa tiếng Việt</label>
            <input value={form.translationVi ?? ''} onChange={e => set('translationVi', e.target.value)} style={inputStyle} placeholder="con chó" />
          </div>
        </div>

        {/* Row 4: category + level + frequency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Danh mục *</label>
            <input value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle} placeholder="noun" />
          </div>
          <div>
            <label style={labelStyle}>Trình độ *</label>
            <select value={form.level} onChange={e => set('level', e.target.value)} style={inputStyle}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tần suất (1–10)</label>
            <input type="number" min={1} max={10} value={form.frequency ?? 5} onChange={e => set('frequency', Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        {/* Row 5: imageUrl */}
        <div>
          <label style={labelStyle}>URL hình ảnh</label>
          <input value={form.imageUrl ?? ''} onChange={e => set('imageUrl', e.target.value)} style={inputStyle} placeholder="https://..." />
        </div>

        {/* Examples */}
        <ArrayField label="Câu ví dụ" values={form.examples ?? []} onChange={v => set('examples', v)} />

        {/* Tips */}
        <ArrayField label="Ghi chú / Tips" values={form.tips ?? []} onChange={v => set('tips', v)} />

        {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Link href="/admin/words" style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hủy</Link>
          <button
            onClick={handleSubmit}
            disabled={createWord.isPending}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {createWord.isPending && <IconLoader size={14} />}
            Tạo từ
          </button>
        </div>
      </div>
    </div>
  );
}
