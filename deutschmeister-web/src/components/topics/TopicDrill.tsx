'use client';

import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import type { TopicWord } from '@/types/topic';
import { speakGerman } from '@/lib/utils';
import { normalizeGerman } from '@/lib/grammarTrainer/engine';
import { isNearMiss } from '@/lib/text';
import { IconVolume, IconRotateCcw } from '@/components/ui/Icons';

export type DrillMode = 'listening' | 'typing' | 'mixed';

// listen  — hear the word, pick its meaning
// type    — see the meaning, type the German word
// dictate — hear the word, type it
type QuestionKind = 'listen' | 'type' | 'dictate';

interface Question {
  word: TopicWord;
  kind: QuestionKind;
  options: string[]; // only for 'listen'
  correctIndex: number;
}

type Verdict = 'correct' | 'almost' | 'missingArticle' | 'wrong';

const DRILL_SIZE = 10;
const MIN_WORDS = 4;
const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'ß'];

const ArticleColor: Record<string, string> = {
  der: ACCENT.srs, die: ACCENT.listening, das: STATUS.success,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const meaningOf = (w: TopicWord) => w.translationVi || w.translationEn;
const germanOf = (w: TopicWord) => (w.article ? `${w.article} ${w.word}` : w.word);

function kindsFor(mode: DrillMode): QuestionKind[] {
  if (mode === 'listening') return ['listen'];
  if (mode === 'typing') return ['type'];
  return ['listen', 'type', 'dictate'];
}

function generateQuestions(words: TopicWord[], mode: DrillMode, pool: TopicWord[] = words): Question[] {
  if (pool.length < MIN_WORDS) return [];
  const kinds = kindsFor(mode);
  return shuffle(words).slice(0, DRILL_SIZE).map((word) => {
    const kind = kinds[Math.floor(Math.random() * kinds.length)]!;
    if (kind !== 'listen') return { word, kind, options: [], correctIndex: -1 };
    const correct = meaningOf(word);
    const distractors = shuffle(
      [...new Set(pool.filter((w) => w.id !== word.id).map(meaningOf))].filter((m) => m !== correct),
    ).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    return { word, kind, options, correctIndex: options.indexOf(correct) };
  });
}

/** Typed answers: umlaut-insensitive (ae/oe/ue/ss accepted), article required for nouns. */
export function gradeTyped(input: string, word: TopicWord): Verdict {
  const typed = normalizeGerman(input);
  const expected = normalizeGerman(germanOf(word));
  if (!typed) return 'wrong';
  if (typed === expected) return 'correct';
  if (word.article && typed === normalizeGerman(word.word)) return 'missingArticle';
  if (isNearMiss(typed, expected)) return 'almost';
  return 'wrong';
}

// ─── State ───

type DrillState = {
  questions: Question[];
  index: number;
  verdict: Verdict | null;
  selectedOption: number | null;
  score: number;
  wrongWords: Set<string>;
  finished: boolean;
};

type DrillAction =
  | { type: 'init'; questions: Question[] }
  | { type: 'answer'; verdict: Verdict; wordId: string; selectedOption?: number }
  | { type: 'next' };

const EMPTY: DrillState = {
  questions: [], index: 0, verdict: null, selectedOption: null, score: 0, wrongWords: new Set(), finished: false,
};

function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case 'init':
      return { ...EMPTY, wrongWords: new Set(), questions: action.questions };
    case 'answer': {
      const correct = action.verdict === 'correct';
      return {
        ...state,
        verdict: action.verdict,
        selectedOption: action.selectedOption ?? null,
        score: correct ? state.score + 1 : state.score,
        wrongWords: correct ? state.wrongWords : new Set(state.wrongWords).add(action.wordId),
      };
    }
    case 'next':
      if (state.index < state.questions.length - 1) {
        return { ...state, index: state.index + 1, verdict: null, selectedOption: null };
      }
      return { ...state, finished: true };
    default:
      return state;
  }
}

// ─── Component ───

interface Props {
  words: TopicWord[];
  mode: DrillMode;
  topicColor: string;
  onMarkLearned?: (wordId: string) => void;
}

const monoGradient = (color: string) => `linear-gradient(135deg, ${color}, ${color}cc)`;

