'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { Word, Gender, GenderInfo } from '@/types';
import { speakGerman } from '@/lib/utils';
import {
  GameSetupCard, GameResultCard, GameButton, GameProgressBar,
  StatCard, AnswerReview, GameInfoBox, KBD,
  IconZap, IconTarget, IconCheck, IconX, IconRocket, IconKeyboard, IconVolume,
  IconRefresh, IconChevronLeft,
} from '@/components/games/GameUI';

const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };
const TOTAL_QUESTIONS = 20;

type GamePhase = 'setup' | 'playing' | 'result';

export default function QuickQuizPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<{ word: Word; selected: Gender; isCorrect: boolean }[]>([]);

  const { data: words, refetch, isLoading } = useRandomWords(TOTAL_QUESTIONS, {});
  const currentWord = words?.[currentIndex];

  const handleStartGame = () => {
    refetch();
    setPhase('playing'); setCurrentIndex(0); setScore(0); setAnswers([]);
    setSelectedAnswer(null); setShowFeedback(false);
  };

  const handleAnswer = useCallback((gender: Gender) => {
    if (showFeedback || !currentWord) return;
    setSelectedAnswer(gender); setShowFeedback(true);
    const isCorrect = gender === currentWord.gender;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(a => [...a, { word: currentWord, selected: gender, isCorrect }]);

    setTimeout(() => {
      if (currentIndex < TOTAL_QUESTIONS - 1) { setCurrentIndex(i => i + 1); setSelectedAnswer(null); setShowFeedback(false); }
      else setPhase('result');
    }, 1500);
  }, [showFeedback, currentWord, currentIndex]);

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

  // ─── Setup ───
  if (phase === 'setup') {
    return (
        <GameSetupCard icon={({ size }) => <IconZap size={size} style={{ color: 'white' }} />} iconColor="#F59E0B" title="Quick Quiz">
          <p className="text-[14px] mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            Chọn mạo từ đúng cho <span className="font-bold" style={{ color: '#F59E0B' }}>{TOTAL_QUESTIONS} từ</span> tiếng Đức
          </p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconTarget size={14} style={{ color: '#F59E0B' }} /><span>Click hoặc dùng phím tắt để trả lời</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: '#8B5CF6' }} /><span>Phím: <KBD>1</KBD> der, <KBD>2</KBD> die, <KBD>3</KBD> das</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: '#3B82F6' }} /><span>Phản hồi tức thì sau mỗi câu</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <GameButton onClick={handleStartGame} loading={isLoading} color="#F59E0B"><IconRocket size={16} /> Bắt đầu</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</GameButton>
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
            <GameButton onClick={handleStartGame} color="#F59E0B"><IconRefresh size={16} /> Chơi lại</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</GameButton>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: GenderInfo[a.word.gender].article, color: AC[a.word.gender] || '#3B82F6' })}
            getSelectedLabel={a => !a.isCorrect ? GenderInfo[a.selected].article : null}
          />
        </div>
      </>
    );
  }

  // ─── Playing ───
  const genderButtons = [
    { gender: 'masculine' as Gender, article: 'der', label: 'Maskulin', color: '#3B82F6' },
    { gender: 'feminine' as Gender, article: 'die', label: 'Feminin', color: '#EC4899' },
    { gender: 'neuter' as Gender, article: 'das', label: 'Neutrum', color: '#22C55E' },
  ];

  return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        {/* Header */}
        <div className="flex justify-between text-[13px] font-semibold mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          <span>Câu {currentIndex + 1} / {TOTAL_QUESTIONS}</span>
          <span>Điểm: <span style={{ color: '#F59E0B' }}>{score}</span></span>
        </div>

        <GameProgressBar current={currentIndex + 1} total={TOTAL_QUESTIONS} color="#F59E0B" />

        {/* Word Card */}
        {currentWord && (
          <div className="rounded-2xl border p-8 text-center my-6"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            {/* Audio button */}
            <button onClick={() => speakGerman(currentWord.word)}
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-200
                hover:scale-110"
              style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.12), rgba(59,130,246,.06))' }}>
              <IconVolume size={18} style={{ color: '#3B82F6' }} />
            </button>

            <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              {currentWord.word}
            </h2>
            <p className="text-[16px]" style={{ color: 'var(--theme-text-secondary)' }}>
              {currentWord.translationEn}
            </p>

            {/* Feedback */}
            {showFeedback && (
              <div className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-semibold"
                style={{
                  background: selectedAnswer === currentWord.gender ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
                  color: selectedAnswer === currentWord.gender ? '#22C55E' : '#EF4444',
                }}>
                {selectedAnswer === currentWord.gender
                  ? <><IconCheck size={15} /> Chính xác!</>
                  : <><IconX size={15} /> Sai! Đáp án: "{GenderInfo[currentWord.gender].article}"</>}
              </div>
            )}
          </div>
        )}

        {/* Answer Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {genderButtons.map((btn, i) => {
            const isSelected = selectedAnswer === btn.gender;
            const isCorrect = currentWord?.gender === btn.gender;

            let bg: string;
            let opacity = 1;
            if (showFeedback) {
              if (isCorrect) bg = 'linear-gradient(135deg, #22C55E, #16A34A)';
              else if (isSelected) bg = 'linear-gradient(135deg, #EF4444, #DC2626)';
              else { bg = `linear-gradient(135deg, ${btn.color}30, ${btn.color}15)`; opacity = 0.5; }
            } else {
              bg = `linear-gradient(135deg, ${btn.color}15, ${btn.color}08)`;
            }

            return (
              <button key={btn.gender} onClick={() => handleAnswer(btn.gender)}
                disabled={showFeedback}
                className="py-5 rounded-2xl font-bold text-2xl transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed"
                style={{
                  background: bg, opacity,
                  color: showFeedback && (isCorrect || isSelected) ? 'white' : btn.color,
                  border: !showFeedback ? `2px solid ${btn.color}20` : '2px solid transparent',
                }}>
                {btn.article}
                <div className="text-[11px] font-medium mt-1 opacity-70">
                  ({i + 1}) {btn.label}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <GameButton variant="ghost" onClick={() => router.push('/games')}>
            <IconX size={14} /> Thoát
          </GameButton>
        </div>
      </div>
  );
}