'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ImportRow, ImportResult, ImportValidationError, WordType, WordTypeInfo } from '@/types/personalWord';

// ============================================
// Validation
// ============================================
function validateImportRow(row: ImportRow, rowIndex: number): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  if (!row.word?.trim()) {
    errors.push({ row: rowIndex, field: 'word', message: 'Từ không được để trống' });
  }
  if (!row.translationEn?.trim()) {
    errors.push({ row: rowIndex, field: 'translationEn', message: 'Nghĩa tiếng Anh không được để trống' });
  }
  if (!row.translationVi?.trim()) {
    errors.push({ row: rowIndex, field: 'translationVi', message: 'Nghĩa tiếng Việt không được để trống' });
  }

  const validTypes: WordType[] = ['nomen', 'verb', 'adjektiv', 'adverb', 'praposition', 'konjunktion', 'pronomen', 'partikel', 'andere'];
  if (!row.wordType || !validTypes.includes(row.wordType)) {
    errors.push({ row: rowIndex, field: 'wordType', message: `Từ loại phải là: ${validTypes.join(', ')}` });
  }

  if (row.wordType === 'nomen') {
    if (!row.article || !['der', 'die', 'das'].includes(row.article.toLowerCase())) {
      errors.push({ row: rowIndex, field: 'article', message: 'Danh từ phải có mạo từ (der/die/das)' });
    }
  }

  return errors;
}

// ============================================
// Column mapping (Vietnamese + German + English headers)
// ============================================
const COLUMN_MAP: Record<string, keyof ImportRow> = {
  'từ': 'word', 'tu': 'word', 'word': 'word', 'wort': 'word',
  'loại': 'wordType', 'loai': 'wordType', 'từ loại': 'wordType', 'wordtype': 'wordType', 'type': 'wordType',
  'mạo từ': 'article', 'mao tu': 'article', 'article': 'article', 'artikel': 'article',
  'số nhiều': 'plural', 'so nhieu': 'plural', 'plural': 'plural',
  'partizipii': 'partizipII', 'partizip ii': 'partizipII', 'partizip2': 'partizipII',
  'hilfsverb': 'hilfsverb',
  'komparativ': 'komparativ',
  'superlativ': 'superlativ',
  'kasus': 'kasus',
  'nghĩa anh': 'translationEn', 'nghia anh': 'translationEn', 'tiếng anh': 'translationEn', 'english': 'translationEn', 'en': 'translationEn', 'translationen': 'translationEn',
  'nghĩa việt': 'translationVi', 'nghia viet': 'translationVi', 'tiếng việt': 'translationVi', 'vietnamese': 'translationVi', 'vi': 'translationVi', 'translationvi': 'translationVi',
  'ví dụ': 'examples', 'vi du': 'examples', 'examples': 'examples', 'example': 'examples',
  'cấp độ': 'level', 'cap do': 'level', 'level': 'level',
  'chủ đề': 'category', 'chu de': 'category', 'category': 'category',
  'ghi chú': 'notes', 'ghi chu': 'notes', 'notes': 'notes', 'note': 'notes',
  'tags': 'tags', 'tag': 'tags',
};

