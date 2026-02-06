'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { Gender, GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameButton, GameProgressBar,
  ComboBadge, StatCard, GenderButtons, AnswerReview, GameInfoBox, KBD,
  IconTarget, IconCheck, IconX, IconFlame, IconRocket, IconKeyboard, IconVolume, IconRefresh, IconChevronLeft,
} from '@/components/games/GameUI';

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
  const session = useGameSession('quick-quiz');

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

  // ─── Setup Screen ───
  if (phase === 'setup') {
    return (
      <MainLayout>
        <GameSetupCard icon={({ size }) => <IconTarget size={size} style={{ color: 'white' }} />} iconColor="#3B82F6" title="Gender Quiz">
          <p className="text-[14px] mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Chọn mạo từ đúng cho <span className="font-bold" style={{ color: '#3B82F6' }}>{questionsCount} từ</span>
          </p>
          <p className="text-[12px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>
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
            <GameButton onClick={startGame} loading={isLoading} color="#3B82F6">
              <IconRocket size={16} /> Bắt đầu
            </GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}>
              <IconChevronLeft size={16} /> Quay lại
            </GameButton>
          </div>
        </GameSetupCard>
      </MainLayout>
    );
  }

  // ─── Result Screen ───
  if (phase === 'result') {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect).length;
    const accuracy = Math.round((correctCount / questionsCount) * 100);

    return (
      <MainLayout>
        <GameResultCard accuracy={accuracy} title="Kết quả">
          {/* Score */}
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: '#3B82F6' }}>{score}</div>
            <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label="Đúng" value={correctCount} color="#22C55E" />
            <StatCard label="Sai" value={wrongCount} color="#EF4444" />
            <StatCard label="Chính xác" value={`${accuracy}%`} color="#3B82F6" />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color="#F59E0B" />
          </div>

          <div className="flex gap-3 justify-center">
            <GameButton onClick={startGame} color="#3B82F6"><IconRefresh size={16} /> Chơi lại</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</GameButton>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: GenderInfo[a.word.gender].article, color: AC[a.word.gender] || '#3B82F6' })}
            getSelectedLabel={a => !a.isCorrect ? GenderInfo[a.selectedAnswer].article : null}
          />
        </div>
      </MainLayout>
    );
  }

  // ─── Playing Screen ───
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-extrabold" style={{ color: '#3B82F6' }}>{score} <span className="text-[13px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>điểm</span></div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{index + 1} / {questionsCount}</div>
        </div>

        <GameProgressBar current={index + 1} total={questionsCount} />

        <div className="mt-3 mb-4">
          <ComboBadge combo={combo} />
        </div>

        {/* Word Card */}
        {currentWord && (
          <div className="rounded-2xl border p-8 md:p-10 text-center mb-5 transition-all duration-300"
            style={{
              borderColor: answered
                ? (selectedAnswer === currentWord.gender ? '#22C55E' : '#EF4444')
                : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
              borderWidth: answered ? '2px' : '1px',
              boxShadow: answered
                ? (selectedAnswer === currentWord.gender ? '0 0 24px rgba(34,197,94,.12)' : '0 0 24px rgba(239,68,68,.12)')
                : 'none',
            }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
              {currentWord.word}
            </h2>
            <p className="text-[16px]" style={{ color: 'var(--theme-text-secondary)' }}>{currentWord.translationEn}</p>
            {settings.showVietnamese && currentWord.translationVi && (
              <p className="text-[14px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>{currentWord.translationVi}</p>
            )}

            {answered && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                <p className="text-[16px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  Đáp án:{' '}
                  <span className="font-bold" style={{ color: AC[currentWord.gender] || '#3B82F6' }}>
                    {GenderInfo[currentWord.gender].article} {currentWord.word}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Answer Buttons */}
        <GenderButtons
          onAnswer={handleAnswer}
          answered={answered}
          selectedAnswer={selectedAnswer}
          correctGender={currentWord?.gender}
        />

        <div className="text-center mt-5">
          <GameButton variant="ghost" onClick={() => { playClick(); router.push('/games'); }}>
            <IconX size={14} /> Thoát
          </GameButton>
        </div>
      </div>
    </MainLayout>
  );
}