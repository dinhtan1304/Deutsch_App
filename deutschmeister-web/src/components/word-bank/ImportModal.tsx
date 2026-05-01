'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ImportRow, ImportResult, ImportValidationError, WordType, WordTypeInfo } from '@/types/personalWord';
import { IconDownload, IconX, IconLoader, IconCheck, IconUpload } from '@/components/ui/Icons';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

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
    const sheetName = workbook.SheetNames[0]!;
    const worksheet = workbook.Sheets[sheetName]!;
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
        if (process.env.NODE_ENV === 'development') console.error(err);
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
    } catch (err) {
      setImportError((err as Error | undefined)?.message || 'Import thất bại.');
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
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import từ vựng từ file Excel"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: 'var(--theme-bg-card, #ffffff)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              // eslint-disable-next-line no-restricted-syntax
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              <IconDownload size={17} className="text-white" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Import từ vựng (Excel)
            </h2>
          </div>
          <button onClick={() => { reset(); onClose(); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-70"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            <IconX size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                <h3 className="font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Định dạng Excel (.xlsx)</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--theme-text-muted)' }}>Từ đã có trong sổ sẽ được <strong>tự động bỏ qua</strong>.</p>
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-left border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <th className="p-1.5 font-bold">Cột</th><th className="p-1.5">Mô tả</th><th className="p-1.5">Bắt buộc</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--theme-text-muted)' }}>
                    <tr><td className="p-1.5 font-mono">word</td><td>Từ gốc</td><td style={{ color: STATUS.danger, fontWeight: 'bold' }}>✱</td></tr>
                    <tr><td className="p-1.5 font-mono">wordType</td><td>nomen / verb / adjektiv / ...</td><td style={{ color: STATUS.danger, fontWeight: 'bold' }}>✱</td></tr>
                    <tr><td className="p-1.5 font-mono">article</td><td>der / die / das</td><td style={{ color: STATUS.danger }}>✱ nomen</td></tr>
                    <tr><td className="p-1.5 font-mono">translationEn</td><td>Nghĩa tiếng Anh</td><td style={{ color: STATUS.danger, fontWeight: 'bold' }}>✱</td></tr>
                    <tr><td className="p-1.5 font-mono">translationVi</td><td>Nghĩa tiếng Việt</td><td style={{ color: STATUS.danger, fontWeight: 'bold' }}>✱</td></tr>
                    <tr><td className="p-1.5 font-mono">level</td><td>A1 / A2 / B1 / B2 / C1</td><td></td></tr>
                  </tbody>
                </table>
                <button onClick={downloadTemplate}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                  // eslint-disable-next-line no-restricted-syntax
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  <IconDownload size={14} /> Tải file mẫu Excel
                </button>
              </div>

              {importError && (
                <div className="p-3 rounded-xl border" style={{ backgroundColor: `${STATUS.danger}0F`, borderColor: `${STATUS.danger}33` }}>
                  <p className="text-sm" style={{ color: STATUS.danger }}>{importError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Chọn file Excel</label>
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
                  Xem trước: {parsedRows.length} từ
                  <span className="text-sm font-normal ml-2" style={{ color: 'var(--theme-text-muted)' }}>({fileName})</span>
                </h3>
                <button onClick={reset} className="text-sm transition-all hover:opacity-70" style={{ color: ACCENT.srs }}>← Chọn file khác</button>
              </div>

              {importError && <div className="p-3 rounded-xl border" style={{ backgroundColor: `${STATUS.danger}0F`, borderColor: `${STATUS.danger}33` }}><p className="text-sm" style={{ color: STATUS.danger }}>{importError}</p></div>}

              {previewErrors.length > 0 && (
                <div className="p-3 rounded-xl border" style={{ backgroundColor: `${ACCENT.xp}0F`, borderColor: `${ACCENT.xp}33` }}>
                  <p className="font-medium mb-2" style={{ color: ACCENT.xp }}>{previewErrors.length} cảnh báo</p>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {previewErrors.slice(0, 20).map((err, i) => (
                      <p key={i} className="text-xs" style={{ color: ACCENT.xp }}>Dòng {err.row}: [{err.field}] {err.message}</p>
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
                        <tr key={i} className="border-t" style={{ borderColor: 'var(--theme-border)', backgroundColor: hasCritical ? `${STATUS.danger}14` : undefined }}>
                          <td className="p-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>{i + 1}</td>
                          <td className="p-2 font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                            {row.article && <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{row.article} </span>}{row.word}
                            {hasCritical && <span className="ml-1" style={{ color: STATUS.danger }}>⚠</span>}
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

              <button onClick={handleImport}
                className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all hover:shadow-md hover:-translate-y-0.5"
                // eslint-disable-next-line no-restricted-syntax
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                <IconUpload size={15} /> Import {parsedRows.length} từ
              </button>
            </div>
          )}

          {/* STEP 2.5: Importing */}
          {step === 'importing' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                style={{ background: `linear-gradient(135deg, ${STATUS.success}26, ${STATUS.success}1A)` }}>
                <IconLoader size={32} style={{ color: STATUS.success }} />
              </div>
              <p className="text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>Đang import {parsedRows.length} từ...</p>
            </div>
          )}

          {/* STEP 3: Result */}
          {step === 'result' && importResult && (
            <div className="space-y-5 py-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                  style={{ background: importResult.added > 0
                    ? `linear-gradient(135deg, ${STATUS.success}26, ${STATUS.success}1A)`
                    : `linear-gradient(135deg, var(--theme-bg-secondary), var(--theme-bg-tertiary))` }}>
                  <IconCheck size={32} style={{ color: importResult.added > 0 ? STATUS.success : 'var(--theme-text-muted)' }} />
                </div>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Kết quả Import</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: `${STATUS.success}1A` }}>
                  <div className="text-3xl font-bold" style={{ color: STATUS.success }}>{importResult.added}</div>
                  <div className="text-sm font-medium" style={{ color: STATUS.success }}>Đã thêm</div>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: `${ACCENT.xp}1A` }}>
                  <div className="text-3xl font-bold" style={{ color: ACCENT.xp }}>{importResult.skipped}</div>
                  <div className="text-sm font-medium" style={{ color: ACCENT.xp }}>Đã có</div>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: `${STATUS.danger}1A` }}>
                  <div className="text-3xl font-bold" style={{ color: STATUS.danger }}>{importResult.failed}</div>
                  <div className="text-sm font-medium" style={{ color: STATUS.danger }}>Lỗi</div>
                </div>
              </div>

              {importResult.skippedWords && importResult.skippedWords.length > 0 && (
                <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: ACCENT.xp }}>Từ đã có (bỏ qua):</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {importResult.skippedWords.slice(0, 30).map((w, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: `${ACCENT.xp}1A`, color: ACCENT.xp }}>{w}</span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => { reset(); onClose(); }}
                className="w-full py-3 rounded-xl font-medium text-white transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: GRADIENT.action }}>
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
