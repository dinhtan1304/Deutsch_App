'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useImportTrainerExercises } from '@/hooks/useGrammarTrainer';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ImportTrainerResult } from '@/lib/api/grammarTrainer';

const SAMPLE_CONJUGATION = `[
  // skillTag: praesens | praeteritum | perfekt | futur1 | nebensatz | modalverben | reflexiv | trennbar | imperativ | konjunktiv2
  {
    "mode": "conjugation",
    "level": "A2",
    "skillTag": "perfekt",
    "prompt": "Chia động từ: Gestern hat er Fußball ___. (spielen — Perfekt)",
    "answer": "gespielt",             // chỉ 1 từ điền vào chỗ trống "___"
    "distractors": ["gespielen", "spielte", "spielt"],
    "explanationVi": "Dấu hiệu 'gestern' → quá khứ. Perfekt = haben/sein + Partizip II; spielen → gespielt.",
    "meta": { "infinitive": "spielen", "person": "erSieEs", "tense": "perfekt" }
  },
  {
    "skillTag": "nebensatz",          // động từ dồn về CUỐI câu phụ
    "mode": "conjugation", "level": "A2",
    "prompt": "Chia động từ: Ich weiß, dass er jeden Tag Deutsch ___. (lernen — Nebensatz)",
    "answer": "lernt",
    "distractors": ["lernen", "lernte", "gelernt"],
    "explanationVi": "Trong câu phụ (dass…), động từ đã chia đứng cuối câu; er → lernt.",
    "meta": { "infinitive": "lernen", "person": "erSieEs", "tense": "nebensatz" }
  },
  {
    "skillTag": "modalverben",        // chia ĐỘNG TỪ KHUYẾT THIẾU, Vollverb nguyên mẫu ở cuối
    "mode": "conjugation", "level": "A2",
    "prompt": "Chia động từ: Ich ___ heute länger arbeiten. (müssen — Modalverb)",
    "answer": "muss",
    "distractors": ["musst", "muß", "müssen"],
    "explanationVi": "Modalverb chia theo chủ ngữ, động từ chính ở dạng nguyên mẫu cuối câu; ich → muss.",
    "meta": { "infinitive": "müssen", "person": "ich", "tense": "modalverben" }
  },
  {
    "skillTag": "reflexiv",           // chỗ trống là ĐẠI TỪ PHẢN THÂN
    "mode": "conjugation", "level": "A2",
    "prompt": "Chia động từ: Er interessiert ___ für Musik. (sich interessieren — Reflexiv)",
    "answer": "sich",
    "distractors": ["ihn", "mich", "dich"],
    "explanationVi": "Đại từ phản thân theo chủ ngữ er → sich (Akkusativ).",
    "meta": { "infinitive": "interessieren", "person": "erSieEs", "tense": "reflexiv" }
  },
  {
    "skillTag": "trennbar",           // chỗ trống là TIỀN TỐ TÁCH ở cuối câu
    "mode": "conjugation", "level": "A2",
    "prompt": "Chia động từ: Ich stehe jeden Tag um 7 Uhr ___. (aufstehen — trennbar)",
    "answer": "auf",
    "distractors": ["an", "aus", "ab"],
    "explanationVi": "Động từ tách: phần thân 'stehe' đã chia, tiền tố 'auf' tách về cuối câu.",
    "meta": { "infinitive": "aufstehen", "person": "ich", "tense": "trennbar" }
  },
  {
    "skillTag": "imperativ",          // dạng MỆNH LỆNH ở đầu câu
    "mode": "conjugation", "level": "A2",
    "prompt": "Chia động từ: ___ bitte die Tür! (öffnen — Imperativ, du)",
    "answer": "Öffne",
    "distractors": ["Öffnen", "Öffnest", "Öffnet"],
    "explanationVi": "Mệnh lệnh ngôi 'du': bỏ đuôi -st → Öffne (die Tür).",
    "meta": { "infinitive": "öffnen", "person": "du", "tense": "imperativ" }
  },
  {
    "skillTag": "konjunktiv2",        // würde-Form hoặc hätte/wäre/könnte…
    "mode": "conjugation", "level": "B1",
    "prompt": "Chia động từ: An deiner Stelle ___ ich mehr lernen. (lernen — Konjunktiv II)",
    "answer": "würde",
    "distractors": ["werde", "wurde", "würdet"],
    "explanationVi": "Konjunktiv II (giả định/lịch sự): würde + nguyên mẫu; ich → würde lernen.",
    "meta": { "infinitive": "lernen", "person": "ich", "tense": "konjunktiv2" }
  }
]`;