export function TopicDrill({ words, mode, topicColor, onMarkLearned }: Props) {
  const t = useTranslations('vocabulary.topicStudy');
  const [state, dispatch] = useReducer(drillReducer, EMPTY);
  const { questions, index, verdict, selectedOption, score, wrongWords, finished } = state;
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (words.length >= MIN_WORDS) dispatch({ type: 'init', questions: generateQuestions(words, mode) });
  }, [words, mode]);

  const current = questions[index];
  const total = questions.length;
  const answered = verdict !== null;
  const hearsWord = current?.kind === 'listen' || current?.kind === 'dictate';

  // Auto-play for listening questions; focus the box for typed ones
  useEffect(() => {
    if (!current) return;
    if (current.kind !== 'type') speakGerman(germanOf(current.word));
    if (current.kind !== 'listen') inputRef.current?.focus();
  }, [current]);

  const restart = useCallback((subset?: TopicWord[]) => {
    setInput('');
    dispatch({ type: 'init', questions: generateQuestions(subset ?? words, mode, words) });
  }, [words, mode]);

  const record = useCallback((v: Verdict, selected?: number) => {
    if (!current) return;
    dispatch({ type: 'answer', verdict: v, wordId: current.word.id, selectedOption: selected });
    if (v === 'correct') onMarkLearned?.(current.word.id);
    // Reveal the pronunciation after a typed answer so the learner hears it once
    if (current.kind === 'type') speakGerman(germanOf(current.word));
  }, [current, onMarkLearned]);

  const choose = useCallback((i: number) => {
    if (answered || !current || current.kind !== 'listen') return;
    record(i === current.correctIndex ? 'correct' : 'wrong', i);
  }, [answered, current, record]);

  const submitTyped = useCallback(() => {
    if (answered || !current || current.kind === 'listen' || !input.trim()) return;
    record(gradeTyped(input, current.word));
  }, [answered, current, input, record]);

  const next = useCallback(() => {
    setInput('');
    dispatch({ type: 'next' });
  }, []);

  // Keyboard: 1-4 pick (listen), Enter submit / next
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!current) return;
      if (answered && (e.key === 'Enter' || (e.key === ' ' && current.kind === 'listen'))) {
        e.preventDefault();
        next();
      } else if (!answered && current.kind === 'listen') {
        const n = parseInt(e.key);
        if (n >= 1 && n <= current.options.length) choose(n - 1);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [current, answered, choose, next]);

  if (words.length < MIN_WORDS) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--theme-text-muted)' }}>{t('quizNeedMin', { count: words.length })}</p>
      </div>
    );
  }

  // ─── Finished ───
  if (finished) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const scoreGradient = pct >= 80 ? GRADIENT.readingGreenH : pct >= 50 ? GRADIENT.xpGoldH : GRADIENT.dangerSolidH;
    const resultMsg = pct >= 80 ? t('msgExcellent') : pct >= 50 ? t('msgGood') : t('msgNeedReview');
    const wrongList = words.filter((w) => wrongWords.has(w.id));
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {t('resultScore', { score, total })}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>{resultMsg}</p>

        <div className="w-64 mx-auto mb-6">
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: scoreGradient }} />
          </div>
          <div className="text-body font-bold mt-1" style={{ color: topicColor }}>{pct}%</div>
        </div>

        {wrongList.length > 0 && (
          <div className="max-w-sm mx-auto mb-6 text-left p-4 rounded-xl"
            style={{ backgroundColor: `${STATUS.danger}0f`, border: `1px solid ${STATUS.danger}26` }}>
            <div className="text-xs font-bold mb-2" style={{ color: STATUS.danger }}>
              {t('wrongWordsRecap', { count: wrongList.length })}
            </div>
            <div className="space-y-1.5">
              {wrongList.map((w) => (
                <button key={w.id} onClick={() => speakGerman(germanOf(w))}
                  className="flex w-full items-center gap-2 text-body text-left">
                  <span className="font-semibold" style={{ color: ArticleColor[w.article] || ACCENT.gray }}>{germanOf(w)}</span>
                  <span style={{ color: 'var(--theme-text-muted)' }}>—</span>
                  <span style={{ color: 'var(--theme-text-secondary)' }}>{meaningOf(w)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          {wrongList.length > 0 && (
            <button onClick={() => restart(wrongList)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: `${STATUS.danger}1a`, color: STATUS.danger }}>
              <IconRotateCcw size={15} /> {t('reviewWrong')}
            </button>
          )}
          <button onClick={() => restart()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${topicColor}15`, color: topicColor }}>
            <IconRotateCcw size={15} /> {t('newQuiz')}
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const ac = ArticleColor[current.word.article] || ACCENT.gray;
  const prompt = current.kind === 'listen' ? t('qListen') : current.kind === 'type' ? t('qType') : t('qDictate');
  const verdictColor = verdict === 'correct' ? STATUS.success : verdict === 'almost' || verdict === 'missingArticle' ? STATUS.warning : STATUS.danger;
  const verdictText = verdict === 'correct' ? t('correct')
    : verdict === 'almost' ? t('almost')
    : verdict === 'missingArticle' ? t('missingArticle')
    : t('wrong');

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>
          {t('questionProgress', { current: index + 1, total })}
        </span>
        <span className="text-body font-bold" style={{ color: topicColor }}>
          {t('scoreLabel', { score, answered: index + (answered ? 1 : 0) })}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-6" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(index / total) * 100}%`, backgroundColor: topicColor }} />
      </div>

      {/* Prompt card */}
      <div className="p-6 rounded-2xl border mb-5"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {prompt}
        </div>

        {hearsWord ? (
          <div className="flex items-center gap-3">
            <button onClick={() => speakGerman(germanOf(current.word))} aria-label={t('listen')}
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: `${topicColor}1a`, color: topicColor }}>
              <IconVolume size={26} />
            </button>
            <button onClick={() => speakGerman(germanOf(current.word), true)}
              className="px-3 py-2 rounded-xl text-body font-semibold"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
              {t('listenSlow')}
            </button>
            {answered && (
              <span className="text-2xl font-bold ml-2" style={{ color: ac }}>{germanOf(current.word)}</span>
            )}
          </div>
        ) : (
          <div className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>{meaningOf(current.word)}</div>
        )}
      </div>

      {/* Answer area */}
      {current.kind === 'listen' ? (
        <div className="grid grid-cols-1 gap-3 mb-5">
          {current.options.map((opt, i) => {
            let style: React.CSSProperties = {
              backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)',
            };
            if (answered) {
              if (i === current.correctIndex) style = { backgroundColor: `${STATUS.success}1a`, borderColor: STATUS.success, color: STATUS.success };
              else if (i === selectedOption) style = { backgroundColor: `${STATUS.danger}1a`, borderColor: STATUS.danger, color: STATUS.danger };
              else style = { ...style, opacity: 0.4 };
            }
            return (
              <button key={i} onClick={() => choose(i)} disabled={answered}
                className={`p-4 rounded-xl border-2 text-left text-[15px] font-medium transition-all ${!answered ? 'hover:-translate-y-0.5 hover:shadow-sm cursor-pointer' : ''}`}
                style={style}>
                <span className="text-xs font-bold mr-3 opacity-50">{i + 1}</span>
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <form className="mb-5" onSubmit={(e) => { e.preventDefault(); submitTyped(); }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={answered}
            autoComplete="off" autoCapitalize="off" spellCheck={false}
            placeholder={current.word.article ? t('typePlaceholderNoun') : t('typePlaceholder')}
            className="w-full px-4 py-3 rounded-xl border-2 text-lg font-medium outline-none transition-colors"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
              borderColor: answered ? verdictColor : 'var(--theme-border)',
            }}
          />
          {!answered && (
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                {SPECIAL_CHARS.map((ch) => (
                  <button key={ch} type="button"
                    onClick={() => { setInput((v) => v + ch); inputRef.current?.focus(); }}
                    className="w-9 h-9 rounded-lg text-body font-semibold"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>
                    {ch}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={!input.trim()}
                className="px-5 py-2.5 rounded-xl text-body font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: monoGradient(topicColor) }}>
                {t('check')}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Feedback + next */}
      {answered && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold" style={{ color: verdictColor }}>
            {verdictText}
            {current.kind !== 'listen' && verdict !== 'correct' && (
              <span className="ml-2" style={{ color: 'var(--theme-text-secondary)' }}>
                → <span style={{ color: ac }}>{germanOf(current.word)}</span>
              </span>
            )}
            {current.kind === 'dictate' && (
              <span className="ml-2" style={{ color: 'var(--theme-text-muted)' }}>({meaningOf(current.word)})</span>
            )}
          </div>
          <button onClick={next}
            className="px-5 py-2.5 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5 shrink-0"
            style={{ background: monoGradient(topicColor) }}>
            {index < total - 1 ? t('nextQuestion') : t('viewResult')}
          </button>
        </div>
      )}
    </div>
  );
}