// ============================================
// Modal Props
// ============================================
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: ImportRow[]) => Promise<ImportResult>;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<ImportValidationError[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setParsedRows([]);
    setPreviewErrors([]);
    setImportResult(null);
    setImportError(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Parse Excel file
  const parseExcel = (data: ArrayBuffer): ImportRow[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (jsonData.length === 0) return [];

    return jsonData.map((row) => {
      const mapped: Partial<ImportRow> = {};

      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase().trim();
        const fieldName = COLUMN_MAP[normalizedKey];
        if (fieldName && value !== null && value !== undefined) {
          const stringValue = String(value).trim();
          
          // Normalize wordType immediately
          if (fieldName === 'wordType') {
            mapped[fieldName] = stringValue.toLowerCase() as WordType;
          }
          // Normalize article immediately
          else if (fieldName === 'article') {
            mapped[fieldName] = stringValue.toLowerCase();
          }
          else {
            mapped[fieldName] = stringValue;
          }
        }
      });

      return {
        word: mapped.word || '',
        wordType: (mapped.wordType || 'andere') as WordType,
        article: mapped.article,
        plural: mapped.plural,
        partizipII: mapped.partizipII,
        hilfsverb: mapped.hilfsverb,
        komparativ: mapped.komparativ,
        superlativ: mapped.superlativ,
        kasus: mapped.kasus,
        translationEn: mapped.translationEn || '',
        translationVi: mapped.translationVi || '',
        examples: mapped.examples,
        level: mapped.level || 'A1',
        category: mapped.category,
        tags: mapped.tags,
        notes: mapped.notes,
      };
    }).filter(r => r.word.trim());
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result as ArrayBuffer;
        const rows = parseExcel(data);

        if (rows.length === 0) {
          setImportError('File không có dữ liệu hoặc định dạng không đúng.');
          return;
        }

        setParsedRows(rows);

        const allErrors: ImportValidationError[] = [];
        rows.forEach((row, i) => {
          const errors = validateImportRow(row, i + 1);
          allErrors.push(...errors);
        });
        setPreviewErrors(allErrors);
        setStep('preview');
      } catch (err) {
        console.error(err);
        setImportError('Không thể đọc file. Vui lòng kiểm tra định dạng Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Import handler
  const handleImport = async () => {
    setStep('importing');
    setImportError(null);
    try {
      const result = await onImport(parsedRows);
      setImportResult(result);
      setStep('result');
    } catch (err: any) {
      setImportError(err?.message || 'Import thất bại.');
      setStep('preview');
    }
  };

  // Download template
  const downloadTemplate = () => {
    const headers = ['word', 'wordType', 'article', 'plural', 'partizipII', 'hilfsverb', 'translationEn', 'translationVi', 'examples', 'level', 'category', 'notes'];
    const sampleData = [
      ['Haus', 'nomen', 'das', 'Häuser', '', '', 'house', 'ngôi nhà', 'Das Haus ist groß.', 'A1', 'Wohnen', ''],
      ['gehen', 'verb', '', '', 'gegangen', 'sein', 'to go', 'đi', 'Ich gehe nach Hause.', 'A1', 'Bewegung', 'Bất quy tắc'],
      ['schnell', 'adjektiv', '', '', '', '', 'fast', 'nhanh', 'Der Zug ist schnell.', 'A1', '', ''],
      ['mit', 'praposition', '', '', '', '', 'with', 'với', 'Ich gehe mit dir.', 'A1', '', 'Dativ'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 6 },
      { wch: 12 }, { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Words');
    XLSX.writeFile(workbook, 'word-bank-template.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { reset(); onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: 'var(--theme-bg-card, #ffffff)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>📥 Import từ vựng (Excel)</h2>
          <button onClick={() => { reset(); onClose(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-xl transition-colors" style={{ color: 'var(--theme-text-muted)' }}>✕</button>
        </div>

        <div className="p-5">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                <h3 className="font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>📊 Định dạng Excel (.xlsx)</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--theme-text-muted)' }}>Từ đã có trong sổ sẽ được <strong>tự động bỏ qua</strong>.</p>
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-left border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <th className="p-1.5 font-bold">Cột</th><th className="p-1.5">Mô tả</th><th className="p-1.5">Bắt buộc</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--theme-text-muted)' }}>
                    <tr><td className="p-1.5 font-mono">word</td><td>Từ gốc</td><td style={{ color: '#EF4444', fontWeight: 'bold' }}>✱</td></tr>
                    <tr><td className="p-1.5 font-mono">wordType</td><td>nomen / verb / adjektiv / ...</td><td style={{ color: '#EF4444', fontWeight: 'bold' }}>✱</td></tr>
                    <tr><td className="p-1.5 font-mono">article</td><td>der / die / das</td><td style={{ color: '#EF4444' }}>✱ nomen</td></tr>
                    <tr><td className="p-1.5 font-mono">translationEn</td><td>Nghĩa tiếng Anh</td><td style={{ color: '#EF4444', fontWeight: 'bold' }}>✱</td></tr>
                    <tr><td className="p-1.5 font-mono">translationVi</td><td>Nghĩa tiếng Việt</td><td style={{ color: '#EF4444', fontWeight: 'bold' }}>✱</td></tr>
                    <tr><td className="p-1.5 font-mono">level</td><td>A1 / A2 / B1 / B2 / C1</td><td></td></tr>
                  </tbody>
                </table>
                <button onClick={downloadTemplate}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  📥 Tải file mẫu Excel
                </button>
              </div>

              {importError && (
                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(239,68,68,.06)', borderColor: 'rgba(239,68,68,.2)' }}>
                  <p className="text-sm" style={{ color: '#EF4444' }}>❌ {importError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-primary)' }}>📁 Chọn file Excel</label>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload}
                  className="w-full p-3 rounded-xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }} />
              </div>
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  📋 Xem trước: {parsedRows.length} từ
                  <span className="text-sm font-normal ml-2" style={{ color: 'var(--theme-text-muted)' }}>({fileName})</span>
                </h3>
                <button onClick={reset} className="text-sm text-blue-500 hover:underline">← Chọn file khác</button>
              </div>

              {importError && <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(239,68,68,.06)', borderColor: 'rgba(239,68,68,.2)' }}><p className="text-sm" style={{ color: '#EF4444' }}>❌ {importError}</p></div>}

              {previewErrors.length > 0 && (
                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(245,158,11,.06)', borderColor: 'rgba(245,158,11,.2)' }}>
                  <p className="font-medium mb-2" style={{ color: '#D97706' }}>⚠️ {previewErrors.length} cảnh báo</p>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {previewErrors.slice(0, 20).map((err, i) => (
                      <p key={i} className="text-xs" style={{ color: '#D97706' }}>Dòng {err.row}: [{err.field}] {err.message}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--theme-border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                      <th className="p-2 text-left text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>#</th>
                      <th className="p-2 text-left text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Từ</th>
                      <th className="p-2 text-left text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Loại</th>
                      <th className="p-2 text-left text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>EN</th>
                      <th className="p-2 text-left text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>VI</th>
                      <th className="p-2 text-left text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 50).map((row, i) => {
                      const info = WordTypeInfo[row.wordType] || WordTypeInfo.andere;
                      const hasCritical = previewErrors.some(e => e.row === i + 1 && ['word', 'translationEn', 'translationVi', 'wordType', 'article'].includes(e.field));
                      return (
                        <tr key={i} className="border-t" style={{ borderColor: 'var(--theme-border)', backgroundColor: hasCritical ? 'rgba(239,68,68,0.08)' : undefined }}>
                          <td className="p-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>{i + 1}</td>
                          <td className="p-2 font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                            {row.article && <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{row.article} </span>}{row.word}
                            {hasCritical && <span className="ml-1" style={{ color: '#EF4444' }}>⚠</span>}
                          </td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: info.color }}>{info.icon} {info.labelDe}</span></td>
                          <td className="p-2 text-sm max-w-40 truncate" style={{ color: 'var(--theme-text-muted)' }}>{row.translationEn}</td>
                          <td className="p-2 text-sm max-w-40 truncate" style={{ color: 'var(--theme-text-muted)' }}>{row.translationVi}</td>
                          <td className="p-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>{row.level || 'A1'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {parsedRows.length > 50 && <p className="p-2 text-center text-xs" style={{ color: 'var(--theme-text-muted)' }}>...và {parsedRows.length - 50} từ khác</p>}
              </div>

              <button onClick={handleImport} className="w-full py-3 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700">
                ✅ Import {parsedRows.length} từ
              </button>
            </div>
          )}

          {/* STEP 2.5: Importing */}
          {step === 'importing' && (
            <div className="text-center py-16">
              <div className="animate-spin text-5xl mb-4">📥</div>
              <p className="text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>Đang import {parsedRows.length} từ...</p>
            </div>
          )}

          {/* STEP 3: Result */}
          {step === 'result' && importResult && (
            <div className="space-y-5 py-4">
              <div className="text-center">
                <div className="text-5xl mb-3">{importResult.added > 0 ? '🎉' : '📋'}</div>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Kết quả Import</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
                  <div className="text-3xl font-bold" style={{ color: '#22C55E' }}>{importResult.added}</div>
                  <div className="text-sm font-medium" style={{ color: '#22C55E' }}>✅ Đã thêm</div>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(234,179,8,0.1)' }}>
                  <div className="text-3xl font-bold" style={{ color: '#D97706' }}>{importResult.skipped}</div>
                  <div className="text-sm font-medium" style={{ color: '#D97706' }}>⏭️ Đã có</div>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                  <div className="text-3xl font-bold" style={{ color: '#EF4444' }}>{importResult.failed}</div>
                  <div className="text-sm font-medium" style={{ color: '#EF4444' }}>❌ Lỗi</div>
                </div>
              </div>

              {importResult.skippedWords && importResult.skippedWords.length > 0 && (
                <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: '#D97706' }}>⏭️ Từ đã có (bỏ qua):</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {importResult.skippedWords.slice(0, 30).map((w, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(245,158,11,.1)', color: '#D97706' }}>{w}</span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => { reset(); onClose(); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Đóng</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}