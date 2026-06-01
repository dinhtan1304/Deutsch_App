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
  GameSetupCard, GameResultCard,
  AnswerReview, AddWrongWordsToBank, GameResultUpsell, GameInfoBox,
  GamePlayHeader, GameStatsBar, GameProgressBar, useGameTimer,
  IconHeadphones, IconRocket, IconChevronLeft, IconVolume, IconRefresh, IconZap, IconTarget, IconFlame, IconX, IconCheck,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

type Phase = 'setup' | 'playing' | 'result';

const AC: Record<string, string> = { masculine: ACCENT.srs, feminine: ACCENT.listening, neuter: STATUS.success };
const MAX_REPLAYS = 3;
const OPTIONS_PER_Q = 4;

interface QuestionSet {
  correct: Word;
  options: Word[]; // shuffled, includes correct
}

interface AnswerRecord {
  word: Word;
  selectedAnswer: string; // "article word"
  isCorrect: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

import { speakGerman, prefetchAudio } from '@/lib/utils';

export default function ListeningQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWordBankMode = searchParams.get('source') === 'wordbank';
  const collectionId = searchParams.get('collectionId') ?? undefined;
  const t = useTranslations('games');

  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playGameOver, playClick } = useSoundEffects();
  const session = useGameSession('listening');

  const [phase, setPhase] = useState<Phase>('setup');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionSet[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [replayCount, setReplayCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const replayCountRef = useRef(0); // replays for current question

  const questionsCount = isLoaded ? settings.questionsPerGame : 20;
  // Fetch enough words for questions + distractors
  const fetchCount = Math.min(questionsCount * OPTIONS_PER_Q, 80);
  const { refetch, isLoading: globalLoading } = useRandomWords(fetchCount, {});
  const wbData = useWordBankGameWords({ collectionId, enabled: isWordBankMode });
  const isLoading = isWordBankMode ? wbData.isLoading : globalLoading;

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const buildQuestions = useCallback((pool: Word[], count: number): QuestionSet[] => {
    const shuffled = shuffle(pool);
    // Each question uses 1 correct answer; distractors drawn from remaining pool
    return Array.from({ length: count }, (_, i) => {
      const correct = shuffled[i % shuffled.length]!;
      const distractors = shuffled
        .filter(w => w.id !== correct.id)
        .slice(0, OPTIONS_PER_Q - 1);
      return {
        correct,
        options: shuffle([correct, ...distractors]),
      };
    });
  }, []);

  const playCurrentWord = useCallback((word: Word) => {
    setIsSpeaking(true);
    speakGerman(word.word);
    // SpeechSynthesis doesn't provide reliable onend, approximate with timeout
    setTimeout(() => setIsSpeaking(false), Math.max(1500, word.word.length * 120));
  }, []);

  const startGame = async () => {
    playClick();
    setLoadError(null);
    let pool: Word[];
    if (isWordBankMode) {
      const eligible = getEligibleWordsForGame('listening', wbData.data ?? []);
      if (eligible.length < 4) { setLoadError(t('listening.errors.minWords4')); return; }
      pool = personalWordsToGameWords(eligible);
    } else {
      const result = await refetch();
      if (!result.data?.length) { setLoadError(t('common.errors.noVocab')); return; }
      pool = result.data;
    }

    const qs = buildQuestions(pool, questionsCount);
    setQuestions(qs);
    setIndex(0);
    setScore(0); scoreRef.current = 0;
    setCombo(0); comboRef.current = 0;
    setBestCombo(0); bestComboRef.current = 0;
    correctRef.current = 0; wrongRef.current = 0;
    setAnswered(false);
    setSelectedAnswer(null);
    setAnswers([]);
    setReplayCount(0); replayCountRef.current = 0;
    setPhase('playing');
    session.start(qs.length);

    // Auto-play first word after state settles
    setTimeout(() => playCurrentWord(qs[0]!.correct), 300);
  };

  // Warm the next question's audio so the next "Replay" / auto-play is instant.
  useEffect(() => {
    const next = questions[index + 1];
    if (next?.correct?.word) prefetchAudio(next.correct.word);
  }, [questions, index]);

  const handleReplay = useCallback(() => {
    const q = questions[index];
    if (!q || answered) return;
    playCurrentWord(q.correct);
    const newCount = replayCountRef.current + 1;
    replayCountRef.current = newCount;
    setReplayCount(newCount);
  }, [questions, index, answered, playCurrentWord]);

  const handleAnswer = useCallback((option: Word) => {
    if (answered) return;
    const q = questions[index];
    if (!q) return;

    const isCorrect = option.id === q.correct.id;
    const article = option.gender && GenderInfo[option.gender] ? GenderInfo[option.gender].article : '';
    const label = `${article} ${option.word}`.trim();
    setSelectedAnswer(label);
    setAnswered(true);

    const answerRecord: AnswerRecord = {
      word: q.correct,
      selectedAnswer: label,
      isCorrect,
    };
    const updatedAnswers = [...answers, answerRecord];

    if (isCorrect) {
      playCorrect();
      correctRef.current++;
      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      // Score depends on how many times they replayed
      const replayPenalty = replayCountRef.current;
      const pts = replayPenalty === 0 ? 15 : replayPenalty === 1 ? 10 : 5;
      const multiplier = Math.min(newCombo, 4);
      scoreRef.current += pts * multiplier;
      setScore(scoreRef.current);
      setCombo(newCombo);
      if (newCombo > bestComboRef.current) {
        bestComboRef.current = newCombo;
        setBestCombo(newCombo);
      }
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) setTimeout(() => playCombo(), 200);
      if (scoreRef.current > 0 && scoreRef.current % 100 === 0) setTimeout(() => playCombo(), 300);
    } else {
      playWrong();
      wrongRef.current++;
      comboRef.current = 0;
      setCombo(0);
    }

    setTimeout(() => {
      if (index + 1 >= questionsCount) {
        playGameOver();
        session.end(scoreRef.current, bestComboRef.current, correctRef.current, wrongRef.current);
        setAnswers(updatedAnswers);
        setPhase('result');
      } else {
        const nextIndex = index + 1;
        setIndex(nextIndex);
        setAnswered(false);
        setSelectedAnswer(null);
        setAnswers(updatedAnswers);
        replayCountRef.current = 0;
        setReplayCount(0);
        // Auto-play next word
        setTimeout(() => playCurrentWord(questions[nextIndex]!.correct), 200);
      }
    }, 1200);
  }, [answered, questions, index, answers, questionsCount, playCorrect, playWrong, playCombo, playGameOver, playCurrentWord, session]);

  const timer = useGameTimer(phase === 'playing');

  // Keyboard: Space = replay · 1–4 = choose · Esc = exit
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { window.speechSynthesis?.cancel(); router.push('/games'); return; }
      if (answered) return;
      const q = questions[index];
      if (!q) return;
      if (e.code === 'Space') { e.preventDefault(); handleReplay(); }
      else if (['1', '2', '3', '4'].includes(e.key)) {
        const opt = q.options[+e.key - 1];
        if (opt) handleAnswer(opt);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answered, questions, index, handleReplay, handleAnswer, router]);

  // ─── Setup Screen ───
  if (phase === 'setup') {
    return (
      <GameSetupCard icon={({ size }) => <span style={{ color: 'white' }}><IconHeadphones size={size} /></span>} iconColor={ACCENT.games} title={t('listening.title')} loadError={loadError}>
        <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          {t.rich('listening.description', {
            count: questionsCount,
            emphasis: (chunks) => <span className="font-bold" style={{ color: ACCENT.games }}>{chunks}</span>,
          })}
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          {t('common.settingsHint')}
        </p>

        <GameInfoBox>
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT.games }}><IconHeadphones size={14} /></span>
            <span>{t('listening.info.scoring')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT.games }}><IconRefresh size={14} /></span>
            <span>{t('listening.info.maxReplays', { max: MAX_REPLAYS })}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT.games }}><IconVolume size={14} /></span>
            <span>{t('listening.info.speech')}</span>
          </div>
        </GameInfoBox>

        <div className="flex gap-3 justify-center mt-6">
          <Button variant="game" accent="games" onClick={startGame} isLoading={isLoading}>
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
    const accuracy = Math.round((correctCount / questionsCount) * 100);
    return (
      <>
        <GameResultCard
          accuracy={accuracy}
          correct={correctCount}
          total={questionsCount}
          stats={[
            { label: t('common.score'), value: score, color: ACCENT.games, icon: IconZap },
            { label: t('common.accuracy'), value: `${accuracy}%`, color: STATUS.success, icon: IconTarget },
            { label: t('common.bestCombo'), value: `x${bestCombo}`, color: ACCENT.xp, icon: IconFlame },
            { label: t('common.wrongLabel'), value: questionsCount - correctCount, color: STATUS.danger, icon: IconX },
          ]}
          onRestart={startGame}
          onExit={() => router.push('/games')}
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({
              article: `${a.word.gender && GenderInfo[a.word.gender] ? GenderInfo[a.word.gender].article : ''} ${a.word.word}`.trim(),
              color: AC[a.word.gender] || ACCENT.games,
            })}
            getSelectedLabel={a => !a.isCorrect ? a.selectedAnswer : null}
          />
        </div>
        {!isWordBankMode && <AddWrongWordsToBank wrongWords={answers.filter(a => !a.isCorrect).map(a => a.word)} />}
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing Screen ───
  const currentQ = questions[index];
  if (!currentQ) return null;
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader title={t('listening.title')} streak={combo} timer={timer}
        onExit={() => { window.speechSynthesis?.cancel(); playClick(); router.push('/games'); }} />
      <GameStatsBar stats={[
        { label: t('common.score'),  value: score,                          color: ACCENT.games },
        { label: t('common.correctLabel'),  value: correctCount,                   color: STATUS.success, dot: true },
        { label: t('common.wrongLabel'),   value: index - correctCount,           color: STATUS.danger, dot: true },
        { label: t('common.questionLabel'),   value: `${index + 1}/${questionsCount}`, color: 'var(--theme-text-primary)' },
      ]} />
      <GameProgressBar current={index} total={questionsCount} />

      {/* Audio panel — calm card with glow + circular play button */}
      <button
        onClick={answered ? undefined : handleReplay}
        disabled={answered || replayCount >= MAX_REPLAYS || isSpeaking}
        className="relative mt-2 mb-4 flex w-full flex-col items-center gap-3 overflow-hidden rounded-xl px-6 py-9 text-center transition-colors disabled:cursor-default"
        style={{ background: 'var(--theme-bg-card)', border: `1px solid ${ACCENT.games}44` }}>
        <span aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 40%, ${ACCENT.games}14, transparent 70%)` }} />
        <span className="relative flex h-18 w-18 items-center justify-center rounded-full"
          style={{ background: `linear-gradient(135deg, ${ACCENT.games}, ${ACCENT.xp})`, boxShadow: `0 8px 24px ${ACCENT.games}55` }}>
          {isSpeaking && (
            <span aria-hidden className="absolute inset-0 animate-ping rounded-full" style={{ background: `${ACCENT.games}55` }} />
          )}
          <span className="relative" style={{ color: 'white' }}><IconHeadphones size={30} /></span>
        </span>
        <span className="relative text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {isSpeaking ? t('listening.playing') : t('listening.tapToListen')}
        </span>
        <span className="relative text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          {answered
            ? `${t('listening.answerLabel')} ${currentQ.correct.gender && GenderInfo[currentQ.correct.gender] ? GenderInfo[currentQ.correct.gender].article + ' ' : ''}${currentQ.correct.word}`
            : replayCount === 0
            ? t('listening.pointHint.first')
            : t('listening.replayCount', { current: replayCount, max: MAX_REPLAYS })}
        </span>
        {!answered && replayCount > 0 && (
          <span className="relative flex gap-1.5">
            {Array.from({ length: MAX_REPLAYS }, (_, i) => (
              <span key={i} className="h-2 w-2 rounded-full"
                style={{ backgroundColor: i < replayCount ? ACCENT.games : 'var(--theme-border)' }} />
            ))}
          </span>
        )}
      </button>

      <p className="mb-3 text-center text-[12.5px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
        {t('listening.pickPrompt')}
      </p>

      {/* 4 options */}
      <div className="grid grid-cols-2 gap-3">
        {currentQ.options.map((option, i) => {
          const article = option.gender && GenderInfo[option.gender] ? GenderInfo[option.gender].article : '';
          const label = `${article} ${option.word}`.trim();
          const isCorrectOption = option.id === currentQ.correct.id;
          const isSelectedWrong = answered && selectedAnswer === label && !isCorrectOption;
          const isAns = answered && isCorrectOption;
          const dim = answered && !isAns && !isSelectedWrong;
          const artColor = AC[option.gender] || ACCENT.games;
          return (
            <button key={option.id}
              onClick={() => handleAnswer(option)}
              disabled={answered}
              className="relative rounded-md border-2 px-4 py-4 text-left transition-all duration-200 disabled:cursor-default"
              style={{
                borderColor: isAns ? STATUS.success : isSelectedWrong ? STATUS.danger : 'var(--theme-border)',
                backgroundColor: isAns ? `color-mix(in srgb, ${STATUS.success} 16%, transparent)`
                  : isSelectedWrong ? `color-mix(in srgb, ${STATUS.danger} 16%, transparent)`
                  : 'var(--theme-bg-card)',
                color: 'var(--theme-text-primary)',
                opacity: dim ? 0.4 : 1,
              }}>
              <kbd className="mono absolute right-2.5 top-2.5 rounded-xs border px-1.5 py-px text-[10px]"
                style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>{i + 1}</kbd>
              <div className="text-base font-bold">
                <span style={{ color: artColor }}>{article}</span> {option.word}
              </div>
              {settings.showVietnamese && option.translationVi && (
                <div className="mt-0.5 text-xs font-normal" style={{ color: 'var(--theme-text-muted)' }}>{option.translationVi}</div>
              )}
              {isAns && <span className="absolute bottom-2.5 right-2.5" style={{ color: STATUS.success }}><IconCheck size={16} /></span>}
              {isSelectedWrong && <span className="absolute bottom-2.5 right-2.5" style={{ color: STATUS.danger }}><IconX size={16} /></span>}
            </button>
          );
        })}
      </div>

      <p className="mt-3.5 text-center text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
        {t.rich('listening.keyHint', { k: (chunks) => <kbd className="mono">{chunks}</kbd> })}
      </p>
    </div>
  );
}
