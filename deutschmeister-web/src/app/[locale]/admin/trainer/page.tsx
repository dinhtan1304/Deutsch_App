'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useAdminTrainerExercises,
  useDeleteExercise,
  useUpdateExerciseStatus,
} from '@/hooks/useGrammarTrainer';
import { TENSES, CASES, TRAINER_LEVELS } from '@/lib/api/grammarTrainer';

const ALL_TAGS = [...TENSES, ...CASES];

export default function AdminTrainerListPage() {
  const [mode, setMode] = useState('');
  const [level, setLevel] = useState('');
  const [skillTag, setSkillTag] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    mode: mode || undefined,
    level: level || undefined,
    skillTag: skillTag || undefined,
    status: status || undefined,
    page,
    limit: 20,
  };
  const { data, isLoading } = useAdminTrainerExercises(params);
  const updateStatus = useUpdateExerciseStatus();
  const remove = useDeleteExercise();

  const selStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--theme-border)',
    backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', fontSize: 13,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)' }}>Grammar Trainer — Pool bài tập</h1>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Đề do AI sinh / import JSON. Duyệt đề <strong>flagged</strong>, xoá đề sai.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/trainer/generate" style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>AI generate</Link>
          <Link href="/admin/trainer/import" style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #6366F1', color: '#6366F1', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Import JSON</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <select value={mode} onChange={(e) => { setMode(e.target.value); setPage(1); }} style={selStyle}>
          <option value="">Mọi loại</option>
          <option value="conjugation">Chia động từ</option>
          <option value="cases">Kasus</option>
        </select>
        <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }} style={selStyle}>
          <option value="">Mọi level</option>
          {TRAINER_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={skillTag} onChange={(e) => { setSkillTag(e.target.value); setPage(1); }} style={selStyle}>
          <option value="">Mọi chủ đề</option>
          {ALL_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={selStyle}>
          <option value="">Mọi trạng thái</option>
          <option value="active">active</option>
          <option value="flagged">flagged</option>
        </select>
      </div>

      <div style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              {['Prompt', 'Đáp án', 'Loại', 'Nguồn', 'Trạng thái', ''].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--theme-text-muted)' }}>Đang tải…</td></tr>
            )}
            {!isLoading && (data?.items.length ?? 0) === 0 && (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--theme-text-muted)' }}>Chưa có bài tập. Hãy AI generate hoặc import JSON.</td></tr>
            )}
            {data?.items.map((ex) => (
              <tr key={ex.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                <td style={{ padding: '8px 12px', color: 'var(--theme-text-primary)', maxWidth: 320 }}>{ex.prompt}</td>
                <td style={{ padding: '8px 12px', color: 'var(--theme-text-secondary)', fontFamily: 'ui-monospace, monospace' }}>{ex.answer}</td>
                <td style={{ padding: '8px 12px', color: 'var(--theme-text-muted)' }}>{ex.mode}/{ex.skillTag}/{ex.level}</td>
                <td style={{ padding: '8px 12px', color: 'var(--theme-text-muted)' }}>{ex.source}</td>
                <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: ex.status === 'active' ? '#22C55E20' : '#F59E0B20', color: ex.status === 'active' ? '#22C55E' : '#F59E0B' }}>{ex.status}</span>
                  {ex.reportCount > 0 && (
                    <span title="Số lượt user báo lỗi" style={{ marginLeft: 6, padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: '#EF444420', color: '#EF4444' }}>⚠ {ex.reportCount}</span>
                  )}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link
                    href={`/admin/trainer/${ex.id}`}
                    style={{ marginRight: 8, padding: '4px 8px', borderRadius: 6, border: '1px solid #6366F1', background: 'transparent', color: '#6366F1', fontSize: 11, textDecoration: 'none' }}
                  >
                    Sửa
                  </Link>
                  <button
                    onClick={() => updateStatus.mutate({ id: ex.id, status: ex.status === 'active' ? 'flagged' : 'active' })}
                    style={{ marginRight: 8, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--theme-border)', background: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 11, cursor: 'pointer' }}
                  >
                    {ex.status === 'active' ? 'Đánh dấu lỗi' : 'Kích hoạt'}
                  </button>
                  <button
                    onClick={() => { if (confirm('Xoá bài tập này?')) remove.mutate(ex.id); }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', fontSize: 11, cursor: 'pointer' }}
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>← Trước</button>
          <span style={{ fontSize: 13, color: 'var(--theme-text-muted)' }}>{page}/{data.totalPages} · {data.total} đề</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: page >= data.totalPages ? 'not-allowed' : 'pointer' }}>Sau →</button>
        </div>
      )}
    </div>
  );
}
