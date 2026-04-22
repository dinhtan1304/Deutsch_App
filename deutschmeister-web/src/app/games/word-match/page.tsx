'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, StatCard, GameInfoBox,
  GamePlayHeader, GameStatsBar,
  IconLink, IconRocket, IconChevronLeft, IconRefresh, IconCheck,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';

const PAIRS = 6;
const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };

type Phase = 'setup' | 'playing' | 'result';

interface MatchItem {
  id: string;   // word id
  word: Word;
}

interface MatchResult {
  word: Word;
  isCorrect: boolean;
  attempts: number;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function WordMatchPage() {
  const router = useRouter();
  const { settings, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playLevelUp, playGameOver, playClick } = useSoundEffects();
  const session = useGameSession('matching');

  const [phase, setPhase] = useState<Phase>('setup');
  const [leftItems, setLeftItems] = useState<MatchItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchItem[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ left: string; right: string } | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, number>>({}); // wordId → attempts

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { refetch, isLoading } = useRandomWords(PAIRS + 2, {});

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Timer
  useEffect(() => {
    if (phase === 'playing') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startGame = async () => {
    playClick();
    const result = await refetch();
    const fetched = result.data?.slice(0, PAIRS);
    if (!fetched?.length) { alert('Không có từ vựng!'); return; }

    setLeftItems(shuffle(fetched.map(w => ({ id: w.id, word: w }))));
    setRightItems(shuffle(fetched.map(w => ({ id: w.id, word: w }))));
    setMatchedIds(new Set());
    setSelectedLeft(null);
    setWrongFlash(null);
    setScore(0); scoreRef.current = 0;
    setCombo(0); comboRef.current = 0;
    setBestCombo(0); bestComboRef.current = 0;
    correctRef.current = 0; wrongRef.current = 0;
    setResults([]);
    setAttempts({});
    setElapsedSec(0);
    setPhase('playing');
    session.start(PAIRS);
  };

  const endGame = useCallback((finalResults: MatchResult[], finalScore: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    playGameOver();
    session.end(finalScore, bestComboRef.current, correctRef.current, wrongRef.current);
    setPhase('result');
    setResults(finalResults);
  }, [playGameOver, session]);

  const handleLeftClick = useCallback((id: string) => {
    if (matchedIds.has(id) || wrongFlash) return;
    playClick();
    setSelectedLeft(prev => prev === id ? null : id);
  }, [matchedIds, wrongFlash, playClick]);

  const handleRightClick = useCallback((rightId: string) => {
    if (matchedIds.has(rightId) || wrongFlash) return;
    if (!selectedLeft) return;

    const leftId = selectedLeft;
    const currentAttempts = (attempts[leftId] ?? 0) + 1;
    setAttempts(prev => ({ ...prev, [leftId]: currentAttempts }));

    if (leftId === rightId) {
      // Correct match
      const newMatched = new Set([...matchedIds, leftId]);
      setMatchedIds(newMatched);
      setSelectedLeft(null);

      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      const multiplier = Math.min(newCombo, 4);
      const pts = 10 * multiplier;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setCombo(newCombo);
      if (newCombo > bestComboRef.current) {
        bestComboRef.current = newCombo;
        setBestCombo(newCombo);
      }
      correctRef.current++;
      playCorrect();
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
      if (scoreRef.current > 0 && scoreRef.current % 50 === 0) setTimeout(() => playLevelUp(), 300);

      // Find word for result
      const word = leftItems.find(li => li.id === leftId)?.word;
      const updatedResults = [...results, { word: word!, isCorrect: true, attempts: currentAttempts }];

      if (newMatched.size === PAIRS) {
        // Speed bonus
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        let bonus = 0;
        if (elapsed < 60) bonus = 50;
        else if (elapsed < 90) bonus = 30;
        else if (elapsed < 120) bonus = 10;
        scoreRef.current += bonus;
        setScore(scoreRef.current);
        endGame(updatedResults, scoreRef.current);
      } else {
        setResults(updatedResults);
      }
    } else {
      // Wrong match
      playWrong();
      comboRef.current = 0;
      setCombo(0);
      wrongRef.current++;
      setWrongFlash({ left: leftId, right: rightId });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
      }, 700);
    }
  }, [selectedLeft, matchedIds, wrongFlash, attempts, leftItems, results, playCorrect, playWrong, playCombo, playLevelUp, endGame]);

  // ─── Setup Screen ───
  if (phase === 'setup') {
    return (
      <GameSetupCard icon={({ size }) => <span style={{ color: 'white' }}><IconLink size={size} /></span>} iconColor="#06B6D4" title="Word Match">
        <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          Ghép <span className="font-bold" style={{ color: '#06B6D4' }}>{PAIRS} cặp</span> từ với nghĩa tương ứng
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          Click từ bên trái, rồi click nghĩa tương ứng bên phải
        </p>

        <GameInfoBox>
          <div className="flex items-center gap-2">
            <span style={{ color: '#06B6D4' }}><IconLink size={14} /></span>
            <span>10 điểm/cặp đúng · Combo tối đa x4</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCheck size={14} style={{ color: '#22C55E' }} />
            <span>Bonus tốc độ: +50 điểm nếu xong trong 60 giây</span>
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
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / PAIRS) * 100);
    return (
      <>
        <GameResultCard accuracy={accuracy} title="Kết quả">
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: '#06B6D4' }}>{score}</div>
            <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label="Đúng" value={correctCount} color="#22C55E" />
            <StatCard label="Cặp" value={PAIRS} />
            <StatCard label="Chính xác" value={`${accuracy}%`} color="#3B82F6" />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color="#F59E0B" />
          </div>
          <div className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Thời gian: {formatTime(elapsedSec)}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="srs" onClick={startGame}><IconRefresh size={16} /> Chơi lại</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</Button>
          </div>
        </GameResultCard>
      </>
    );
  }

  // ─── Playing Screen ───
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader title="Word Match" streak={combo} timer={formatTime(elapsedSec)}
        onExit={() => { playClick(); router.push('/games'); }} />
      <GameStatsBar stats={[
        { label: 'Điểm',     value: score,                       color: '#06B6D4' },
        { label: 'Cặp',      value: `${matchedIds.size}/${PAIRS}`, color: '#22C55E', dot: true },
        { label: 'Sai',      value: wrongRef.current,            color: '#EF4444', dot: true },
        { label: 'Thời gian', value: formatTime(elapsedSec),     color: 'var(--theme-text-primary)' },
      ]} />

      {/* Match Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column - German words */}
        <div className="flex flex-col gap-2">
          {leftItems.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedLeft === item.id;
            const isWrongLeft = wrongFlash?.left === item.id;
            const artColor = AC[item.word.gender] || '#3B82F6';
            return (
              <button key={item.id}
                onClick={() => handleLeftClick(item.id)}
                disabled={isMatched}
                className="rounded-xl border px-3 py-3 text-left transition-all duration-200 text-sm font-semibold"
                style={{
                  borderColor: isMatched ? '#22C55E'
                    : isWrongLeft ? '#EF4444'
                    : isSelected ? '#06B6D4'
                    : 'var(--theme-border)',
                  backgroundColor: isMatched ? 'rgba(34,197,94,.08)'
                    : isWrongLeft ? 'rgba(239,68,68,.08)'
                    : isSelected ? 'rgba(6,182,212,.1)'
                    : 'var(--theme-bg-card)',
                  color: isMatched ? '#22C55E'
                    : isSelected ? '#06B6D4'
                    : 'var(--theme-text-primary)',
                  cursor: isMatched ? 'default' : 'pointer',
                  opacity: isMatched ? 0.6 : 1,
                }}>
                <span style={{ color: isMatched ? '#22C55E' : artColor }}>
                  {GenderInfo[item.word.gender].article}
                </span>{' '}
                {item.word.word}
              </button>
            );
          })}
        </div>

        {/* Right column - Meanings */}
        <div className="flex flex-col gap-2">
          {rightItems.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isWrongRight = wrongFlash?.right === item.id;
            const label = (settings.showVietnamese && item.word.translationVi) || item.word.translationEn;
            return (
              <button key={item.id}
                onClick={() => handleRightClick(item.id)}
                disabled={isMatched || !selectedLeft}
                className="rounded-xl border px-3 py-3 text-left transition-all duration-200 text-body"
                style={{
                  borderColor: isMatched ? '#22C55E'
                    : isWrongRight ? '#EF4444'
                    : selectedLeft ? '#06B6D4'
                    : 'var(--theme-border)',
                  backgroundColor: isMatched ? 'rgba(34,197,94,.08)'
                    : isWrongRight ? 'rgba(239,68,68,.08)'
                    : selectedLeft ? 'rgba(6,182,212,.04)'
                    : 'var(--theme-bg-card)',
                  color: isMatched ? '#22C55E' : 'var(--theme-text-secondary)',
                  cursor: isMatched || !selectedLeft ? 'default' : 'pointer',
                  opacity: isMatched ? 0.6 : 1,
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      {!selectedLeft && matchedIds.size < PAIRS && (
        <p className="text-center text-xs mt-4" style={{ color: 'var(--theme-text-muted)' }}>
          Click một từ bên trái để bắt đầu ghép cặp
        </p>
      )}
      {selectedLeft && (
        <p className="text-center text-xs mt-4 font-semibold" style={{ color: '#06B6D4' }}>
          Bây giờ chọn nghĩa tương ứng bên phải →
        </p>
      )}
    </div>
  );
}
