'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { useGameSession } from '@/hooks/useGameSession';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
// BUG FIX 2: Added settings + sound effects (was the only game missing both)
import { Word, Gender, GenderInfo } from '@/types';
import { speakGerman } from '@/lib/utils';
import {
  GameSetupCard, GameResultCard, GameProgressBar,
  StatCard, AnswerReview, AddWrongWordsToBank, GameResultUpsell, GameInfoBox, KBD,
  GamePlayHeader, GameStatsBar, GameWordCard, GenderButtons, useGameTimer,
  IconZap, IconTarget, IconCheck, IconX, IconRocket, IconKeyboard, IconVolume,
  IconRefresh, IconChevronLeft,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';

const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };
// BUG FIX 2: Removed hardcoded TOTAL_QUESTIONS = 20, now reads from settings
type GamePhase = 'setup' | 'playing' | 'result';

export default function QuickQuizPage() {
  const router = useRouter();
  const session = useGameSession('quick-quiz');
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playGameOver } = useSoundEffects();

  // Use settings value — fall back to 20 until settings load
  const TOTAL_QUESTIONS = isLoaded ? settings.questionsPerGame : 20;

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<{ word: Word; selected: Gender; isCorrect: boolean }[]>([]);

  // Refs for session.end() — avoid stale closure issues in useEffect
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const { data: words, refetch, isLoading } = useRandomWords(TOTAL_QUESTIONS, {});
  const currentWord = words?.[currentIndex];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleStartGame = async () => {
    const result = await refetch();
    if (!result.data?.length) { alert('Không có từ vựng!'); return; }

    // Reset state
    setPhase('playing'); setCurrentIndex(0); setScore(0); setAnswers([]);
    setSelectedAnswer(null); setShowFeedback(false);

    // Reset refs
    scoreRef.current = 0;
    correctRef.current = 0;
    wrongRef.current = 0;

    // Register session on backend
    session.start(TOTAL_QUESTIONS);
  };

  const handleAnswer = useCallback((gender: Gender) => {
    if (showFeedback || !currentWord) return;
    setSelectedAnswer(gender); setShowFeedback(true);
    const isCorrect = gender === currentWord.gender;

    if (isCorrect) {
      playCorrect(); // BUG FIX 2: sound was missing
      setScore(s => s + 1);
      scoreRef.current += 1;
      correctRef.current += 1;
    } else {
      playWrong(); // BUG FIX 2: sound was missing
      wrongRef.current += 1;
    }

    setAnswers(a => [...a, { word: currentWord, selected: gender, isCorrect }]);

    setTimeout(() => {
      if (currentIndex < TOTAL_QUESTIONS - 1) { setCurrentIndex(i => i + 1); setSelectedAnswer(null); setShowFeedback(false); }
      else { playGameOver(); setPhase('result'); } // BUG FIX 2: missing game over sound
    }, 1500);
  }, [showFeedback, currentWord, currentIndex, playCorrect, playWrong, playGameOver, TOTAL_QUESTIONS]);

  // Save session to backend when game finishes
  useEffect(() => {
    if (phase === 'result') {
      session.end(scoreRef.current, 0, correctRef.current, wrongRef.current);
    }
  }, [phase, session]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing' || showFeedback) return;
      if (e.key === '1') handleAnswer('masculine');
      if (e.key === '2') handleAnswer('feminine');
      if (e.key === '3') handleAnswer('neuter');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, showFeedback, handleAnswer]);

  const timer = useGameTimer(phase === 'playing');

  // ─── Setup ───
  if (phase === 'setup') {
    return (
        <GameSetupCard icon={({ size }) => <IconZap size={size} style={{ color: 'white' }} />} iconColor="#F59E0B" title="Quick Quiz">
          <p className="text-sm mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            Chọn mạo từ đúng cho <span className="font-bold" style={{ color: '#F59E0B' }}>{TOTAL_QUESTIONS} từ</span> tiếng Đức
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>(Thay đổi số câu trong Settings → Học tập)
          </p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconTarget size={14} style={{ color: '#F59E0B' }} /><span>Click hoặc dùng phím tắt để trả lời</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: '#8B5CF6' }} /><span>Phím: <KBD>1</KBD> der, <KBD>2</KBD> die, <KBD>3</KBD> das</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: '#3B82F6' }} /><span>Phản hồi tức thì sau mỗi câu</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="game" accent="xp" onClick={handleStartGame} isLoading={isLoading}><IconRocket size={16} /> Bắt đầu</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</Button>
          </div>
        </GameSetupCard>
    );
  }

  // ─── Result ───
  if (phase === 'result') {
    const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);

    return (
      <>
        <GameResultCard accuracy={percentage} title="Hoàn thành!">
          <p className="text-[15px] mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
            Bạn đúng {score} trên {TOTAL_QUESTIONS} câu
          </p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <StatCard label="Đúng" value={score} color="#22C55E" />
            <StatCard label="Sai" value={TOTAL_QUESTIONS - score} color="#EF4444" />
            <StatCard label="Chính xác" value={`${percentage}%`} color="#3B82F6" />
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="xp" onClick={handleStartGame}><IconRefresh size={16} /> Chơi lại</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</Button>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: GenderInfo[a.word.gender].article, color: AC[a.word.gender] || '#3B82F6' })}
            getSelectedLabel={a => !a.isCorrect ? GenderInfo[a.selected].article : null}
          />
        </div>
        <AddWrongWordsToBank wrongWords={answers.filter(a => !a.isCorrect).map(a => a.word)} />
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing ───
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader
        title="Quick Quiz" streak={score > 0 ? Math.floor(score / 10) : undefined} timer={timer}
        onExit={() => router.push('/games')}
      />
      <GameStatsBar stats={[
        { label: 'Điểm',  value: score,        color: '#F59E0B' },
        { label: 'Đúng',  value: correctCount, color: '#22C55E', dot: true },
        { label: 'Sai',   value: currentIndex - correctCount, color: '#EF4444', dot: true },
        { label: 'Câu',   value: `${currentIndex + 1}/${TOTAL_QUESTIONS}`, color: 'var(--theme-text-primary)' },
      ]} />
      <GameProgressBar current={currentIndex + 1} total={TOTAL_QUESTIONS} />

      {currentWord && (
        <GameWordCard
          gradient="linear-gradient(135deg, #1a0f00 0%, #92400e 100%)"
          feedback={showFeedback ? (selectedAnswer === currentWord.gender ? 'correct' : 'wrong') : null}
        >
          <button onClick={() => speakGerman(currentWord.word)}
            className="w-11 h-11 rounded-full flex items-center justify-center mb-4 transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
            <IconVolume size={20} />
          </button>
          <h2 className="text-4xl font-extrabold text-white mb-2">{currentWord.word}</h2>
          <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {currentWord.translationVi || currentWord.translationEn}
          </p>
          {showFeedback && (
            <p className="text-body mt-4 font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {selectedAnswer === currentWord.gender
                ? '✓ Chính xác!'
                : `✗ Đáp án: ${GenderInfo[currentWord.gender].article}`}
            </p>
          )}
        </GameWordCard>
      )}

      <GenderButtons onAnswer={handleAnswer} answered={showFeedback} selectedAnswer={selectedAnswer} correctGender={currentWord?.gender} />
      <p className="text-center text-caption mt-4" style={{ color: 'var(--theme-text-muted)' }}>
        Phím tắt: <KBD>1</KBD> der · <KBD>2</KBD> die · <KBD>3</KBD> das
      </p>
    </div>
  );
}