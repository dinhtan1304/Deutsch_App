'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamWritingSession, useSaveExamWritingDraft, useSubmitExamWriting } from '@/hooks/useExamWriting';
import { ExamWritingTeil } from '@/lib/api/examWriting';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCheck({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconChevronLeft({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconSend({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}

const ACCENT = '#A855F7';
const GRADIENT = 'linear-gradient(135deg, #A855F7, #6366F1)';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function taskTypeLabel(type: string) {
  const map: Record<string, string> = {
    form_fill:      'Formular ausfüllen',
    informal_email: 'E-Mail (informell)',
    formal_email:   'E-Mail (formell)',
    sms:            'SMS / Kurznachricht',
    forum_comment:  'Forumsbeitrag',
  };
  return map[type] || type;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ─── Word Count Bar ────────────────────────────────────────────────────────────
function WordCountBar({ count, min, max }: { count: number; min: number; max: number }) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  const ok = count >= min && count <= max;
  const over = count > max;
  const started = count > 0;
  const color = ok ? '#22C55E' : over ? '#EF4444' : started ? '#F59E0B' : 'var(--theme-border)';

  return (
    <div className="space-y-1.5">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color }}>
          {count} Wörter
          {ok && ' ✓'}
          {over && ' — zu lang ⚠'}
          {started && !ok && !over && ` — noch ${min - count} fehlend`}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{min}–{max}</span>
      </div>
    </div>
  );
}

// ─── Teil Writer ──────────────────────────────────────────────────────────────
function TeilWriter({ teil, value, onChange }: { teil: ExamWritingTeil; value: string; onChange: (v: string) => void }) {
  const wc = countWords(value);

  return (
    <div className="space-y-3">
      {/* Situation */}
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,.1), rgba(99,102,241,.08))', border: '1px solid rgba(168,85,247,.25)' }}>
        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>Situation</p>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
          {teil.scenario}
        </p>
      </div>

      {/* Task */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--theme-text-muted)' }}>Aufgabe</p>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
          {teil.taskDescription}
        </p>
        {teil.requiredPoints.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {teil.requiredPoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 mt-0.5"
                  style={{ background: GRADIENT }}>{i + 1}</span>
                <span className="text-[12px] leading-snug pt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{pt}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] mt-3 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
          Schreiben Sie ca. {teil.minWords}–{teil.maxWords} Wörter · max. {teil.maxPoints} Punkte
        </p>
      </div>

      {/* Textarea */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${value.trim() ? 'rgba(168,85,247,.5)' : 'var(--theme-border)'}`, backgroundColor: 'var(--theme-bg-card)' }}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Schreiben Sie hier Ihren Text…`}
          rows={8}
          className="w-full px-4 pt-4 pb-2 text-[14px] leading-relaxed resize-none outline-none block"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--theme-text-primary)',
            fontFamily: 'Georgia, serif',
            minHeight: '160px',
          }}
        />
        <div className="px-4 pb-4 pt-1">
          <WordCountBar count={wc} min={teil.minWords} max={teil.maxWords} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExamWritingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useExamWritingSession(id);
  const saveDraft = useSaveExamWritingDraft();
  const submitMut = useSubmitExamWriting();

  const [activeTeil, setActiveTeil] = useState(0);
  const [userTexts, setUserTexts] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref mirrors userTexts — lets the debounced callback read latest value
  // without adding userTexts to useCallback deps (would recreate on every keystroke)
  const userTextsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (session?.userTexts && Object.keys(userTexts).length === 0) {
      setUserTexts(session.userTexts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/writing/exam/${id}/result`);
    }
  }, [session?.status, id, router]);

  // Cancel pending autosave on unmount — prevents state updates after navigation
  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

  // Keep ref in sync with latest state value
  useEffect(() => { userTextsRef.current = userTexts; }, [userTexts]);

  const handleTextChange = useCallback((teilNum: number, value: string) => {
    const key = `teil_${teilNum}`;
    setUserTexts(prev => ({ ...prev, [key]: value }));
    setSaveState('idle');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        // Use ref instead of stale closure — always contains latest texts
        await saveDraft.mutateAsync({ id, userTexts: { ...userTextsRef.current, [key]: value } });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2500);
      } catch { setSaveState('idle'); }
    }, 1800);
  }, [id, saveDraft]); // userTexts removed — accessed via ref

  const handleSubmit = async () => {
    setConfirmSubmit(false);
    setErrorMsg('');
    try {
      await submitMut.mutateAsync({ id, userTexts });
      router.push(`/practice-test/writing/exam/${id}/result`);
    } catch {
      setErrorMsg('Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={28} />
          <p className="text-[14px]" style={{ color: 'var(--theme-text-muted)' }}>Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài thi.</p>
      </div>
    );
  }

  const teile = session.teile;
  const currentTeil = teile[activeTeil];
  if (!currentTeil) return null;

  const filledCount = teile.filter(t => (userTexts[`teil_${t.number}`] ?? '').trim().length > 0).length;
  const allFilled = filledCount === teile.length;
  const isLastTeil = activeTeil === teile.length - 1;

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="max-w-2xl mx-auto px-4">
          {/* Top row */}
          <div className="h-13 flex items-center gap-3" style={{ height: '52px' }}>
            <Link href="/practice-test/writing/exam"
              className="flex items-center gap-1 text-[13px] font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--theme-text-secondary)' }}>
              <IconChevronLeft size={14} /> Danh sách
            </Link>
            <div className="w-px h-4 shrink-0" style={{ backgroundColor: 'var(--theme-border)' }} />
            <p className="text-[13px] font-bold flex-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {session.examType} {session.cefrLevel} · Schreiben
            </p>
            {/* Autosave indicator */}
            {saveState === 'saving' && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                <IconLoader size={11} /> Speichern…
              </span>
            )}
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#22C55E' }}>
                <IconCheck size={11} /> Gespeichert
              </span>
            )}
          </div>

          {/* Teil tabs + overall progress */}
          <div className="pb-2.5 flex items-center gap-2">
            <div className="flex gap-1.5 flex-1 overflow-x-auto">
              {teile.map((teil, i) => {
                const filled = (userTexts[`teil_${teil.number}`] ?? '').trim().length > 0;
                const active = i === activeTeil;
                return (
                  <button key={teil.number} onClick={() => setActiveTeil(i)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border"
                    style={active
                      ? { background: GRADIENT, color: 'white', borderColor: 'transparent' }
                      : filled
                        ? { backgroundColor: 'rgba(168,85,247,.08)', color: ACCENT, borderColor: 'rgba(168,85,247,.3)' }
                        : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
                    Teil {teil.number}
                    {filled && !active && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                        <IconCheck size={9} style={{ color: 'white' }} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] font-semibold shrink-0" style={{ color: allFilled ? ACCENT : 'var(--theme-text-muted)' }}>
              {filledCount}/{teile.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-6">

        {/* Teil header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-extrabold text-white shrink-0"
            style={{ background: GRADIENT }}>{currentTeil.number}</span>
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {taskTypeLabel(currentTeil.taskType)}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              {currentTeil.minWords}–{currentTeil.maxWords} Wörter · max. {currentTeil.maxPoints} Punkte
            </p>
          </div>
        </div>

        <TeilWriter
          teil={currentTeil}
          value={userTexts[`teil_${currentTeil.number}`] ?? ''}
          onChange={v => handleTextChange(currentTeil.number, v)}
        />

        {/* ── Navigation ── */}
        <div className="flex gap-3 mt-5">
          {activeTeil > 0 && (
            <button onClick={() => setActiveTeil(activeTeil - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)' }}>
              <IconChevronLeft /> Teil {teile[activeTeil - 1].number}
            </button>
          )}
          <div className="flex-1" />
          {!isLastTeil && (
            <button onClick={() => setActiveTeil(activeTeil + 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: GRADIENT }}>
              Teil {teile[activeTeil + 1].number} <IconChevronRight />
            </button>
          )}
        </div>

        {/* ── Submit section (only on last Teil) ── */}
        {isLastTeil && (
          <div className="mt-5 rounded-2xl border p-4"
            style={{ borderColor: allFilled ? 'rgba(168,85,247,.3)' : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            {/* Per-Teil status chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {teile.map(t => {
                const filled = (userTexts[`teil_${t.number}`] ?? '').trim().length > 0;
                const wc = countWords(userTexts[`teil_${t.number}`] ?? '');
                return (
                  <button key={t.number} onClick={() => setActiveTeil(teile.indexOf(t))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all"
                    style={filled
                      ? { backgroundColor: 'rgba(168,85,247,.08)', color: ACCENT, borderColor: 'rgba(168,85,247,.3)' }
                      : { backgroundColor: 'rgba(239,68,68,.06)', color: '#EF4444', borderColor: 'rgba(239,68,68,.2)' }}>
                    Teil {t.number}
                    {filled ? <><IconCheck size={9} /> {wc}W</> : ' — leer'}
                  </button>
                );
              })}
            </div>

            {errorMsg && <p className="text-[12px] text-center mb-3" style={{ color: '#EF4444' }}>{errorMsg}</p>}

            {confirmSubmit ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmSubmit(false)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-semibold border transition-all"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'transparent' }}>
                  Hủy
                </button>
                <button onClick={handleSubmit} disabled={submitMut.isPending}
                  className="flex-1 py-3 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: GRADIENT }}>
                  {submitMut.isPending
                    ? <><IconLoader size={15} style={{ color: 'white' }} /> AI đang chấm...</>
                    : 'Xác nhận nộp bài'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => allFilled && setConfirmSubmit(true)}
                disabled={!allFilled || submitMut.isPending}
                className="w-full py-3.5 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: GRADIENT, boxShadow: allFilled ? '0 4px 14px rgba(168,85,247,.35)' : 'none' }}>
                <IconSend size={15} />
                {allFilled ? 'Nộp bài & AI chấm điểm' : `Còn ${teile.length - filledCount} Teil chưa viết`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
