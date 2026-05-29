'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useListeningSession, useSubmitListening } from '@/hooks/useListening';
import { ListeningQuestion } from '@/lib/api/listening';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { synthesizeAudio } from '@/lib/utils';

function IconHeadphones({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
}
function IconPlay({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block', ...style }}><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function IconSquare({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block', ...style }}><rect width="15" height="15" x="4.5" y="4.5" rx="2" /></svg>;
}
function IconLoader({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

// ─── TTS Player ───────────────────────────────────────────────────────────────
function TTSPlayer({ text }: { text: string }) {
  const t = useTranslations('practice.listening.answering');
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  // Web Speech API fallback when the backend TTS is unreachable.
  const playViaBrowser = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = speed;
    u.onstart = () => setPlaying(true);
    u.onend = () => { setPlaying(false); setPlayCount(c => c + 1); };
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  }, [text, speed]);

  const play = useCallback(async () => {
    stop();
    try {
      const audio = await synthesizeAudio(text);
      audio.playbackRate = speed;
      audio.onplay = () => setPlaying(true);
      audio.onended = () => { setPlaying(false); setPlayCount(c => c + 1); };
      audio.onerror = () => setPlaying(false);
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[TTSPlayer] backend failed, falling back to Web Speech API:', err);
      playViaBrowser();
    }
  }, [text, speed, stop, playViaBrowser]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return (
    <div className="rounded-3xl border p-6 transition-all duration-300"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: playing ? `0 12px 32px ${ACCENT.listening}1F` : '0 4px 12px rgba(0,0,0,.03)'
      }}>
      <div className="flex flex-col items-center text-center gap-6">
        <button onClick={playing ? stop : play}
          className="w-24 h-24 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shrink-0 shadow-2xl relative group"
          style={{ background: GRADIENT.listening }}>
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          {playing ? <IconSquare size={32} style={{ color: 'white' }} /> : <IconPlay size={36} style={{ color: 'white', marginLeft: 6 }} />}
        </button>

        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <IconHeadphones size={14} style={{ color: ACCENT.listening }} />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: ACCENT.listening }}>{t('ttsAudioLabel')}</p>
          </div>
          <h3 className="text-title font-black mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {playing ? t('ttsPlaying') : t('ttsTitle')}
          </h3>
          <p className="text-caption font-medium opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
            {playCount > 0 ? t('ttsPlayCount', { count: playCount }) : t('ttsReady')}
          </p>

          <div className="mt-6 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-border/10 overflow-hidden relative">
              <div className="absolute inset-0 opacity-20" style={{ background: GRADIENT.listening }} />
              <div className="h-full transition-all duration-300"
                style={{
                  width: playing ? '100%' : '0%',
                  background: GRADIENT.listening,
                  transitionTimingFunction: 'linear',
                  transitionDuration: playing ? '60s' : '0.3s'
                }} />
            </div>
            <div className="flex justify-between text-[10px] font-bold opacity-40 uppercase tracking-tighter">
              <span>0:00</span>
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t flex flex-col gap-4" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t('ttsSpeedLabel')}</p>
          <div className="flex gap-1.5">
            {[0.75, 1.0].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
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
          {t('ttsTip')}
        </p>
      </div>
    </div>
  );
}

