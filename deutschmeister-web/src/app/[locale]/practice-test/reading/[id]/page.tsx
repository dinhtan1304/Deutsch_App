'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useReadingSession, useSubmitReading } from '@/hooks/useReading';
import { ReadingQuestion, VocabHighlight } from '@/lib/api/reading';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { StructuredPassage } from '../../_components/StructuredPassage';
import { PageHeader, FixedActionBar, MobileSplitTabs } from '@/components/ui';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { synthesizeAudioSequence, type AudioSequenceHandle } from '@/lib/utils';
import {
  IconLoader, IconSend, IconCheck,
  IconPlay, IconPause, IconClock,
} from '../icons';

const ARTICLE_STYLE: Record<string, { backgroundColor: string; color: string }> = {
  'der': { backgroundColor: `${ACCENT.srs}40`,       color: `#93C5FD` },
  'die': { backgroundColor: `${ACCENT.listening}40`, color: `#F9A8D4` },
  'das': { backgroundColor: `#14B8A640`,             color: `#5EEAD4` },
};

const UNANSWERED_GRADIENT = GRADIENT.action;

// ─── Waveform bars (static visual pattern) ───
function WaveformDisplay({ progress }: { progress: number }) {
  const bars = 42;
  return (
    <div className="flex items-center gap-px" style={{ height: 28 }}>
      {Array.from({ length: bars }, (_, i) => {
        const h = 25 + Math.abs(Math.sin(i * 0.9) * 26 + Math.sin(i * 1.7) * 16);
        const active = i / bars <= progress;
        return (
          <div key={i} className="flex-1 rounded-full"
            style={{ height: `${Math.max(16, Math.min(92, h))}%`, backgroundColor: active ? ACCENT.reading : 'var(--theme-border)' }} />
        );
      })}
    </div>
  );
}

