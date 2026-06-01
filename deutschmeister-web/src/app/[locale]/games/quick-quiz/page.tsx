'use client';
/* eslint-disable no-restricted-syntax -- game pages use custom dark-theme gradients */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRandomWords } from '@/hooks/useWords';
import { useWordBankGameWords } from '@/hooks/usePersonalWords';
import { personalWordsToGameWords, getEligibleWordsForGame } from '@/lib/personalWordAdapter';
import { useGameSession } from '@/hooks/useGameSession';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
// BUG FIX 2: Added settings + sound effects (was the only game missing both)
import { Word, Gender, GenderInfo } from '@/types';
import { speakGerman } from '@/lib/utils';
import {
  GameSetupCard, GameResultCard, GameProgressBar,
  AnswerReview, AddWrongWordsToBank, GameResultUpsell, GameInfoBox, KBD,
  GamePlayHeader, GameStatsBar, GameWordCard, GenderButtons, useGameTimer,
  IconZap, IconTarget, IconRocket, IconKeyboard, IconVolume,
  IconChevronLeft, IconCheck, IconX,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

const AC: Record<string, string> = { masculine: ACCENT.srs, feminine: ACCENT.listening, neuter: STATUS.success };
// BUG FIX 2: Removed hardcoded TOTAL_QUESTIONS = 20, now reads from settings
type GamePhase = 'setup' | 'playing' | 'result';

export default function QuickQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWordBankMode = searchParams.get('source') === 'wordbank';
  const collectionId = searchParams.get('collectionId') ?? undefined;
  const t = useTranslations('games');

  const session = useGameSession('quick-quiz');
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playGameOver } = useSoundEffects();

  // Use settings value — fall back to 20 until settings load
  const TOTAL_QUESTIONS = isLoaded ? settings.questionsPerGame : 20;

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<{ word: Word; selected: Gender; isCorrect: boolean }[]>([]);
  const [wbGameWords, setWbGameWords] = useState<Word[]>([]);

  // Refs for session.end() — avoid stale closure issues in useEffect
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const { data: globalWords, refetch, isLoading: globalLoading } = useRandomWords(TOTAL_QUESTIONS, { nounsOnly: true });
  const wbData = useWordBankGameWords({ collectionId, enabled: isWordBankMode });
  const words = isWordBankMode ? wbGameWords : (globalWords ?? []);
  const isLoading = isWordBankMode ? wbData.isLoading : globalLoading;
  const currentWord = words?.[currentIndex];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleStartGame = async () => {
    setLoadError(null);
    if (isWordBankMode) {
      const eligible = getEligibleWordsForGame('quick-quiz', wbData.data ?? []);
      if (eligible.length < 4) { setLoadError(t('common.errors.minNounsWordBank')); return; }
      const shuffled = [...eligible].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
      setWbGameWords(personalWordsToGameWords(shuffled));
      setPhase('playing'); setCurrentIndex(0); setScore(0); setAnswers([]);
      setSelectedAnswer(null); setShowFeedback(false);
      scoreRef.current = 0; correctRef.current = 0; wrongRef.current = 0;
      session.start(shuffled.length);
    } else {
      const result = await refetch();
      if (!result.data?.length) { setLoadError(t('common.errors.noVocab')); return; }
      setPhase('playing'); setCurrentIndex(0); setScore(0); setAnswers([]);
      setSelectedAnswer(null); setShowFeedback(false);
      scoreRef.current = 0; correctRef.current = 0; wrongRef.current = 0;
      session.start(TOTAL_QUESTIONS);
    }
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
        <GameSetupCard icon={({ size }) => <IconZap size={size} style={{ color: 'white' }} />} iconColor="#F59E0B" title={t('quickQuiz.title')} loadError={loadError}>
          <p className="text-sm mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            {t.rich('quickQuiz.description', {
              count: TOTAL_QUESTIONS,
              emphasis: (chunks) => <span className="font-bold" style={{ color: ACCENT.xp }}>{chunks}</span>,
            })}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>{t('common.settingsHint')}
          </p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconTarget size={14} style={{ color: ACCENT.xp }} /><span>{t('quickQuiz.info.click')}</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: ACCENT.vocab }} /><span>{t.rich('quickQuiz.info.hotkeys', { kbd: (chunks) => <KBD>{chunks}</KBD> })}</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: ACCENT.srs }} /><span>{t('quickQuiz.info.feedback')}</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="game" accent="xp" onClick={handleStartGame} isLoading={isLoading}><IconRocket size={16} /> {t('common.start')}</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> {t('common.back')}</Button>
          </div>
        </GameSetupCard>
    );
  }

  // ─── Result ───
  if (phase === 'result') {
    const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);

    return (
      <>
        <GameResultCard
          accuracy={percentage}
          correct={score}
          total={TOTAL_QUESTIONS}
          stats={[
            { label: t('common.correctLabel'), value: score, color: STATUS.success, icon: IconCheck },
            { label: t('common.wrongLabel'), value: TOTAL_QUESTIONS - score, color: STATUS.danger, icon: IconX },
            { label: t('common.accuracy'), value: `${percentage}%`, color: ACCENT.srs, icon: IconTarget },
          ]}
          onRestart={handleStartGame}
          onExit={() => router.push('/games')}
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ 
              article: a.word.gender && GenderInfo[a.word.gender] ? GenderInfo[a.word.gender].article : '', 
              color: AC[a.word.gender] || ACCENT.srs 
            })}
            getSelectedLabel={a => !a.isCorrect && a.selected && GenderInfo[a.selected] ? GenderInfo[a.selected].article : null}
          />
        </div>
        {!isWordBankMode && <AddWrongWordsToBank wrongWords={answers.filter(a => !a.isCorrect).map(a => a.word)} />}
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing ───
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader
        title={t('quickQuiz.title')} streak={score > 0 ? Math.floor(score / 10) : undefined} timer={timer}
        onExit={() => router.push('/games')}
      />
      <GameStatsBar stats={[
        { label: t('common.score'),  value: score,        color: ACCENT.xp },
        { label: t('common.correctLabel'), value: correctCount, color: STATUS.success, dot: true },
        { label: t('common.wrongLabel'),   value: currentIndex - correctCount, color: STATUS.danger, dot: true },
        { label: t('common.questionLabel'), value: `${currentIndex + 1}/${TOTAL_QUESTIONS}`, color: 'var(--theme-text-primary)' },
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
                ? t('common.feedback.correctMark')
                : t('common.feedback.wrongMark', { answer: currentWord.gender && GenderInfo[currentWord.gender] ? GenderInfo[currentWord.gender].article : '' })}
            </p>
          )}
        </GameWordCard>
      )}

      <GenderButtons onAnswer={handleAnswer} answered={showFeedback} selectedAnswer={selectedAnswer} correctGender={currentWord?.gender} />
      <p className="text-center text-caption mt-4" style={{ color: 'var(--theme-text-muted)' }}>
        {t.rich('common.hotkeyHint', { kbd: (chunks) => <KBD>{chunks}</KBD> })}
      </p>
    </div>
  );
}