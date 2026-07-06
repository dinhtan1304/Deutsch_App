'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ACCENT, STATUS } from '@/lib/tokens';
import { IconChevronLeft, IconFlame, IconCheckCircle, IconXCircle } from '@/components/ui/Icons';
import type { TrainerExercise, TrainerMode } from '@/lib/api/grammarTrainer';
import { gradeAnswer, buildOptions, skillTagLabel } from '@/lib/grammarTrainer/engine';
import { WhyExplainer } from '@/components/grammar/WhyExplainer';
import { getDelayText } from '@/lib/srs';
import { useGrammarSrsStats, useGrammarSrsSession, useReviewGrammarSrs } from '@/hooks/useGrammarSrs';
import { ReportExerciseModal } from '@/components/grammar/trainer/ReportExerciseModal';

type Phase = 'list' | 'drill' | 'done';
type AnswerMode = 'type' | 'choose';

const MODES: { mode: TrainerMode; label: string; desc: string; accent: string }[] = [
  { mode: 'cases', label: 'Cách (Kasus)', desc: 'Nominativ · Akkusativ · Dativ · Genitiv', accent: ACCENT.vocab },
  { mode: 'conjugation', label: 'Chia động từ', desc: 'Präsens · Präteritum · Perfekt · Futur I', accent: ACCENT.srs },
];
const UMLAUTS = ['ä', 'ö', 'ü', 'ß'];
const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
// Module-scope wrapper: timing runs only inside event handlers, not render.
const nowMs = () => Date.now();

