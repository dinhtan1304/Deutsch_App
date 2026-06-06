/**
 * Drill engine (client, nhẹ). Đề đến từ pool (API) nên ở đây chỉ:
 * - chuẩn hoá + chấm đáp án tức thì,
 * - dựng phương án cho chế độ bấm chọn,
 * - nhãn hiển thị cho thì/cách/ngôi.
 */

import type { TrainerExercise } from '@/lib/api/grammarTrainer';

export function normalizeGerman(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Chấm 1 câu: so khớp chuẩn hoá với answer + alternatives. */
export function gradeAnswer(input: string, ex: Pick<TrainerExercise, 'answer' | 'alternatives'>): boolean {
  const norm = normalizeGerman(input);
  if (!norm) return false;
  const accepted = [ex.answer, ...(ex.alternatives ?? [])].map(normalizeGerman);
  return accepted.includes(norm);
}

/** Phương án cho chế độ bấm chọn: answer + distractors, đã xáo trộn & loại trùng. */
export function buildOptions(ex: Pick<TrainerExercise, 'answer' | 'distractors'>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const opt of [ex.answer, ...(ex.distractors ?? [])]) {
    const key = normalizeGerman(opt);
    if (opt && !seen.has(key)) {
      seen.add(key);
      out.push(opt);
    }
  }
  // Fisher–Yates
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

// ── Nhãn hiển thị ──

export const TENSE_LABEL: Record<string, string> = {
  praesens: 'Präsens',
  praeteritum: 'Präteritum',
  perfekt: 'Perfekt',
  futur1: 'Futur I',
};

export const CASE_LABEL: Record<string, string> = {
  nominativ: 'Nominativ',
  akkusativ: 'Akkusativ',
  dativ: 'Dativ',
  genitiv: 'Genitiv',
};

export const CASE_QUESTION: Record<string, string> = {
  nominativ: 'Wer/Was?',
  akkusativ: 'Wen/Was?',
  dativ: 'Wem?',
  genitiv: 'Wessen?',
};

export function skillTagLabel(mode: string, tag: string): string {
  if (mode === 'conjugation') return TENSE_LABEL[tag] ?? tag;
  return CASE_LABEL[tag] ?? tag;
}
