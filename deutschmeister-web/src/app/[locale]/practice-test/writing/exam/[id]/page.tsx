'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useExamWritingSession, useSaveExamWritingDraft, useSubmitExamWriting } from '@/hooks/useExamWriting';
import { ExamWritingTeil } from '@/lib/api/examWriting';
import { EXAM_WRITING_DISPLAY } from '@/lib/examConfig';
import { useExamCountdown, formatTime } from '@/hooks/useExamCountdown';
import { useMockExamContext } from '@/hooks/useMockExamContext';
import { TeilStrategyPanel } from '../../../_components/TeilStrategyPanel';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { useUmlautTrigger, UMLAUT_TRIGGER_HINT } from '@/hooks/useUmlautTrigger';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
import { FixedActionBar, MobileSplitTabs } from '@/components/ui';

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
function IconPenLine({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
type TaskTypeKey = 'form_fill' | 'informal_email' | 'formal_email' | 'sms' | 'forum_comment' | 'grafik_argument';

function useTaskTypeLabel() {
  const t = useTranslations('practice.examWriting.answering.taskTypes');
  return (type: string) => {
    const keys: TaskTypeKey[] = ['form_fill', 'informal_email', 'formal_email', 'sms', 'forum_comment', 'grafik_argument'];
    return (keys as string[]).includes(type) ? t(type as TaskTypeKey) : type;
  };
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

// ─── Word Count Bar ────────────────────────────────────────────────────────────
function WordCountBar({ count, min, max }: { count: number; min: number; max: number }) {
  const t = useTranslations('practice.examWriting.answering');
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  const ok = count >= min && count <= max;
  const over = count > max;
  const started = count > 0;
  const color = ok ? STATUS.success : over ? STATUS.danger : started ? STATUS.warning : 'var(--theme-border)';

  return (
    <div className="space-y-1.5">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color }}>
          {t('wordsLabel', { count })}
          {ok && ' ✓'}
          {over && ` — ${t('tooLong')} ⚠`}
          {started && !ok && !over && ` — ${t('stillNeed', { n: min - count })}`}
        </span>
        <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{min}–{max}</span>
      </div>
    </div>
  );
}

// ─── Teil Writer ──────────────────────────────────────────────────────────────
function TeilWriter({ teil, value, onChange, promptRef, hidePrompt = false }: {
  teil: ExamWritingTeil;
  value: string;
  onChange: (v: string) => void;
  promptRef?: React.RefObject<HTMLDivElement | null>;
  hidePrompt?: boolean;
}) {
  const t = useTranslations('practice.examWriting.answering');
  const wc = countWords(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const onUmlautKey = useUmlautTrigger(onChange);

  const insertSpecial = useCallback((char: string) => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    const newText = value.substring(0, selectionStart) + char + value.substring(selectionEnd);
    onChange(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(selectionStart + 1, selectionStart + 1);
      }
    }, 0);
  }, [value, onChange]);

  return (
    <div className="space-y-4">
      {!hidePrompt && (
        <div ref={promptRef} className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${ACCENT.examWriting}1A, ${ACCENT.writing}14)`, border: `1px solid ${ACCENT.examWriting}40` }}>
            <p className="text-caption font-extrabold uppercase tracking-widest mb-1" style={{ color: ACCENT.examWriting }}>{t('situationLabel')}</p>
            <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
              <HighlightedText text={teil.scenario} />
            </p>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            <p className="text-caption font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--theme-text-muted)' }}>{t('aufgabeLabel')}</p>
            <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
              <HighlightedText text={teil.taskDescription} />
            </p>
            {teil.requiredPoints.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {teil.requiredPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-[7px] flex items-center justify-center text-caption font-extrabold text-white shrink-0 mt-0.5"
                      style={{ background: GRADIENT.examWriting }}>{i + 1}</span>
                    <span className="text-xs leading-snug pt-0.5" style={{ color: 'var(--theme-text-secondary)' }}><HighlightedText text={pt} /></span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-caption mt-3 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              {t('writeHint', { min: teil.minWords, max: teil.maxWords, points: teil.maxPoints })}
            </p>
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="rounded-3xl overflow-hidden shadow-sm border-2"
        style={{ borderColor: value.trim() ? `${ACCENT.examWriting}66` : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="px-5 py-3 border-b flex justify-between items-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          <span className="text-xs font-black uppercase tracking-widest opacity-40">{t('meinText')}</span>
          <span className="text-xs font-mono font-bold" style={{ color: value.trim() ? ACCENT.examWriting : 'var(--theme-text-muted)' }}>
            {t('wordsLabel', { count: wc })}
          </span>
        </div>

        {/* Special Characters Toolbar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b overflow-x-auto no-scrollbar"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mr-1" style={{ color: 'var(--theme-text-primary)' }}>{t('specialCharsLabel')}</span>
          {SPECIAL_CHARS.map(char => (
            <button key={char} onClick={() => insertSpecial(char)}
              className="w-8 h-8 rounded-lg text-sm font-bold transition-all hover:scale-110 active:scale-90 flex items-center justify-center border"
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-primary)'
              }}>
              {char}
            </button>
          ))}
          <span className="text-[10px] font-medium ml-2 hidden sm:inline" style={{ color: 'var(--theme-text-muted)' }}>
            {t('umlautOrType')} <span className="font-mono font-bold">{UMLAUT_TRIGGER_HINT}</span>
          </span>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onUmlautKey}
          placeholder={t('writePlaceholder')}
          rows={14}
          className="w-full px-5 py-5 text-body leading-relaxed resize-none outline-none block bg-transparent"
          style={{
            color: 'var(--theme-text-primary)',
            minHeight: '400px',
          }}
          title={t('umlautTip', { hint: UMLAUT_TRIGGER_HINT })}
        />
        <div className="px-5 pb-5 pt-1">
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
  const t = useTranslations('practice.examWriting.answering');
  const tCommon = useTranslations('practice.examCommon.answering');
  const taskTypeLabel = useTaskTypeLabel();
  const { data: session, isLoading } = useExamWritingSession(id);
  const saveDraft = useSaveExamWritingDraft();
  const submitMut = useSubmitExamWriting();
  const { isMock, cockpitHref } = useMockExamContext();
  const doneHref = isMock && cockpitHref ? cockpitHref : `/practice-test/writing/exam/${id}/result`;

  const [activeTeil, setActiveTeil] = useState(0);
  const [userTexts, setUserTexts] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showStickyPrompt, setShowStickyPrompt] = useState(false);
  const [mobileView, setMobileView] = useState<'task' | 'editor'>('task');
  const promptRef = useRef<HTMLDivElement>(null);

  // Reset to task view when switching Teile so user reads the new prompt first
  const goToTeil = useCallback((i: number) => {
    setActiveTeil(i);
    setMobileView('task');
  }, []);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTextsRef = useRef<Record<string, string>>({});

  // Đếm ngược theo timeMin của chứng chỉ; bắt đầu khi học viên gõ chữ đầu tiên,
  // hết giờ tự nộp bài.
  const totalSeconds = (EXAM_WRITING_DISPLAY[session?.examType ?? '']?.[session?.cefrLevel ?? '']?.timeMin ?? 0) * 60;
  const handleTimeUp = useCallback(() => {
    submitMut.mutateAsync({ id, userTexts: userTextsRef.current })
      .then(() => router.push(doneHref))
      .catch(() => {});
  }, [id, submitMut, router, doneHref]);
  const { timeRemaining, start: startTimer } = useExamCountdown(totalSeconds, handleTimeUp);

  useEffect(() => {
    if (session?.userTexts && Object.keys(userTexts).length === 0) {
      setUserTexts(session.userTexts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(doneHref);
    }
  }, [session?.status, id, router, doneHref]);

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

  useEffect(() => { userTextsRef.current = userTexts; }, [userTexts]);

  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyPrompt(!entry!.isIntersecting),
      { threshold: 0, rootMargin: '-160px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTeil]);

  useEffect(() => { }, [activeTeil, showStickyPrompt]);

  const handleTextChange = useCallback((teilNum: number, value: string) => {
    startTimer();
    const key = `teil_${teilNum}`;
    setUserTexts(prev => ({ ...prev, [key]: value }));
    setSaveState('idle');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        await saveDraft.mutateAsync({ id, userTexts: { ...userTextsRef.current, [key]: value } });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2500);
      } catch { setSaveState('idle'); }
    }, 1800);
  }, [id, saveDraft, startTimer]);

  const handleSubmit = async () => {
    setConfirmSubmit(false);
    setErrorMsg('');
    try {
      await submitMut.mutateAsync({ id, userTexts });
      router.push(doneHref);
    } catch {
      setErrorMsg(tCommon('submitError'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={28} />
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{tCommon('loadingExam')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>{tCommon('examNotFound')}</p>
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
     <div className="max-w-360 mx-auto px-4">

      {/* Immersive Header */}
      <div className="relative -mx-4 px-4 pt-8 pb-12 mb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: GRADIENT.examWriting, maskImage: 'radial-gradient(circle at top right, white, transparent)' }} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: GRADIENT.examWriting }}>
              <IconPenLine size={28} style={{ color: 'white' }} />
            </div>
            <div>
              <Link href="/practice-test/writing/exam" className="text-xs font-bold uppercase tracking-widest mb-1 block opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-primary)' }}>
                {t('pageTitleBack')}
              </Link>
              <h1 className="text-h2 font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                {session.examType} {session.cefrLevel}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  style={{ backgroundColor: `${ACCENT.examWriting}1A`, color: ACCENT.examWriting, border: `1px solid ${ACCENT.examWriting}33` }}>
                  {session.cefrLevel}
                </span>
                <span className="text-xs font-medium opacity-60">{t('subtitle')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {timeRemaining !== null && timeRemaining > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs tabular-nums shadow-sm"
                style={{ backgroundColor: `${ACCENT.games}1A`, color: ACCENT.games, border: `1px solid ${ACCENT.games}33` }}>
                ⏱ {formatTime(timeRemaining)}
              </span>
            )}
            <div className="hidden sm:flex flex-col items-end text-right">
              {saveState === 'saving' && (
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
                  <IconLoader size={12} /> {t('saving')}
                </span>
              )}
              {saveState === 'saved' && (
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: STATUS.success }}>
                  <IconCheck size={12} /> {t('saved')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teil tabs */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {teile.map((teil, i) => {
            const filled = (userTexts[`teil_${teil.number}`] ?? '').trim().length > 0;
            const active = i === activeTeil;
            return (
              <button key={teil.number} onClick={() => goToTeil(i)}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all border"
                style={active
                  ? { backgroundColor: `${ACCENT.examWriting}14`, color: ACCENT.examWriting, borderColor: ACCENT.examWriting }
                  : filled
                    ? { backgroundColor: `${ACCENT.examWriting}0D`, color: ACCENT.examWriting, borderColor: `${ACCENT.examWriting}4D` }
                    : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
                Teil {teil.number}
                {filled && !active && <IconCheck size={10} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-Teil strategy hints — never during a mock sitting */}
      {!isMock && (
        <div className="max-w-2xl mx-auto">
          <TeilStrategyPanel examType={session.examType} cefrLevel={session.cefrLevel} skill="writing" teilNumber={currentTeil.number} />
        </div>
      )}

      {/* ── Content ── */}
      <div className="pb-24">
        {/* Mobile-only tab switcher between task and editor */}
        <MobileSplitTabs
          view={mobileView}
          onChange={setMobileView}
          accent="examWriting"
          taskLabel={t('mobileTaskLabel')}
          editorLabel={t('mobileEditorLabel')}
          editorBadge={
            <span className="text-[10px] font-mono opacity-80">
              {countWords(userTexts[`teil_${currentTeil.number}`] ?? '')} W
            </span>
          }
        />
        <div className="flex flex-col lg:flex-row gap-8 mt-3 lg:mt-0">

          {/* Left Side: Exam Task */}
          <div className={`${mobileView === 'task' ? 'block' : 'hidden'} lg:block lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1 space-y-4`}>
            {/* Teil header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                style={{ background: GRADIENT.examWriting }}>{currentTeil.number}</span>
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                  {taskTypeLabel(currentTeil.taskType)}
                </p>
                <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('writeHint', { min: currentTeil.minWords, max: currentTeil.maxWords, points: currentTeil.maxPoints })}
                </p>
              </div>
            </div>

            {/* Situation */}
            <div className="rounded-2xl p-5 border" style={{ background: `linear-gradient(135deg, ${ACCENT.examWriting}14, ${ACCENT.writing}0D)`, borderColor: `${ACCENT.examWriting}33` }}>
              <p className="text-caption font-extrabold uppercase tracking-widest mb-2" style={{ color: ACCENT.examWriting }}>{t('situationLabelVi')}</p>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
                <HighlightedText text={currentTeil.scenario} />
              </p>
            </div>

            {/* Task Description */}
            <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              <p className="text-caption font-extrabold uppercase tracking-widest mb-3" style={{ color: 'var(--theme-text-muted)' }}>{t('aufgabeLabelVi')}</p>
              <p className="text-[15px] leading-relaxed mb-4" style={{ color: 'var(--theme-text-primary)' }}>
                <HighlightedText text={currentTeil.taskDescription} />
              </p>
              {currentTeil.requiredPoints.length > 0 && (
                <div className="space-y-2.5">
                  {currentTeil.requiredPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-[7px] flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 mt-0.5"
                        style={{ background: GRADIENT.examWriting }}>{i + 1}</span>
                      <span className="text-body leading-snug" style={{ color: 'var(--theme-text-secondary)' }}><HighlightedText text={pt} /></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Editor */}
          <div className={`${mobileView === 'editor' ? 'block' : 'hidden'} lg:block lg:w-1/2 min-w-0`}>
            <TeilWriter
              teil={currentTeil}
              value={userTexts[`teil_${currentTeil.number}`] ?? ''}
              onChange={v => handleTextChange(currentTeil.number, v)}
              promptRef={promptRef}
              hidePrompt={true}
            />
          </div>
        </div>

        {/* Fixed Action Bar */}
        <FixedActionBar columns={3}>
          <button onClick={() => activeTeil > 0 && goToTeil(activeTeil - 1)}
            disabled={activeTeil === 0}
            className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-70 disabled:opacity-20"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
            <IconChevronLeft size={16} /> {t('previousBtn')}
          </button>

          {!isLastTeil ? (
            <button onClick={() => goToTeil(activeTeil + 1)}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: GRADIENT.examWriting }}>
              <IconChevronRight size={16} /> {t('nextBtn')}
            </button>
          ) : (
            <button onClick={() => allFilled && setConfirmSubmit(true)}
              disabled={!allFilled || submitMut.isPending}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
              style={{ background: GRADIENT.examWriting, boxShadow: allFilled ? `0 8px 24px ${ACCENT.examWriting}40` : 'none' }}>
              <IconSend size={16} /> {submitMut.isPending ? t('gradingBtn') : t('submitBtn')}
            </button>
          )}

          <div className="flex flex-col items-center justify-center py-2 px-3 rounded-xl"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <span className="text-xs font-black" style={{ color: allFilled ? ACCENT.examWriting : 'var(--theme-text-muted)' }}>
              {filledCount}/{teile.length}
            </span>
            <span className="text-[10px] font-medium opacity-60">{t('doneCounter')}</span>
          </div>
        </FixedActionBar>

        {errorMsg && (
          <p className="text-center text-body mt-3" style={{ color: STATUS.danger }}>{errorMsg}</p>
        )}

        {/* Submit confirmation overlay */}
        {confirmSubmit && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
              <h3 className="text-title font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('confirmTitle')}</h3>
              <p className="text-body mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                {t('confirmBody', { examType: session.examType })}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmSubmit(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{t('cancelBtn')}</button>
                <button onClick={handleSubmit}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: GRADIENT.examWriting }}>{t('confirmBtn')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
     </div>
    </div>
  );
}
