'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Gender, GenderInfo } from '@/types';

type Phase = 'setup' | 'countdown' | 'playing' | 'result';

export default function TimedChallengePage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playGameOver, playTick, playClick } = useSoundEffects();
  
  const [phase, setPhase] = useState<Phase>('setup');
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [starting, setStarting] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const { data: words, refetch, isLoading } = useRandomWords(200, {});
  const currentWord = words?.[index];

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const duration = isLoaded ? settings.timedChallengeSeconds : 60;

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startGame = async () => {
    playClick();
    setStarting(true);
    clearTimers();
    
    try {
      const result = await refetch();
      if (!result.data?.length) {
        alert('Không có từ vựng! Vui lòng seed database.');
        setStarting(false);
        return;
      }
      
      setIndex(0);
      setTimeLeft(duration);
      setScore(0);
      setCombo(0);
      setBestCombo(0);
      setCorrect(0);
      setWrong(0);
      setCountdown(3);
      setLastAnswer(null);
      setPhase('countdown');

      let c = 3;
      countdownRef.current = setInterval(() => {
        c--;
        setCountdown(c);
        playTick();
        
        if (c <= 0) {
          clearInterval(countdownRef.current!);
          setPhase('playing');
          
          timerRef.current = setInterval(() => {
            setTimeLeft(t => {
              // Play tick sound in last 10 seconds
              if (t <= 10 && t > 0) {
                playTick();
              }
              
              if (t <= 1) {
                clearInterval(timerRef.current!);
                playGameOver();
                setPhase('result');
                return 0;
              }
              return t - 1;
            });
          }, 1000);
        }
      }, 1000);
    } catch (e) {
      alert('Lỗi tải từ vựng!');
    } finally {
      setStarting(false);
    }
  };

  const answer = useCallback((gender: Gender) => {
    if (phase !== 'playing' || !currentWord) return;

    const isCorrect = gender === currentWord.gender;

    if (isCorrect) {
      playCorrect();
      
      const newCombo = combo + 1;
      const mult = Math.min(newCombo, 4);
      setScore(s => s + 10 * mult);
      setCorrect(c => c + 1);
      setCombo(newCombo);
      setLastAnswer('correct');
      
      if (newCombo > bestCombo) setBestCombo(newCombo);
      
      // Play combo sound at milestones
      if (newCombo === 5 || newCombo === 10 || newCombo === 15 || newCombo === 20) {
        setTimeout(() => playCombo(), 150);
      }
    } else {
      playWrong();
      setWrong(w => w + 1);
      setCombo(0);
      setLastAnswer('wrong');
    }
    
    // Clear feedback after short delay
    setTimeout(() => setLastAnswer(null), 300);
    
    setIndex(i => (i >= (words?.length || 1) - 1 ? 0 : i + 1));
  }, [phase, currentWord, combo, bestCombo, words?.length, playCorrect, playWrong, playCombo]);

  // Keyboard
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === '1') answer('masculine');
      if (e.key === '2') answer('feminine');
      if (e.key === '3') answer('neuter');
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, answer]);

  // Setup
  if (phase === 'setup') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-6">⏱️</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Timed Challenge</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Trả lời nhanh trong <span className="font-bold text-blue-500">{duration} giây</span>!
            </p>
            <p className="text-sm text-gray-400 mb-8">(Thay đổi trong Settings → Học tập)</p>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🎯 10 điểm/câu đúng • Combo tối đa x4 • Sai = mất combo
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Phím: <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">1</kbd> der,{' '}
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">2</kbd> die,{' '}
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">3</kbd> das
              </p>
              <p className="text-sm text-gray-500 mt-2">
                🔊 Âm thanh: {settings.soundEnabled ? 'Bật' : 'Tắt'}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={startGame} isLoading={isLoading || starting}>
                🚀 Bắt đầu
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/games')}>
                ← Quay lại
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Countdown
  if (phase === 'countdown') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-[150px] font-bold text-blue-500 animate-pulse">{countdown}</div>
            <p className="text-2xl text-gray-500">Chuẩn bị!</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Result
  if (phase === 'result') {
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wpm = Math.round((correct / duration) * 60);

    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hết giờ!</h1>
            
            <div className="my-6">
              <div className="text-7xl font-bold text-blue-500">{score}</div>
              <p className="text-gray-500">điểm</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3">
                <div className="text-xl font-bold text-green-600">{correct}</div>
                <div className="text-xs text-green-600">Đúng</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-3">
                <div className="text-xl font-bold text-red-600">{wrong}</div>
                <div className="text-xs text-red-600">Sai</div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3">
                <div className="text-xl font-bold text-blue-600">{acc}%</div>
                <div className="text-xs text-blue-600">Chính xác</div>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-3">
                <div className="text-xl font-bold text-orange-600">x{bestCombo}</div>
                <div className="text-xs text-orange-600">Best Combo</div>
              </div>
            </div>

            <p className="text-gray-500 mb-6">⚡ Tốc độ: {wpm} từ/phút</p>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={startGame}>🔄 Chơi lại</Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/games')}>← Quay lại</Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Playing
  const genderButtons = [
    { gender: 'masculine' as Gender, color: '#3b82f6' },
    { gender: 'feminine' as Gender, color: '#ec4899' },
    { gender: 'neuter' as Gender, color: '#22c55e' },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div 
            className="text-5xl font-bold transition-colors"
            style={{ color: timeLeft <= 10 ? '#ef4444' : 'inherit' }}
          >
            {timeLeft}<span className="text-xl text-gray-400">s</span>
          </div>
          <div className="text-4xl font-bold text-blue-500">{score}</div>
        </div>

        {/* Progress */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full transition-all duration-1000"
            style={{ 
              width: `${(timeLeft / duration) * 100}%`,
              backgroundColor: timeLeft <= 10 ? '#ef4444' : '#3b82f6'
            }}
          />
        </div>

        {/* Combo */}
        <div className="h-12 flex justify-center items-center mb-4">
          {combo > 0 && (
            <div 
              className="px-6 py-2 text-white rounded-full font-bold"
              style={{ 
                background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                animation: combo >= 5 ? 'pulse 0.5s infinite' : 'none'
              }}
            >
              🔥 x{Math.min(combo, 4)} Combo! {combo >= 5 && '🔥'}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-12 mb-4">
          <span className="text-green-500 font-bold text-lg">✓ {correct}</span>
          <span className="text-red-500 font-bold text-lg">✗ {wrong}</span>
        </div>

        {/* Word */}
        {currentWord && (
          <Card 
            className="text-center mb-6 py-10 transition-all"
            style={{
              boxShadow: lastAnswer === 'correct' 
                ? '0 0 30px rgba(34, 197, 94, 0.5)' 
                : lastAnswer === 'wrong' 
                  ? '0 0 30px rgba(239, 68, 68, 0.5)' 
                  : undefined
            }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              {currentWord.word}
            </h2>
            <p className="text-xl text-gray-500">{currentWord.translationEn}</p>
          </Card>
        )}

        {/* Answer Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {genderButtons.map(({ gender, color }, i) => (
            <button
              key={gender}
              onClick={() => answer(gender)}
              disabled={!currentWord}
              className="py-8 md:py-10 rounded-2xl font-bold text-3xl md:text-4xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {GenderInfo[gender].article}
              <div className="text-sm font-normal mt-2 opacity-80">({i + 1})</div>
            </button>
          ))}
        </div>

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => { 
              clearTimers(); 
              playClick();
              router.push('/games'); 
            }}
          >
            ✕ Thoát
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </MainLayout>
  );
}