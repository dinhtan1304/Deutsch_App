'use client';
/* eslint-disable no-restricted-syntax */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { useSettings } from '@/hooks/useUser';

interface Question {
  level: 'A1' | 'A2' | 'B1';
  sentence: string;
  options: string[];
  answer: number;
  hint: string;
}

const QUESTIONS: Question[] = [
  { level: 'A1', sentence: 'Das ___ mein Bruder.', options: ['ist', 'bist', 'sind', 'bin'], answer: 0, hint: 'Verb "sein"' },
  { level: 'A1', sentence: '___ heißt du?', options: ['Was', 'Wer', 'Wie', 'Wo'], answer: 2, hint: 'W-Fragen' },
  { level: 'A1', sentence: 'Ich ___ zwei Kinder.', options: ['hat', 'habe', 'haben', 'hast'], answer: 1, hint: 'Verb "haben"' },
  { level: 'A1', sentence: 'Wir ___ gern Fußball.', options: ['spielt', 'spiele', 'spielen', 'spielst'], answer: 2, hint: 'Konjugation Präsens' },
  { level: 'A1', sentence: '___ Apfel ist rot.', options: ['Die', 'Das', 'Der', 'Ein'], answer: 2, hint: 'Bestimmter Artikel' },
  { level: 'A2', sentence: 'Ich habe gestern einen Film ___.', options: ['sehen', 'gesehen', 'geseht', 'sah'], answer: 1, hint: 'Perfekt' },
  { level: 'A2', sentence: 'Er fährt morgen ___ seiner Mutter.', options: ['mit', 'auf', 'in', 'an'], answer: 0, hint: 'Dativ-Präpositionen' },
  { level: 'A2', sentence: 'Ich ___ morgen früh aufstehen.', options: ['kann', 'muss', 'darf', 'soll'], answer: 1, hint: 'Modalverben' },
  { level: 'A2', sentence: '___ du schon einmal in Berlin gewesen?', options: ['Hast', 'Bist', 'Wirst', 'Kannst'], answer: 1, hint: 'Perfekt mit "sein"' },
  { level: 'A2', sentence: 'Das Buch gehört ___ Lehrer.', options: ['der', 'den', 'dem', 'des'], answer: 2, hint: 'Dativ' },
  { level: 'B1', sentence: 'Wenn ich reich ___, würde ich um die Welt reisen.', options: ['bin', 'war', 'wäre', 'sei'], answer: 2, hint: 'Konjunktiv II' },
  { level: 'B1', sentence: 'Das ist der Mann, ___ ich gestern getroffen habe.', options: ['der', 'dem', 'den', 'dessen'], answer: 2, hint: 'Relativpronomen (Akk.)' },
  { level: 'B1', sentence: 'Das Haus ___ letztes Jahr gebaut.', options: ['hat', 'ist', 'wird', 'wurde'], answer: 3, hint: 'Passiv Präteritum' },
  { level: 'B1', sentence: 'Er kam nicht zur Arbeit, ___ er krank war.', options: ['dass', 'weil', 'ob', 'wenn'], answer: 1, hint: 'Kausale Nebensätze' },
  { level: 'B1', sentence: 'Je mehr ich lerne, ___ besser verstehe ich.', options: ['so', 'desto', 'als', 'wie'], answer: 1, hint: 'je ... desto' },
];

const LEVEL_COLORS: Record<string, string> = { A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab };

function determineLevel(a1: number, a2: number, b1: number): string {
  if (a1 >= 3 && a2 >= 3 && b1 >= 3) return 'B1';
  if (a1 >= 3 && a2 >= 3) return 'A2';
  return 'A1';
}

function determineSublevel(a1: number, a2: number, b1: number): { level: string; sublabel: string } {
  const base = determineLevel(a1, a2, b1);
  if (base === 'A1') {
    return a1 >= 4
      ? { level: 'A1', sublabel: 'A1.2 — Nền tảng vững' }
      : { level: 'A1', sublabel: 'A1.1 — Bắt đầu' };
  }
  if (base === 'A2') {
    return a2 >= 4
      ? { level: 'A2', sublabel: 'A2.2 — Trên sơ cấp' }
      : { level: 'A2', sublabel: 'A2.1 — Sơ cấp' };
  }
  return b1 >= 4
    ? { level: 'B1', sublabel: 'B1.2 — Trung cấp vững' }
    : { level: 'B1', sublabel: 'B1.1 — Trung cấp thấp' };
}

type Phase = 'intro' | 'quiz' | 'result';

