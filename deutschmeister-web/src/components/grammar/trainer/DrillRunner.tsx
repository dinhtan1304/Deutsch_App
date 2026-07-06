'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { ACCENT, STATUS } from '@/lib/tokens';
import { IconFlame, IconCheckCircle, IconXCircle, IconFileText } from '@/components/ui/Icons';
import { TENSES, CASES, TRAINER_LEVELS, TrainerExercise, TrainerMode } from '@/lib/api/grammarTrainer';
import { useTrainerExercises, useRecordTrainerSession } from '@/hooks/useGrammarTrainer';
import { buildOptions, gradeAnswer, skillTagLabel } from '@/lib/grammarTrainer/engine';
import { WhyExplainer } from '@/components/grammar/WhyExplainer';
import { ReportExerciseModal } from './ReportExerciseModal';

type AnswerMode = 'type' | 'choose';
type Phase = 'setup' | 'drill' | 'done';

const COUNTS = [10, 20, 30];
const UMLAUTS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

interface Committed {
  mode: TrainerMode;
  level: string;
  skillTags: string[];
  count: number;
}

const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
// Module-scope wrapper: drill timing runs only inside event handlers, not render.
const nowMs = () => Date.now();

export default function DrillRunner({ mode }: { mode: TrainerMode }) {
  const allTags = mode === 'conjugation' ? [...TENSES] : [...CASES];

  const [phase, setPhase] = useState<Phase>('setup');
  const [level, setLevel] = useState('A2');
  const [tags, setTags] = useState<string[]>(allTags);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('type');
  const [count, setCount] = useState(10);

  const [committed, setCommitted] = useState<Committed | null>(null);
  const exercisesQuery = useTrainerExercises(
    committed ?? { mode, level, skillTags: tags, count },
    !!committed,
  );

  // Drill state
  const [items, setItems] = useState<TrainerExercise[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [perTag, setPerTag] = useState<Record<string, { c: number; t: number }>>({});
  const [wrong, setWrong] = useState<TrainerExercise[]>([]);
  const startRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [reportId, setReportId] = useState<string | null>(null);
  const recordMutation = useRecordTrainerSession();
  const recordedRef = useRef(false);
  const awaitingStartRef = useRef(false);
  const [xpEarned, setXpEarned] = useState(0);

  function startDrill(list: TrainerExercise[]) {
    setItems(list);
    setIdx(0);
    setInput('');
    setSelected(null);
    setRevealed(false);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setPerTag({});
    setWrong([]);
    recordedRef.current = false;
    setXpEarned(0);
    startRef.current = nowMs();
    setPhase('drill');
  }

  // Khi đề về từ pool → vào drill (1 lần cho mỗi lần bấm "Bắt đầu").
  useEffect(() => {
    if (!awaitingStartRef.current || !committed) return;
    if (exercisesQuery.data) {
      awaitingStartRef.current = false;
      if (exercisesQuery.data.length > 0) startDrill(exercisesQuery.data);
    }
  }, [exercisesQuery.data, committed]);

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function begin() {
    const chosen = tags.length > 0 ? tags : allTags;
    awaitingStartRef.current = true;
    setCommitted({ mode, level, skillTags: chosen, count });
  }

  const current = items[idx];
  const options = useMemo(() => (current && answerMode === 'choose' ? buildOptions(current) : []), [current, answerMode]);
  const filledSentence = current && current.prompt.includes('___')
    ? current.prompt.replace(/\s*\([^)]*\)\s*$/, '').replace('___', current.answer)
    : null;

  function submit() {
    if (!current || revealed) return;
    const given = answerMode === 'type' ? input : selected ?? '';
    if (!given.trim()) return;
    const ok = gradeAnswer(given, current);
    setLastCorrect(ok);
    setRevealed(true);
    setPerTag((prev) => {
      const cur = prev[current.skillTag] ?? { c: 0, t: 0 };
      return { ...prev, [current.skillTag]: { c: cur.c + (ok ? 1 : 0), t: cur.t + 1 } };
    });
    if (ok) {
      setCorrect((c) => c + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
      setWrong((w) => [...w, current]);
    }
  }

  function next() {
    if (idx + 1 >= items.length) {
      finish();
      return;
    }
    setIdx((i) => i + 1);
    setInput('');
    setSelected(null);
    setRevealed(false);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function finish() {
    setPhase('done');
    if (recordedRef.current) return;
    recordedRef.current = true;
    const breakdown: Record<string, { correct: number; total: number }> = {};
    for (const [tag, v] of Object.entries(perTag)) breakdown[tag] = { correct: v.c, total: v.t };
    recordMutation.mutate(
      {
        mode,
        level: committed?.level ?? level,
        totalItems: items.length,
        correctItems: correct,
        durationMs: nowMs() - startRef.current,
        breakdown,
      },
      {
        onSuccess: (res) => setXpEarned(res.xpEarned),
        onError: () => {},
      },
    );
  }

  function insertUmlaut(ch: string) {
    const el = inputRef.current;
    if (!el) {
      setInput((v) => v + ch);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    setInput(input.slice(0, start) + ch + input.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  }

  function resetToSetup() {
    setCommitted(null);
    setPhase('setup');
  }

  // ─────────── SETUP ───────────
  if (phase === 'setup') {
    const loading = !!committed && exercisesQuery.isLoading;
    const empty = !!committed && exercisesQuery.isSuccess && (exercisesQuery.data?.length ?? 0) === 0;
    return (
      <Card className="max-w-2xl">
        <Group label="1. Trình độ">
          {TRAINER_LEVELS.map((l) => (
            <FilterChip key={l} active={level === l} onClick={() => setLevel(l)}>{l}</FilterChip>
          ))}
        </Group>

        <Group label={mode === 'conjugation' ? '2. Chọn thì' : '2. Chọn cách'}>
          {allTags.map((t) => (
            <FilterChip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>{skillTagLabel(mode, t)}</FilterChip>
          ))}
        </Group>

        <Group label="3. Chế độ trả lời">
          <FilterChip active={answerMode === 'type'} onClick={() => setAnswerMode('type')}>Tự gõ</FilterChip>
          <FilterChip active={answerMode === 'choose'} onClick={() => setAnswerMode('choose')}>Bấm chọn</FilterChip>
        </Group>

        <Group label="4. Số câu">
          {COUNTS.map((c) => (
            <FilterChip key={c} active={count === c} onClick={() => setCount(c)}>{String(c)}</FilterChip>
          ))}
        </Group>

        {empty && (
          <div className="rounded-lg p-3.5 mb-4 text-body" style={{ background: tint(ACCENT.xp, 12), border: `1px solid ${ACCENT.xp}`, color: 'var(--theme-text-secondary)' }}>
            Chưa có bài tập cho lựa chọn này. Admin cần tạo đề (AI generate hoặc import JSON) ở trang <strong>/admin/trainer</strong>.
          </div>
        )}

        <button
          onClick={begin}
          disabled={loading || tags.length === 0}
          className="v2-accent-grad w-full rounded-[11px] py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ color: 'var(--accent-on)' }}
        >
          {loading ? 'Đang tải đề…' : 'Bắt đầu luyện'}
        </button>
      </Card>
    );
  }

  // ─────────── DONE ───────────
  if (phase === 'done') {
    const acc = items.length > 0 ? Math.round((correct / items.length) * 100) : 0;
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="v2-accent-grad mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 96, height: 96, color: 'var(--accent-on)', fontSize: 28, fontWeight: 700 }}>
          {acc}%
        </div>
        <h2 className="font-bold mb-1.5" style={{ fontSize: 22, color: 'var(--theme-text-primary)' }}>Hoàn thành!</h2>
        <p className="text-body mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
          Đúng <strong style={{ color: 'var(--accent)' }}>{correct}</strong>/{items.length} · streak cao nhất <strong style={{ color: ACCENT.xp }}>{bestStreak}</strong>
          {xpEarned > 0 && <> · <strong style={{ color: ACCENT.xp }}>+{xpEarned} XP</strong></>}
        </p>

        <Card className="text-left mb-5" variant="bordered">
          {Object.entries(perTag).map(([tag, v]) => {
            const a = v.t > 0 ? Math.round((v.c / v.t) * 100) : 0;
            return (
              <div key={tag} className="flex items-center gap-2.5 mb-1.5 last:mb-0">
                <span className="text-caption" style={{ width: 104, color: 'var(--theme-text-secondary)' }}>{skillTagLabel(mode, tag)}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
                  <div className="h-full v2-accent-grad" style={{ width: `${a}%` }} />
                </div>
                <span className="text-caption text-right" style={{ width: 56, color: 'var(--theme-text-muted)' }}>{v.c}/{v.t}</span>
              </div>
            );
          })}
        </Card>

        <div className="flex gap-2.5 justify-center flex-wrap">
          {wrong.length > 0 && (
            <button onClick={() => startDrill(wrong)} className="rounded-[11px] px-4 py-2.5 text-body font-semibold" style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)' }}>
              Luyện lại {wrong.length} câu sai
            </button>
          )}
          <button onClick={resetToSetup} className="v2-accent-grad rounded-[11px] px-4 py-2.5 text-body font-semibold" style={{ color: 'var(--accent-on)' }}>
            Luyện bộ mới
          </button>
          <Link href="/grammar/trainer" className="rounded-[11px] px-4 py-2.5 text-body font-semibold inline-flex items-center" style={{ color: 'var(--theme-text-muted)' }}>
            Về hub
          </Link>
        </div>
      </div>
    );
  }

  // ─────────── DRILL ───────────
  if (!current) return null;
  const fb = lastCorrect ? STATUS.success : STATUS.danger;
  const canSubmit = answerMode === 'type' ? !!input.trim() : !!selected;
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-3.5">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
          <div className="h-full v2-accent-grad transition-[width] duration-200" style={{ width: `${(idx / items.length) * 100}%` }} />
        </div>
        <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{idx + 1}/{items.length}</span>
        <span className="inline-flex items-center gap-1 text-caption font-bold" style={{ color: streak > 0 ? ACCENT.xp : 'var(--theme-text-muted)' }}><IconFlame size={13} /> {streak}</span>
      </div>

      <Card className="mb-4">
        <span className="inline-block text-[11px] font-semibold rounded-full px-2.5 py-1 mb-3" style={{ color: 'var(--accent)', background: tint('var(--accent)', 12) }}>
          {skillTagLabel(mode, current.skillTag)} · {current.level}
        </span>
        <div className="text-lead font-semibold mb-4" style={{ color: 'var(--theme-text-primary)', lineHeight: 1.5 }}>
          {current.prompt}
        </div>

        {answerMode === 'type' ? (
          <>
            <input
              ref={inputRef}
              value={input}
              autoFocus
              disabled={revealed}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { if (revealed) next(); else submit(); } }}
              placeholder="Nhập đáp án…"
              className="w-full rounded-[11px] px-3.5 py-3 text-base outline-none"
              style={{
                border: `1.5px solid ${revealed ? fb : 'var(--theme-border)'}`,
                background: 'var(--theme-bg-body)',
                color: 'var(--theme-text-primary)',
              }}
            />
            {!revealed && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {UMLAUTS.map((u) => (
                  <button key={u} type="button" onMouseDown={(e) => { e.preventDefault(); insertUmlaut(u); }}
                    className="rounded-lg px-2.5 py-1 text-[15px]"
                    style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
                    {u}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-2">
            {options.map((opt) => {
              const isAns = revealed && gradeAnswer(opt, current);
              const isPicked = selected === opt;
              const wrongPick = revealed && isPicked && !isAns;
              const bc = isAns ? STATUS.success : wrongPick ? STATUS.danger : isPicked ? 'var(--accent)' : 'var(--theme-border)';
              const bg = isAns ? tint(STATUS.success, 12) : wrongPick ? tint(STATUS.danger, 12) : isPicked ? tint('var(--accent)', 8) : 'var(--theme-bg-body)';
              return (
                <button key={opt} disabled={revealed} onClick={() => setSelected(opt)}
                  className="text-left rounded-[11px] px-3.5 py-3 text-[15px]"
                  style={{ border: `1.5px solid ${bc}`, background: bg, color: 'var(--theme-text-primary)', fontWeight: isPicked || isAns ? 600 : 400 }}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {revealed && (
          <div className="mt-3.5 rounded-[11px] p-3" style={{ background: tint(fb, 10), border: `1px solid ${fb}` }}>
            <div className="text-sm font-bold inline-flex items-center gap-1.5" style={{ color: fb }}>
              {lastCorrect
                ? <><IconCheckCircle size={16} /> Chính xác!</>
                : <><IconXCircle size={16} /> Đáp án: {current.answer}</>}
            </div>
            {filledSentence && (
              <div className="text-sm font-semibold mt-1 flex items-start gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                <span className="shrink-0" style={{ color: fb, marginTop: 2 }}><IconFileText size={14} /></span>
                <span>{filledSentence}</span>
              </div>
            )}
            {current.explanationVi && (
              <div className="text-body mt-1" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.5 }}>{current.explanationVi}</div>
            )}
            {!lastCorrect && <WhyExplainer concept={current.skillTag} />}
            <button
              type="button"
              onClick={() => setReportId(current.id)}
              className="mt-2 text-caption underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Báo lỗi câu này
            </button>
          </div>
        )}
      </Card>

      <button
        onClick={revealed ? next : submit}
        disabled={!revealed && !canSubmit}
        className="v2-accent-grad w-full rounded-[11px] py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        style={{ color: 'var(--accent-on)' }}
      >
        {revealed ? (idx + 1 >= items.length ? 'Xem kết quả' : 'Câu tiếp →') : 'Kiểm tra'}
      </button>

      {reportId && <ReportExerciseModal exerciseId={reportId} onClose={() => setReportId(null)} />}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-caption font-medium uppercase mb-2" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.06em' }}>{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
