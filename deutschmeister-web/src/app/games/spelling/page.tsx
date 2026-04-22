'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameProgressBar,
  StatCard, AnswerReview, AddWrongWordsToBank, GameResultUpsell, GameInfoBox, KBD,
  GamePlayHeader, GameStatsBar, useGameTimer,
  IconSpellCheck, IconRocket, IconChevronLeft, IconRefresh, IconX, IconCheck,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';

type Phase = 'setup' | 'playing' | 'result';
type Feedback = 'correct' | 'wrong' | null;

const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };
const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'];

interface AnswerRecord {
  word: Word;
  selectedAnswer: string;
  isCorrect: boolean;
}

export default function SpellingBeePage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playLevelUp, playGameOver, playClick } = useSoundEffects();
  const session = useGameSession('spelling');

  const [phase, setPhase] = useState<Phase>('setup');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const questionsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: words, refetch, isLoading } = useRandomWords(questionsCount, {});
  const currentWord = words?.[index];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Focus input when playing
  useEffect(() => {
    if (phase === 'playing' && !feedback) {
      inputRef.current?.focus();
    }
  }, [phase, index, feedback]);

  const startGame = async () => {
    playClick();
    const result = await refetch();
    if (!result.data?.length) { alert('Không có từ vựng!'); return; }
    setIndex(0); setScore(0); setCombo(0); setBestCombo(0);
    scoreRef.current = 0; comboRef.current = 0; bestComboRef.current = 0;
    correctRef.current = 0; wrongRef.current = 0;
    setInput(''); setFeedback(null); setAnswers([]);
    setPhase('playing');
    session.start(questionsCount);
  };

  const advanceToNext = useCallback((delay: number, callback?: () => void) => {
    setTimeout(() => {
      callback?.();
      if (index + 1 >= questionsCount) {
        playGameOver();
        session.end(scoreRef.current, bestComboRef.current, correctRef.current, wrongRef.current);
        setPhase('result');
      } else {
        setIndex(i => i + 1);
        setInput('');
        setFeedback(null);
      }
    }, delay);
  }, [index, questionsCount, playGameOver, session]);

  const submitAnswer = useCallback(() => {
    if (!currentWord || feedback) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const isCorrect = trimmed.toLowerCase() === currentWord.word.toLowerCase();
    setAnswers(prev => [...prev, { word: currentWord, selectedAnswer: trimmed, isCorrect }]);

    if (isCorrect) {
      setFeedback('correct');
      playCorrect();
      correctRef.current++;
      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      const multiplier = Math.min(newCombo, 4);
      scoreRef.current += 15 * multiplier;
      setScore(scoreRef.current);
      setCombo(newCombo);
      if (newCombo > bestComboRef.current) {
        bestComboRef.current = newCombo;
        setBestCombo(newCombo);
      }
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
      if (scoreRef.current > 0 && scoreRef.current % 100 === 0) setTimeout(() => playLevelUp(), 300);
      advanceToNext(1000);
    } else {
      setFeedback('wrong');
      playWrong();
      comboRef.current = 0;
      wrongRef.current++;
      setCombo(0);
      advanceToNext(1600);
    }
  }, [currentWord, feedback, input, playCorrect, playWrong, playCombo, playLevelUp, advanceToNext]);

  // Enter key to submit
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === 'Enter') submitAnswer();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, submitAnswer]);

  const insertSpecial = useCallback((char: string) => {
    setInput(prev => prev + char);
    inputRef.current?.focus();
  }, []);

  // Word length hint: show underscores
  const lengthHint = currentWord
    ? currentWord.word.split('').map(() => '_').join(' ')
    : '';

  const timer = useGameTimer(phase === 'playing');

  // ─── Setup Screen ───
  if (phase === 'setup') {
    return (
      <GameSetupCard icon={({ size }) => <span style={{ color: 'white' }}><IconSpellCheck size={size} /></span>} iconColor="#EC4899" title="Spelling Bee">
        <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          Gõ đúng chính tả <span className="font-bold" style={{ color: '#EC4899' }}>{questionsCount} từ</span> tiếng Đức
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          (Thay đổi số câu trong Settings → Học tập)
        </p>

        <GameInfoBox>
          <div className="flex items-center gap-2">
            <span style={{ color: '#EC4899' }}><IconSpellCheck size={14} /></span>
            <span>15 điểm/câu đúng · Combo tối đa x4</span>
          </div>
          <div className="flex items-center gap-2">
            <KBD>Enter</KBD>
            <span>để xác nhận đáp án</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-body" style={{ color: '#EC4899' }}>ä ö ü ß</span>
            <span>Nút ký tự đặc biệt có sẵn</span>
          </div>
        </GameInfoBox>

        <div className="flex gap-3 justify-center mt-6">
          <Button variant="game" accent="listening" onClick={startGame} isLoading={isLoading}>
            <IconRocket size={16} /> Bắt đầu
          </Button>
          <Button variant="outline" onClick={() => router.push('/games')}>
            <IconChevronLeft size={16} /> Quay lại
          </Button>
        </div>
      </GameSetupCard>
    );
  }

  // ─── Result Screen ───
  if (phase === 'result') {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctCount / questionsCount) * 100);
    return (
      <>
        <GameResultCard accuracy={accuracy} title="Kết quả">
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: '#EC4899' }}>{score}</div>
            <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label="Đúng" value={correctCount} color="#22C55E" />
            <StatCard label="Sai" value={questionsCount - correctCount} color="#EF4444" />
            <StatCard label="Chính xác" value={`${accuracy}%`} />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color="#F59E0B" />
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="listening" onClick={startGame}><IconRefresh size={16} /> Chơi lại</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</Button>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: a.word.word, color: AC[a.word.gender] || '#EC4899' })}
            getSelectedLabel={a => !a.isCorrect ? a.selectedAnswer : null}
          />
        </div>
        <AddWrongWordsToBank wrongWords={answers.filter(a => !a.isCorrect).map(a => a.word)} />
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing Screen ───
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader title="Spelling Bee" streak={combo} timer={timer}
        onExit={() => { playClick(); router.push('/games'); }} />
      <GameStatsBar stats={[
        { label: 'Điểm',  value: score,                          color: '#EC4899' },
        { label: 'Đúng',  value: correctCount,                   color: '#22C55E', dot: true },
        { label: 'Sai',   value: index - correctCount,           color: '#EF4444', dot: true },
        { label: 'Câu',   value: `${index + 1}/${questionsCount}`, color: 'var(--theme-text-primary)' },
      ]} />
      <GameProgressBar current={index + 1} total={questionsCount} />

      {currentWord && (
        <div className="rounded-3xl overflow-hidden mb-5 mt-4 transition-all duration-300"
          style={{
            background: feedback === 'correct'
              ? 'linear-gradient(135deg, #052e16 0%, #166534 100%)'
              : feedback === 'wrong'
              ? 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)'
              : 'linear-gradient(135deg, #2a0a1e 0%, #9d174d 100%)',
          }}>
          <div className="flex flex-col items-center justify-center px-6 py-8 text-center" style={{ minHeight: 200 }}>
            <div className="text-body font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Mạo từ:{' '}
              <span className="font-bold" style={{ color: AC[currentWord.gender] }}>
                {GenderInfo[currentWord.gender].article}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-1 text-white">
              {currentWord.translationEn}
            </h2>
            {settings.showVietnamese && currentWord.translationVi && (
              <p className="text-[15px] mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {currentWord.translationVi}
              </p>
            )}

            <p className="text-xs font-mono tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {lengthHint}
            </p>

            {feedback === 'correct' && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <IconCheck size={18} style={{ color: '#4ade80' }} />
                <span className="font-bold text-base" style={{ color: '#4ade80' }}>{currentWord.word}</span>
              </div>
            )}
            {feedback === 'wrong' && (
              <div className="mb-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <IconX size={16} style={{ color: '#f87171' }} />
                  <span className="text-sm line-through" style={{ color: '#f87171' }}>{input}</span>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Đáp án: <span className="font-bold text-white">
                    {GenderInfo[currentWord.gender].article} {currentWord.word}
                  </span>
                </p>
              </div>
            )}

            {!feedback && (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Gõ từ tiếng Đức..."
                  className="w-full rounded-xl px-4 py-3 text-center text-base font-semibold outline-none transition-all border-2"
                  style={{
                    borderColor: '#EC4899',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: 'white',
                  }}
                />
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  {SPECIAL_CHARS.map(ch => (
                    <button key={ch}
                      onClick={() => insertSpecial(ch)}
                      className="w-9 h-9 rounded-lg text-sm font-bold transition-all hover:scale-105"
                      style={{
                        border: '1px solid rgba(236,72,153,.5)',
                        color: '#F9A8D4',
                        backgroundColor: 'rgba(236,72,153,.15)',
                      }}>
                      {ch}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="game" accent="listening" onClick={submitAnswer} disabled={!input.trim()}>
                    <IconCheck size={16} /> Xác nhận
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
