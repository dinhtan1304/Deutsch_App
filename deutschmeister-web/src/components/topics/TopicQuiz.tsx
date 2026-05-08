'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import type { TopicWord } from '@/types/topic';
import { speakGerman } from '@/lib/utils';

function IconVolume({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
function IconRotateCcw({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
  );
}

const ArticleColor: Record<string, string> = {
  der: ACCENT.srs, die: ACCENT.listening, das: STATUS.success,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i]!;
    a[i] = a[j]!;
    a[j] = temp;
  }
  return a;
}

type QuizMode = 'de-to-vi' | 'vi-to-de' | 'article';

interface Question {
  word: TopicWord;
  options: string[];
  correctIndex: number;
  mode: QuizMode;
}

function generateQuestions(words: TopicWord[], count: number): Question[] {
  if (words.length < 4) return [];

  const shuffled = shuffle(words);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const questions: Question[] = [];

  for (const word of selected) {
    const modes: QuizMode[] = ['de-to-vi', 'vi-to-de'];
    if (word.article) modes.push('article');
    const mode = modes[Math.floor(Math.random() * modes.length)]!;

    let correct: string;
    let distractorPool: string[];

    if (mode === 'de-to-vi') {
      correct = word.translationVi || word.translationEn;
      distractorPool = words
        .filter(w => w.id !== word.id)
        .map(w => w.translationVi || w.translationEn);
    } else if (mode === 'vi-to-de') {
      correct = word.article ? `${word.article} ${word.word}` : word.word;
      distractorPool = words
        .filter(w => w.id !== word.id)
        .map(w => w.article ? `${w.article} ${w.word}` : w.word);
    } else {
      correct = word.article;
      distractorPool = ['der', 'die', 'das'].filter(a => a !== word.article);
      const options = shuffle([correct, ...distractorPool]);
      questions.push({ word, options, correctIndex: options.indexOf(correct), mode });
      continue;
    }

    const distractors = shuffle(distractorPool).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    questions.push({ word, options, correctIndex: options.indexOf(correct), mode });
  }

  return questions;
}

// ─── State management ───

type QuizState = {
  questions: Question[];
  currentIndex: number;
  selectedOption: number | null;
  isAnswered: boolean;
  score: number;
  wrongWords: Set<string>;
  isFinished: boolean;
};

type QuizAction =
  | { type: 'init'; questions: Question[] }
  | { type: 'select'; optionIndex: number; correctIndex: number; wordId: string }
  | { type: 'next' };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'init':
      return { questions: action.questions, currentIndex: 0, selectedOption: null, isAnswered: false, score: 0, wrongWords: new Set(), isFinished: false };
    case 'select': {
      const correct = action.optionIndex === action.correctIndex;
      const wrongWords = correct ? state.wrongWords : new Set(state.wrongWords).add(action.wordId);
      return { ...state, selectedOption: action.optionIndex, isAnswered: true, score: correct ? state.score + 1 : state.score, wrongWords };
    }
    case 'next':
      if (state.currentIndex < state.questions.length - 1) {
        return { ...state, currentIndex: state.currentIndex + 1, selectedOption: null, isAnswered: false };
      }
      return { ...state, isFinished: true };
    default:
      return state;
  }
}

const QUIZ_SIZE = 10;

// ─── Component ───

interface Props {
  words: TopicWord[];
  topicColor: string;
  onMarkLearned?: (wordId: string) => void;
}

const monoGradient = (color: string) => `linear-gradient(135deg, ${color}, ${color}cc)`;