export default function PlacementRetakePage() {
  const router = useRouter();
  const { data: settings } = useSettings();
  const [phase, setPhase] = useState<Phase>('intro');
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const scores = useMemo(() => {
    const a1 = answers.slice(0, 5).filter(Boolean).length;
    const a2 = answers.slice(5, 10).filter(Boolean).length;
    const b1 = answers.slice(10, 15).filter(Boolean).length;
    return { a1, a2, b1, total: a1 + a2 + b1 };
  }, [answers]);

  const { level, sublabel } = useMemo(() => determineSublevel(scores.a1, scores.a2, scores.b1), [scores]);

  const handleAnswer = useCallback((optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    const correct = optIdx === QUESTIONS[qIdx]!.answer;
    setAnswers(prev => [...prev, correct]);

    timer.current = setTimeout(() => {
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(i => i + 1);
        setSelected(null);
      } else {
        setPhase('result');
      }
    }, 800);
  }, [selected, qIdx]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.updateSettings({ preferredLevel: level as any });
      router.push('/profile');
    } catch {
      setSaving(false);
    }
  };

  const q = QUESTIONS[qIdx]!;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="w-full max-w-lg">

        {/* Intro */}
        {phase === 'intro' && (
          <div className="rounded-2xl border p-8 text-center"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              Kiểm tra trình độ
            </h1>
            <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
              15 câu hỏi ngữ pháp — mỗi 5 câu cho A1, A2, B1
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
              Kết quả sẽ cập nhật level gợi ý của bạn. Mất khoảng 3-5 phút.
            </p>
            {settings?.preferredLevel && (
              <p className="text-xs mb-4 px-3 py-1.5 rounded-lg inline-block"
                style={{ backgroundColor: 'rgba(99,102,241,.08)', color: ACCENT.writing }}>
                Level hiện tại: {settings.preferredLevel}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Link href="/profile" className="px-5 py-2.5 rounded-xl border font-semibold text-body"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                Quay lại
              </Link>
              <button onClick={() => setPhase('quiz')}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }}>
                Bắt đầu
              </button>
            </div>
          </div>
        )}

        {/* Quiz */}
        {phase === 'quiz' && (
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium" style={{ color: LEVEL_COLORS[q.level] }}>{q.level}</span>
              <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{qIdx + 1}/{QUESTIONS.length}</span>
            </div>
            <div className="h-1.5 rounded-full mb-5 overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${((qIdx + 1) / QUESTIONS.length) * 100}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }} />
            </div>

            {/* Question */}
            <p className="text-caption mb-1" style={{ color: 'var(--theme-text-muted)' }}>{q.hint}</p>
            <p className="text-lg font-bold mb-5" style={{ color: 'var(--theme-text-primary)' }}>{q.sentence}</p>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.answer;
                const showResult = selected !== null;

                let bg = 'var(--theme-bg-secondary)';
                let border = 'var(--theme-border)';
                let textColor = 'var(--theme-text-primary)';

                if (showResult && isCorrect) {
                  bg = 'rgba(34,197,94,.12)'; border = STATUS.success; textColor = STATUS.success;
                } else if (showResult && isSelected && !isCorrect) {
                  bg = 'rgba(239,68,68,.1)'; border = STATUS.danger; textColor = STATUS.danger;
                }

                return (
                  <button key={i} onClick={() => handleAnswer(i)}
                    disabled={selected !== null}
                    className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all"
                    style={{ backgroundColor: bg, borderColor: border, color: textColor }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="rounded-2xl border p-8 text-center"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="text-4xl mb-2">🎯</div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              Kết quả
            </h2>
            <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
              {scores.total}/15 câu đúng
            </p>

            {/* Breakdown by level */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {(['A1', 'A2', 'B1'] as const).map(lv => {
                const s = lv === 'A1' ? scores.a1 : lv === 'A2' ? scores.a2 : scores.b1;
                return (
                  <div key={lv} className="rounded-xl p-3"
                    style={{ backgroundColor: `${LEVEL_COLORS[lv]}10` }}>
                    <div className="text-caption font-bold" style={{ color: LEVEL_COLORS[lv] }}>{lv}</div>
                    <div className="text-xl font-extrabold" style={{ color: LEVEL_COLORS[lv] }}>{s}/5</div>
                  </div>
                );
              })}
            </div>

            {/* Suggested level */}
            <div className="rounded-xl p-4 mb-5"
              style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[level]}12, ${LEVEL_COLORS[level]}06)`, border: `1px solid ${LEVEL_COLORS[level]}30` }}>
              <div className="text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                Trình độ ước tính
              </div>
              <div className="text-2xl font-extrabold" style={{ color: LEVEL_COLORS[level] }}>
                {sublabel}
              </div>
              <div className="text-caption mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Ước tính dựa trên 15 câu ngữ pháp — không thay thế bài thi chính thức.
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link href="/profile" className="px-5 py-2.5 rounded-xl border font-semibold text-body"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                Giữ nguyên
              </Link>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Đang lưu...' : `Cập nhật → ${level}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
