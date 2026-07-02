'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminTrainerExercise, useUpdateExercise } from '@/hooks/useGrammarTrainer';
import { TENSES, CASES, TRAINER_LEVELS, REPORT_REASON_LABEL, type ReportReason } from '@/lib/api/grammarTrainer';
import { skillTagLabel } from '@/lib/grammarTrainer/engine';
import { getApiErrorMessage } from '@/lib/api/client';

const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--theme-text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', backgroundColor: 'var(--theme-bg-body)',
  border: '1px solid var(--theme-border)', borderRadius: 8, color: 'var(--theme-text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const monoStyle: React.CSSProperties = { ...inputStyle, fontFamily: 'ui-monospace, monospace', resize: 'vertical' };

export default function AdminTrainerEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useAdminTrainerExercise(id);
  const updateMutation = useUpdateExercise();

  const [level, setLevel] = useState('A2');
  const [skillTag, setSkillTag] = useState('');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [distractors, setDistractors] = useState('');
  const [explanationVi, setExplanationVi] = useState('');
  const [metaText, setMetaText] = useState('');
  const [statusVal, setStatusVal] = useState('active');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setLevel(data.level);
    setSkillTag(data.skillTag);
    setPrompt(data.prompt);
    setAnswer(data.answer);
    setAlternatives((data.alternatives ?? []).join('\n'));
    setDistractors((data.distractors ?? []).join('\n'));
    setExplanationVi(data.explanationVi ?? '');
    setMetaText(data.meta ? JSON.stringify(data.meta, null, 2) : '');
    setStatusVal(data.status);
  }, [data]);

  const tagOptions = data?.mode === 'cases' ? [...CASES] : [...TENSES];

  function splitLines(s: string): string[] {
    return s.split('\n').map((x) => x.trim()).filter(Boolean);
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    let meta: Record<string, unknown> | null = null;
    if (metaText.trim()) {
      try {
        meta = JSON.parse(metaText);
      } catch (e) {
        setError('meta không phải JSON hợp lệ: ' + (e as Error).message);
        return;
      }
    }
    updateMutation.mutate(
      {
        id,
        patch: {
          level, skillTag, prompt, answer,
          alternatives: splitLines(alternatives),
          distractors: splitLines(distractors),
          explanationVi,
          meta,
          status: statusVal,
        },
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setError(getApiErrorMessage(err) || 'Lưu thất bại'),
      },
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Link href="/admin/trainer" style={{ padding: '6px 10px', borderRadius: 8, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none', border: '1px solid var(--theme-border)' }}>← Quay lại</Link>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)' }}>Sửa bài tập báo lỗi</h1>
      </div>

      {isLoading && <p style={{ fontSize: 13, color: 'var(--theme-text-muted)' }}>Đang tải…</p>}
      {isError && <p style={{ fontSize: 13, color: '#EF4444' }}>Không tìm thấy bài tập.</p>}

      {data && (
        <>
          {/* Lịch sử báo lỗi */}
          {data.reports.length > 0 && (
            <div style={{ backgroundColor: '#EF444410', border: '1px solid #EF4444', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>{data.reports.length} lượt báo lỗi</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.reports.map((r) => (
                  <li key={r.id} style={{ fontSize: 12, color: 'var(--theme-text-secondary)' }}>
                    <strong style={{ color: 'var(--theme-text-primary)' }}>{REPORT_REASON_LABEL[r.reason as ReportReason] ?? r.reason}</strong>
                    {r.note ? ` — ${r.note}` : ''}
                    <span style={{ color: 'var(--theme-text-muted)' }}> · {new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Loại: <strong style={{ color: 'var(--theme-text-primary)' }}>{data.mode}</strong> · Nguồn: {data.source}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                <label style={labelStyle}>Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
                  {TRAINER_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Chủ đề (skillTag)</label>
                <select value={skillTag} onChange={(e) => setSkillTag(e.target.value)} style={inputStyle}>
                  {tagOptions.map((t) => <option key={t} value={t}>{skillTagLabel(data.mode, t)} ({t})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Trạng thái</label>
                <select value={statusVal} onChange={(e) => setStatusVal(e.target.value)} style={inputStyle}>
                  <option value="active">active (hiển thị lại)</option>
                  <option value="flagged">flagged (ẩn)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Prompt (câu hỏi)</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} style={monoStyle} />
            </div>

            <div>
              <label style={labelStyle}>Đáp án đúng</label>
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} style={monoStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={labelStyle}>Đáp án chấp nhận thêm (mỗi dòng 1)</label>
                <textarea value={alternatives} onChange={(e) => setAlternatives(e.target.value)} rows={3} style={monoStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phương án sai / distractors (mỗi dòng 1)</label>
                <textarea value={distractors} onChange={(e) => setDistractors(e.target.value)} rows={3} style={monoStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Giải thích (tiếng Việt)</label>
              <textarea value={explanationVi} onChange={(e) => setExplanationVi(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div>
              <label style={labelStyle}>meta (JSON)</label>
              <textarea value={metaText} onChange={(e) => setMetaText(e.target.value)} rows={5} style={monoStyle} placeholder='{ "infinitive": "…", "person": "…", "tense": "…" }' />
            </div>

            {error && (
              <div style={{ backgroundColor: '#EF444415', border: '1px solid #EF4444', borderRadius: 8, padding: 12, fontSize: 12, color: '#EF4444' }}>{error}</div>
            )}
            {saved && (
              <div style={{ backgroundColor: '#22C55E15', border: '1px solid #22C55E', borderRadius: 8, padding: 12, fontSize: 12, color: '#22C55E' }}>Đã lưu.</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Link href="/admin/trainer" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Huỷ</Link>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: updateMutation.isPending ? 'var(--theme-border)' : '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: updateMutation.isPending ? 'not-allowed' : 'pointer' }}
              >
                {updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
