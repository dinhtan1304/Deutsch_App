'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useExamReadingSession, useSubmitExamReading } from '@/hooks/useExamReading';
import { ExamReadingTeil, ExamTeilQuestion } from '@/lib/api/examReading';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { PageHeader, FixedActionBar, MobileSplitTabs } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { speakGerman as speakText } from '@/lib/utils';
import {
  IconChevronLeft, IconChevronRight, IconLoader,
  IconVolume2, IconCheck, IconSend,
} from '../../icons';

// ─── TextCard ─────────────────────────────────────────────────────────────────
function TextCard({ text }: { text: ExamReadingTeil['texts'][0] }) {
  const t = useTranslations('practice.examReading.answering');
  const shortLabel = text.label && text.label.length <= 3;
  const longLabel = text.label && text.label.length > 3;
  return (
    <div className="rounded-xl border p-4 mb-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
      {(text.label || text.title) && (
        <div className="mb-2">
          {shortLabel && (
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                style={{ background: GRADIENT.reading }}>{text.label}</span>
              {text.title && <p className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>}
            </div>
          )}
          {longLabel && (
            <div className="mb-1.5">
              <span className="inline-block text-caption font-bold px-2.5 py-1 rounded-lg text-white" style={{ background: GRADIENT.reading }}>{text.label}</span>
              {text.title && <p className="text-body font-bold mt-1" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>}
            </div>
          )}
          {!text.label && text.title && (
            <p className="text-body font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>
          )}
        </div>
      )}
      {text.author && <p className="text-caption mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>{t('byAuthor', { author: text.author })}</p>}
      <p className="text-body leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
        <HighlightedText text={text.content} />
      </p>
      <button onClick={() => speakText(text.content)}
        className="mt-2 p-1.5 rounded-lg transition-all hover:scale-110 flex items-center gap-1 text-caption"
        style={{ color: ACCENT.reading }}>
        <IconVolume2 size={13} /> {t('listen')}
      </button>
    </div>
  );
}

// ─── LEFT: passage / texts per task type ─────────────────────────────────────

function TeilLeftContent({ teil }: { teil: ExamReadingTeil }) {
  const t = useTranslations('practice.examReading.answering');
  switch (teil.taskType) {
    case 'richtig_falsch':
    case 'multiple_choice':
      return (
        <div className="space-y-3">
          {teil.texts.map(t => <TextCard key={t.id} text={t} />)}
        </div>
      );

    case 'zuordnung':
      return (
        <div className="grid sm:grid-cols-1 gap-3">
          {teil.texts.map(t => <TextCard key={t.id} text={t} />)}
        </div>
      );

    case 'ja_nein': {
      const thema = teil.texts.find(t => t.id === 'thema' || t.type === 'thema');
      return thema ? (
        <div className="rounded-xl p-4 text-center"
          style={{ backgroundColor: `${ACCENT.reading}0F`, border: `1px solid ${ACCENT.reading}26` }}>
          <p className="text-caption font-bold mb-1.5 uppercase tracking-wider" style={{ color: ACCENT.reading }}>{t('themaLabel')}</p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            <HighlightedText text={thema.content} />
          </p>
        </div>
      ) : null;
    }

    case 'sprachbausteine': {
      const wordBank = teil.wordBank || [];
      return wordBank.length > 0 ? (
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          <p className="text-caption font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('wortliste')}</p>
          <div className="flex flex-wrap gap-2">
            {wordBank.map(w => (
              <span key={w} className="px-2.5 py-1.5 rounded-lg text-body font-medium border"
                style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      ) : null;
    }

    default:
      return null;
  }
}

// ─── RIGHT: questions per task type ───────────────────────────────────────────

function TeilRightContent({ teil, answers, onAnswer, cefrLevel }: {
  teil: ExamReadingTeil;
  answers: Record<string, string>;
  onAnswer: (qid: string, val: string) => void;
  cefrLevel: string;
}) {
  const t = useTranslations('practice.examReading.answering');
  const tCommon = useTranslations('practice.examCommon.answering');
  const questions = teil.questions as ExamTeilQuestion[];
  const showNoMatchOption = cefrLevel !== 'A1' && teil.taskType === 'zuordnung';

  switch (teil.taskType) {

    case 'richtig_falsch':
      return (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border p-5 transition-all duration-300 shadow-sm"
              style={{ borderColor: answers[q.id] ? `${ACCENT.reading}4D` : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="flex items-start gap-3 mb-4">
                 <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                   style={{ background: answers[q.id] ? GRADIENT.reading : 'var(--theme-bg-secondary)', color: answers[q.id] ? 'white' : 'var(--theme-text-muted)' }}>
                   {i + 1}
                 </div>
                 <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
                   <HighlightedText text={q.questionText} />
                 </p>
              </div>
              <div className="flex gap-2.5">
                {[{ id: 'richtig', label: t('richtigLabel') }, { id: 'falsch', label: t('falschLabel') }].map(opt => {
                  const sel = answers[q.id] === opt.id;
                  const isPositive = opt.id === 'richtig';
                  return (
                    <button key={opt.id} onClick={() => onAnswer(q.id, opt.id)}
                      className="flex-1 py-3 rounded-xl text-body font-bold border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={sel
                        ? { borderColor: isPositive ? ACCENT.reading : STATUS.danger, backgroundColor: isPositive ? `${ACCENT.reading}1A` : `${STATUS.danger}1A`, color: isPositive ? ACCENT.reading : STATUS.danger }
                        : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );

    case 'ja_nein': {
      const opinions = teil.texts.filter(t => t.id !== 'thema' && t.type !== 'thema');
      return (
        <div className="space-y-4">
          {questions.map((q, i) => {
            const person = opinions[i];
            const isAns = !!answers[q.id];
            return (
              <div key={q.id} className="rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm"
                style={{ borderColor: isAns ? `${ACCENT.reading}4D` : 'var(--theme-border)' }}>
                {person && (
                  <div className="p-4 border-b" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                    {person.label && <p className="text-xs font-black mb-2 uppercase tracking-widest" style={{ color: ACCENT.reading }}>{person.label}</p>}
                    <p className="text-[15px] leading-relaxed" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
                      <HighlightedText text={person.content} />
                    </p>
                  </div>
                )}
                <div className="p-4" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
                  <p className="text-sm font-bold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
                    <HighlightedText text={q.questionText} />
                  </p>
                  <div className="flex gap-2.5">
                    {[{ id: 'ja', label: t('jaLabel') }, { id: 'nein', label: t('neinLabel') }].map(opt => {
                      const sel = answers[q.id] === opt.id;
                      const isPositive = opt.id === 'ja';
                      return (
                        <button key={opt.id} onClick={() => onAnswer(q.id, opt.id)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all"
                          style={sel
                            ? { borderColor: isPositive ? ACCENT.reading : STATUS.danger, backgroundColor: isPositive ? `${ACCENT.reading}1A` : `${STATUS.danger}1A`, color: isPositive ? ACCENT.reading : STATUS.danger }
                            : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case 'multiple_choice':
      return (
        <div className="space-y-5">
          {questions.map((q, i) => {
            const isAns = !!answers[q.id];
            return (
              <div key={q.id} className="rounded-2xl border p-5 transition-all duration-300 shadow-sm"
                style={{ borderColor: isAns ? `${ACCENT.reading}4D` : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="flex items-start gap-3 mb-4">
                   <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                     style={{ background: isAns ? GRADIENT.reading : 'var(--theme-bg-secondary)', color: isAns ? 'white' : 'var(--theme-text-muted)' }}>
                     {i + 1}
                   </div>
                   <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
                     <HighlightedText text={q.questionText} />
                   </p>
                </div>
                <div className="space-y-2.5">
                  {(q.options || []).map(opt => {
                    const sel = answers[q.id] === opt.id;
                    return (
                      <button key={opt.id} onClick={() => onAnswer(q.id, opt.id)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-[15px] text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={sel
                          ? { borderColor: ACCENT.reading, backgroundColor: `${ACCENT.reading}14`, color: ACCENT.reading }
                          : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-black"
                          style={{ borderColor: sel ? ACCENT.reading : 'var(--theme-border)', backgroundColor: sel ? ACCENT.reading : 'transparent', color: sel ? 'white' : 'var(--theme-text-muted)' }}>
                          {opt.id.toUpperCase()}
                        </div>
                        <span className="font-medium"><HighlightedText text={opt.text} /></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );

    case 'zuordnung': {
      const labels = teil.texts.map(t => t.label || t.id).filter(Boolean);
      return (
        <div className="space-y-4">
          {showNoMatchOption && (
            <div className="rounded-xl px-4 py-3 text-[13px] leading-relaxed border"
              style={{ borderColor: `${ACCENT.reading}33`, backgroundColor: `${ACCENT.reading}0D`, color: 'var(--theme-text-secondary)' }}>
              <span className="font-bold" style={{ color: ACCENT.reading }}>{t('zuordnungNoteIntro')}</span>{' '}
              {t('zuordnungNoteBody')}{' '}
              <span className="font-black px-1.5 py-0.5 rounded" style={{ backgroundColor: `${ACCENT.reading}26`, color: ACCENT.reading }}>{t('zuordnungNoteXBadge')}</span>{' '}
              {t('zuordnungNoteTail')}
            </div>
          )}
          {questions.map((q, i) => {
            const isAns = !!answers[q.id];
            return (
              <div key={q.id} className="rounded-2xl border p-5 transition-all duration-300 shadow-sm"
                style={{ borderColor: isAns ? `${ACCENT.reading}4D` : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="flex items-start gap-3 mb-4">
                   <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                     style={{ background: isAns ? GRADIENT.reading : 'var(--theme-bg-secondary)', color: isAns ? 'white' : 'var(--theme-text-muted)' }}>
                     {i + 1}
                   </div>
                   <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
                     <HighlightedText text={q.questionText} />
                   </p>
                </div>
                <select value={answers[q.id] || ''} onChange={e => onAnswer(q.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 text-[15px] font-bold outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: isAns ? ACCENT.reading : 'var(--theme-border)',
                    backgroundColor: isAns ? `${ACCENT.reading}0D` : 'var(--theme-bg-secondary)',
                    color: isAns ? ACCENT.reading : 'var(--theme-text-secondary)',
                  }}>
                  <option value="">{tCommon('bitteWahlen')}</option>
                  {labels.map(lbl => <option key={lbl} value={lbl}>{lbl}</option>)}
                  {showNoMatchOption && <option value="X">{tCommon('keinePasst')}</option>}
                </select>
              </div>
            );
          })}
        </div>
      );
    }

    case 'sprachbausteine': {
      const text = teil.texts[0]?.content || '';
      const wordBank = teil.wordBank || [];
      const parts = text.split(/\[GAP_(\d+)\]/g);
      return (
        <div className="rounded-3xl border p-6 leading-loose text-[15px] shadow-sm"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', fontFamily: 'Georgia, serif', color: 'var(--theme-text-primary)' }}>
          {parts.map((part, idx) => {
            if (idx % 2 === 0) return <span key={idx}><HighlightedText text={part} /></span>;
            const gapNum = parseInt(part);
            const q = questions.find(qq => qq.id === `q${gapNum}`);
            if (!q) return <span key={idx}>[{gapNum}]</span>;
            const val = answers[q.id];
            const opts = q.options && q.options.length > 0 ? q.options : null;
            return (
              <span key={idx} className="inline-block mx-1 align-middle">
                <select value={val || ''} onChange={e => onAnswer(q.id, e.target.value)}
                  className="px-3 py-1 rounded-xl border-2 text-[13px] font-bold outline-none transition-all"
                  style={{ borderColor: val ? ACCENT.reading : 'var(--theme-border)', backgroundColor: val ? `${ACCENT.reading}0D` : 'var(--theme-bg-secondary)', color: val ? ACCENT.reading : 'var(--theme-text-muted)', minWidth: '90px' }}>
                  <option value="">___</option>
                  {opts
                    ? opts.map(o => <option key={o.id} value={o.id}>{o.text || o.id}</option>)
                    : wordBank.map(w => <option key={w} value={w}>{w}</option>)
                  }
                </select>
              </span>
            );
          })}
        </div>
      );
    }

    default:
      return <p style={{ color: 'var(--theme-text-muted)' }}>{tCommon('unsupportedQuestion')}</p>;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExamReadingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.examReading.answering');
  const tCommon = useTranslations('practice.examCommon.answering');
  const { data: session, isLoading } = useExamReadingSession(id);
  const submitMut = useSubmitExamReading();

  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [currentTeil, setCurrentTeil] = useState(0);
  const [error, setError] = useState('');
  const [mobileView, setMobileView] = useState<'task' | 'editor'>('task');

  // Reset to passage view when switching Teile so user reads context first
  const goToTeil = useCallback((i: number) => {
    setCurrentTeil(i);
    setMobileView('task');
  }, []);

  const handleAnswer = useCallback((teilNumber: number, qid: string, val: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [`teil_${teilNumber}`]: { ...(prev[`teil_${teilNumber}`] || {}), [qid]: val },
    }));
  }, []);

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/reading/exam/${id}/result`);
    }
  }, [session?.status, id, router]);

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT.reading }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>{tCommon('loadingExam')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>{tCommon('examNotFound')}</p>
        <Link href="/practice-test/reading/exam" className="text-sm font-semibold" style={{ color: ACCENT.reading }}>{tCommon('back')}</Link>
      </div>
    );
  }

  if (session.status === 'GRADED') return null;

  const teile = session.teile as ExamReadingTeil[];
  const teil = teile[currentTeil]!;
  const teilKey = `teil_${teil.number}`;
  const teilAnswers = userAnswers[teilKey] || {};
  const teilTotalQ = teil.questions.length;

  const totalAnswered = teile.reduce((sum, t) =>
    sum + Object.keys(userAnswers[`teil_${t.number}`] || {}).length, 0);
  const totalQ = session.totalQuestions;
  const allAnswered = totalAnswered >= totalQ;

  const handleSubmit = async () => {
    setError('');
    try {
      await submitMut.mutateAsync({ id, userAnswers });
      router.push(`/practice-test/reading/exam/${id}/result`);
    } catch {
      setError(tCommon('submitError'));
    }
  };

  const isLastTeil = currentTeil === teile.length - 1;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      <PageHeader
        backHref="/practice-test/reading/exam"
        title={t('pageTitle')}
        accent="reading"
        right={
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: ACCENT.reading }}>{session.cefrLevel}</span>
        }
      />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {session.examType} {session.cefrLevel} · Reading
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="px-1.5 py-0.5 rounded uppercase tracking-widest text-[10px]"
              style={{ backgroundColor: `${ACCENT.reading}1A`, color: ACCENT.reading }}>{session.examType}</span>
            <span className="opacity-40">·</span>
            <span>{tCommon('answeredCount', { done: totalAnswered, total: totalQ })}</span>
          </div>
        </div>
      </div>

      {/* Teil Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar">
        {teile.map((t, i) => {
          const tAns = Object.keys(userAnswers[`teil_${t.number}`] || {}).length;
          const tTot = t.questions.length;
          const isCurrent = i === currentTeil;
          const isDone = tAns >= tTot;

          return (
            <button key={t.number} onClick={() => goToTeil(i)}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all border uppercase tracking-widest"
              style={isCurrent
                ? { background: GRADIENT.reading, color: 'white', borderColor: 'transparent', boxShadow: `0 8px 16px ${ACCENT.reading}40` }
                : isDone
                  ? { backgroundColor: `${ACCENT.reading}14`, color: ACCENT.reading, borderColor: `${ACCENT.reading}33` }
                  : { backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
              <span>Teil {t.number}</span>
              {isDone && <IconCheck size={10} />}
            </button>
          );
        })}
      </div>

      {/* Mobile-only tab switcher between passage and questions */}
      <MobileSplitTabs
        view={mobileView}
        onChange={setMobileView}
        accent="reading"
        taskLabel="Texte / Bài đọc"
        editorLabel="Fragen / Câu hỏi"
        editorBadge={
          <span className="text-[10px] font-mono opacity-80">
            {Object.keys(teilAnswers).length}/{teilTotalQ}
          </span>
        }
      />

      {/* Split Layout */}
      <div className="flex flex-col lg:flex-row gap-8 mt-3 lg:mt-0">

        {/* Left Side: Texts (Sticky) */}
        <div className={`${mobileView === 'task' ? 'block' : 'hidden'} lg:block lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1 space-y-6`}>
          <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="flex items-center gap-2 mb-4">
               <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white" style={{ background: GRADIENT.reading }}>{teil.number}</span>
               <h3 className="text-body font-black uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>{tCommon('anweisungLabel')}</h3>
            </div>
            <p className="text-[15px] italic leading-relaxed" style={{ color: 'var(--theme-text-secondary)', fontFamily: 'Georgia, serif' }}>
              {teil.instruction}
            </p>
          </div>
          <TeilLeftContent teil={teil} />
        </div>

        {/* Right Side: Questions */}
        <div className={`${mobileView === 'editor' ? 'block' : 'hidden'} lg:block lg:w-1/2 min-w-0 space-y-4`}>
          <h2 className="text-title font-bold px-1" style={{ color: 'var(--theme-text-primary)' }}>
            {tCommon('fragenLabel', { n: teilTotalQ })}
          </h2>
          <TeilRightContent
            teil={teil}
            answers={teilAnswers}
            onAnswer={(qid, val) => handleAnswer(teil.number, qid, val)}
            cefrLevel={session.cefrLevel}
          />
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <FixedActionBar columns={1}>
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 flex gap-2 items-center">
            {currentTeil > 0 && (
              <button onClick={() => goToTeil(currentTeil - 1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all hover:bg-black/5"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                <IconChevronLeft size={18} />
              </button>
            )}
            <span className="text-xs font-black uppercase tracking-widest opacity-40 mx-2">
              {tCommon('teilXofY', { n: teil.number, total: teile.length })}
            </span>
            {!isLastTeil && (
              <button onClick={() => goToTeil(currentTeil + 1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all hover:bg-black/5"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                <IconChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="shrink-0 h-8 w-px bg-border/40 mx-2" />

          <button
            onClick={() => allAnswered && handleSubmit()}
            disabled={!allAnswered || submitMut.isPending}
            className="flex items-center gap-2 px-10 py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg"
            style={{ background: GRADIENT.reading, boxShadow: allAnswered ? `0 8px 24px ${ACCENT.reading}4D` : 'none' }}>
            {submitMut.isPending ? <IconLoader size={16} /> : <><IconSend size={16} /> {tCommon('submit')}</>}
          </button>
        </div>
      </FixedActionBar>

      {error && (
        <p className="fixed bottom-24 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-2 rounded-full shadow-sm z-50"
          style={{ color: STATUS.danger, backgroundColor: `${STATUS.danger}14`, border: `1px solid ${STATUS.danger}26` }}>
          {error}
        </p>
      )}
    </div>
  );
}
