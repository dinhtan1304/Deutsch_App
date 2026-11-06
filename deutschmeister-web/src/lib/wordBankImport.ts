/**
 * Word-bank import parsing, kept free of React so it is easy to reason about:
 * Excel rows, CSV/TSV files and Quizlet-style pasted text all end up as
 * ImportRow[] and go through the same validation/preview in ImportModal.
 */
import type { ImportRow, WordType } from '@/types/personalWord';

// Header aliases (Vietnamese + German + English) → ImportRow field.
export const COLUMN_MAP: Record<string, keyof ImportRow> = {
  'từ': 'word', 'tu': 'word', 'word': 'word', 'wort': 'word', 'term': 'word',
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

export type TermSeparator = '\t' | ',' | ';';

/**
 * Split delimited text into rows of cells. Handles a UTF-8 BOM, CRLF and
 * RFC 4180 quoting ("a, b" stays one cell, "" is an escaped quote) so a CSV
 * saved from Excel or Google Sheets survives with commas inside meanings.
 */
export function parseDelimited(text: string, sep: TermSeparator): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell.trim() === '') { quoted = true; cell = ''; continue; }
    if (ch === sep) { row.push(cell); cell = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      rows.push(row); row = [];
      continue;
    }
    cell += ch;
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }

  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ''));
}

/** Tab if any line has one (Quizlet's default), else whichever of ; or , is more common. */
export function detectSeparator(text: string): TermSeparator {
  const sample = text.split(/\r?\n/).slice(0, 20).join('\n');
  if (sample.includes('\t')) return '\t';
  const semis = (sample.match(/;/g) ?? []).length;
  const commas = (sample.match(/,/g) ?? []).length;
  return semis > commas ? ';' : ',';
}

/** "der Hund" → { article: 'der', word: 'Hund' }; anything else is returned as-is. */
export function splitArticle(term: string): { article?: string; word: string } {
  const m = term.trim().match(/^(der|die|das)\s+(.+)$/i);
  return m ? { article: m[1]!.toLowerCase(), word: m[2]!.trim() } : { word: term.trim() };
}

/** Map one header-keyed record (Excel sheet row or CSV with a header line) to an ImportRow. */
export function rowFromRecord(record: Record<string, unknown>): ImportRow {
  const mapped: Partial<Record<keyof ImportRow, string>> = {};
  for (const [key, value] of Object.entries(record)) {
    const field = COLUMN_MAP[key.toLowerCase().trim()];
    if (!field || value === null || value === undefined) continue;
    const s = String(value).trim();
    mapped[field] = field === 'wordType' || field === 'article' ? s.toLowerCase() : s;
  }

  // A noun typed as "der Hund" in the word column still gets its article.
  let word = mapped.word || '';
  let article = mapped.article;
  if (!article) {
    const split = splitArticle(word);
    if (split.article) { word = split.word; article = split.article; }
  }

  return {
    word,
    wordType: (mapped.wordType || (article ? 'nomen' : 'andere')) as WordType,
    article,
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
}

/**
 * Quizlet / Anki-style "term<sep>definition" line. The word bank requires both
 * a Vietnamese and an English meaning, and a flashcard export has only one
 * definition, so it fills both; the learner can refine either later.
 */
export function rowFromTermDefinition(term: string, definition: string): ImportRow {
  const { article, word } = splitArticle(term);
  return {
    word,
    wordType: (article ? 'nomen' : 'andere') as WordType,
    article,
    translationVi: definition,
    translationEn: definition,
    level: 'A1',
  };
}

/** True when the first row looks like a header: it names the word column and one more known field. */
function looksLikeHeader(cells: string[]): boolean {
  const fields = cells.map((c) => COLUMN_MAP[c.toLowerCase().trim()]).filter(Boolean);
  return fields.includes('word') && fields.length >= 2;
}

/**
 * Delimited text → ImportRow[]. A recognised header line maps columns by name
 * (same aliases as Excel); otherwise each line is read as term, definition.
 */
export function rowsFromDelimitedText(
  text: string,
  opts: { sep?: TermSeparator } = {},
): ImportRow[] {
  const sep = opts.sep ?? detectSeparator(text);
  const table = parseDelimited(text, sep);
  if (table.length === 0) return [];

  if (looksLikeHeader(table[0]!)) {
    const header = table[0]!;
    return table
      .slice(1)
      .map((cells) => rowFromRecord(Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']))))
      .filter((r) => r.word.trim());
  }

  return table
    .filter((cells) => cells.length >= 2 && cells[0])
    .map((cells) => rowFromTermDefinition(cells[0]!, cells.slice(1).join(', ').trim()));
}