export default function GrammarReviewPage() {
  const { data: stats, isLoading } = useGrammarSrsStats();
  const [mode, setMode] = useState<TrainerMode | null>(null);
  const [phase, setPhase] = useState<Phase>('list');
  const session = useGrammarSrsSession(phase === 'drill' ? mode : null);
  const reviewMutation = useReviewGrammarSrs();

  // drill state
  const [items, setItems] = useState<TrainerExercise[]>([]);
  const [idx, setIdx] = useState(0);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('type');
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [perTag, setPerTag] = useState<Record<string, { c: number; t: number }>>({});
  const startRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [result, setResult] = useState<{ xp: number; acc: number; delayMinutes: number; levelChanged?: { from: string; to: string; direction: 'up' | 'down' } } | null>(null);

  // Start the drill once the session exercises arrive.
  useEffect(() => {
    if (phase !== 'drill' || items.length > 0) return;
    if (session.data && session.data.exercises.length > 0) {
      setItems(session.data.exercises);
      setIdx(0); setCorrect(0); setStreak(0); setPerTag({});
      setInput(''); setSelected(null); setRevealed(false);
      startRef.current = nowMs();
    }
  }, [phase, session.data, items.length]);

  const current = items[idx];
  const options = useMemo(
    () => (current && answerMode === 'choose' ? buildOptions(current) : []),
    [current, answerMode],
  );

  function startTrack(m: TrainerMode) {
    setMode(m);
    setItems([]);
    setResult(null);
    setPhase('drill');
  }

  function submit() {
    if (!current || revealed) return;
    const given = answerMode === 'type' ? input : selected ?? '';
    if (!given.trim()) return;
    const ok = gradeAnswer(given, current);
    setLastCorrect(ok);
    setRevealed(true);
    setPerTag((p) => {
      const cur = p[current.skillTag] ?? { c: 0, t: 0 };
      return { ...p, [current.skillTag]: { c: cur.c + (ok ? 1 : 0), t: cur.t + 1 } };
    });
    if (ok) { setCorrect((c) => c + 1); setStreak((s) => s + 1); } else setStreak(0);
  }

  function next() {
    if (idx + 1 >= items.length) { finish(); return; }
    setIdx((i) => i + 1);
    setInput(''); setSelected(null); setRevealed(false);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function finish() {
    const breakdown: Record<string, { correct: number; total: number }> = {};
    for (const [tag, v] of Object.entries(perTag)) breakdown[tag] = { correct: v.c, total: v.t };
    const acc = items.length > 0 ? Math.round((correct / items.length) * 100) : 0;
    reviewMutation.mutate(
      { mode: mode as TrainerMode, level: session.data?.level, totalItems: items.length, correctItems: correct, durationMs: nowMs() - startRef.current, breakdown },
      {
        onSuccess: (res) => setResult({
          xp: res.xpEarned, acc,
          delayMinutes: Math.max(1, Math.round((new Date(res.nextReviewAt).getTime() - nowMs()) / 60000)),
          levelChanged: res.levelChanged,
        }),
        onError: () => setResult({ xp: 0, acc, delayMinutes: 10 }),
      },
    );
    setPhase('done');
  }

  function insertUmlaut(ch: string) {
    const el = inputRef.current;
    if (!el) { setInput((v) => v + ch); return; }
    const s = el.selectionStart ?? input.length;
    const e = el.selectionEnd ?? input.length;
    setInput(input.slice(0, s) + ch + input.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + ch.length, s + ch.length); });
  }

  // ─────────── LIST ───────────
  if (phase === 'list') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Link href="/smart-review" className="mb-3 inline-flex items-center gap-1 text-body font-medium transition-opacity hover:opacity-70" style={{ color: ACCENT.brand }}>
          <IconChevronLeft size={15} /> Quay lại
        </Link>
        <header className="mb-6">
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>Ôn ngữ pháp (SRS)</h1>
          <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-muted)' }}>Thẻ ngữ pháp lặp lại theo lịch — luyện đúng phần bạn hay sai.</p>
        </header>

        <div className="space-y-3">
          {MODES.map(({ mode: m, label, desc, accent }) => {
            const st = stats?.byMode?.[m];
            const due = st?.due ?? false;
            return (
              <button key={m} onClick={() => startTrack(m)}
                className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: accent }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{label}</p>
                    {st?.level && (
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: tint(accent, 16), color: accent }}>{st.level}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>{desc}</p>
                </div>
                {due ? (
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: STATUS.danger }}>Đến hạn</span>
                ) : st?.nearGraduation ? (
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: tint(ACCENT.xp, 16), color: ACCENT.xp }}>Sắp lên cấp 🎯</span>
                ) : st ? (
                  <span className="shrink-0 text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{st.interval}d</span>
                ) : (
                  <span className="shrink-0 text-[11px] font-medium" style={{ color: ACCENT.brand }}>Bắt đầu</span>
                )}
              </button>
            );
          })}
        </div>
        {!isLoading && stats && stats.total === 0 && (
          <p className="mt-5 text-center text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            Chưa có thẻ nào. Luyện viết để hệ thống phát hiện điểm yếu ngữ pháp, hoặc bắt đầu một track ngay.
          </p>
        )}
      </div>
    );
  }

  // ─────────── DONE ───────────
  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="v2-accent-grad mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 96, height: 96, color: 'var(--accent-on)', fontSize: 28, fontWeight: 700 }}>
          {result?.acc ?? 0}%
        </div>
        <h2 className="mb-1.5 font-bold" style={{ fontSize: 22, color: 'var(--theme-text-primary)' }}>Hoàn thành!</h2>
        <p className="mb-2 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
          Đúng <strong style={{ color: 'var(--accent)' }}>{correct}</strong>/{items.length}
          {result && result.xp > 0 && <> · <strong style={{ color: ACCENT.xp }}>+{result.xp} XP</strong></>}
        </p>
        {result?.levelChanged && (
          <div className="mx-auto mb-4 max-w-xs rounded-xl px-4 py-3 text-body font-bold"
            style={{
              background: tint(result.levelChanged.direction === 'up' ? STATUS.success : ACCENT.xp, 14),
              border: `1px solid ${result.levelChanged.direction === 'up' ? STATUS.success : ACCENT.xp}`,
              color: result.levelChanged.direction === 'up' ? STATUS.success : ACCENT.xp,
            }}>
            {result.levelChanged.direction === 'up'
              ? `⬆️ Lên cấp ${result.levelChanged.to}! Giờ ôn ở độ khó cao hơn.`
              : `↔️ Hạ về ${result.levelChanged.to} để củng cố nền tảng.`}
          </div>
        )}
        {result && (
          <p className="mb-6 text-body" style={{ color: 'var(--theme-text-muted)' }}>
            ⟲ Ôn lại sau <strong style={{ color: 'var(--theme-text-primary)' }}>{getDelayText(result.delayMinutes)}</strong>
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2.5">
          <button onClick={() => { setPhase('list'); setMode(null); }} className="v2-accent-grad rounded-[11px] px-4 py-2.5 text-body font-semibold" style={{ color: 'var(--accent-on)' }}>
            Về danh sách
          </button>
          <Link href="/smart-review" className="inline-flex items-center rounded-[11px] px-4 py-2.5 text-body font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
            Lộ trình thông minh
          </Link>
        </div>
      </div>
    );
  }

  // ─────────── DRILL ───────────
  if (session.isLoading || !current) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-body" style={{ color: 'var(--theme-text-muted)' }}>
        {session.isLoading ? 'Đang tải đề…' : 'Chưa có bài tập cho phần này.'}
        {!session.isLoading && (
          <div className="mt-4"><button onClick={() => { setPhase('list'); setMode(null); }} className="text-body font-semibold" style={{ color: ACCENT.brand }}>← Về danh sách</button></div>
        )}
      </div>
    );
  }

  const fb = lastCorrect ? STATUS.success : STATUS.danger;
  const canSubmit = answerMode === 'type' ? !!input.trim() : !!selected;
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-3.5 flex items-center gap-3">
        <button onClick={() => { setPhase('list'); setMode(null); setItems([]); }} className="shrink-0" style={{ color: 'var(--theme-text-muted)' }} aria-label="Thoát">
          <IconChevronLeft size={18} />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
          <div className="v2-accent-grad h-full transition-[width] duration-200" style={{ width: `${(idx / items.length) * 100}%` }} />
        </div>
        <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{idx + 1}/{items.length}</span>
        <span className="inline-flex items-center gap-1 text-caption font-bold" style={{ color: streak > 0 ? ACCENT.xp : 'var(--theme-text-muted)' }}><IconFlame size={13} /> {streak}</span>
      </div>

      <div className="mb-4 flex gap-1.5">
        {(['type', 'choose'] as AnswerMode[]).map((am) => (
          <button key={am} onClick={() => setAnswerMode(am)}
            className="rounded-full px-3 py-1 text-caption font-semibold"
            style={{ background: answerMode === am ? 'var(--accent)' : 'var(--theme-bg-secondary)', color: answerMode === am ? 'var(--accent-on)' : 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
            {am === 'type' ? 'Tự gõ' : 'Bấm chọn'}
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-2xl border p-5" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <span className="mb-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: 'var(--accent)', background: tint('var(--accent)', 12) }}>
          {skillTagLabel(current.mode, current.skillTag)} · {current.level}
        </span>
        <div className="mb-4 text-lead font-semibold" style={{ color: 'var(--theme-text-primary)', lineHeight: 1.5 }}>{current.prompt}</div>

        {answerMode === 'type' ? (
          <>
            <input ref={inputRef} value={input} autoFocus disabled={revealed}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { if (revealed) next(); else submit(); } }}
              placeholder="Nhập đáp án…"
              className="w-full rounded-[11px] px-3.5 py-3 text-base outline-none"
              style={{ border: `1.5px solid ${revealed ? fb : 'var(--theme-border)'}`, background: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)' }} />
            {!revealed && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {UMLAUTS.map((u) => (
                  <button key={u} type="button" onMouseDown={(e) => { e.preventDefault(); insertUmlaut(u); }}
                    className="rounded-lg px-2.5 py-1 text-[15px]" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>{u}</button>
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
                  className="rounded-[11px] px-3.5 py-3 text-left text-[15px]"
                  style={{ border: `1.5px solid ${bc}`, background: bg, color: 'var(--theme-text-primary)', fontWeight: isPicked || isAns ? 600 : 400 }}>{opt}</button>
              );
            })}
          </div>
        )}

        {revealed && (
          <div className="mt-3.5 rounded-[11px] p-3" style={{ background: tint(fb, 10), border: `1px solid ${fb}` }}>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: fb }}>
              {lastCorrect ? <><IconCheckCircle size={16} /> Chính xác!</> : <><IconXCircle size={16} /> Đáp án: {current.answer}</>}
            </div>
            {current.explanationVi && (
              <div className="mt-1 text-body" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.5 }}>{current.explanationVi}</div>
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
      </div>

      <button onClick={revealed ? next : submit} disabled={!revealed && !canSubmit}
        className="v2-accent-grad w-full rounded-[11px] py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        style={{ color: 'var(--accent-on)' }}>
        {revealed ? (idx + 1 >= items.length ? 'Xem kết quả' : 'Câu tiếp →') : 'Kiểm tra'}
      </button>

      {reportId && <ReportExerciseModal exerciseId={reportId} onClose={() => setReportId(null)} />}
    </div>
  );
}
