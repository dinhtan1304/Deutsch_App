import { ACCENT, STATUS } from '@/lib/tokens';

export interface Question {
  level: 'A1' | 'A2' | 'B1';
  sentence: string;
  options: string[];
  answer: number;
  hint: string;
}

export const QUESTIONS: Question[] = [
  // ── A1 (1-5) ──
  { level: 'A1', sentence: 'Das ___ mein Bruder.', options: ['ist', 'bist', 'sind', 'bin'], answer: 0, hint: 'Verb "sein"' },
  { level: 'A1', sentence: '___ heißt du?', options: ['Was', 'Wer', 'Wie', 'Wo'], answer: 2, hint: 'W-Fragen' },
  { level: 'A1', sentence: 'Ich ___ zwei Kinder.', options: ['hat', 'habe', 'haben', 'hast'], answer: 1, hint: 'Verb "haben"' },
  { level: 'A1', sentence: 'Wir ___ gern Fußball.', options: ['spielt', 'spiele', 'spielen', 'spielst'], answer: 2, hint: 'Konjugation Präsens' },
  { level: 'A1', sentence: '___ Apfel ist rot.', options: ['Die', 'Das', 'Der', 'Ein'], answer: 2, hint: 'Bestimmter Artikel' },
  // ── A2 (6-10) ──
  { level: 'A2', sentence: 'Ich habe gestern einen Film ___.', options: ['sehen', 'gesehen', 'geseht', 'sah'], answer: 1, hint: 'Perfekt' },
  { level: 'A2', sentence: 'Er fährt morgen ___ seiner Mutter.', options: ['mit', 'auf', 'in', 'an'], answer: 0, hint: 'Dativ-Präpositionen' },
  { level: 'A2', sentence: 'Ich ___ morgen früh aufstehen.', options: ['kann', 'muss', 'darf', 'soll'], answer: 1, hint: 'Modalverben' },
  { level: 'A2', sentence: '___ du schon einmal in Berlin gewesen?', options: ['Hast', 'Bist', 'Wirst', 'Kannst'], answer: 1, hint: 'Perfekt mit "sein"' },
  { level: 'A2', sentence: 'Das Buch gehört ___ Lehrer.', options: ['der', 'den', 'dem', 'des'], answer: 2, hint: 'Dativ' },
  // ── B1 (11-15) ──
  { level: 'B1', sentence: 'Wenn ich reich ___, würde ich um die Welt reisen.', options: ['bin', 'war', 'wäre', 'sei'], answer: 2, hint: 'Konjunktiv II' },
  { level: 'B1', sentence: 'Das ist der Mann, ___ ich gestern getroffen habe.', options: ['der', 'dem', 'den', 'dessen'], answer: 2, hint: 'Relativpronomen (Akk.)' },
  { level: 'B1', sentence: 'Das Haus ___ letztes Jahr gebaut.', options: ['hat', 'ist', 'wird', 'wurde'], answer: 3, hint: 'Passiv Präteritum' },
  { level: 'B1', sentence: 'Er kam nicht zur Arbeit, ___ er krank war.', options: ['dass', 'weil', 'ob', 'wenn'], answer: 1, hint: 'Kausale Nebensätze' },
  { level: 'B1', sentence: 'Je mehr ich lerne, ___ besser verstehe ich.', options: ['so', 'desto', 'als', 'wie'], answer: 1, hint: 'je ... desto' },
];

export const GOALS = [
  { value: 10, label: '10 từ', sub: '~5 phút' },
  { value: 20, label: '20 từ', sub: '~10 phút' },
  { value: 30, label: '30 từ', sub: '~15 phút' },
] as const;

export const LEVEL_CONFIG = {
  A1: { color: STATUS.success, label: 'Sơ cấp' },
  A2: { color: ACCENT.srs, label: 'Sơ cấp cao' },
  B1: { color: ACCENT.vocab, label: 'Trung cấp' },
};

export function determineLevel(a1: number, a2: number, b1: number): keyof typeof LEVEL_CONFIG {
  if (a1 >= 3 && a2 >= 3 && b1 >= 3) return 'B1';
  if (a1 >= 3 && a2 >= 3) return 'A2';
  return 'A1';
}
