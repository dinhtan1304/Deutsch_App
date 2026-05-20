'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useImportWords } from '@/hooks/useWords';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ImportWordsResult } from '@/lib/api/words';

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconUpload({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
}
function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCheck({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconX({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface ImportErrorBody {
  message?: string;
  errors?: string[];
}

export default function AdminWordsImportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ImportWordsResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [topLevelError, setTopLevelError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportWords();

  function handleFilesSelected(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.name.toLowerCase().endsWith('.json'));
    setFiles(picked);
    setResult(null);
    setErrors([]);
    setTopLevelError(null);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearAll() {
    setFiles([]);
    setResult(null);
    setErrors([]);
    setTopLevelError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleImport() {
    if (files.length === 0) return;
    setResult(null);
    setErrors([]);
    setTopLevelError(null);

    importMutation.mutate(files, {
      onSuccess: (res) => {
        setResult(res);
      },
      onError: (err: unknown) => {
        const e = err as { status?: number; message?: string; data?: ImportErrorBody };
        const body = e?.data;
        if (body?.errors && Array.isArray(body.errors)) {
          setErrors(body.errors);
          setTopLevelError(body.message || getApiErrorMessage(err));
        } else {
          setTopLevelError(getApiErrorMessage(err) || 'Import thất bại');
        }
      },
    });
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Link href="/admin/words" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none', border: '1px solid var(--theme-border)' }}>
          <IconArrowLeft size={14} /> Quay lại
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 2 }}>Import từ vựng từ JSON</h1>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Chọn nhiều file JSON. Mỗi file là một mảng các từ. Upsert theo (word + level), rollback toàn bộ nếu có lỗi.</p>
        </div>
      </div>

      {/* Drop / pick area */}
      <div style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px dashed var(--theme-border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F120', color: '#6366F1' }}>
              <IconUpload size={20} />
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)' }}>
                {files.length === 0 ? 'Chưa chọn file' : `Đã chọn ${files.length} file (${formatBytes(totalSize)})`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Chỉ chấp nhận .json. Giới hạn 5MB / file.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={importMutation.isPending}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #6366F1', backgroundColor: 'transparent', color: '#6366F1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Chọn file
            </button>
            {files.length > 0 && (
              <button
                onClick={clearAll}
                disabled={importMutation.isPending}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-muted)', fontSize: 13, cursor: 'pointer' }}
              >
                Xoá
              </button>
            )}
            <button
              onClick={handleImport}
              disabled={files.length === 0 || importMutation.isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: files.length === 0 || importMutation.isPending ? 'var(--theme-border)' : '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: files.length === 0 || importMutation.isPending ? 'not-allowed' : 'pointer' }}
            >
              {importMutation.isPending ? <><IconLoader size={14} /> Đang import...</> : <><IconUpload size={14} /> Bắt đầu import</>}
            </button>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16, maxHeight: 320, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--theme-bg-card)' }}>
              <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>Tên file</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>Kích thước</th>
                <th style={{ padding: '8px 12px', width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={`${f.name}-${i}`} style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <td style={{ padding: '6px 12px', color: 'var(--theme-text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{f.name}</td>
                  <td style={{ padding: '6px 12px', color: 'var(--theme-text-muted)', textAlign: 'right' }}>{formatBytes(f.size)}</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => removeFile(i)}
                      disabled={importMutation.isPending}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-muted)', padding: 2, display: 'inline-flex' }}
                    >
                      <IconX size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ backgroundColor: '#22C55E15', border: '1px solid #22C55E', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#22C55E' }}><IconCheck size={18} /></span>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#22C55E' }}>Import thành công</h3>
          </div>
          <div style={{ fontSize: 13, color: 'var(--theme-text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div><strong style={{ color: 'var(--theme-text-primary)' }}>{result.files}</strong> file</div>
            <div><strong style={{ color: 'var(--theme-text-primary)' }}>{result.total}</strong> từ xử lý</div>
            <div><strong style={{ color: '#22C55E' }}>{result.created}</strong> tạo mới</div>
            <div><strong style={{ color: '#6366F1' }}>{result.updated}</strong> ghi đè</div>
          </div>
        </div>
      )}

      {/* Top-level error */}
      {topLevelError && (
        <div style={{ backgroundColor: '#EF444415', border: '1px solid #EF4444', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>Import thất bại</h3>
          <p style={{ fontSize: 12, color: 'var(--theme-text-secondary)' }}>{topLevelError}</p>
        </div>
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <div style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid #EF4444', borderRadius: 12, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>
            {errors.length} lỗi validation — không có dữ liệu nào được ghi vào DB
          </h3>
          <div style={{ maxHeight: 360, overflowY: 'auto', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)', borderRadius: 8, padding: 10 }}>
            <ol style={{ fontSize: 11, color: 'var(--theme-text-secondary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', listStylePosition: 'inside', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {errors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