export function TopicQuiz({ words, topicColor, onMarkLearned }: Props) {
  const [state, dispatch] = useReducer(quizReducer, {
    questions: [], currentIndex: 0, selectedOption: null,
    isAnswered: false, score: 0, wrongWords: new Set<string>(), isFinished: false,
  });
  const { questions, currentIndex, selectedOption, isAnswered, score, wrongWords, isFinished } = state;

  // Init / re-init when words change
  useEffect(() => {
    if (words.length >= 4) dispatch({ type: 'init', questions: generateQuestions(words, QUIZ_SIZE) });
  }, [words]);

  const current = questions[currentIndex];
  const total = questions.length;

  const startQuiz = useCallback((wordSet?: TopicWord[]) => {
    dispatch({ type: 'init', questions: generateQuestions(wordSet ?? words, QUIZ_SIZE) });
  }, [words]);

  const handleSelect = useCallback((optionIndex: number) => {
    if (isAnswered || !current) return;
    dispatch({ type: 'select', optionIndex, correctIndex: current.correctIndex, wordId: current.word.id });
    if (optionIndex === current.correctIndex) onMarkLearned?.(current.word.id);
  }, [isAnswered, current, onMarkLearned]);

  const handleNext = useCallback(() => {
    dispatch({ type: 'next' });
  }, []);

  // Keyboard: 1-4 select, Enter/Space next
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!current) return;
      if (!isAnswered) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= current.options.length) handleSelect(num - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [current, isAnswered, handleSelect, handleNext]);

  const playAudio = (text: string) => {
    speakGerman(text);
  };

  if (words.length < 4) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📝</div>
        <p style={{ color: 'var(--theme-text-muted)' }}>
          Cần ít nhất 4 từ để tạo quiz. Chủ đề này có {words.length} từ.
        </p>
      </div>
    );
  }

  // ─── Finished ───
  if (isFinished) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const scoreGradient = pct >= 80 ? GRADIENT.readingGreenH : pct >= 50 ? GRADIENT.xpGoldH : GRADIENT.dangerSolidH;
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📖'}</div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Kết quả: {score}/{total}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          {pct >= 80 ? 'Xuất sắc! 🎉' : pct >= 50 ? 'Khá tốt, tiếp tục cố gắng!' : 'Cần ôn lại thêm nhé!'}
        </p>

        {/* Score bar */}
        <div className="w-64 mx-auto mb-6">
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: scoreGradient }} />
          </div>
          <div className="text-body font-bold mt-1" style={{ color: topicColor }}>{pct}%</div>
        </div>

        {/* Wrong words recap */}
        {wrongWords.size > 0 && (
          <div className="max-w-sm mx-auto mb-6 text-left p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)' }}>
            <div className="text-xs font-bold mb-2" style={{ color: STATUS.danger }}>
              Từ cần ôn lại ({wrongWords.size}):
            </div>
            <div className="space-y-1.5">
              {words.filter(w => wrongWords.has(w.id)).map(w => (
                <div key={w.id} className="flex items-center gap-2 text-body">
                  <span className="font-semibold" style={{ color: ArticleColor[w.article] || ACCENT.gray }}>
                    {w.article} {w.word}
                  </span>
                  <span style={{ color: 'var(--theme-text-muted)' }}>—</span>
                  <span style={{ color: 'var(--theme-text-secondary)' }}>
                    {w.translationVi || w.translationEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          {wrongWords.size > 0 && (
            <button onClick={() => {
              const wrongList = words.filter(w => wrongWords.has(w.id));
              startQuiz(wrongList.length >= 4 ? wrongList : undefined);
            }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(239,68,68,.1)', color: STATUS.danger }}>
              <IconRotateCcw size={15} /> Ôn từ sai
            </button>
          )}
          <button onClick={() => startQuiz()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${topicColor}15`, color: topicColor }}>
            <IconRotateCcw size={15} /> Quiz mới
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const ac = ArticleColor[current.word.article] || ACCENT.gray;
  const questionLabel = current.mode === 'de-to-vi'
    ? 'Nghĩa của từ này?'
    : current.mode === 'vi-to-de'
    ? 'Từ tiếng Đức nào đúng?'
    : 'Article nào đúng?';

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>
          Câu {currentIndex + 1}/{total}
        </span>
        <span className="text-body font-bold" style={{ color: topicColor }}>
          Điểm: {score}/{currentIndex + (isAnswered ? 1 : 0)}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-6"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex) / total) * 100}%`, backgroundColor: topicColor }} />
      </div>

      {/* Question Card */}
      <div className="p-6 rounded-2xl border mb-5"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--theme-text-muted)' }}>
          {questionLabel}
        </div>

        {current.mode === 'de-to-vi' || current.mode === 'article' ? (
          <div className="flex items-center gap-3">
            {current.word.article && current.mode !== 'article' && (
              <span className="text-[15px] font-bold" style={{ color: ac }}>
                {current.word.article}
              </span>
            )}
            <span className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {current.word.word}
            </span>
            <button onClick={() => playAudio(`${current.word.article || ''} ${current.word.word}`)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: `${ac}15`, color: ac }}>
              <IconVolume size={16} />
            </button>
          </div>
        ) : (
          <div className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {current.word.translationVi || current.word.translationEn}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3 mb-5">
        {current.options.map((opt, i) => {
          let optStyle: React.CSSProperties = {
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          };

          if (isAnswered) {
            if (i === current.correctIndex) {
              optStyle = {
                backgroundColor: 'rgba(34,197,94,.1)',
                borderColor: STATUS.success,
                color: STATUS.success,
              };
            } else if (i === selectedOption && i !== current.correctIndex) {
              optStyle = {
                backgroundColor: 'rgba(239,68,68,.1)',
                borderColor: STATUS.danger,
                color: STATUS.danger,
              };
            } else {
              optStyle = { ...optStyle, opacity: 0.4 };
            }
          }

          return (
            <button key={i} onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={`p-4 rounded-xl border-2 text-left text-[15px] font-medium transition-all
                ${!isAnswered ? 'hover:-translate-y-0.5 hover:shadow-sm cursor-pointer' : ''}`}
              style={optStyle}>
              <span className="text-xs font-bold mr-3 opacity-50">{i + 1}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
      {isAnswered && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold"
            style={{ color: selectedOption === current.correctIndex ? STATUS.success : STATUS.danger }}>
            {selectedOption === current.correctIndex ? '✓ Chính xác!' : '✗ Sai rồi!'}
          </div>
          <button onClick={handleNext}
            className="px-5 py-2.5 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: monoGradient(topicColor) }}>
            {currentIndex < total - 1 ? 'Câu tiếp → Enter' : 'Xem kết quả'}
          </button>
        </div>
      )}
    </div>
  );
}
