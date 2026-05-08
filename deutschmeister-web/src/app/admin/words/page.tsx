'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminWordKeys } from '@/hooks/useAdmin';
import { useDeleteWord } from '@/hooks/useAdmin';
import { apiGet } from '@/lib/api/client';
import { AdminWordItem } from '@/lib/api/admin';

function IconSearch({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function IconPlus({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconTrash({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

interface WordListResponse {
  data: AdminWordItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ARTICLE_COLORS: Record<string, string> = {
  der: '#3B82F6',
  die: '#EC4899',
  das: '#22C55E',
};

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444', C2: '#EC4899',
};

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const ARTICLES = ['', 'der', 'die', 'das'];

function toQS(params: Record<string, any>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export default function AdminWordsPage() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [article, setArticle] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = { search: search || undefined, level: level || undefined, article: article || undefined, page, limit: 20 };

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<WordListResponse>({
    queryKey: adminWordKeys.list(params),
    queryFn: () => apiGet<WordListResponse>(`/words${toQS(params)}`),
    staleTime: 30_000,
  });

  const deleteWord = useDeleteWord();

  function handleDelete(id: string) {
    deleteWord.mutate(id, { onSuccess: () => setDeleteId(null) });
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 2 }}>Từ vựng</h1>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{data ? `${data.total} từ` : '...'}</p>
        </div>
        <Link href="/admin/words/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          <IconPlus size={14} /> Thêm từ
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-text-muted)' }}>
            <IconSearch size={14} />
          </span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm từ..."
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8, color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={level}
          onChange={e => { setLevel(e.target.value); setPage(1); }}
          style={{ height: 36, padding: '0 10px', backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8, color: level ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)', fontSize: 13, outline: 'none' }}
        >
          {LEVELS.map(l => <option key={l} value={l} style={{ backgroundColor: 'var(--theme-bg-card)' }}>{l || 'Trình độ'}</option>)}
        </select>
        <select
          value={article}
          onChange={e => { setArticle(e.target.value); setPage(1); }}
          style={{ height: 36, padding: '0 10px', backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8, color: article ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)', fontSize: 13, outline: 'none' }}
        >
          {ARTICLES.map(a => <option key={a} value={a} style={{ backgroundColor: 'var(--theme-bg-card)' }}>{a || 'Mạo từ'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <span style={{ color: '#6366F1' }}><IconLoader size={24} /></span>
          </div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>Không tải được danh sách từ.</div>
            <div style={{ color: 'var(--theme-text-muted)', fontSize: 12, marginBottom: 12 }}>{(error as any)?.message ?? 'Lỗi không xác định.'}</div>
            <button onClick={() => refetch()}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
              Thử lại
            </button>
          </div>
        ) : !data?.data?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--theme-text-muted)', fontSize: 13 }}>
            Không tìm thấy từ nào.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                {['Từ', 'Dịch nghĩa', 'Level', 'Danh mục', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((w, i) => (
                <tr key={w.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        backgroundColor: `${ARTICLE_COLORS[w.article] || 'var(--theme-text-muted)'}20`,
                        color: ARTICLE_COLORS[w.article] || 'var(--theme-text-muted)',
                      }}>
                        {w.article}
                      </span>
                      <Link href={`/admin/words/${w.id}`} style={{ fontWeight: 600, color: 'var(--theme-text-primary)', textDecoration: 'none' }}>
                        {w.word}
                      </Link>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--theme-text-secondary)' }}>
                    {w.translationVi || w.translationEn}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      backgroundColor: `${LEVEL_COLORS[w.level] || 'var(--theme-text-muted)'}20`,
                      color: LEVEL_COLORS[w.level] || 'var(--theme-text-muted)',
                    }}>
                      {w.level}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)', fontSize: 12 }}>{w.category}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Link href={`/admin/words/${w.id}`} style={{ fontSize: 11, color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}>Sửa</Link>
                      <button
                        onClick={() => setDeleteId(w.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-muted)', padding: 4, display: 'flex' }}
                      >
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
          <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Trang {page} / {totalPages} {isFetching && '...'}</span>
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
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 8 }}>Xóa từ này?</h3>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 20 }}>Từ sẽ bị xóa khỏi tất cả topics và game answers.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleteWord.isPending}
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
