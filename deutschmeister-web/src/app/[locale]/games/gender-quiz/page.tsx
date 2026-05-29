'use client';
/* eslint-disable no-restricted-syntax -- game pages use custom dark-theme gradients */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { useWordBankGameWords } from '@/hooks/usePersonalWords';
import { personalWordsToGameWords, getEligibleWordsForGame } from '@/lib/personalWordAdapter';
import { Gender, GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameProgressBar,
  StatCard, GenderButtons, AnswerReview, AddWrongWordsToBank, GameResultUpsell, GameInfoBox, KBD,
  GamePlayHeader, GameStatsBar, GameWordCard, useGameTimer,
  IconTarget, IconRocket, IconKeyboard, IconVolume, IconRefresh, IconChevronLeft,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

// Article color map
const AC: Record<string, string> = { masculine: ACCENT.srs, feminine: ACCENT.listening, neuter: STATUS.success };

type Phase = 'setup' | 'playing' | 'result';

interface AnswerRecord {
  word: Word;
  selectedAnswer: Gender;
  isCorrect: boolean;
}

export default function GenderQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWordBankMode = searchParams.get('source') === 'wordbank';
  const collectionId = searchParams.get('collectionId') ?? undefined;
  const t = useTranslations('games');

  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playGameOver, playClick } = useSoundEffects();
  // BUG FIX 1: was 'quick-quiz' — caused all GenderQuiz sessions to be
  // recorded as QuickQuiz in the backend, corrupting game history stats.
  const session = useGameSession('gender-quiz');

  const [phase, setPhase] = useState<Phase>('setup');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [wbGameWords, setWbGameWords] = useState<Word[]>([]);
  const scoreRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const questionsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: globalWords, refetch, isLoading: globalLoading } = useRandomWords(questionsCount, { nounsOnly: true });
  const wbData = useWordBankGameWords({ collectionId, enabled: isWordBankMode });
  const words = isWordBankMode ? wbGameWords : (globalWords ?? []);
  const isLoading = isWordBankMode ? wbData.isLoading : globalLoading;
  const currentWord = words?.[index];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const startGame = async () => {
    playClick();
    setLoadError(null);
    if (isWordBankMode) {
      const eligible = getEligibleWordsForGame('gender-quiz', wbData.data ?? []);
      if (eligible.length < 4) { setLoadError(t('common.errors.minNounsWordBank')); return; }
      const shuffled = [...eligible].sort(() => Math.random() - 0.5).slice(0, questionsCount);
      setWbGameWords(personalWordsToGameWords(shuffled));
      setIndex(0); setScore(0); setCombo(0); setBestCombo(0);
      scoreRef.current = 0; bestComboRef.current = 0;
      correctRef.current = 0; wrongRef.current = 0;
      setAnswered(false); setSelectedAnswer(null); setAnswers([]); setPhase('playing');
      session.start(shuffled.length);
    } else {
      const result = await refetch();
      if (!result.data?.length) { setLoadError(t('common.errors.noVocab')); return; }
      setIndex(0); setScore(0); setCombo(0); setBestCombo(0);
      scoreRef.current = 0; bestComboRef.current = 0;
      correctRef.current = 0; wrongRef.current = 0;
      setAnswered(false); setSelectedAnswer(null); setAnswers([]); setPhase('playing');
      session.start(questionsCount);
    }
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
      if ((score + 10 * multiplier) % 100 === 0) setTimeout(() => playCombo(), 300);
    } else { playWrong(); wrongRef.current++; setCombo(0); }

    setTimeout(() => {
      if (index + 1 >= questionsCount) { playGameOver(); setPhase('result'); }
      else { setIndex(i => i + 1); setAnswered(false); setSelectedAnswer(null); }
    }, 1200);
  }, [answered, currentWord, combo, bestCombo, index, questionsCount, score, playCorrect, playWrong, playCombo, playGameOver]);

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
        <GameSetupCard icon={({ size }) => <IconTarget size={size} style={{ color: 'white' }} />} iconColor="#3B82F6" title={t('genderQuiz.title')} loadError={loadError}>
          <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            {t.rich('genderQuiz.description', {
              count: questionsCount,
              emphasis: (chunks) => <span className="font-bold" style={{ color: ACCENT.srs }}>{chunks}</span>,
            })}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
            {t('common.settingsHint')}
          </p>

          <GameInfoBox>
            <div className="flex items-center gap-2">
              <IconTarget size={14} style={{ color: ACCENT.srs }} />
              <span>{t('genderQuiz.info.scoring')}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconKeyboard size={14} style={{ color: ACCENT.vocab }} />
              <span>{t.rich('quickQuiz.info.hotkeys', { kbd: (chunks) => <KBD>{chunks}</KBD> })}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconVolume size={14} style={{ color: STATUS.success }} />
              <span>{t('genderQuiz.info.sound', { state: settings.soundEnabled ? t('genderQuiz.info.soundOn') : t('genderQuiz.info.soundOff') })}</span>
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
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect).length;
    const accuracy = Math.round((correctCount / questionsCount) * 100);

    return (
      <>
        <GameResultCard accuracy={accuracy} title={t('genderQuiz.result')}>
          {/* Score */}
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: ACCENT.srs }}>{score}</div>
            <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>{t('genderQuiz.scoreUnit')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label={t('common.correctLabel')} value={correctCount} color="#22C55E" />
            <StatCard label={t('common.wrongLabel')} value={wrongCount} color="#EF4444" />
            <StatCard label={t('common.accuracy')} value={`${accuracy}%`} />
            <StatCard label={t('genderQuiz.bestCombo')} value={`x${bestCombo}`} color="#F59E0B" />
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="srs" onClick={startGame}><IconRefresh size={16} /> {t('common.restart')}</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> {t('common.menu')}</Button>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: GenderInfo[a.word.gender].article, color: AC[a.word.gender] || ACCENT.srs })}
            getSelectedLabel={a => !a.isCorrect ? GenderInfo[a.selectedAnswer].article : null}
          />
        </div>
        {!isWordBankMode && <AddWrongWordsToBank wrongWords={answers.filter(a => !a.isCorrect).map(a => a.word)} />}
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
        title={t('genderQuiz.title')} streak={combo} timer={timer}
        onExit={() => { playClick(); router.push('/games'); }}
      />
      <GameStatsBar stats={[
        { label: t('common.score'),  value: score,        color: ACCENT.srs },
        { label: t('common.correctLabel'), value: correctCount, color: STATUS.success, dot: true },
        { label: t('common.wrongLabel'),   value: wrongCount,   color: STATUS.danger, dot: true },
        { label: t('common.questionLabel'), value: `${index + 1}/${questionsCount}`, color: 'var(--theme-text-primary)' },
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
              {t('genderQuiz.answer')} <span className="font-extrabold text-white">{GenderInfo[currentWord.gender].article} {currentWord.word}</span>
            </p>
          )}
        </GameWordCard>
      )}

      <GenderButtons onAnswer={handleAnswer} answered={answered} selectedAnswer={selectedAnswer} correctGender={currentWord?.gender} />
      <p className="text-center text-caption mt-4" style={{ color: 'var(--theme-text-muted)' }}>
        {t.rich('common.hotkeyHint', { kbd: (chunks) => <KBD>{chunks}</KBD> })}
      </p>
    </div>
  );
}