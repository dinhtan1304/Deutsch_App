'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTopic, updateTopic, deleteTopic, addWordsToTopic, removeWordsFromTopic } from '@/lib/api/topics';
import { apiGet } from '@/lib/api/client';

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconX({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconSearch({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}

const inputStyle = {
  width: '100%', padding: '8px 10px', backgroundColor: '#0F172A', border: '1px solid #334155',
  borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
};
const labelStyle = { fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 } as const;

const ARTICLE_COLORS: Record<string, string> = { der: '#3B82F6', die: '#EC4899', das: '#22C55E' };

interface WordSearchResult { id: string; word: string; article: string; translationVi: string | null; translationEn: string; level: string; }
interface WordListResponse { items: WordSearchResult[]; }

export default function AdminTopicEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const topicKey = ['admin-topic', id];
  const { data: topic, isLoading } = useQuery({
    queryKey: topicKey,
    queryFn: () => getTopic(id, true),
    enabled: !!id,
  });

  const [slug, setSlug] = useState('');
  const [nameDe, setNameDe] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameVi, setNameVi] = useState('');
  const [descVi, setDescVi] = useState('');
  const [level, setLevel] = useState('A1');
  const [order, setOrder] = useState(0);
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [wordSearch, setWordSearch] = useState('');

  useEffect(() => {
    if (topic) {
      setSlug(topic.slug); setNameDe(topic.nameDe); setNameEn(topic.nameEn); setNameVi(topic.nameVi);
      setDescVi(topic.descriptionVi ?? ''); setLevel(topic.level); setOrder(topic.order);
      setIcon(topic.icon ?? ''); setColor(topic.color ?? ''); setImageUrl(topic.imageUrl ?? '');
      setIsActive(topic.isActive);
    }
  }, [topic]);

  const saveMut = useMutation({
    mutationFn: () => updateTopic(id, { slug, nameDe, nameEn, nameVi, descriptionVi: descVi || undefined, level, order, icon: icon || undefined, color: color || undefined, imageUrl: imageUrl || undefined, isActive }),
    onSuccess: () => { setSaved(true); queryClient.invalidateQueries({ queryKey: topicKey }); queryClient.invalidateQueries({ queryKey: ['admin-topics'] }); },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteTopic(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-topics'] }); router.push('/admin/topics'); },
  });

  const removeWordMut = useMutation({
    mutationFn: (wordId: string) => removeWordsFromTopic(id, [wordId]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKey }),
  });

  const addWordMut = useMutation({
    mutationFn: (wordId: string) => addWordsToTopic(id, [wordId]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: topicKey }); setWordSearch(''); },
  });

  const { data: searchData } = useQuery<WordListResponse>({
    queryKey: ['word-search', wordSearch],
    queryFn: () => apiGet<WordListResponse>(`/words?search=${encodeURIComponent(wordSearch)}&limit=10`),
    enabled: wordSearch.length >= 2,
    staleTime: 10_000,
  });

  const existingWordIds = new Set(topic?.words?.map(w => w.id) ?? []);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><span style={{ color: '#6366F1' }}><IconLoader size={28} /></span></div>;
  }
  if (!topic) {
    return <div style={{ textAlign: 'center', padding: '60px 0' }}><p style={{ color: '#64748B', fontSize: 14 }}>Không tìm thấy topic.</p><Link href="/admin/topics" style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none' }}>← Quay lại</Link></div>;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/admin/topics" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
        <IconArrowLeft size={14} /> Danh sách Topics
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 28 }}>{topic.icon || '📚'}</span>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9' }}>{topic.nameDe}</h1>
        <span style={{ fontSize: 11, color: '#475569' }}>Cập nhật: {new Date(topic.updatedAt).toLocaleString('vi-VN')}</span>
      </div>

      {/* Edit form */}
      <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Slug</label><input value={slug} onChange={e => { setSlug(e.target.value); setSaved(false); }} style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Trình độ</label>
            <select value={level} onChange={e => { setLevel(e.target.value); setSaved(false); }} style={inputStyle}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Thứ tự</label><input type="number" value={order} onChange={e => { setOrder(Number(e.target.value)); setSaved(false); }} style={inputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Tên Tiếng Đức</label><input value={nameDe} onChange={e => { setNameDe(e.target.value); setSaved(false); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>Tên Tiếng Anh</label><input value={nameEn} onChange={e => { setNameEn(e.target.value); setSaved(false); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>Tên Tiếng Việt</label><input value={nameVi} onChange={e => { setNameVi(e.target.value); setSaved(false); }} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>Mô tả (Tiếng Việt)</label><textarea value={descVi} onChange={e => { setDescVi(e.target.value); setSaved(false); }} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
          <div><label style={labelStyle}>Icon</label><input value={icon} onChange={e => { setIcon(e.target.value); setSaved(false); }} style={inputStyle} placeholder="🏠" /></div>
          <div><label style={labelStyle}>Màu</label><input value={color} onChange={e => { setColor(e.target.value); setSaved(false); }} style={inputStyle} placeholder="#4CAF50" /></div>
          <div><label style={labelStyle}>URL hình ảnh</label><input value={imageUrl} onChange={e => { setImageUrl(e.target.value); setSaved(false); }} style={inputStyle} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={labelStyle}>Hiển thị</label>
          <button onClick={() => { setIsActive(v => !v); setSaved(false); }}
            style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: isActive ? '#22C55E' : '#334155', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 2, left: isActive ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        {saved && <p style={{ color: '#22C55E', fontSize: 13 }}>Đã lưu.</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saveMut.isPending && <IconLoader size={14} />} Lưu
          </button>
        </div>
      </div>

      {/* Words in topic */}
      <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Từ vựng trong topic ({topic.words?.length ?? 0})
          </p>
        </div>

        {/* Search to add words */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }}><IconSearch size={14} /></span>
          <input value={wordSearch} onChange={e => setWordSearch(e.target.value)} placeholder="Tìm từ để thêm vào topic..."
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Search results */}
        {wordSearch.length >= 2 && searchData?.data && (
          <div style={{ backgroundColor: '#0F172A', borderRadius: 8, border: '1px solid #334155', marginBottom: 12, overflow: 'hidden' }}>
            {searchData.data.length === 0 ? (
              <p style={{ padding: '12px 14px', fontSize: 13, color: '#475569' }}>Không tìm thấy từ nào.</p>
            ) : (
              searchData.data.map(w => (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid #1E293B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: `${ARTICLE_COLORS[w.article] || '#475569'}20`, color: ARTICLE_COLORS[w.article] || '#475569' }}>{w.article}</span>
                    <span style={{ fontSize: 13, color: '#F1F5F9', fontWeight: 600 }}>{w.word}</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{w.translationVi || w.translationEn}</span>
                  </div>
                  {existingWordIds.has(w.id) ? (
                    <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>Đã thêm</span>
                  ) : (
                    <button onClick={() => addWordMut.mutate(w.id)} disabled={addWordMut.isPending}
                      style={{ padding: '4px 10px', borderRadius: 6, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      + Thêm
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Existing words */}
        {!topic.words?.length ? (
          <p style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '16px 0' }}>Chưa có từ vựng nào.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topic.words.map(w => (
              <div key={w.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 6px', borderRadius: 6, backgroundColor: '#0F172A', border: '1px solid #334155' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 3, backgroundColor: `${ARTICLE_COLORS[w.article] || '#475569'}20`, color: ARTICLE_COLORS[w.article] || '#475569' }}>{w.article}</span>
                <span style={{ fontSize: 12, color: '#F1F5F9', fontWeight: 600 }}>{w.word}</span>
                {w.isCore && <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B' }}>CORE</span>}
                <button onClick={() => removeWordMut.mutate(w.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <IconX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Vùng nguy hiểm</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>Xóa topic này</p>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Xóa topic và tất cả dữ liệu học tập liên quan.</p>
          </div>
          <button onClick={() => setShowDelete(true)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Xóa topic
          </button>
        </div>
      </div>

      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 24, maxWidth: 360, width: '90%', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Xóa topic "{topic.nameDe}"?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Thao tác này không thể hoàn tác.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDelete(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
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
