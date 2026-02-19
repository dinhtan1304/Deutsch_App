'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { Gender, GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameButton, GameProgressBar,
  ComboBadge, StatCard, AnswerReview, GameInfoBox, KBD,
  IconPenTool, IconTarget, IconCheck, IconX, IconRocket, IconKeyboard, IconVolume,
  IconRefresh, IconChevronLeft, IconLightbulb,
} from '@/components/games/GameUI';

const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };

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
    const result = await refetch();
    if (!result.data?.length) { alert('Không có từ vựng!'); return; }
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

  const handleQuickAnswer = (article: string) => {
    if (answered) return;
    setUserInput(article);
    setTimeout(() => {
      const correctAnswer = currentWord?.article.toLowerCase();
      const correct = article.toLowerCase() === correctAnswer;
      setAnswered(true); setIsCorrect(correct);
      setAnswers(prev => [...prev, { word: currentWord!, userInput: article, correctAnswer: currentWord!.article, isCorrect: correct }]);
      if (correct) {
        playCorrect(); correctRef.current++; const newCombo = combo + 1;
        setScore(s => s + 10 * Math.min(newCombo, 4)); scoreRef.current += 10 * Math.min(newCombo, 4);
        setCombo(newCombo);
        if (newCombo > bestCombo) { setBestCombo(newCombo); bestComboRef.current = newCombo; }
        if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
      } else { playWrong(); wrongRef.current++; setCombo(0); }
    }, 100);
  };

  // Save game session to backend when game ends
  useEffect(() => {
    if (phase === 'result') {
      session.end(scoreRef.current, bestComboRef.current, correctRef.current, wrongRef.current);
    }
  }, [phase, session]);

  // ─── Setup ───
  if (phase === 'setup') {
    return (
        <GameSetupCard icon={({ size }) => <IconPenTool size={size} style={{ color: 'white' }} />} iconColor="#8B5CF6" title="Fill in the Blank">
          <p className="text-[14px] mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Điền mạo từ đúng cho <span className="font-bold" style={{ color: '#8B5CF6' }}>{questionsCount} từ</span>
          </p>
          <p className="text-[12px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>(Thay đổi số câu trong Settings → Học tập)</p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconTarget size={14} style={{ color: '#8B5CF6' }} /><span>Gõ hoặc click nút để điền mạo từ</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: '#3B82F6' }} /><span>Nhấn <KBD>Enter</KBD> để xác nhận</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: '#22C55E' }} /><span>Âm thanh: {settings.soundEnabled ? 'Bật' : 'Tắt'}</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <GameButton onClick={startGame} loading={isLoading} color="#8B5CF6"><IconRocket size={16} /> Bắt đầu</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</GameButton>
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
            <div className="text-5xl font-extrabold" style={{ color: '#8B5CF6' }}>{score}</div>
            <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label="Đúng" value={correctCount} color="#22C55E" />
            <StatCard label="Sai" value={wrongCount} color="#EF4444" />
            <StatCard label="Chính xác" value={`${accuracy}%`} color="#3B82F6" />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color="#F59E0B" />
          </div>
          <div className="flex gap-3 justify-center">
            <GameButton onClick={startGame} color="#8B5CF6"><IconRefresh size={16} /> Chơi lại</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</GameButton>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: a.correctAnswer, color: AC[a.word.gender] || '#8B5CF6' })}
            getSelectedLabel={a => !a.isCorrect ? (a.userInput || '(trống)') : null}
          />
        </div>
      </>
    );
  }

  // ─── Playing ───
  const genderColor = currentWord ? (AC[currentWord.gender] || '#8B5CF6') : '#8B5CF6';

  return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-extrabold" style={{ color: '#8B5CF6' }}>{score} <span className="text-[13px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>điểm</span></div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{index + 1} / {questionsCount}</div>
        </div>

        <GameProgressBar current={index + 1} total={questionsCount} color="#8B5CF6" />
        <div className="mt-3 mb-4"><ComboBadge combo={combo} /></div>

        {/* Word Card */}
        {currentWord && (
          <div className="rounded-2xl border p-7 text-center mb-5 transition-all duration-300"
            style={{
              borderColor: answered ? (isCorrect ? '#22C55E' : '#EF4444') : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
              borderWidth: answered ? '2px' : '1px',
            }}>
            {/* Fill blank sentence */}
            <div className="text-3xl md:text-4xl font-bold mb-5">
              <span className="inline-block min-w-20 border-b-4 mx-2 pb-1 transition-colors duration-300"
                style={{ borderColor: answered ? (isCorrect ? '#22C55E' : '#EF4444') : '#8B5CF6', color: answered ? genderColor : 'var(--theme-text-primary)' }}>
                {answered ? currentWord.article : '______'}
              </span>
              <span style={{ color: 'var(--theme-text-primary)' }}>{currentWord.word}</span>
            </div>

            <p className="text-[16px] mb-1" style={{ color: 'var(--theme-text-secondary)' }}>{currentWord.translationEn}</p>
            {settings.showVietnamese && currentWord.translationVi && (
              <p className="text-[14px]" style={{ color: 'var(--theme-text-muted)' }}>{currentWord.translationVi}</p>
            )}

            {/* Hint */}
            {!answered && (
              <button onClick={() => setShowHint(true)}
                className="mt-4 text-[13px] font-medium flex items-center gap-1 mx-auto transition-opacity hover:opacity-80"
                style={{ color: '#F59E0B' }}>
                <IconLightbulb size={14} />
                {showHint ? GenderInfo[currentWord.gender].label : 'Xem gợi ý'}
              </button>
            )}

            {/* Feedback */}
            {answered && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                <p className="text-[16px] font-semibold flex items-center justify-center gap-1.5"
                  style={{ color: isCorrect ? '#22C55E' : '#EF4444' }}>
                  {isCorrect ? <><IconCheck size={16} /> Chính xác!</> : <><IconX size={16} /> Sai rồi! Đáp án là "{currentWord.article}"</>}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        {!answered ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={userInput}
                onChange={e => setUserInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Gõ der, die hoặc das..."
                autoComplete="off" autoCapitalize="off"
                className="flex-1 px-4 py-3 rounded-xl border-2 text-center text-[18px] font-semibold
                  focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)', '--tw-ring-color': '#8B5CF6',
                } as React.CSSProperties} />
              <GameButton onClick={checkAnswer} disabled={!userInput.trim()} color="#8B5CF6">Kiểm tra</GameButton>
            </div>

            {/* Quick answer buttons */}
            <div className="grid grid-cols-3 gap-3">
              {([
                { article: 'der', color: '#3B82F6' },
                { article: 'die', color: '#EC4899' },
                { article: 'das', color: '#22C55E' },
              ]).map(btn => (
                <button key={btn.article} onClick={() => handleQuickAnswer(btn.article)}
                  className="py-3.5 rounded-xl font-bold text-[18px] text-white transition-all duration-200
                    hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${btn.color}, ${btn.color}cc)`, boxShadow: `0 3px 12px ${btn.color}25` }}>
                  {btn.article}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <GameButton onClick={nextQuestion} className="w-full" color="#8B5CF6">
            {index + 1 >= questionsCount ? <><IconCheck size={16} /> Xem kết quả</> : <>Câu tiếp theo →</>}
          </GameButton>
        )}

        <div className="text-center mt-5">
          <GameButton variant="ghost" onClick={() => { playClick(); router.push('/games'); }}>
            <IconX size={14} /> Thoát
          </GameButton>
        </div>
      </div>
  );
}