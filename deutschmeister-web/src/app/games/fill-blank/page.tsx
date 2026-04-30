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
  IconPenTool, IconTarget, IconCheck, IconX, IconRocket, IconKeyboard, IconVolume,
  IconRefresh, IconChevronLeft, IconLightbulb,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

const AC: Record<string, string> = { masculine: ACCENT.srs, feminine: ACCENT.listening, neuter: STATUS.success };

type Phase = 'setup' | 'playing' | 'result';

interface AnswerRecord {
  word: Word;
  userInput: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function FillBlankPage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playLevelUp, playGameOver, playClick } = useSoundEffects();
  const session = useGameSession('fill-blank');
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('setup');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showHint, setShowHint] = useState(false);

  const questionsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: words, refetch, isLoading } = useRandomWords(questionsCount, {});
  const currentWord = words?.[index];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (phase === 'playing' && !answered && inputRef.current) inputRef.current.focus();
  }, [phase, answered, index]);

  const startGame = async () => {
    playClick();
    setLoadError(null);
    const result = await refetch();
    if (!result.data?.length) { setLoadError('Không có từ vựng! Vui lòng thêm từ hoặc seed database.'); return; }
    setIndex(0); setScore(0); setCombo(0); setBestCombo(0);
    scoreRef.current = 0; bestComboRef.current = 0;
    correctRef.current = 0; wrongRef.current = 0;
    setUserInput(''); setAnswered(false); setIsCorrect(false);
    setAnswers([]); setShowHint(false); setPhase('playing');
    session.start(questionsCount);
  };

  const checkAnswer = useCallback(() => {
    if (answered || !currentWord) return;
    const correctAnswer = currentWord.article.toLowerCase();
    const userAnswer = userInput.trim().toLowerCase();
    const correct = userAnswer === correctAnswer;
    setAnswered(true); setIsCorrect(correct);
    setAnswers(prev => [...prev, { word: currentWord, userInput: userInput.trim(), correctAnswer: currentWord.article, isCorrect: correct }]);

    if (correct) {
      playCorrect();
      correctRef.current++;
      const newCombo = combo + 1; const multiplier = Math.min(newCombo, 4);
      setScore(s => s + 10 * multiplier); scoreRef.current += 10 * multiplier;
      setCombo(newCombo);
      if (newCombo > bestCombo) { setBestCombo(newCombo); bestComboRef.current = newCombo; }
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
      if ((score + 10 * multiplier) % 100 === 0) setTimeout(() => playLevelUp(), 300);
    } else { playWrong(); wrongRef.current++; setCombo(0); }
  }, [answered, currentWord, userInput, combo, bestCombo, score, playCorrect, playWrong, playCombo, playLevelUp]);

  const nextQuestion = useCallback(() => {
    if (index + 1 >= questionsCount) { playGameOver(); setPhase('result'); }
    else { setIndex(i => i + 1); setUserInput(''); setAnswered(false); setIsCorrect(false); setShowHint(false); }
  }, [index, questionsCount, playGameOver]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { if (!answered) checkAnswer(); else nextQuestion(); }
  };

  // BUG FIX 7: Removed unnecessary setTimeout(100) wrapper.
  // Previously: setUserInput(article) ran immediately, then 100ms later the
  // actual logic ran — during this window a second click could fire since
  // `answered` was still false. The stale `combo` in the closure also meant
  // the multiplier could use an outdated value in rapid clicks.
  const handleQuickAnswer = (article: string) => {
    if (answered || !currentWord) return;
    const correctAnswer = currentWord.article.toLowerCase();
    const correct = article.toLowerCase() === correctAnswer;
    setUserInput(article);
    setAnswered(true); setIsCorrect(correct);
    setAnswers(prev => [...prev, { word: currentWord, userInput: article, correctAnswer: currentWord.article, isCorrect: correct }]);
    if (correct) {
      playCorrect(); correctRef.current++; const newCombo = combo + 1;
      const multiplier = Math.min(newCombo, 4);
      setScore(s => s + 10 * multiplier); scoreRef.current += 10 * multiplier;
      setCombo(newCombo);
      if (newCombo > bestCombo) { setBestCombo(newCombo); bestComboRef.current = newCombo; }
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
    } else { playWrong(); wrongRef.current++; setCombo(0); }
  };

  // Save game session to backend when game ends
  useEffect(() => {
    if (phase === 'result') {
      session.end(scoreRef.current, bestComboRef.current, correctRef.current, wrongRef.current);
    }
  }, [phase, session]);

  const timer = useGameTimer(phase === 'playing');

  // ─── Setup ───
  if (phase === 'setup') {
    return (
        <GameSetupCard icon={({ size }) => <IconPenTool size={size} style={{ color: 'white' }} />} iconColor={ACCENT.vocab} title="Fill in the Blank" loadError={loadError}>
          <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Điền mạo từ đúng cho <span className="font-bold" style={{ color: ACCENT.vocab }}>{questionsCount} từ</span>
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>(Thay đổi số câu trong Settings → Học tập)</p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconTarget size={14} style={{ color: ACCENT.vocab }} /><span>Gõ hoặc click nút để điền mạo từ</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: ACCENT.srs }} /><span>Nhấn <KBD>Enter</KBD> để xác nhận</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: STATUS.success }} /><span>Âm thanh: {settings.soundEnabled ? 'Bật' : 'Tắt'}</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="game" accent="premium" onClick={startGame} isLoading={isLoading}><IconRocket size={16} /> Bắt đầu</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</Button>
          </div>
        </GameSetupCard>
    );
  }

  // ─── Result ───
  if (phase === 'result') {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect).length;
    const accuracy = Math.round((correctCount / questionsCount) * 100);

    return (
      <>
        <GameResultCard accuracy={accuracy} title="Kết quả">
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: ACCENT.vocab }}>{score}</div>
            <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label="Đúng" value={correctCount} color={STATUS.success} />
            <StatCard label="Sai" value={wrongCount} color={STATUS.danger} />
            <StatCard label="Chính xác" value={`${accuracy}%`} color={ACCENT.srs} />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color={ACCENT.xp} />
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="premium" onClick={startGame}><IconRefresh size={16} /> Chơi lại</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</Button>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: a.correctAnswer, color: AC[a.word.gender] || ACCENT.vocab })}
            getSelectedLabel={a => !a.isCorrect ? (a.userInput || '(trống)') : null}
          />
        </div>
        <AddWrongWordsToBank wrongWords={answers.filter(a => !a.isCorrect).map(a => a.word)} />
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing ───
  const genderColor = currentWord ? (AC[currentWord.gender] || ACCENT.vocab) : ACCENT.vocab;
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader title="Fill in the Blank" streak={combo} timer={timer}
        onExit={() => { playClick(); router.push('/games'); }} />
      <GameStatsBar stats={[
        { label: 'Điểm',  value: score,        color: ACCENT.vocab },
        { label: 'Đúng',  value: correctCount, color: STATUS.success, dot: true },
        { label: 'Sai',   value: index - correctCount, color: STATUS.danger, dot: true },
        { label: 'Câu',   value: `${index + 1}/${questionsCount}`, color: 'var(--theme-text-primary)' },
      ]} />
        <GameProgressBar current={index + 1} total={questionsCount} />

      {currentWord && (
        <div className="rounded-3xl overflow-hidden mb-5 transition-all duration-300"
          style={{
            background: answered
              // eslint-disable-next-line no-restricted-syntax
              ? (isCorrect ? 'linear-gradient(135deg, #052e16 0%, #166534 100%)' : 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)')
              // eslint-disable-next-line no-restricted-syntax
              : 'linear-gradient(135deg, #1a1040 0%, #5b21b6 100%)',
          }}>
          <div className="flex flex-col items-center justify-center px-6 py-6 text-center" style={{ minHeight: 150 }}>
            <div className="text-2xl md:text-3xl font-extrabold mb-3 text-white">
              <span className="inline-block min-w-16 border-b-2 mx-1.5 pb-0.5 transition-colors duration-300"
                // eslint-disable-next-line no-restricted-syntax
                style={{ borderColor: answered ? 'rgba(255,255,255,.3)' : '#A78BFA', color: 'white' }}>
                {answered ? currentWord.article : '____'}
              </span>
              <span className="text-white">{currentWord.word}</span>
            </div>
            <p className="text-sm opacity-60 text-white">{currentWord.translationEn}</p>
            {settings.showVietnamese && currentWord.translationVi && (
              <p className="text-body mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{currentWord.translationVi}</p>
            )}
            {!answered && (
              <button onClick={() => setShowHint(true)}
                className="mt-4 text-xs font-semibold flex items-center gap-1 mx-auto transition-opacity hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.5)' }}>
                <IconLightbulb size={13} />
                {showHint ? (currentWord.gender && GenderInfo[currentWord.gender] ? GenderInfo[currentWord.gender].label : '???') : 'Xem gợi ý'}
              </button>
            )}
            {answered && (
              <p className="text-body mt-3 font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {isCorrect ? '✓ Chính xác!' : `✗ Đáp án: "${currentWord.article}"`}
              </p>
            )}
          </div>
        </div>
      )}

      {!answered ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input ref={inputRef} type="text" value={userInput}
              onChange={e => setUserInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Gõ der, die hoặc das..."
              autoComplete="off" autoCapitalize="off"
              className="flex-1 px-4 py-3 rounded-xl border-2 text-center text-title font-semibold focus:outline-none transition-all duration-200"
              style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: ACCENT.vocab, color: 'var(--theme-text-primary)' }} />
            <Button variant="game" accent="premium" onClick={checkAnswer} disabled={!userInput.trim()}>Kiểm tra</Button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {/* eslint-disable no-restricted-syntax */}
            {([
              { article: 'der', bg: 'linear-gradient(160deg, #0a1628, #1e3a8a)', border: `${ACCENT.srs}73`,       color: '#93C5FD' },
              { article: 'die', bg: 'linear-gradient(160deg, #2a0a1e, #9d174d)', border: `${ACCENT.listening}73`, color: '#F9A8D4' },
              { article: 'das', bg: 'linear-gradient(160deg, #0a2218, #065f46)', border: `${ACCENT.teal}73`,      color: '#5EEAD4' },
            ]).map(btn => (
            /* eslint-enable no-restricted-syntax */
              <button key={btn.article} onClick={() => handleQuickAnswer(btn.article)}
                className="py-5 rounded-2xl font-extrabold text-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-95"
                style={{ background: btn.bg, border: `1.5px solid ${btn.border}`, color: btn.color }}>
                {btn.article}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Button variant="game" accent="premium" onClick={nextQuestion} className="w-full">
          {index + 1 >= questionsCount ? <><IconCheck size={16} /> Xem kết quả</> : <>Câu tiếp theo →</>}
        </Button>
      )}
    </div>
  );
}