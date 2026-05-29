'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRandomWords } from '@/hooks/useWords';
import { useWordBankGameWords } from '@/hooks/usePersonalWords';
import { personalWordsToGameWords, getEligibleWordsForGame } from '@/lib/personalWordAdapter';
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
import { ACCENT, STATUS } from '@/lib/tokens';

const PAIRS = 6;
const AC: Record<string, string> = { masculine: ACCENT.srs, feminine: ACCENT.listening, neuter: STATUS.success };

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
  const searchParams = useSearchParams();
  const isWordBankMode = searchParams.get('source') === 'wordbank';
  const collectionId = searchParams.get('collectionId') ?? undefined;
  const t = useTranslations('games');

  const { settings, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playGameOver, playClick } = useSoundEffects();
  const session = useGameSession('matching');

  const [phase, setPhase] = useState<Phase>('setup');
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [wrongCount, setWrongCount] = useState(0);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { refetch, isLoading: globalLoading } = useRandomWords(PAIRS + 2, {});
  const wbData = useWordBankGameWords({ collectionId, enabled: isWordBankMode });
  const isLoading = isWordBankMode ? wbData.isLoading : globalLoading;

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
    setLoadError(null);
    let fetched: (typeof leftItems[0]['word'])[];
    if (isWordBankMode) {
      const eligible = getEligibleWordsForGame('word-match', wbData.data ?? []);
      if (eligible.length < 4) { setLoadError(t('wordMatch.errors.minWords4')); return; }
      const pairs = Math.min(PAIRS, Math.floor(eligible.length / 2) * 2);
      const shuffled = [...eligible].sort(() => Math.random() - 0.5).slice(0, pairs);
      fetched = personalWordsToGameWords(shuffled);
    } else {
      const result = await refetch();
      fetched = result.data?.slice(0, PAIRS) ?? [];
      if (!fetched.length) { setLoadError(t('common.errors.noVocab')); return; }
    }

    setLeftItems(shuffle(fetched.map(w => ({ id: w.id, word: w }))));
    setRightItems(shuffle(fetched.map(w => ({ id: w.id, word: w }))));
    setMatchedIds(new Set());
    setSelectedLeft(null);
    setWrongFlash(null);
    setScore(0); scoreRef.current = 0;
    setCombo(0); comboRef.current = 0;
    setBestCombo(0); bestComboRef.current = 0;
    correctRef.current = 0; wrongRef.current = 0; setWrongCount(0);
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
      if (scoreRef.current > 0 && scoreRef.current % 50 === 0) setTimeout(() => playCombo(), 300);

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
      setWrongCount(c => c + 1);
      setWrongFlash({ left: leftId, right: rightId });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
      }, 700);
    }
  }, [selectedLeft, matchedIds, wrongFlash, attempts, leftItems, results, playCorrect, playWrong, playCombo, endGame]);

  // ─── Setup Screen ───
  if (phase === 'setup') {
    return (
      <GameSetupCard icon={({ size }) => <span style={{ color: 'white' }}><IconLink size={size} /></span>} iconColor={ACCENT.cyan} title={t('wordMatch.title')} loadError={loadError}>
        <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          {t.rich('wordMatch.description', {
            count: PAIRS,
            emphasis: (chunks) => <span className="font-bold" style={{ color: ACCENT.cyan }}>{chunks}</span>,
          })}
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          {t('wordMatch.subtitle')}
        </p>

        <GameInfoBox>
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT.cyan }}><IconLink size={14} /></span>
            <span>{t('wordMatch.info.scoring')}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCheck size={14} style={{ color: STATUS.success }} />
            <span>{t('wordMatch.info.speedBonus')}</span>
          </div>
        </GameInfoBox>

        <div className="flex gap-3 justify-center mt-6">
          <Button variant="game" accent="srs" onClick={startGame} isLoading={isLoading}>
            <IconRocket size={16} /> {t('common.start')}
          </Button>
          <Button variant="outline" onClick={() => router.push('/games')}>
            <IconChevronLeft size={16} /> {t('common.back')}
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
        <GameResultCard accuracy={accuracy} title={t('common.result')}>
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: ACCENT.cyan }}>{score}</div>
            <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>{t('common.scoreUnit')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label={t('common.correctLabel')} value={correctCount} color={STATUS.success} />
            <StatCard label={t('wordMatch.stats.pairs')} value={PAIRS} />
            <StatCard label={t('common.accuracy')} value={`${accuracy}%`} color={ACCENT.srs} />
            <StatCard label={t('common.bestCombo')} value={`x${bestCombo}`} color={ACCENT.xp} />
          </div>
          <div className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            {t('wordMatch.timeLabel', { time: formatTime(elapsedSec) })}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="srs" onClick={startGame}><IconRefresh size={16} /> {t('common.restart')}</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> {t('common.menu')}</Button>
          </div>
        </GameResultCard>
      </>
    );
  }

  // ─── Playing Screen ───
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader title={t('wordMatch.title')} streak={combo} timer={formatTime(elapsedSec)}
        onExit={() => { playClick(); router.push('/games'); }} />
      <GameStatsBar stats={[
        { label: t('common.score'),     value: score,                       color: ACCENT.cyan },
        { label: t('wordMatch.stats.pairs'),      value: `${matchedIds.size}/${PAIRS}`, color: STATUS.success, dot: true },
        { label: t('wordMatch.stats.wrong'),      value: wrongCount,                  color: STATUS.danger, dot: true },
        { label: t('common.time'), value: formatTime(elapsedSec),     color: 'var(--theme-text-primary)' },
      ]} />

      {/* Match Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column - German words */}
        <div className="flex flex-col gap-2">
          {leftItems.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedLeft === item.id;
            const isWrongLeft = wrongFlash?.left === item.id;
            const artColor = AC[item.word.gender] || ACCENT.srs;
            return (
              <button key={item.id}
                onClick={() => handleLeftClick(item.id)}
                disabled={isMatched}
                className="rounded-xl border px-3 py-3 text-left transition-all duration-200 text-sm font-semibold"
                style={{
                  borderColor: isMatched ? STATUS.success
                    : isWrongLeft ? STATUS.danger
                    : isSelected ? ACCENT.cyan
                    : 'var(--theme-border)',
                  backgroundColor: isMatched ? 'rgba(34,197,94,.08)'
                    : isWrongLeft ? 'rgba(239,68,68,.08)'
                    : isSelected ? 'rgba(6,182,212,.1)'
                    : 'var(--theme-bg-card)',
                  color: isMatched ? STATUS.success
                    : isSelected ? ACCENT.cyan
                    : 'var(--theme-text-primary)',
                  cursor: isMatched ? 'default' : 'pointer',
                  opacity: isMatched ? 0.6 : 1,
                }}>
                <span style={{ color: isMatched ? STATUS.success : artColor }}>
                  {item.word.gender && GenderInfo[item.word.gender] ? GenderInfo[item.word.gender].article : ''}
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
                  borderColor: isMatched ? STATUS.success
                    : isWrongRight ? STATUS.danger
                    : selectedLeft ? ACCENT.cyan
                    : 'var(--theme-border)',
                  backgroundColor: isMatched ? 'rgba(34,197,94,.08)'
                    : isWrongRight ? 'rgba(239,68,68,.08)'
                    : selectedLeft ? 'rgba(6,182,212,.04)'
                    : 'var(--theme-bg-card)',
                  color: isMatched ? STATUS.success : 'var(--theme-text-secondary)',
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
          {t('wordMatch.hints.selectLeft')}
        </p>
      )}
      {selectedLeft && (
        <p className="text-center text-xs mt-4 font-semibold" style={{ color: ACCENT.cyan }}>
          {t('wordMatch.hints.selectRight')}
        </p>
      )}
    </div>
  );
}
