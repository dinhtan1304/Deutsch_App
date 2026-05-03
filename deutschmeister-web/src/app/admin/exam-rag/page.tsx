'use client';

import { useState, useRef } from 'react';
import {
  useExamRagDocuments,
  useUploadExamDocument,
  useDeleteExamDocument,
  useExamRagDocument,
} from '@/hooks/useExamRag';

// ─── Constants ──────────────────────────────────────────────────────────────

const EXAM_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'GOETHE', label: 'Goethe' },
  { value: 'TELC', label: 'TELC' },
];

const LEVELS = [
  { value: '', label: 'Tất cả' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
];

const SKILLS = [
  { value: '', label: 'Tất cả' },
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'listening', label: 'Listening' },
  { value: 'speaking', label: 'Speaking' },
];

const SKILL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  reading:   { bg: 'rgba(34,197,94,0.12)',  color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
  writing:   { bg: 'rgba(99,102,241,0.12)', color: '#A5B4FC', border: 'rgba(99,102,241,0.25)' },
  listening: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  speaking:  { bg: 'rgba(239,68,68,0.12)',  color: '#FCA5A5', border: 'rgba(239,68,68,0.25)' },
  all:       { bg: 'rgba(168,85,247,0.12)', color: '#C4B5FD', border: 'rgba(168,85,247,0.25)' },
  general:   { bg: 'rgba(100,116,139,0.12)', color: '#94A3B8', border: 'rgba(100,116,139,0.25)' },
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminExamRagPage() {
  const [filterExamType, setFilterExamType] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Upload form state
  const [uploadExamType, setUploadExamType] = useState('GOETHE');
  const [uploadLevel, setUploadLevel] = useState('A1');
  const [uploadSkill, setUploadSkill] = useState('all');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useExamRagDocuments({
    examType: filterExamType || undefined,
    cefrLevel: filterLevel || undefined,
    skill: filterSkill || undefined,
  });
  const upload = useUploadExamDocument();
  const deleteDoc = useDeleteExamDocument();

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await upload.mutateAsync({
      file,
      meta: { examType: uploadExamType, cefrLevel: uploadLevel, skill: uploadSkill },
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const selectStyle: React.CSSProperties = {
    backgroundColor: '#0F172A', color: '#F1F5F9', border: '1px solid #334155',
    borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', cursor: 'pointer',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', cursor: 'pointer',
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Exam RAG — Đề mẫu</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
            {data ? `${data.total} tài liệu` : 'Đang tải...'}
          </p>
        </div>
      </div>

      {/* Upload section */}
      <div style={{
        borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 24,
        background: 'rgba(99,102,241,0.03)',
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: '0 0 12px' }}>Upload đề mẫu PDF</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Loại đề</label>
            <select value={uploadExamType} onChange={e => setUploadExamType(e.target.value)} style={selectStyle}>
              <option value="GOETHE">Goethe</option>
              <option value="TELC">TELC</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Trình độ</label>
            <select value={uploadLevel} onChange={e => setUploadLevel(e.target.value)} style={selectStyle}>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Kỹ năng</label>
            <select value={uploadSkill} onChange={e => setUploadSkill(e.target.value)} style={selectStyle}>
              <option value="all">Tất cả (Full exam)</option>
              <option value="reading">Reading</option>
              <option value="writing">Writing</option>
              <option value="listening">Listening</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>File PDF</label>
            <input ref={fileRef} type="file" accept=".pdf" style={{ fontSize: 12, color: '#94A3B8' }} />
          </div>
          <button
            onClick={handleUpload}
            disabled={upload.isPending}
            style={{ ...btnPrimary, opacity: upload.isPending ? 0.6 : 1 }}
          >
            {upload.isPending ? 'Đang xử lý...' : 'Upload & Xử lý'}
          </button>
        </div>
        {upload.isError && (
          <p style={{ color: '#FCA5A5', fontSize: 12, marginTop: 8 }}>
            Lỗi: {(upload.error as Error).message}
          </p>
        )}
        {upload.isSuccess && (
          <p style={{ color: '#4ADE80', fontSize: 12, marginTop: 8 }}>Upload thành công!</p>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select value={filterExamType} onChange={e => setFilterExamType(e.target.value)} style={selectStyle}>
          {EXAM_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={selectStyle}>
          {LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)} style={selectStyle}>
          {SKILLS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#1E293B' }}>
              {['File', 'Loại đề', 'Level', 'Kỹ năng', 'Chunks', 'Ngày upload', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left', color: '#94A3B8', fontWeight: 700,
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #334155',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Đang tải...</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Chưa có tài liệu nào</td></tr>
            ) : data.items.map(item => (
              <DocumentRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onDelete={() => { if (confirm('Xóa tài liệu này?')) deleteDoc.mutate(item.id); }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Row component ──────────────────────────────────────────────────────────

function DocumentRow({
  item, expanded, onToggle, onDelete,
}: {
  item: { id: string; filename: string; examType: string; cefrLevel: string; skill: string; chunkCount: number; createdAt: string };
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const skillStyle = SKILL_COLORS[item.skill] ?? { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' };
  const date = new Date(item.createdAt);

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer', backgroundColor: expanded ? 'rgba(99,102,241,0.04)' : 'transparent', transition: 'background 0.15s' }}
      >
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', color: '#F1F5F9' }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 250 }}>
            {item.filename}
          </div>
        </td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: 12 }}>
          {item.examType}
        </td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B' }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)',
          }}>
            {item.cefrLevel}
          </span>
        </td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B' }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: skillStyle.bg, color: skillStyle.color, border: `1px solid ${skillStyle.border}`,
          }}>
            {item.skill}
          </span>
        </td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: 12 }}>
          {item.chunkCount}
        </td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>
          {date.toLocaleDateString('vi-VN')}
        </td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5',
            }}
          >
            Xóa
          </button>
        </td>
      </tr>

      {expanded && <ExpandedChunks documentId={item.id} />}
    </>
  );
}

// ─── Expanded chunks ────────────────────────────────────────────────────────

function ExpandedChunks({ documentId }: { documentId: string }) {
  const { data, isLoading } = useExamRagDocument(documentId);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} style={{ padding: '16px 14px', borderBottom: '1px solid #334155', backgroundColor: 'rgba(99,102,241,0.03)' }}>
          <span style={{ color: '#64748B', fontSize: 12 }}>Đang tải chunks...</span>
        </td>
      </tr>
    );
  }

  if (!data) return null;

  return (
    <tr>
      <td colSpan={7} style={{ padding: '0 14px 16px', borderBottom: '1px solid #334155', backgroundColor: 'rgba(99,102,241,0.03)' }}>
        <div style={{ padding: '12px 0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 10 }}>
            {data.chunks.length} chunks
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.chunks.map(chunk => (
              <div key={chunk.id} style={{
                padding: 12, borderRadius: 8, background: '#0F172A', border: '1px solid #1E293B',
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {(() => {
                    const cs = SKILL_COLORS[chunk.skill] ?? SKILL_COLORS.general!;
                    return (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                        background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`,
                      }}>
                        {chunk.skill}
                      </span>
                    );
                  })()}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                    background: 'rgba(99,102,241,0.12)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.25)',
                  }}>
                    Teil {chunk.teilNumber}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                    background: 'rgba(100,116,139,0.12)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.25)',
                  }}>
                    {chunk.teilType}
                  </span>
                  <span style={{ fontSize: 10, color: '#475569' }}>
                    {chunk.content.length} chars
                  </span>
                </div>
                <p style={{
                  color: '#CBD5E1', fontSize: 12, lineHeight: 1.6, margin: 0,
                  whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto',
                }}>
                  {chunk.content.slice(0, 500)}{chunk.content.length > 500 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}
