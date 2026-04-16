'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameButton, GameProgressBar,
  ComboBadge, StatCard, AnswerReview, AddWrongWordsToBank, GameResultUpsell, GameInfoBox,
  IconHeadphones, IconRocket, IconChevronLeft, IconRefresh, IconX,
} from '@/components/games/GameUI';

type Phase = 'setup' | 'playing' | 'result';

const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };
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

function speakGerman(text: string, rate = 0.85) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

export default function ListeningQuizPage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playLevelUp, playGameOver, playClick } = useSoundEffects();
  const session = useGameSession('listening');

  const [phase, setPhase] = useState<Phase>('setup');
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
  const { refetch, isLoading } = useRandomWords(fetchCount, {});

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const buildQuestions = useCallback((pool: Word[], count: number): QuestionSet[] => {
    const shuffled = shuffle(pool);
    // Each question uses 1 correct answer; distractors drawn from remaining pool
    return Array.from({ length: count }, (_, i) => {
      const correct = shuffled[i % shuffled.length];
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
    const result = await refetch();
    if (!result.data?.length) { alert('Không có từ vựng!'); return; }

    const qs = buildQuestions(result.data, questionsCount);
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
    session.start(questionsCount);

    // Auto-play first word after state settles
    setTimeout(() => playCurrentWord(qs[0].correct), 300);
  };

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
    const label = `${GenderInfo[option.gender].article} ${option.word}`;
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
      if (scoreRef.current > 0 && scoreRef.current % 100 === 0) setTimeout(() => playLevelUp(), 300);
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
        setTimeout(() => playCurrentWord(questions[nextIndex].correct), 200);
      }
    }, 1200);
  }, [answered, questions, index, answers, questionsCount, playCorrect, playWrong, playCombo, playLevelUp, playGameOver, playCurrentWord, session]);

  // ─── Setup Screen ───
  if (phase === 'setup') {
    return (
      <GameSetupCard icon={({ size }) => <span style={{ color: 'white' }}><IconHeadphones size={size} /></span>} iconColor="#F97316" title="Listening Quiz">
        <p className="text-[14px] mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          Nghe và chọn đúng <span className="font-bold" style={{ color: '#F97316' }}>{questionsCount} từ</span> tiếng Đức
        </p>
        <p className="text-[12px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          (Thay đổi số câu trong Settings → Học tập)
        </p>

        <GameInfoBox>
          <div className="flex items-center gap-2">
            <span style={{ color: '#F97316' }}><IconHeadphones size={14} /></span>
            <span>Nghe lần 1: +15 · Lần 2: +10 · Lần 3+: +5</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#F97316' }}>⟳</span>
            <span>Có thể nghe lại tối đa {MAX_REPLAYS} lần</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#F97316' }}>🔊</span>
            <span>Dùng Web Speech API (cần kết nối và trình duyệt hỗ trợ)</span>
          </div>
        </GameInfoBox>

        <div className="flex gap-3 justify-center mt-6">
          <GameButton onClick={startGame} loading={isLoading} color="#F97316">
            <IconRocket size={16} /> Bắt đầu
          </GameButton>
          <GameButton variant="outline" onClick={() => router.push('/games')}>
            <IconChevronLeft size={16} /> Quay lại
          </GameButton>
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
        <GameResultCard accuracy={accuracy} title="Kết quả">
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: '#F97316' }}>{score}</div>
            <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label="Đúng" value={correctCount} color="#22C55E" />
            <StatCard label="Sai" value={questionsCount - correctCount} color="#EF4444" />
            <StatCard label="Chính xác" value={`${accuracy}%`} color="#F97316" />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color="#F59E0B" />
          </div>
          <div className="flex gap-3 justify-center">
            <GameButton onClick={startGame} color="#F97316"><IconRefresh size={16} /> Chơi lại</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</GameButton>
          </div>
        </GameResultCard>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <AnswerReview
            answers={answers}
            getCorrectArticle={a => ({
              article: `${GenderInfo[a.word.gender].article} ${a.word.word}`,
              color: AC[a.word.gender] || '#F97316',
            })}
            getSelectedLabel={a => !a.isCorrect ? a.selectedAnswer : null}
          />
        </div>
        <AddWrongWordsToBank wrongWords={answers.filter(a => !a.isCorrect).map(a => a.word)} />
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing Screen ───
  const currentQ = questions[index];
  if (!currentQ) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-xl font-extrabold" style={{ color: '#F97316' }}>
          {score} <span className="text-[13px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>điểm</span>
        </div>
        <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
          {index + 1} / {questionsCount}
        </div>
      </div>

      <GameProgressBar current={index + 1} total={questionsCount} />

      <div className="mt-3 mb-4">
        <ComboBadge combo={combo} />
      </div>

      {/* Audio Card */}
      <div className="rounded-2xl border p-8 text-center mb-5"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

        {/* Play Button */}
        <button
          onClick={answered ? undefined : handleReplay}
          disabled={answered || replayCount >= MAX_REPLAYS || isSpeaking}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300
            disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          style={{
            background: isSpeaking
              ? 'linear-gradient(135deg, #F97316aa, #EF4444aa)'
              : 'linear-gradient(135deg, #F97316, #EF4444)',
            boxShadow: isSpeaking ? '0 0 0 8px rgba(249,115,22,.15)' : '0 4px 20px rgba(249,115,22,.3)',
          }}>
          <span style={{ color: 'white' }}><IconHeadphones size={32} /></span>
        </button>

        {!answered && (
          <p className="text-[13px] mb-1" style={{ color: 'var(--theme-text-muted)' }}>
            {isSpeaking ? 'Đang phát...' : replayCount === 0 ? 'Nhấn để nghe từ' : `Nghe lại (${replayCount}/${MAX_REPLAYS})`}
          </p>
        )}

        {/* Replay count indicator */}
        {!answered && replayCount > 0 && (
          <div className="flex justify-center gap-1.5 mt-1">
            {Array.from({ length: MAX_REPLAYS }, (_, i) => (
              <div key={i} className="w-2 h-2 rounded-full"
                style={{ backgroundColor: i < replayCount ? '#F97316' : 'var(--theme-border)' }} />
            ))}
          </div>
        )}

        {/* Score hint */}
        {!answered && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--theme-text-muted)' }}>
            {replayCount === 0 ? '+15 điểm nếu đúng lần đầu'
              : replayCount === 1 ? '+10 điểm nếu đúng'
              : '+5 điểm nếu đúng'}
          </p>
        )}

        {/* Answered feedback */}
        {answered && currentQ && (
          <div className="mt-2">
            <p className="text-[15px] font-bold" style={{
              color: selectedAnswer === `${GenderInfo[currentQ.correct.gender].article} ${currentQ.correct.word}` ? '#22C55E' : '#EF4444'
            }}>
              {selectedAnswer === `${GenderInfo[currentQ.correct.gender].article} ${currentQ.correct.word}` ? '✓ Đúng!' : '✗ Sai'}
            </p>
            <p className="text-[14px] mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Đáp án: <span className="font-bold" style={{ color: AC[currentQ.correct.gender] }}>
                {GenderInfo[currentQ.correct.gender].article} {currentQ.correct.word}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Options */}
      <p className="text-[13px] font-semibold mb-3 text-center" style={{ color: 'var(--theme-text-muted)' }}>
        Chọn từ bạn vừa nghe:
      </p>
      <div className="grid grid-cols-2 gap-3">
        {currentQ.options.map(option => {
          const label = `${GenderInfo[option.gender].article} ${option.word}`;
          const isCorrectOption = option.id === currentQ.correct.id;
          const isSelected = selectedAnswer === label;

          let borderColor = 'var(--theme-border)';
          let bgColor = 'var(--theme-bg-card)';
          let textColor = 'var(--theme-text-primary)';

          if (answered) {
            if (isCorrectOption) { borderColor = '#22C55E'; bgColor = 'rgba(34,197,94,.08)'; textColor = '#22C55E'; }
            else if (isSelected) { borderColor = '#EF4444'; bgColor = 'rgba(239,68,68,.08)'; textColor = '#EF4444'; }
          }

          return (
            <button key={option.id}
              onClick={() => handleAnswer(option)}
              disabled={answered}
              className="rounded-xl border px-4 py-4 text-center transition-all duration-200 font-semibold text-[15px]
                disabled:cursor-default hover:scale-[1.02] active:scale-[0.98]"
              style={{ borderColor, backgroundColor: bgColor, color: textColor }}>
              <span style={{ color: answered && isCorrectOption ? '#22C55E' : AC[option.gender] }}>
                {GenderInfo[option.gender].article}
              </span>{' '}
              {option.word}
              {settings.showVietnamese && option.translationVi && (
                <span className="block text-[11px] font-normal mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {option.translationVi}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center mt-6">
        <GameButton variant="ghost" onClick={() => {
          window.speechSynthesis?.cancel();
          playClick();
          router.push('/games');
        }}>
          <IconX size={14} /> Thoát
        </GameButton>
      </div>
    </div>
  );
}
