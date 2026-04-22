'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { Gender, GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameProgressBar,
  StatCard, GenderButtons, AnswerReview, AddWrongWordsToBank, GameResultUpsell, GameInfoBox, KBD,
  GamePlayHeader, GameStatsBar, GameWordCard, useGameTimer,
  IconTarget, IconCheck, IconX, IconFlame, IconRocket, IconKeyboard, IconVolume, IconRefresh, IconChevronLeft,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';

// Article color map
const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };

type Phase = 'setup' | 'playing' | 'result';

interface AnswerRecord {
  word: Word;
  selectedAnswer: Gender;
  isCorrect: boolean;
}

export default function GenderQuizPage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playLevelUp, playGameOver, playClick } = useSoundEffects();
  // BUG FIX 1: was 'quick-quiz' — caused all GenderQuiz sessions to be
  // recorded as QuickQuiz in the backend, corrupting game history stats.
  const session = useGameSession('gender-quiz');

  const [phase, setPhase] = useState<Phase>('setup');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const scoreRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const questionsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: words, refetch, isLoading } = useRandomWords(questionsCount, {});
  const currentWord = words?.[index];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const startGame = async () => {
    playClick();
    const result = await refetch();
    if (!result.data?.length) { alert('Không có từ vựng! Vui lòng seed database.'); return; }
    setIndex(0); setScore(0); setCombo(0); setBestCombo(0);
    scoreRef.current = 0; bestComboRef.current = 0;
    correctRef.current = 0; wrongRef.current = 0;
    setAnswered(false); setSelectedAnswer(null); setAnswers([]); setPhase('playing');
    session.start(questionsCount);
  };

  const handleAnswer = useCallback((gender: Gender) => {
    if (answered || !currentWord) return;
    setSelectedAnswer(gender); setAnswered(true);
    const isCorrect = gender === currentWord.gender;
    setAnswers(prev => [...prev, { word: currentWord, selectedAnswer: gender, isCorrect }]);

    if (isCorrect) {
      playCorrect();
      correctRef.current++;
      const newCombo = combo + 1;
      const multiplier = Math.min(newCombo, 4);
      setScore(s => s + 10 * multiplier); scoreRef.current += 10 * multiplier;
      setCombo(newCombo);
      if (newCombo > bestCombo) { setBestCombo(newCombo); bestComboRef.current = newCombo; }
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
      if ((score + 10 * multiplier) % 100 === 0) setTimeout(() => playLevelUp(), 300);
    } else { playWrong(); wrongRef.current++; setCombo(0); }

    setTimeout(() => {
      if (index + 1 >= questionsCount) { playGameOver(); setPhase('result'); }
      else { setIndex(i => i + 1); setAnswered(false); setSelectedAnswer(null); }
    }, 1200);
  }, [answered, currentWord, combo, bestCombo, index, questionsCount, score, playCorrect, playWrong, playCombo, playLevelUp, playGameOver]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'playing' || answered) return;
      if (e.key === '1') handleAnswer('masculine');
      if (e.key === '2') handleAnswer('feminine');
      if (e.key === '3') handleAnswer('neuter');
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, answered, handleAnswer]);

  // Save game session to backend when game ends
  useEffect(() => {
    if (phase === 'result') {
      session.end(scoreRef.current, bestComboRef.current, correctRef.current, wrongRef.current);
    }
  }, [phase, session]);

  const timer = useGameTimer(phase === 'playing');

  // ─── Setup Screen ───
  if (phase === 'setup') {
    return (
        <GameSetupCard icon={({ size }) => <IconTarget size={size} style={{ color: 'white' }} />} iconColor="#3B82F6" title="Gender Quiz">
          <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Chọn mạo từ đúng cho <span className="font-bold" style={{ color: '#3B82F6' }}>{questionsCount} từ</span>
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
            (Thay đổi số câu trong Settings → Học tập)
          </p>

          <GameInfoBox>
            <div className="flex items-center gap-2">
              <IconTarget size={14} style={{ color: '#3B82F6' }} />
              <span>10 điểm/câu đúng · Combo tối đa x4</span>
            </div>
            <div className="flex items-center gap-2">
              <IconKeyboard size={14} style={{ color: '#8B5CF6' }} />
              <span>Phím: <KBD>1</KBD> der, <KBD>2</KBD> die, <KBD>3</KBD> das</span>
            </div>
            <div className="flex items-center gap-2">
              <IconVolume size={14} style={{ color: '#22C55E' }} />
              <span>Âm thanh: {settings.soundEnabled ? 'Bật' : 'Tắt'}</span>
            </div>
          </GameInfoBox>

          <div className="flex gap-3 justify-center mt-6">
            <Button variant="game" accent="srs" onClick={startGame} isLoading={isLoading}>
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
    const wrongCount = answers.filter(a => !a.isCorrect).length;
    const accuracy = Math.round((correctCount / questionsCount) * 100);

    return (
      <>
        <GameResultCard accuracy={accuracy} title="Kết quả">
          {/* Score */}
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: '#3B82F6' }}>{score}</div>
            <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label="Đúng" value={correctCount} color="#22C55E" />
            <StatCard label="Sai" value={wrongCount} color="#EF4444" />
            <StatCard label="Chính xác" value={`${accuracy}%`} />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color="#F59E0B" />
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="srs" onClick={startGame}><IconRefresh size={16} /> Chơi lại</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</Button>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: GenderInfo[a.word.gender].article, color: AC[a.word.gender] || '#3B82F6' })}
            getSelectedLabel={a => !a.isCorrect ? GenderInfo[a.selectedAnswer].article : null}
          />
        </div>
        <AddWrongWordsToBank wrongWords={answers.filter(a => !a.isCorrect).map(a => a.word)} />
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing Screen ───
  const correctCount = answers.filter(a => a.isCorrect).length;
  const wrongCount   = answers.filter(a => !a.isCorrect).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader
        title="Gender Quiz" streak={combo} timer={timer}
        onExit={() => { playClick(); router.push('/games'); }}
      />
      <GameStatsBar stats={[
        { label: 'Điểm',  value: score,        color: '#3B82F6' },
        { label: 'Đúng',  value: correctCount, color: '#22C55E', dot: true },
        { label: 'Sai',   value: wrongCount,   color: '#EF4444', dot: true },
        { label: 'Câu',   value: `${index + 1}/${questionsCount}`, color: 'var(--theme-text-primary)' },
      ]} />
      <GameProgressBar current={index + 1} total={questionsCount} />

      {currentWord && (
        <GameWordCard
          gradient="linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)"
          feedback={answered ? (selectedAnswer === currentWord.gender ? 'correct' : 'wrong') : null}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3">{currentWord.word}</h2>
          <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{currentWord.translationEn}</p>
          {settings.showVietnamese && currentWord.translationVi && (
            <p className="text-body mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{currentWord.translationVi}</p>
          )}
          {answered && (
            <p className="text-body mt-4 font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Đáp án: <span className="font-extrabold text-white">{GenderInfo[currentWord.gender].article} {currentWord.word}</span>
            </p>
          )}
        </GameWordCard>
      )}

      <GenderButtons onAnswer={handleAnswer} answered={answered} selectedAnswer={selectedAnswer} correctGender={currentWord?.gender} />
      <p className="text-center text-caption mt-4" style={{ color: 'var(--theme-text-muted)' }}>
        Phím tắt: <KBD>1</KBD> der · <KBD>2</KBD> die · <KBD>3</KBD> das
      </p>
    </div>
  );
}