const SAMPLE_CASES = `[
  {
    "mode": "cases",
    "level": "A2",
    "skillTag": "dativ",             // nominativ | akkusativ | dativ | genitiv
    "prompt": "Điền cụm đúng cách: Ich fahre mit ___ zur Arbeit. (der Bus — Dativ)",
    "answer": "dem Bus",             // cụm đã biến cách điền vào "___"
    "distractors": ["den Bus", "des Busses", "der Bus"],
    "explanationVi": "Giới từ 'mit' luôn đi với Dativ; der → dem.",
    "meta": { "gender": "masculine", "number": "singular", "case": "dativ", "articleType": "definite", "noun": "Bus" }
  }
]`;

interface ImportErrorBody { message?: string; errors?: string[]; }

export default function AdminTrainerImportPage() {
  const [mode, setMode] = useState<'file' | 'paste'>('paste');
  const [files, setFiles] = useState<File[]>([]);
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<ImportTrainerResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [topLevelError, setTopLevelError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportTrainerExercises();

  function resetOutput() {
    setResult(null); setErrors([]); setTopLevelError(null);
  }

  function switchMode(next: 'file' | 'paste') {
    setMode(next);
    resetOutput();
  }

  function handleFilesSelected(list: FileList | null) {
    if (!list) return;
    setFiles(Array.from(list).filter((f) => f.name.toLowerCase().endsWith('.json')));
    resetOutput();
  }

  function runImport(payload: File[]) {
    resetOutput();
    importMutation.mutate(payload, {
      onSuccess: (res) => setResult(res),
      onError: (err: unknown) => {
        const body = (err as { data?: ImportErrorBody })?.data;
        if (body?.errors && Array.isArray(body.errors)) {
          setErrors(body.errors);
          setTopLevelError(body.message || getApiErrorMessage(err));
        } else {
          setTopLevelError(getApiErrorMessage(err) || 'Import thất bại');
        }
      },
    });
  }

  function handleImport() {
    if (mode === 'file') {
      if (files.length === 0) return;
      runImport(files);
      return;
    }
    if (jsonText.trim() === '') return;
    resetOutput();
    try {
      JSON.parse(jsonText);
    } catch (e) {
      setTopLevelError('JSON không hợp lệ: ' + (e as Error).message);
      return;
    }
    const blob = new Blob([jsonText], { type: 'application/json' });
    const pastedFile = new File([blob], 'pasted-exercises.json', { type: 'application/json' });
    runImport([pastedFile]);
  }

  const canImport = mode === 'file' ? files.length > 0 : jsonText.trim() !== '';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Link href="/admin/trainer" style={{ padding: '6px 10px', borderRadius: 8, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none', border: '1px solid var(--theme-border)' }}>← Quay lại</Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)' }}>Import bài tập Trainer từ JSON</h1>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Mỗi file là một mảng bài tập. Upsert theo (mode + skillTag + prompt), rollback toàn bộ nếu có lỗi.</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 10, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-body)', marginBottom: 16 }}>
          {(['paste', 'file'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              disabled={importMutation.isPending}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: mode === m ? '#6366F1' : 'transparent', color: mode === m ? '#fff' : 'var(--theme-text-secondary)' }}
            >
              {m === 'paste' ? 'Dán JSON' : 'Chọn file'}
            </button>
          ))}
        </div>

        {mode === 'paste' ? (
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            placeholder={'Dán mảng JSON bài tập vào đây, ví dụ: [ { "mode": "cases", ... } ]'}
            style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)', borderRadius: 8, color: 'var(--theme-text-primary)', fontSize: 12, fontFamily: 'ui-monospace, monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
          />
        ) : (
          <div style={{ border: '1px dashed var(--theme-border)', borderRadius: 8, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--theme-text-secondary)' }}>
              {files.length === 0 ? 'Chưa chọn file (.json, ≤5MB)' : `Đã chọn ${files.length} file`}
            </div>
            <input ref={inputRef} type="file" multiple accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => handleFilesSelected(e.target.files)} />
            <button onClick={() => inputRef.current?.click()} disabled={importMutation.isPending} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #6366F1', backgroundColor: 'transparent', color: '#6366F1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Chọn file</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleImport} disabled={!canImport || importMutation.isPending} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: !canImport || importMutation.isPending ? 'var(--theme-border)' : '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: !canImport ? 'not-allowed' : 'pointer' }}>
            {importMutation.isPending ? 'Đang import…' : 'Bắt đầu import'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ backgroundColor: '#22C55E15', border: '1px solid #22C55E', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', marginBottom: 6 }}>Import thành công</h3>
          <div style={{ fontSize: 13, color: 'var(--theme-text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            <div><strong style={{ color: 'var(--theme-text-primary)' }}>{result.files}</strong> file</div>
            <div><strong style={{ color: 'var(--theme-text-primary)' }}>{result.total}</strong> xử lý</div>
            <div><strong style={{ color: '#22C55E' }}>{result.created}</strong> tạo mới</div>
            <div><strong style={{ color: '#6366F1' }}>{result.updated}</strong> ghi đè</div>
          </div>
        </div>
      )}

      {topLevelError && (
        <div style={{ backgroundColor: '#EF444415', border: '1px solid #EF4444', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>Import thất bại</h3>
          <p style={{ fontSize: 12, color: 'var(--theme-text-secondary)' }}>{topLevelError}</p>
        </div>
      )}

      {errors.length > 0 && (
        <div style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid #EF4444', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>{errors.length} lỗi — không có dữ liệu nào được ghi</h3>
          <div style={{ maxHeight: 320, overflowY: 'auto', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)', borderRadius: 8, padding: 10 }}>
            <ol style={{ fontSize: 11, color: 'var(--theme-text-secondary)', fontFamily: 'ui-monospace, monospace', listStylePosition: 'inside', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {errors.map((msg, i) => <li key={i}>{msg}</li>)}
            </ol>
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 10 }}>
        Một file có thể gộp cả 2 loại (trường <code>mode</code> quyết định). Dưới đây tách riêng cho dễ theo dõi.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        <div style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 12, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 4 }}>1 · Chia động từ (conjugation)</h3>
          <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginBottom: 8 }}>Câu có chỗ trống <code>___</code> + từ tín hiệu; <code>answer</code> là 1 từ; <code>meta</code> = {'{ infinitive, person, tense }'}.</p>
          <pre style={{ fontSize: 11, color: 'var(--theme-text-secondary)', fontFamily: 'ui-monospace, monospace', overflowX: 'auto', margin: 0, whiteSpace: 'pre' }}>{SAMPLE_CONJUGATION}</pre>
        </div>
        <div style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 12, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 4 }}>2 · Các cách (cases)</h3>
          <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginBottom: 8 }}>Câu có <code>___</code> + giới từ/động từ chi phối cách; <code>answer</code> là cụm đã biến cách; <code>meta</code> = {'{ gender, number, case, articleType, noun }'}.</p>
          <pre style={{ fontSize: 11, color: 'var(--theme-text-secondary)', fontFamily: 'ui-monospace, monospace', overflowX: 'auto', margin: 0, whiteSpace: 'pre' }}>{SAMPLE_CASES}</pre>
        </div>
      </div>
    </div>
  );
}
