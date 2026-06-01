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
  GameSetupCard, GameResultCard, GameProgressBar,
  AnswerReview, AddWrongWordsToBank, GameResultUpsell, GameInfoBox, KBD,
  GamePlayHeader, GameStatsBar, useGameTimer,
  IconPenTool, IconTarget, IconRocket, IconKeyboard, IconVolume,
  IconChevronLeft, IconLightbulb, IconZap, IconFlame, IconX,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

const AC: Record<string, string> = { masculine: ACCENT.srs, feminine: ACCENT.listening, neuter: STATUS.success };

// Article colour per article string (der=blue, die=pink, das=green)
const ART_COLOR: Record<string, string> = { der: 'var(--der)', die: 'var(--die)', das: 'var(--das)' };
const ART_LABEL: Record<string, string> = { der: 'Maskulin', die: 'Feminin', das: 'Neutrum' };
const mix = (c: string, p: number) => `color-mix(in srgb, ${c} ${p}%, transparent)`;

type Phase = 'setup' | 'playing' | 'result';

interface AnswerRecord {
  word: Word;
  userInput: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function FillBlankPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWordBankMode = searchParams.get('source') === 'wordbank';
  const collectionId = searchParams.get('collectionId') ?? undefined;
  const t = useTranslations('games');

  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playGameOver, playClick } = useSoundEffects();
  const session = useGameSession('fill-blank');
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('setup');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showHint, setShowHint] = useState(false);

  const questionsCount = isLoaded ? settings.questionsPerGame : 20;
  const [wbGameWords, setWbGameWords] = useState<Word[]>([]);
  const { data: globalWords, refetch, isLoading: globalLoading } = useRandomWords(questionsCount, { nounsOnly: true });
  const wbData = useWordBankGameWords({ collectionId, enabled: isWordBankMode });
  const words = isWordBankMode ? wbGameWords : (globalWords ?? []);
  const isLoading = isWordBankMode ? wbData.isLoading : globalLoading;
  const currentWord = words?.[index];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (phase === 'playing' && !answered && inputRef.current) inputRef.current.focus();
  }, [phase, answered, index]);

  const startGame = async () => {
    playClick();
    setLoadError(null);
    if (isWordBankMode) {
      const eligible = getEligibleWordsForGame('fill-blank', wbData.data ?? []);
      if (eligible.length < 4) { setLoadError(t('common.errors.minNounsWordBank')); return; }
      const shuffled = [...eligible].sort(() => Math.random() - 0.5).slice(0, questionsCount);
      setWbGameWords(personalWordsToGameWords(shuffled));
      setIndex(0); setScore(0); setCombo(0); setBestCombo(0);
      scoreRef.current = 0; bestComboRef.current = 0;
      correctRef.current = 0; wrongRef.current = 0;
      setUserInput(''); setAnswered(false); setIsCorrect(false);
      setAnswers([]); setShowHint(false); setPhase('playing');
      session.start(shuffled.length);
    } else {
      const result = await refetch();
      if (!result.data?.length) { setLoadError(t('common.errors.noVocab')); return; }
      setIndex(0); setScore(0); setCombo(0); setBestCombo(0);
      scoreRef.current = 0; bestComboRef.current = 0;
      correctRef.current = 0; wrongRef.current = 0;
      setUserInput(''); setAnswered(false); setIsCorrect(false);
      setAnswers([]); setShowHint(false); setPhase('playing');
      session.start(questionsCount);
    }
  };

  const checkAnswer = useCallback(() => {
    if (answered || !currentWord) return;
    const correctAnswer = currentWord.article.toLowerCase();
    const userAnswer = userInput.trim().toLowerCase();
    const correct = userAnswer === correctAnswer;
    setAnswered(true); setIsCorrect(correct);
    setAnswers(prev => [...prev, { word: currentWord, userInput: userInput.trim(), correctAnswer: currentWord.article, isCorrect: correct }]);

    if (correct) {
      playCorrect();
      correctRef.current++;
      const newCombo = combo + 1; const multiplier = Math.min(newCombo, 4);
      setScore(s => s + 10 * multiplier); scoreRef.current += 10 * multiplier;
      setCombo(newCombo);
      if (newCombo > bestCombo) { setBestCombo(newCombo); bestComboRef.current = newCombo; }
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
      if ((score + 10 * multiplier) % 100 === 0) setTimeout(() => playCombo(), 300);
    } else { playWrong(); wrongRef.current++; setCombo(0); }
  }, [answered, currentWord, userInput, combo, bestCombo, score, playCorrect, playWrong, playCombo]);

  const nextQuestion = useCallback(() => {
    if (index + 1 >= questionsCount) { playGameOver(); setPhase('result'); }
    else { setIndex(i => i + 1); setUserInput(''); setAnswered(false); setIsCorrect(false); setShowHint(false); }
  }, [index, questionsCount, playGameOver]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { if (!answered) checkAnswer(); else nextQuestion(); }
  };

  // BUG FIX 7: Removed unnecessary setTimeout(100) wrapper.
  // Previously: setUserInput(article) ran immediately, then 100ms later the
  // actual logic ran — during this window a second click could fire since
  // `answered` was still false. The stale `combo` in the closure also meant
  // the multiplier could use an outdated value in rapid clicks.
  const handleQuickAnswer = (article: string) => {
    if (answered || !currentWord) return;
    const correctAnswer = currentWord.article.toLowerCase();
    const correct = article.toLowerCase() === correctAnswer;
    setUserInput(article);
    setAnswered(true); setIsCorrect(correct);
    setAnswers(prev => [...prev, { word: currentWord, userInput: article, correctAnswer: currentWord.article, isCorrect: correct }]);
    if (correct) {
      playCorrect(); correctRef.current++; const newCombo = combo + 1;
      const multiplier = Math.min(newCombo, 4);
      setScore(s => s + 10 * multiplier); scoreRef.current += 10 * multiplier;
      setCombo(newCombo);
      if (newCombo > bestCombo) { setBestCombo(newCombo); bestComboRef.current = newCombo; }
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
    } else { playWrong(); wrongRef.current++; setCombo(0); }
  };

  // Save game session to backend when game ends
  useEffect(() => {
    if (phase === 'result') {
      session.end(scoreRef.current, bestComboRef.current, correctRef.current, wrongRef.current);
    }
  }, [phase, session]);

  // After answering, briefly show the correct/wrong feedback, then advance.
  useEffect(() => {
    if (phase !== 'playing' || !answered) return;
    const id = setTimeout(() => nextQuestion(), 1400);
    return () => clearTimeout(id);
  }, [phase, answered, nextQuestion]);

  const timer = useGameTimer(phase === 'playing');

  // ─── Setup ───
  if (phase === 'setup') {
    return (
        <GameSetupCard icon={({ size }) => <IconPenTool size={size} style={{ color: 'white' }} />} iconColor={ACCENT.vocab} title={t('fillBlank.title')} loadError={loadError}>
          <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            {t.rich('fillBlank.description', {
              count: questionsCount,
              emphasis: (chunks) => <span className="font-bold" style={{ color: ACCENT.vocab }}>{chunks}</span>,
            })}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>{t('common.settingsHint')}</p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconTarget size={14} style={{ color: ACCENT.vocab }} /><span>{t('fillBlank.info.click')}</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: ACCENT.srs }} /><span>{t.rich('fillBlank.info.enter', { kbd: (chunks) => <KBD>{chunks}</KBD> })}</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: STATUS.success }} /><span>{t('fillBlank.info.sound', { state: settings.soundEnabled ? t('common.soundOn') : t('common.soundOff') })}</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="game" accent="premium" onClick={startGame} isLoading={isLoading}><IconRocket size={16} /> {t('common.start')}</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> {t('common.back')}</Button>
          </div>
        </GameSetupCard>
    );
  }

  // ─── Result ───
  if (phase === 'result') {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect).length;
    const accuracy = Math.round((correctCount / questionsCount) * 100);

    return (
      <>
        <GameResultCard
          accuracy={accuracy}
          correct={correctCount}
          total={questionsCount}
          stats={[
            { label: t('common.score'), value: score, color: ACCENT.vocab, icon: IconZap },
            { label: t('common.accuracy'), value: `${accuracy}%`, color: STATUS.success, icon: IconTarget },
            { label: t('common.bestCombo'), value: `x${bestCombo}`, color: ACCENT.xp, icon: IconFlame },
            { label: t('common.wrongLabel'), value: wrongCount, color: STATUS.danger, icon: IconX },
          ]}
          onRestart={startGame}
          onExit={() => router.push('/games')}
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({ article: a.correctAnswer, color: AC[a.word.gender] || ACCENT.vocab })}
            getSelectedLabel={a => !a.isCorrect ? (a.userInput || t('fillBlank.emptyAnswer')) : null}
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
      <GamePlayHeader title={t('fillBlank.title')} streak={combo} timer={timer}
        onExit={() => { playClick(); router.push('/games'); }} />
      <GameStatsBar stats={[
        { label: t('common.score'),  value: score,        color: ACCENT.vocab },
        { label: t('common.correctLabel'),  value: correctCount, color: STATUS.success, dot: true },
        { label: t('common.wrongLabel'),   value: index - correctCount, color: STATUS.danger, dot: true },
        { label: t('common.questionLabel'),   value: `${index + 1}/${questionsCount}`, color: 'var(--theme-text-primary)' },
      ]} />
        <GameProgressBar current={index + 1} total={questionsCount} />

      {currentWord && (() => {
        // light feedback colours (green when right, salmon when wrong) — card stays purple
        const fbText = isCorrect ? 'color-mix(in srgb, var(--success) 72%, white)' : 'color-mix(in srgb, var(--danger) 55%, white)';
        const blankBorder = !answered ? 'var(--accent)' : isCorrect ? 'var(--success)' : 'color-mix(in srgb, var(--danger) 55%, white)';
        return (
        <div className="rounded-3xl overflow-hidden my-6 transition-all duration-300"
          style={{
            // eslint-disable-next-line no-restricted-syntax
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          }}>
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center" style={{ minHeight: 200 }}>
            <div className="text-3xl md:text-4xl font-extrabold mb-3 text-white">
              <span className="inline-block min-w-16 border-b-2 mx-1.5 pb-0.5 transition-colors duration-300"
                style={{ borderColor: blankBorder, color: answered ? fbText : 'white' }}>
                {answered ? currentWord.article : ' '}
              </span>
              <span className="text-white">{currentWord.word}</span>
            </div>
            <p className="text-sm opacity-60 text-white">{currentWord.translationEn}</p>
            {settings.showVietnamese && currentWord.translationVi && (
              <p className="text-body mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{currentWord.translationVi}</p>
            )}
            {!answered && (
              <button onClick={() => setShowHint(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.14)' }}>
                <IconLightbulb size={13} />
                {showHint ? (currentWord.gender && GenderInfo[currentWord.gender] ? GenderInfo[currentWord.gender].label : t('fillBlank.hintFallback')) : t('fillBlank.hintToggle')}
              </button>
            )}
            {answered && (
              <p className="text-body mt-3 font-bold" style={{ color: fbText }}>
                {isCorrect ? t('fillBlank.correctMark') : t('fillBlank.wrongMark', { answer: currentWord.article })}
              </p>
            )}
          </div>
        </div>
        );
      })()}

      <div className="space-y-3">
        <div className="flex gap-2">
          <input ref={inputRef} type="text" value={userInput} disabled={answered}
            onChange={e => setUserInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={t('fillBlank.placeholder')}
            autoComplete="off" autoCapitalize="off"
            className="flex-1 px-4 py-3 rounded-xl border-2 text-center text-title font-semibold focus:outline-none transition-all duration-200"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: answered ? (isCorrect ? STATUS.success : STATUS.danger) : ACCENT.vocab, color: 'var(--theme-text-primary)' }} />
          <Button variant="game" accent="premium" onClick={checkAnswer} disabled={answered || !userInput.trim()}>{t('fillBlank.check')}</Button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {(['der', 'die', 'das'] as const).map(art => {
            const color = ART_COLOR[art]!;
            const isCorrectBtn = answered && currentWord?.article === art;
            const isWrongPick = answered && userInput.trim().toLowerCase() === art && !isCorrect;
            const dim = answered && !isCorrectBtn && !isWrongPick;
            const bg = isCorrectBtn ? mix('var(--success)', 18) : isWrongPick ? mix('var(--danger)', 18) : mix(color, 12);
            const bd = isCorrectBtn ? 'var(--success)' : isWrongPick ? 'var(--danger)' : mix(color, 30);
            const col = isCorrectBtn ? 'var(--success)' : isWrongPick ? 'var(--danger)' : color;
            return (
              <button key={art} onClick={() => handleQuickAnswer(art)} disabled={answered}
                className="flex flex-col items-center justify-center gap-0.5 py-4 rounded-[13px] transition-all duration-200 enabled:hover:-translate-y-0.5"
                style={{ background: bg, border: `2px solid ${bd}`, color: col, opacity: dim ? 0.4 : 1 }}>
                <span className="text-h2 font-extrabold leading-none" style={{ letterSpacing: '-.02em' }}>{art}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{ART_LABEL[art]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}