// ─── TTS Audio Player ───
function AudioPlayer({ passage }: { passage: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const seqRef = useRef<AudioSequenceHandle | null>(null);

  const wordCount = passage.split(/\s+/).length;
  const duration = Math.max(30, Math.round(wordCount / 110 * 60));
  const progress = Math.min(elapsed / duration, 1);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const stop = useCallback(() => {
    seqRef.current?.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Web Speech API fallback when the backend TTS is fully unreachable.
  const playViaBrowser = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(passage);
    u.lang = 'de-DE';
    u.rate = 0.85 * speed;
    u.onend = () => {
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    window.speechSynthesis.speak(u);
    setIsPlaying(true);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, [passage, speed]);

  // Chunked sequential playback keeps long reading passages (B1 up to ~3500
  // chars) on the natural Piper voice instead of being rejected and dropping
  // to the robotic browser voice.
  const toggle = useCallback(() => {
    if (isPlaying) { stop(); return; }
    setElapsed(0);
    seqRef.current?.stop();
    const seq = synthesizeAudioSequence(passage, {
      playbackRate: 0.85 * speed,
      onStart: () => {
        setIsPlaying(true);
        intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      },
      onEnded: () => {
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      },
      onError: (err) => {
        console.warn('[ReadingAudio] backend failed, falling back to Web Speech API:', err);
        playViaBrowser();
      },
    });
    seqRef.current = seq;
    void seq.play();
  }, [isPlaying, passage, speed, stop, playViaBrowser]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="rounded-2xl p-3.5 mb-4 border"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
      <div className="flex items-center gap-3">
        <button onClick={toggle}
          className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
          style={{ background: GRADIENT.reading, color: 'white' }}>
          {isPlaying ? <IconPause size={14} /> : <IconPlay size={14} />}
        </button>
        <div className="flex-1 min-w-0">
          <WaveformDisplay progress={progress} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>{fmt(elapsed)}</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>{fmt(duration)}</span>
          </div>
        </div>
        <select value={speed}
          onChange={e => { setSpeed(Number(e.target.value)); if (isPlaying) stop(); }}
          className="rounded-lg text-[10px] font-bold outline-none cursor-pointer"
          style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)', padding: '5px 8px' }}>
          <option value={0.75}>0.75x</option>
          <option value={1.0}>1.0x</option>
          <option value={1.25}>1.25x</option>
        </select>
      </div>
    </div>
  );
}

// ─── Vocab Panel (right sidebar) ───
function VocabPanel({ vocabHighlights }: { vocabHighlights: VocabHighlight[] }) {
  const t = useTranslations('practice.reading.answering');
  if (!vocabHighlights.length) return null;
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <h3 className="text-body font-bold mb-3 flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
        🧩 {t('vocabHighlights')}
        <span className="font-normal" style={{ color: 'var(--theme-text-muted)' }}>({vocabHighlights.length})</span>
      </h3>
      <div className="space-y-2.5">
        {vocabHighlights.map((v, i) => {
          const art = v.article?.toLowerCase();
          const artStyle = art ? (ARTICLE_STYLE[art] || {}) : {};
          return (
            <div key={i} className="flex items-center gap-2">
              {art && ['der', 'die', 'das'].includes(art) && (
                <span className="px-1.5 py-0.5 rounded text-caption font-black uppercase shrink-0"
                  style={artStyle}>
                  {art.toUpperCase()}
                </span>
              )}
              <span className="text-body font-semibold flex-1 min-w-0" style={{ color: 'var(--theme-text-primary)' }}>{v.word}</span>
              <span className="text-xs shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{v.translation}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Question Item (2×2 grid options) ───
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

function QuestionItem({ question, index, selectedAnswer, onSelect }: {
  question: ReadingQuestion;
  index: number;
  selectedAnswer: string | undefined;
  onSelect: (questionId: string, optionId: string) => void;
}) {
  const isAnswered = !!selectedAnswer;
  return (
    <div className="rounded-2xl border p-5 transition-colors duration-200"
      style={{ borderColor: isAnswered ? `${ACCENT.reading}59` : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center text-body font-bold shrink-0 text-white"
          style={{ background: isAnswered ? GRADIENT.reading : UNANSWERED_GRADIENT }}>
          {isAnswered ? <IconCheck size={13} /> : index + 1}
        </div>
        <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
          <HighlightedText text={question.questionText} />
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {question.options.map((opt, oi) => {
          const isSelected = selectedAnswer === opt.id;
          return (
            <button key={opt.id}
              onClick={() => onSelect(question.id, opt.id)}
              className="flex items-center gap-2.5 px-3 py-3 rounded-md border-2 text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                borderColor: isSelected ? ACCENT.reading : 'var(--theme-border)',
                backgroundColor: isSelected ? `${ACCENT.reading}14` : 'transparent',
                color: isSelected ? ACCENT.reading : 'var(--theme-text-primary)',
              }}>
              <div className="w-6 h-6 rounded-[8px] border-2 flex items-center justify-center shrink-0 text-caption font-bold"
                style={{
                  borderColor: isSelected ? ACCENT.reading : 'var(--theme-border)',
                  backgroundColor: isSelected ? ACCENT.reading : 'transparent',
                  color: isSelected ? 'white' : 'var(--theme-text-muted)',
                  minWidth: 24,
                }}>
                {OPTION_LABELS[oi]}
              </div>
              <span className="text-body font-medium leading-snug">
                <HighlightedText text={opt.text} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ReadingSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.reading.answering');
  const { data: session, isLoading, error } = useReadingSession(id);
  const submitMutation = useSubmitReading();
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [mobileView, setMobileView] = useState<'task' | 'editor'>('task');
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/reading/${id}/result`);
    }
  }, [session?.status, id, router]);

  const handleSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!session) return;
    const questions = session.questions as ReadingQuestion[];
    if (Object.keys(userAnswers).length < questions.length) return;
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (typeof window !== 'undefined') localStorage.setItem(`reading_time_${id}`, String(elapsed));
    try {
      await submitMutation.mutateAsync({ id, userAnswers });
      router.push(`/practice-test/reading/${id}/result`);
    } catch { /* handled */ }
  };

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT.reading }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>{t('notFound')}</p>
        <Link href="/practice-test/reading" className="text-sm font-semibold" style={{ color: ACCENT.reading }}>
          {t('backToList')}
        </Link>
      </div>
    );
  }

  const questions = session.questions as ReadingQuestion[];
  const vocabHighlights = (session.vocabHighlights || []) as VocabHighlight[];
  const answered = Object.keys(userAnswers).length;
  const wordCount = session.passage.split(/\s+/).length;
  const readingMin = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="max-w-360 mx-auto px-4 py-6 pb-28">
      <PageHeader
        backHref="/practice-test/reading"
        title={t('title')}
        accent="reading"
        right={
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: ACCENT.reading }}>{session.cefrLevel}</span>
        }
      />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {session.title}
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="flex items-center gap-1"><IconClock size={11} /> {t('readingTime', { minutes: readingMin })}</span>
            <span className="opacity-40">·</span>
            <span>{t('wordCount', { count: wordCount })}</span>
            <span className="opacity-40">·</span>
            <span>{t('answeredCount', { answered, total: questions.length })}</span>
          </div>
        </div>
      </div>

      <MobileSplitTabs
        view={mobileView}
        onChange={setMobileView}
        accent="reading"
        taskLabel={t('tabTask')}
        editorLabel={t('tabEditor')}
        editorBadge={
          <span className="text-[10px] font-mono opacity-80">
            {answered}/{questions.length}
          </span>
        }
      />

      <div className="flex flex-col lg:flex-row gap-5 mt-3 lg:mt-0">

        <div className={`${mobileView === 'task' ? 'block' : 'hidden'} lg:block lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 space-y-4`}>
          <AudioPlayer passage={session.passage} />
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <StructuredPassage content={session.passage} highlight textType={session.textType} />
          </div>
          {vocabHighlights.length > 0 && (
            <VocabPanel vocabHighlights={vocabHighlights} />
          )}
        </div>

        <div className={`${mobileView === 'editor' ? 'block' : 'hidden'} lg:block lg:w-1/2 min-w-0 space-y-4`}>
          <h2 className="text-title font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {t('questionsTitle', { count: questions.length })}
          </h2>
          {questions.map((q, i) => (
            <QuestionItem key={q.id} question={q} index={i} selectedAnswer={userAnswers[q.id]} onSelect={handleSelect} />
          ))}
        </div>

      </div>

      <FixedActionBar columns={1}>
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex gap-1">
              {questions.map(q => (
                <div key={q.id} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{ backgroundColor: userAnswers[q.id] ? ACCENT.reading : 'rgba(0,0,0,0.1)' }} />
              ))}
            </div>
            <span className="text-xs font-black uppercase tracking-widest opacity-40">
              {t('progressLabel', { answered, total: questions.length })}
            </span>
          </div>

          <div className="shrink-0 h-8 w-px bg-border/40 mx-2" />

          <button onClick={handleSubmit}
            disabled={answered !== questions.length || submitMutation.isPending}
            className="flex items-center gap-2 px-10 py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg"
            style={{ background: GRADIENT.reading, boxShadow: answered === questions.length ? `0 8px 24px ${ACCENT.reading}4D` : 'none' }}>
            {submitMutation.isPending
              ? <><IconLoader size={16} /> {t('grading')}</>
              : <><IconSend size={16} /> {t('submit')}</>}
          </button>
        </div>
      </FixedActionBar>
    </div>
  );
}