// ─── Question renderer ────────────────────────────────────────────────────────
function QuestionItem({ q, idx, answer, onAnswer }: {
  q: ListeningQuestion; idx: number; answer: string; onAnswer: (val: string) => void;
}) {
  const isAnswered = !!answer;

  if (q.type === 'richtig_falsch') {
    return (
      <div className="rounded-2xl border p-5 transition-all duration-300"
        style={{
          borderColor: isAnswered ? `${STATUS.success}4D` : 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)'
        }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
            style={{ background: isAnswered ? GRADIENT.reading : 'var(--theme-bg-secondary)', color: isAnswered ? 'white' : 'var(--theme-text-muted)' }}>
            {idx + 1}
          </div>
          <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
            {q.questionText}
          </p>
        </div>
        <div className="flex gap-2.5">
          {[{ id: 'richtig', label: 'Richtig ✓' }, { id: 'falsch', label: 'Falsch ✗' }].map(opt => {
            const sel = answer === opt.id;
            return (
              <button key={opt.id} onClick={() => onAnswer(opt.id)}
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
  }

  return (
    <div className="rounded-2xl border p-5 transition-all duration-300"
      style={{
        borderColor: isAnswered ? `${STATUS.success}4D` : 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)'
      }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
          style={{ background: isAnswered ? GRADIENT.reading : 'var(--theme-bg-secondary)', color: isAnswered ? 'white' : 'var(--theme-text-muted)' }}>
          {idx + 1}
        </div>
        <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
          {q.questionText}
        </p>
      </div>
      <div className="space-y-2">
        {(q.options || []).map(opt => {
          const sel = answer === opt.id;
          return (
            <button key={opt.id} onClick={() => onAnswer(opt.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-[15px] text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={sel
                ? { borderColor: ACCENT.listening, backgroundColor: `${ACCENT.listening}14`, color: ACCENT.listening }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-black"
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
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ListeningSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.listening.answering');
  const { data: session, isLoading } = useListeningSession(id);
  const submitMut = useSubmitListening();

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const handleAnswer = useCallback((qid: string, val: string) => {
    setUserAnswers(prev => ({ ...prev, [qid]: val }));
  }, []);

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/listening/${id}/result`);
    }
  }, [session?.status, id, router]);

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT.listening }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>{t('notFound')}</p>
        <Link href="/practice-test/listening" className="text-sm font-semibold" style={{ color: ACCENT.listening }}>{t('backToList')}</Link>
      </div>
    );
  }

  const questions = session.questions as ListeningQuestion[];
  const answered = Object.keys(userAnswers).length;
  const total = questions.length;
  const allAnswered = answered >= total;

  const handleSubmit = async () => {
    setError('');
    try {
      await submitMut.mutateAsync({ id, userAnswers });
      router.push(`/practice-test/listening/${id}/result`);
    } catch {
      setError(t('submitError'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      <PageHeader
        backHref="/practice-test/listening"
        title={t('title')}
        accent="listening"
        right={
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: ACCENT.listening }}>{session.cefrLevel}</span>
        }
      />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {session.title}
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-widest"
              style={{ backgroundColor: `${ACCENT.listening}1A`, color: ACCENT.listening }}>{session.cefrLevel}</span>
            <span className="opacity-40">·</span>
            <span>{t('answeredCount', { answered, total })}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start space-y-6">
          <TTSPlayer text={session.transcript} />
        </div>

        <div className="lg:w-1/2 min-w-0 space-y-4">
          <h2 className="text-title font-bold px-1" style={{ color: 'var(--theme-text-primary)' }}>
            {t('questionsTitle', { count: total })}
          </h2>
          {questions.map((q, i) => (
            <QuestionItem key={q.id} q={q} idx={i} answer={userAnswers[q.id] || ''} onAnswer={val => handleAnswer(q.id, val)} />
          ))}
        </div>
      </div>

      <FixedActionBar columns={1}>
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 flex gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {questions.map((q, i) => {
              const hasAns = !!userAnswers[q.id];
              return (
                <div key={q.id} className="w-2 h-2 rounded-full shrink-0 transition-all"
                  style={{ backgroundColor: hasAns ? STATUS.success : 'var(--theme-border)' }}
                  title={t('questionTooltip', { index: i + 1 })} />
              );
            })}
          </div>

          <div className="shrink-0 h-8 w-px bg-border/40 mx-1" />

          <button
            onClick={() => allAnswered && handleSubmit()}
            disabled={!allAnswered || submitMut.isPending}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg"
            style={{ background: GRADIENT.listening, boxShadow: allAnswered ? `0 8px 24px ${ACCENT.listening}4D` : 'none' }}>
            {submitMut.isPending ? <IconLoader size={16} /> : <><IconHeadphones size={16} /> {t('submit')}</>}
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
