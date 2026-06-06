'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGenerateExercises } from '@/hooks/useGrammarTrainer';
import { getApiErrorMessage } from '@/lib/api/client';
import { TENSES, CASES, TRAINER_LEVELS, TrainerMode } from '@/lib/api/grammarTrainer';
import { skillTagLabel } from '@/lib/grammarTrainer/engine';
import type { GenerateResult } from '@/lib/api/grammarTrainer';

export default function AdminTrainerGeneratePage() {
  const [mode, setMode] = useState<TrainerMode>('cases');
  const [level, setLevel] = useState('A2');
  const [tags, setTags] = useState<string[]>([]);
  const [count, setCount] = useState(20);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allTags = mode === 'conjugation' ? [...TENSES] : [...CASES];
  const gen = useGenerateExercises();

  function toggleTag(t: string) {
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  }
  function switchMode(m: TrainerMode) {
    setMode(m);
    setTags([]);
    setResult(null);
  }

  function run() {
    setResult(null); setError(null);
    gen.mutate(
      { mode, level, skillTags: tags.length ? tags : undefined, count },
      {
        onSuccess: (res) => setResult(res),
        onError: (err) => setError(getApiErrorMessage(err)),
      },
    );
  }

  const chip = (on: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: on ? 700 : 500, cursor: 'pointer',
    border: `1.5px solid ${on ? '#6366F1' : 'var(--theme-border)'}`,
    backgroundColor: on ? 'rgba(99,102,241,.12)' : 'transparent',
    color: on ? '#818CF8' : 'var(--theme-text-secondary)',
  });

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Link href="/admin/trainer" style={{ padding: '6px 10px', borderRadius: 8, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none', border: '1px solid var(--theme-border)' }}>← Quay lại</Link>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)' }}>AI sinh bài tập Trainer</h1>
      </div>

      <Field label="Loại">
        {(['conjugation', 'cases'] as TrainerMode[]).map((m) => (
          <button key={m} onClick={() => switchMode(m)} style={chip(mode === m)}>
            {m === 'conjugation' ? 'Chia động từ' : 'Các cách (Kasus)'}
          </button>
        ))}
      </Field>

      <Field label="Trình độ">
        {TRAINER_LEVELS.map((l) => (
          <button key={l} onClick={() => setLevel(l)} style={chip(level === l)}>{l}</button>
        ))}
      </Field>

      <Field label={`Chủ đề (${mode === 'conjugation' ? 'thì' : 'cách'}) — bỏ trống = tất cả`}>
        {allTags.map((t) => (
          <button key={t} onClick={() => toggleTag(t)} style={chip(tags.includes(t))}>{skillTagLabel(mode, t)}</button>
        ))}
      </Field>

      <Field label="Số lượng">
        {[10, 20, 30, 50].map((c) => (
          <button key={c} onClick={() => setCount(c)} style={chip(count === c)}>{c}</button>
        ))}
      </Field>

      <button onClick={run} disabled={gen.isPending} style={{ marginTop: 8, padding: '11px 20px', borderRadius: 10, border: 'none', backgroundColor: gen.isPending ? 'var(--theme-border)' : '#6366F1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: gen.isPending ? 'not-allowed' : 'pointer' }}>
        {gen.isPending ? 'Đang sinh… (có thể mất vài giây)' : 'Sinh bài tập'}
      </button>

      {result && (
        <div style={{ marginTop: 16, backgroundColor: '#22C55E15', border: '1px solid #22C55E', borderRadius: 12, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', marginBottom: 6 }}>Đã sinh xong</h3>
          <div style={{ fontSize: 13, color: 'var(--theme-text-secondary)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div><strong style={{ color: 'var(--theme-text-primary)' }}>{result.generated}</strong> tổng</div>
            <div><strong style={{ color: '#22C55E' }}>{result.active}</strong> hợp lệ (active)</div>
            <div><strong style={{ color: '#F59E0B' }}>{result.flagged}</strong> cần duyệt (flagged)</div>
          </div>
          <Link href="/admin/trainer" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: '#6366F1', textDecoration: 'none' }}>→ Xem pool &amp; duyệt</Link>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, backgroundColor: '#EF444415', border: '1px solid #EF4444', borderRadius: 12, padding: 14, fontSize: 13, color: 'var(--theme-text-secondary)' }}>{error}</div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}
