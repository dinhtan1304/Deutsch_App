'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useExamListeningSession, useSubmitExamListening } from '@/hooks/useExamListening';
import { ExamListeningTeil, ExamListeningQuestion } from '@/lib/api/examListening';
import { EXAM_LISTENING_DISPLAY } from '@/lib/examConfig';
import { useExamCountdown, formatTime } from '@/hooks/useExamCountdown';
import { useMockExamContext } from '@/hooks/useMockExamContext';
import { TeilStrategyPanel } from '../../../_components/TeilStrategyPanel';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { synthesizeAudioSequence, type AudioSequenceHandle } from '@/lib/utils';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconPlay({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block', ...style }}><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function IconSquare({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block', ...style }}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
}
function IconCheck({ size = 10 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconSend({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
}

const PLAYING_GRADIENT = `linear-gradient(135deg, ${ACCENT.games}, ${STATUS.danger})`;

// ─── TTS Player ───────────────────────────────────────────────────────────────
function TTSPlayer({ texts, speed, onSpeedChange, playCount, onPlay, onPlayStart }: {
  texts: ExamListeningTeil['texts'];
  speed: number;
  onSpeedChange: (s: number) => void;
  playCount: number;
  onPlay: () => void;
  onPlayStart: () => void;
}) {
  const t = useTranslations('practice.examListening.answering');
  const [playing, setPlaying] = useState(false);
  const seqRef = useRef<AudioSequenceHandle | null>(null);
  const fullScript = texts.map(t => t.content).join('\n\n');

  const stopAll = useCallback(() => {
    seqRef.current?.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  // Keep speed in sync if the user changes it mid-playback.
  useEffect(() => { seqRef.current?.setPlaybackRate(speed); }, [speed]);

  const playViaBrowser = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(fullScript);
    u.lang = 'de-DE';
    u.rate = speed;
    u.onstart = () => setPlaying(true);
    u.onend = () => { setPlaying(false); onPlay(); };
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  };

  // Chunked sequential playback keeps the long multi-text exam script on the
  // natural Piper voice instead of being rejected and dropping to the browser.
  const handlePlay = () => {
    if (playing) { stopAll(); return; }
    onPlayStart();
    seqRef.current?.stop();
    const seq = synthesizeAudioSequence(fullScript, {
      playbackRate: speed,
      onStart: () => setPlaying(true),
      onEnded: () => { setPlaying(false); onPlay(); },
      onError: (err) => {
        console.warn('[ExamListening] backend failed, falling back to Web Speech API:', err);
        setPlaying(false);
        playViaBrowser();
      },
    });
    seqRef.current = seq;
    void seq.play();
  };

  return (
    <div className="rounded-3xl border p-6 transition-all duration-300 shadow-sm"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: playing ? `0 12px 32px ${ACCENT.listening}1F` : 'none'
      }}>
      <div className="flex flex-col items-center text-center gap-6">
        <button onClick={handlePlay}
          className="w-24 h-24 rounded-[26px] flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shrink-0 shadow-2xl relative group"
          style={{ background: playing ? PLAYING_GRADIENT : GRADIENT.listening }}>
          <div className="absolute inset-0 rounded-[26px] bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          {playing ? <IconSquare size={32} style={{ color: 'white' }} /> : <IconPlay size={36} style={{ color: 'white', marginLeft: 6 }} />}
        </button>

        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={ACCENT.listening} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: ACCENT.listening }}>{t('audioExam')}</p>
          </div>
          <h3 className="text-title font-black mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {playing ? t('playing') : t('audioReady')}
          </h3>
          <p className="text-caption font-medium opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
            {playCount > 0 ? t('playedNTimes', { n: playCount }) : t('readyToListen')}
          </p>

          <div className="mt-6 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-border/10 overflow-hidden relative">
              <div className="absolute inset-0 opacity-20" style={{ background: GRADIENT.listening }} />
              <div className="h-full transition-all duration-300"
                style={{
                  width: playing ? '100%' : '0%',
                  background: GRADIENT.listening,
                  transitionTimingFunction: 'linear',
                  transitionDuration: playing ? '120s' : '0.3s'
                }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t flex flex-col gap-4" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t('speedLabel')}</p>
          <div className="flex gap-1.5">
            {[0.75, 1.0].map(s => (
              <button key={s} onClick={() => onSpeedChange(s)}
                className="px-3 py-1 rounded-lg text-xs font-black border-2 transition-all"
                style={s === speed
                  ? { borderColor: ACCENT.listening, backgroundColor: `${ACCENT.listening}1A`, color: ACCENT.listening }
                  : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                {s}x
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] italic leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          {t('listeningWarning')}
        </p>
      </div>
    </div>
  );
}

// ─── Question Renderers ───────────────────────────────────────────────────────

function RichtigFalschTeil({ teil, answers, onAnswer }: { teil: ExamListeningTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  const t = useTranslations('practice.examReading.answering');
  return (
    <div className="space-y-4">
      {(teil.questions as ExamListeningQuestion[]).map((q, i) => {
        const isAns = !!answers[q.id];
        return (
          <div key={q.id} className="rounded-2xl border p-5 transition-all duration-300 shadow-sm"
            style={{
              borderColor: isAns ? `${STATUS.success}4D` : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)'
            }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center text-xs font-black shrink-0"
                style={{ background: isAns ? GRADIENT.reading : 'var(--theme-bg-secondary)', color: isAns ? 'white' : 'var(--theme-text-muted)' }}>
                {i + 1}
              </div>
              <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
                {q.questionText}
              </p>
            </div>
            <div className="flex gap-2.5">
              {[{ id: 'richtig', label: t('richtigLabel') }, { id: 'falsch', label: t('falschLabel') }].map(opt => {
                const sel = answers[q.id] === opt.id;
                return (
                  <button key={opt.id} onClick={() => onAnswer(q.id, opt.id)}
                    className="flex-1 py-3 rounded-xl text-body font-bold border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={sel
                      ? { borderColor: opt.id === 'richtig' ? STATUS.success : STATUS.danger, backgroundColor: opt.id === 'richtig' ? `${STATUS.success}1A` : `${STATUS.danger}1A`, color: opt.id === 'richtig' ? STATUS.success : STATUS.danger }
                      : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MCQTeil({ teil, answers, onAnswer }: { teil: ExamListeningTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  return (
    <div className="space-y-5">
      {(teil.questions as ExamListeningQuestion[]).map((q, i) => {
        const isAns = !!answers[q.id];
        return (
          <div key={q.id} className="rounded-2xl border p-5 transition-all duration-300 shadow-sm"
            style={{
              borderColor: isAns ? `${STATUS.success}4D` : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)'
            }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center text-xs font-black shrink-0"
                style={{ background: isAns ? GRADIENT.reading : 'var(--theme-bg-secondary)', color: isAns ? 'white' : 'var(--theme-text-muted)' }}>
                {i + 1}
              </div>
              <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
                {q.questionText}
              </p>
            </div>
            <div className="space-y-2.5">
              {(q.options || []).map(opt => {
                const sel = answers[q.id] === opt.id;
                return (
                  <button key={opt.id} onClick={() => onAnswer(q.id, opt.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-md border-2 text-[15px] text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={sel
                      ? { borderColor: ACCENT.listening, backgroundColor: `${ACCENT.listening}14`, color: ACCENT.listening }
                      : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
                    <div className="w-6 h-6 rounded-[8px] border-2 flex items-center justify-center shrink-0 text-[10px] font-black"
                      style={{ borderColor: sel ? ACCENT.listening : 'var(--theme-border)', backgroundColor: sel ? ACCENT.listening : 'transparent', color: sel ? 'white' : 'var(--theme-text-muted)' }}>
                      {opt.id.toUpperCase()}
                    </div>
                    <span className="font-medium">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ZuordnungTeil({ teil, answers, onAnswer }: { teil: ExamListeningTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  const tCommon = useTranslations('practice.examCommon.answering');
  const labels = teil.texts.map(t => t.label || t.id).filter(Boolean);

  return (
    <div className="space-y-4">
      {(teil.questions as ExamListeningQuestion[]).map((q, i) => {
        const isAns = !!answers[q.id];
        return (
          <div key={q.id} className="rounded-2xl border p-5 transition-all duration-300 shadow-sm"
            style={{
              borderColor: isAns ? `${ACCENT.listening}4D` : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)'
            }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center text-xs font-black shrink-0"
                style={{ background: isAns ? GRADIENT.reading : 'var(--theme-bg-secondary)', color: isAns ? 'white' : 'var(--theme-text-muted)' }}>
                {i + 1}
              </div>
              <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
                {q.questionText}
              </p>
            </div>
            <select
              value={answers[q.id] || ''}
              onChange={e => onAnswer(q.id, e.target.value)}
              className="w-full px-4 py-3 rounded-md border-2 text-[15px] font-bold outline-none transition-all focus:ring-2"
              style={{
                borderColor: isAns ? ACCENT.listening : 'var(--theme-border)',
                backgroundColor: isAns ? `${ACCENT.listening}0D` : 'var(--theme-bg-secondary)',
                color: isAns ? ACCENT.listening : 'var(--theme-text-secondary)',
              }}>
              <option value="">{tCommon('bitteWahlen')}</option>
              {labels.map(lbl => (
                <option key={lbl} value={lbl}>{lbl}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function TeilRenderer({ teil, answers, onAnswer }: { teil: ExamListeningTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  const tCommon = useTranslations('practice.examCommon.answering');
  switch (teil.taskType) {
    case 'richtig_falsch':  return <RichtigFalschTeil  teil={teil} answers={answers} onAnswer={onAnswer} />;
    case 'multiple_choice': return <MCQTeil             teil={teil} answers={answers} onAnswer={onAnswer} />;
    case 'zuordnung':       return <ZuordnungTeil       teil={teil} answers={answers} onAnswer={onAnswer} />;
    default: return <p style={{ color: 'var(--theme-text-muted)' }}>{tCommon('unsupportedQuestion')}</p>;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExamListeningPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.examListening.answering');
  const tCommon = useTranslations('practice.examCommon.answering');
  const { data: session, isLoading } = useExamListeningSession(id);
  const submitMut = useSubmitExamListening();
  const { isMock, cockpitHref } = useMockExamContext();
  const doneHref = isMock && cockpitHref ? cockpitHref : `/practice-test/listening/exam/${id}/result`;

  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [currentTeil, setCurrentTeil] = useState(0);
  const [error, setError] = useState('');
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [playCounts, setPlayCounts] = useState<Record<number, number>>({});
  const userAnswersRef = useRef(userAnswers);

  useEffect(() => { userAnswersRef.current = userAnswers; }, [userAnswers]);

  // Đếm ngược theo timeMin của chứng chỉ; chỉ bắt đầu khi học viên bấm Play lần đầu
  // (mô phỏng phòng thi thật), hết giờ tự nộp bài.
  const totalSeconds = (EXAM_LISTENING_DISPLAY[session?.examType ?? '']?.[session?.cefrLevel ?? '']?.timeMin ?? 0) * 60;
  const handleTimeUp = useCallback(() => {
    submitMut.mutateAsync({ id, userAnswers: userAnswersRef.current })
      .then(() => router.push(doneHref))
      .catch(() => {});
  }, [id, submitMut, router, doneHref]);
  const { timeRemaining, start: startTimer } = useExamCountdown(totalSeconds, handleTimeUp);

  const handleAnswer = useCallback((teilNumber: number, qid: string, val: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [`teil_${teilNumber}`]: { ...(prev[`teil_${teilNumber}`] || {}), [qid]: val },
    }));
  }, []);

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(doneHref);
    }
  }, [session?.status, id, router, doneHref]);

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT.listening }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>{tCommon('loadingExam')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>{tCommon('examNotFound')}</p>
        <Link href="/practice-test/listening/exam" className="text-sm font-semibold" style={{ color: ACCENT.listening }}>{tCommon('back')}</Link>
      </div>
    );
  }

  if (session.status === 'GRADED') return null;

  const teile = session.teile as ExamListeningTeil[];
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
      router.push(doneHref);
    } catch {
      setError(tCommon('submitError'));
    }
  };

  const isLastTeil = currentTeil === teile.length - 1;

  return (
    <div className="max-w-360 mx-auto px-4 py-6 pb-28">
      <PageHeader
        backHref={isMock && cockpitHref ? cockpitHref : '/practice-test/listening/exam'}
        title={t('pageTitle')}
        accent="listening"
        right={
          <div className="flex items-center gap-3">
            {timeRemaining !== null && timeRemaining > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs tabular-nums shadow-sm"
                style={{ backgroundColor: `${ACCENT.games}1A`, color: ACCENT.games, border: `1px solid ${ACCENT.games}33` }}>
                ⏱ {formatTime(timeRemaining)}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
              style={{ backgroundColor: ACCENT.listening }}>{session.cefrLevel}</span>
          </div>
        }
      />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {session.examType} {session.cefrLevel} · Listening
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-widest"
              style={{ backgroundColor: `${ACCENT.listening}1A`, color: ACCENT.listening }}>{session.examType}</span>
            <span className="opacity-40">·</span>
            <span>{tCommon('answeredCount', { done: totalAnswered, total: totalQ })}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar">
        {teile.map((t, i) => {
          const tAns = Object.keys(userAnswers[`teil_${t.number}`] || {}).length;
          const tTot = t.questions.length;
          const isCurrent = i === currentTeil;
          const isDone = tAns >= tTot;

          return (
            <button key={t.number} onClick={() => setCurrentTeil(i)}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-black transition-all border uppercase tracking-widest"
              style={isCurrent
                ? { backgroundColor: `${ACCENT.listening}14`, color: ACCENT.listening, borderColor: ACCENT.listening }
                : isDone
                  ? { backgroundColor: `${STATUS.success}14`, color: STATUS.success, borderColor: `${STATUS.success}33` }
                  : { backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
              <span>Teil {t.number}</span>
              {isDone && <IconCheck size={10} />}
            </button>
          );
        })}
      </div>

      {/* Per-Teil strategy hints — never during a mock sitting */}
      {!isMock && (
        <TeilStrategyPanel examType={session.examType} cefrLevel={session.cefrLevel} skill="listening" teilNumber={teil.number} />
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1 space-y-6">
          <TTSPlayer
            texts={teil.texts}
            speed={ttsSpeed}
            onSpeedChange={setTtsSpeed}
            playCount={playCounts[teil.number] || 0}
            onPlay={() => setPlayCounts(prev => ({ ...prev, [teil.number]: (prev[teil.number] || 0) + 1 }))}
            onPlayStart={startTimer}
          />

          <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-black text-white" style={{ background: GRADIENT.listening }}>{teil.number}</span>
              <h3 className="text-body font-black uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>{tCommon('anweisungLabel')}</h3>
            </div>
            <p className="text-[15px] italic leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              {teil.instruction}
            </p>
          </div>
        </div>

        <div className="lg:w-1/2 min-w-0 space-y-4">
          <h2 className="text-title font-bold px-1" style={{ color: 'var(--theme-text-primary)' }}>
            {tCommon('fragenLabel', { n: teilTotalQ })}
          </h2>
          <TeilRenderer
            teil={teil}
            answers={teilAnswers}
            onAnswer={(qid, val) => handleAnswer(teil.number, qid, val)}
          />
        </div>
      </div>

      <FixedActionBar columns={1}>
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 flex gap-2 items-center">
            {currentTeil > 0 && (
              <button onClick={() => setCurrentTeil(currentTeil - 1)}
                className="w-10 h-10 rounded-md flex items-center justify-center border transition-all hover:bg-black/5"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                <IconChevronLeft size={18} />
              </button>
            )}
            <span className="text-xs font-black uppercase tracking-widest opacity-40 mx-2">
              {tCommon('teilXofY', { n: teil.number, total: teile.length })}
            </span>
            {!isLastTeil && (
              <button onClick={() => setCurrentTeil(currentTeil + 1)}
                className="w-10 h-10 rounded-md flex items-center justify-center border transition-all hover:bg-black/5"
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
            style={{ background: GRADIENT.listening, boxShadow: allAnswered ? `0 8px 24px ${ACCENT.listening}4D` : 'none' }}>
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
