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
  GameSetupCard, GameResultCard, GameInfoBox,
  GamePlayHeader, GameStatsBar, GameProgressBar,
  IconLink, IconRocket, IconChevronLeft, IconCheck, IconZap, IconTarget, IconFlame, IconClock,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

const PAIRS = 6;
// Exact der/die/das article colors per design
const AC: Record<string, string> = { masculine: 'var(--der)', feminine: 'var(--die)', neuter: 'var(--das)' };

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
        <GameResultCard
          accuracy={accuracy}
          correct={correctCount}
          total={PAIRS}
          stats={[
            { label: t('common.score'), value: score, color: ACCENT.cyan, icon: IconZap },
            { label: t('common.accuracy'), value: `${accuracy}%`, color: STATUS.success, icon: IconTarget },
            { label: t('common.bestCombo'), value: `x${bestCombo}`, color: ACCENT.xp, icon: IconFlame },
            { label: t('common.time'), value: formatTime(elapsedSec), color: ACCENT.srs, icon: IconClock },
          ]}
          onRestart={startGame}
          onExit={() => router.push('/games')}
        />
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
      <GameProgressBar current={matchedIds.size} total={PAIRS} />

      {/* Match Grid — single row-major grid so each row's left+right cell share one height */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mt-2 items-stretch">
        {leftItems.map((left, i) => {
          const right = rightItems[i];
          // Left (German word)
          const lMatched = matchedIds.has(left.id);
          const lSelected = selectedLeft === left.id;
          const lWrong = wrongFlash?.left === left.id;
          const artColor = AC[left.word.gender] || 'var(--der)';
          const article = left.word.gender && GenderInfo[left.word.gender] ? GenderInfo[left.word.gender].article : '';
          // Right (meaning)
          const rMatched = right ? matchedIds.has(right.id) : false;
          const rWrong = right ? wrongFlash?.right === right.id : false;
          const rClickable = !!right && !!selectedLeft && !rMatched;
          const rLabel = right ? ((settings.showVietnamese && right.word.translationVi) || right.word.translationEn) : '';
          return [
            <button key={`l-${left.id}`}
              onClick={() => handleLeftClick(left.id)}
              disabled={lMatched}
              className="flex h-full items-center gap-1.5 rounded-[11px] border-2 px-4 py-3.5 text-left text-[15px] font-semibold transition-all duration-150"
              style={{
                borderColor: lMatched ? `color-mix(in srgb, ${STATUS.success} 35%, transparent)`
                  : lWrong ? STATUS.danger
                  : lSelected ? ACCENT.cyan
                  : 'var(--theme-border)',
                backgroundColor: lMatched ? `color-mix(in srgb, ${STATUS.success} 10%, transparent)`
                  : lWrong ? `color-mix(in srgb, ${STATUS.danger} 8%, transparent)`
                  : lSelected ? `color-mix(in srgb, ${ACCENT.cyan} 12%, transparent)`
                  : 'var(--theme-bg-card)',
                color: 'var(--theme-text-primary)',
                cursor: lMatched ? 'default' : 'pointer',
                opacity: lMatched ? 0.55 : 1,
              }}>
              <span className="font-bold" style={{ color: artColor }}>{article}</span>
              <span>{left.word.word}</span>
              {lMatched && <IconCheck size={15} style={{ color: STATUS.success, marginLeft: 'auto' }} />}
            </button>,
            right ? (
              <button key={`r-${right.id}`}
                onClick={() => handleRightClick(right.id)}
                disabled={rMatched || !selectedLeft}
                className="flex h-full items-center gap-1.5 rounded-[11px] border-2 px-4 py-3.5 text-left text-sm transition-all duration-150"
                style={{
                  borderColor: rMatched ? `color-mix(in srgb, ${STATUS.success} 35%, transparent)`
                    : rWrong ? STATUS.danger
                    : rClickable ? `color-mix(in srgb, ${ACCENT.cyan} 35%, transparent)`
                    : 'var(--theme-border)',
                  backgroundColor: rMatched ? `color-mix(in srgb, ${STATUS.success} 10%, transparent)`
                    : rWrong ? `color-mix(in srgb, ${STATUS.danger} 8%, transparent)`
                    : 'var(--theme-bg-card)',
                  color: rMatched ? 'var(--theme-text-secondary)' : 'var(--theme-text-primary)',
                  cursor: rClickable ? 'pointer' : 'default',
                  opacity: rMatched ? 0.55 : 1,
                }}>
                <span className="flex-1">{rLabel}</span>
                {rMatched && <IconCheck size={15} style={{ color: STATUS.success }} />}
              </button>
            ) : <div key={`r-empty-${i}`} />,
          ];
        })}
      </div>

      {/* Hint */}
      <p className="text-center text-xs mt-4.5" style={{ color: 'var(--theme-text-muted)' }}>
        {selectedLeft ? t('wordMatch.hints.selectRight') : t('wordMatch.hints.selectLeft')}
      </p>
    </div>
  );
}
